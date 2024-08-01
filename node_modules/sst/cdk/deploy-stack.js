import * as uuid from "uuid";
import { makeBodyParameter, } from "sst-aws-cdk/lib/api/util/template-body-parameter.js";
import { addMetadataAssetsToManifest } from "sst-aws-cdk/lib/assets.js";
import { debug, print, warning } from "sst-aws-cdk/lib/logging.js";
import { AssetManifestBuilder } from "sst-aws-cdk/lib/util/asset-manifest-builder.js";
import { publishAssets } from "sst-aws-cdk/lib/util/asset-publishing.js";
import { CfnEvaluationException } from "sst-aws-cdk/lib/api/evaluate-cloudformation-template.js";
import { HotswapMode } from "sst-aws-cdk/lib/api/hotswap/common.js";
import { tryHotswapDeployment } from "sst-aws-cdk/lib/api/hotswap-deployments.js";
import { changeSetHasNoChanges, CloudFormationStack, TemplateParameters, waitForChangeSet, waitForStackDeploy, waitForStackDelete, } from "sst-aws-cdk/lib/api/util/cloudformation.js";
import { callWithRetry } from "./util.js";
export async function deployStack(options) {
    const stackArtifact = options.stack;
    const stackEnv = options.resolvedEnvironment;
    options.sdk.appendCustomUserAgent(options.extraUserAgent);
    const cfn = options.sdk.cloudFormation();
    const deployName = options.deployName || stackArtifact.stackName;
    let cloudFormationStack = await callWithRetry(() => CloudFormationStack.lookup(cfn, deployName));
    if (cloudFormationStack.stackStatus.isCreationFailure) {
        debug(`Found existing stack ${deployName} that had previously failed creation. Deleting it before attempting to re-create it.`);
        await cfn.deleteStack({ StackName: deployName }).promise();
        const deletedStack = await waitForStackDelete(cfn, deployName);
        if (deletedStack && deletedStack.stackStatus.name !== "DELETE_COMPLETE") {
            throw new Error(`Failed deleting stack ${deployName} that had previously failed creation (current state: ${deletedStack.stackStatus})`);
        }
        // Update variable to mark that the stack does not exist anymore, but avoid
        // doing an actual lookup in CloudFormation (which would be silly to do if
        // we just deleted it).
        cloudFormationStack = CloudFormationStack.doesNotExist(cfn, deployName);
    }
    // Detect "legacy" assets (which remain in the metadata) and publish them via
    // an ad-hoc asset manifest, while passing their locations via template
    // parameters.
    const legacyAssets = new AssetManifestBuilder();
    const assetParams = await addMetadataAssetsToManifest(stackArtifact, legacyAssets, options.envResources, options.reuseAssets);
    const finalParameterValues = { ...options.parameters, ...assetParams };
    const templateParams = TemplateParameters.fromTemplate(stackArtifact.template);
    const stackParams = options.usePreviousParameters
        ? templateParams.updateExisting(finalParameterValues, cloudFormationStack.parameters)
        : templateParams.supplyAll(finalParameterValues);
    if (await canSkipDeploy(options, cloudFormationStack, stackParams.hasChanges(cloudFormationStack.parameters))) {
        debug(`${deployName}: skipping deployment (use --force to override)`);
        // if we can skip deployment and we are performing a hotswap, let the user know
        // that no hotswap deployment happened
        if (options.hotswap) {
        }
        return {
            noOp: true,
            outputs: cloudFormationStack.outputs,
            stackArn: cloudFormationStack.stackId,
        };
    }
    else {
        debug(`${deployName}: deploying...`);
    }
    const bodyParameter = await makeBodyParameter(stackArtifact, options.resolvedEnvironment, legacyAssets, options.envResources, options.sdk, options.overrideTemplate);
    await publishAssets(legacyAssets.toManifest(stackArtifact.assembly.directory), options.sdkProvider, stackEnv, {
        parallel: options.assetParallelism,
    });
    const hotswapMode = options.hotswap;
    if (hotswapMode && hotswapMode !== HotswapMode.FULL_DEPLOYMENT) {
        // attempt to short-circuit the deployment if possible
        try {
            const hotswapDeploymentResult = await tryHotswapDeployment(options.sdkProvider, stackParams.values, cloudFormationStack, stackArtifact, hotswapMode);
            if (hotswapDeploymentResult) {
                return hotswapDeploymentResult;
            }
            print("Could not perform a hotswap deployment, as the stack %s contains non-Asset changes", stackArtifact.displayName);
        }
        catch (e) {
            if (!(e instanceof CfnEvaluationException)) {
                throw e;
            }
            print("Could not perform a hotswap deployment, because the CloudFormation template could not be resolved: %s", e.message);
        }
        if (hotswapMode === HotswapMode.FALL_BACK) {
            print("Falling back to doing a full deployment");
            options.sdk.appendCustomUserAgent("cdk-hotswap/fallback");
        }
        else {
            return {
                noOp: true,
                stackArn: cloudFormationStack.stackId,
                outputs: cloudFormationStack.outputs,
            };
        }
    }
    // could not short-circuit the deployment, perform a full CFN deploy instead
    const fullDeployment = new FullCloudFormationDeployment(options, cloudFormationStack, stackArtifact, stackParams, bodyParameter);
    return fullDeployment.performDeployment();
}
/**
 * This class shares state and functionality between the different full deployment modes
 */
class FullCloudFormationDeployment {
    options;
    cloudFormationStack;
    stackArtifact;
    stackParams;
    bodyParameter;
    cfn;
    stackName;
    update;
    verb;
    uuid;
    constructor(options, cloudFormationStack, stackArtifact, stackParams, bodyParameter) {
        this.options = options;
        this.cloudFormationStack = cloudFormationStack;
        this.stackArtifact = stackArtifact;
        this.stackParams = stackParams;
        this.bodyParameter = bodyParameter;
        this.cfn = options.sdk.cloudFormation();
        this.stackName = options.deployName ?? stackArtifact.stackName;
        this.update =
            cloudFormationStack.exists &&
                cloudFormationStack.stackStatus.name !== "REVIEW_IN_PROGRESS";
        this.verb = this.update ? "update" : "create";
        this.uuid = uuid.v4();
    }
    async performDeployment() {
        const deploymentMethod = this.options.deploymentMethod ?? {
            method: "change-set",
        };
        if (deploymentMethod.method === "direct" &&
            this.options.resourcesToImport) {
            throw new Error("Importing resources requires a changeset deployment");
        }
        switch (deploymentMethod.method) {
            case "change-set":
                return this.changeSetDeployment(deploymentMethod);
            case "direct":
                return this.directDeployment();
        }
    }
    async changeSetDeployment(deploymentMethod) {
        const changeSetName = deploymentMethod.changeSetName ?? "cdk-deploy-change-set";
        const execute = deploymentMethod.execute ?? true;
        const changeSetDescription = await this.createChangeSet(changeSetName, execute);
        await this.updateTerminationProtection();
        if (changeSetHasNoChanges(changeSetDescription)) {
            debug("No changes are to be performed on %s.", this.stackName);
            if (execute) {
                debug("Deleting empty change set %s", changeSetDescription.ChangeSetId);
                await this.cfn
                    .deleteChangeSet({
                    StackName: this.stackName,
                    ChangeSetName: changeSetName,
                })
                    .promise();
            }
            if (this.options.force) {
                warning([
                    "You used the --force flag, but CloudFormation reported that the deployment would not make any changes.",
                    "According to CloudFormation, all resources are already up-to-date with the state in your CDK app.",
                    "",
                    "You cannot use the --force flag to get rid of changes you made in the console. Try using",
                    "CloudFormation drift detection instead: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html",
                ].join("\n"));
            }
            return {
                noOp: true,
                outputs: this.cloudFormationStack.outputs,
                stackArn: changeSetDescription.StackId,
            };
        }
        if (!execute) {
            print("Changeset %s created and waiting in review for manual execution (--no-execute)", changeSetDescription.ChangeSetId);
            return {
                noOp: false,
                outputs: this.cloudFormationStack.outputs,
                stackArn: changeSetDescription.StackId,
            };
        }
        return this.executeChangeSet(changeSetDescription);
    }
    async createChangeSet(changeSetName, willExecute) {
        await this.cleanupOldChangeset(changeSetName);
        debug(`Attempting to create ChangeSet with name ${changeSetName} to ${this.verb} stack ${this.stackName}`);
        const changeSet = await this.cfn
            .createChangeSet({
            StackName: this.stackName,
            ChangeSetName: changeSetName,
            ChangeSetType: this.options.resourcesToImport
                ? "IMPORT"
                : this.update
                    ? "UPDATE"
                    : "CREATE",
            ResourcesToImport: this.options.resourcesToImport,
            Description: `CDK Changeset for execution ${this.uuid}`,
            ClientToken: `create${this.uuid}`,
            ...this.commonPrepareOptions(),
        })
            .promise();
        debug("Initiated creation of changeset: %s; waiting for it to finish creating...", changeSet.Id);
        // Fetching all pages if we'll execute, so we can have the correct change count when monitoring.
        return waitForChangeSet(this.cfn, this.stackName, changeSetName, {
            fetchAll: willExecute,
        });
    }
    async executeChangeSet(changeSet) {
        debug("Initiating execution of changeset %s on stack %s", changeSet.ChangeSetId, this.stackName);
        await this.cfn
            .executeChangeSet({
            StackName: this.stackName,
            ChangeSetName: changeSet.ChangeSetName,
            ClientRequestToken: `exec${this.uuid}`,
            ...this.commonExecuteOptions(),
        })
            .promise();
        debug("Execution of changeset %s on stack %s has started; waiting for the update to complete...", changeSet.ChangeSetId, this.stackName);
        // +1 for the extra event emitted from updates.
        const changeSetLength = (changeSet.Changes ?? []).length + (this.update ? 1 : 0);
        return this.monitorDeployment(changeSet.CreationTime, changeSetLength);
    }
    async cleanupOldChangeset(changeSetName) {
        if (this.cloudFormationStack.exists) {
            // Delete any existing change sets generated by CDK since change set names must be unique.
            // The delete request is successful as long as the stack exists (even if the change set does not exist).
            debug(`Removing existing change set with name ${changeSetName} if it exists`);
            await this.cfn
                .deleteChangeSet({
                StackName: this.stackName,
                ChangeSetName: changeSetName,
            })
                .promise();
        }
    }
    async updateTerminationProtection() {
        // Update termination protection only if it has changed.
        const terminationProtection = this.stackArtifact.terminationProtection ?? false;
        if (!!this.cloudFormationStack.terminationProtection !== terminationProtection) {
            debug("Updating termination protection from %s to %s for stack %s", this.cloudFormationStack.terminationProtection, terminationProtection, this.stackName);
            await this.cfn
                .updateTerminationProtection({
                StackName: this.stackName,
                EnableTerminationProtection: terminationProtection,
            })
                .promise();
            debug("Termination protection updated to %s for stack %s", terminationProtection, this.stackName);
        }
    }
    async directDeployment() {
        const startTime = new Date();
        if (this.update) {
            await this.updateTerminationProtection();
            try {
                await this.cfn
                    .updateStack({
                    StackName: this.stackName,
                    ClientRequestToken: `update${this.uuid}`,
                    ...this.commonPrepareOptions(),
                    ...this.commonExecuteOptions(),
                })
                    .promise();
            }
            catch (err) {
                if (err.message === "No updates are to be performed.") {
                    debug("No updates are to be performed for stack %s", this.stackName);
                    return {
                        noOp: true,
                        outputs: this.cloudFormationStack.outputs,
                        stackArn: this.cloudFormationStack.stackId,
                    };
                }
                throw err;
            }
            if (this.options.noMonitor)
                return;
            return this.monitorDeployment(startTime, undefined);
        }
        else {
            // Take advantage of the fact that we can set termination protection during create
            const terminationProtection = this.stackArtifact.terminationProtection ?? false;
            await this.cfn
                .createStack({
                StackName: this.stackName,
                ClientRequestToken: `create${this.uuid}`,
                ...(terminationProtection
                    ? { EnableTerminationProtection: true }
                    : undefined),
                ...this.commonPrepareOptions(),
                ...this.commonExecuteOptions(),
            })
                .promise();
            if (this.options.noMonitor)
                return;
            return this.monitorDeployment(startTime, undefined);
        }
    }
    async monitorDeployment(startTime, expectedChanges) {
        // const monitor = this.options.quiet
        //   ? undefined
        //   : StackActivityMonitor.withDefaultPrinter(
        //       this.cfn,
        //       this.stackName,
        //       this.stackArtifact,
        //       {
        //         resourcesTotal: expectedChanges,
        //         progress: this.options.progress,
        //         changeSetCreationTime: startTime,
        //         ci: this.options.ci,
        //       }
        //     ).start();
        let finalState = this.cloudFormationStack;
        try {
            const successStack = await waitForStackDeploy(this.cfn, this.stackName);
            // This shouldn't really happen, but catch it anyway. You never know.
            if (!successStack) {
                throw new Error("Stack deploy failed (the stack disappeared while we were deploying it)");
            }
            finalState = successStack;
        }
        catch (e) {
            throw new Error(suffixWithErrors(e.message /*, monitor?.errors*/));
        }
        finally {
            // await monitor?.stop();
        }
        debug("Stack %s has completed updating", this.stackName);
        return {
            noOp: false,
            outputs: finalState.outputs,
            stackArn: finalState.stackId,
        };
    }
    /**
     * Return the options that are shared between CreateStack, UpdateStack and CreateChangeSet
     */
    commonPrepareOptions() {
        return {
            Capabilities: [
                "CAPABILITY_IAM",
                "CAPABILITY_NAMED_IAM",
                "CAPABILITY_AUTO_EXPAND",
            ],
            NotificationARNs: this.options.notificationArns,
            Parameters: this.stackParams.apiParameters,
            RoleARN: this.options.roleArn,
            TemplateBody: this.bodyParameter.TemplateBody,
            TemplateURL: this.bodyParameter.TemplateURL,
            Tags: this.options.tags,
        };
    }
    /**
     * Return the options that are shared between UpdateStack and CreateChangeSet
     *
     * Be careful not to add in keys for options that aren't used, as the features may not have been
     * deployed everywhere yet.
     */
    commonExecuteOptions() {
        const shouldDisableRollback = this.options.rollback === false;
        return {
            StackName: this.stackName,
            ...(shouldDisableRollback ? { DisableRollback: true } : undefined),
        };
    }
}
export async function destroyStack(options) {
    const deployName = options.deployName || options.stack.stackName;
    const cfn = options.sdk.cloudFormation();
    const currentStack = await CloudFormationStack.lookup(cfn, deployName);
    if (!currentStack.exists) {
        return;
    }
    /*
    const monitor = options.quiet
      ? undefined
      : StackActivityMonitor.withDefaultPrinter(cfn, deployName, options.stack, {
          ci: options.ci,
        }).start();
    */
    try {
        await cfn
            .deleteStack({ StackName: deployName, RoleARN: options.roleArn })
            .promise();
        const destroyedStack = await waitForStackDelete(cfn, deployName);
        if (destroyedStack &&
            destroyedStack.stackStatus.name !== "DELETE_COMPLETE") {
            throw new Error(`Failed to destroy ${deployName}: ${destroyedStack.stackStatus}`);
        }
    }
    catch (e) {
        throw new Error(suffixWithErrors(e.message /* , monitor?.errors */));
    }
    finally {
        /*
        if (monitor) {
          await monitor.stop();
        }
        */
    }
}
/**
 * Checks whether we can skip deployment
 *
 * We do this in a complicated way by preprocessing (instead of just
 * looking at the changeset), because if there are nested stacks involved
 * the changeset will always show the nested stacks as needing to be
 * updated, and the deployment will take a long time to in effect not
 * do anything.
 */
async function canSkipDeploy(deployStackOptions, cloudFormationStack, parameterChanges) {
    const deployName = deployStackOptions.deployName || deployStackOptions.stack.stackName;
    debug(`${deployName}: checking if we can skip deploy`);
    // Forced deploy
    if (deployStackOptions.force) {
        debug(`${deployName}: forced deployment`);
        return false;
    }
    // Creating changeset only (default true), never skip
    if (deployStackOptions.deploymentMethod?.method === "change-set" &&
        deployStackOptions.deploymentMethod.execute === false) {
        debug(`${deployName}: --no-execute, always creating change set`);
        return false;
    }
    // No existing stack
    if (!cloudFormationStack.exists) {
        debug(`${deployName}: no existing stack`);
        return false;
    }
    // SST check: stack is not busy
    if (cloudFormationStack.stackStatus.isInProgress) {
        debug(`${deployName}: stack is busy`);
        return false;
    }
    // Template has changed (assets taken into account here)
    if (JSON.stringify(deployStackOptions.stack.template) !==
        JSON.stringify(await cloudFormationStack.template())) {
        debug(`${deployName}: template has changed`);
        return false;
    }
    // Tags have changed
    if (!compareTags(cloudFormationStack.tags, deployStackOptions.tags ?? [])) {
        debug(`${deployName}: tags have changed`);
        return false;
    }
    // Termination protection has been updated
    if (!!deployStackOptions.stack.terminationProtection !==
        !!cloudFormationStack.terminationProtection) {
        debug(`${deployName}: termination protection has been updated`);
        return false;
    }
    // Parameters have changed
    if (parameterChanges) {
        if (parameterChanges === "ssm") {
            debug(`${deployName}: some parameters come from SSM so we have to assume they may have changed`);
        }
        else {
            debug(`${deployName}: parameters have changed`);
        }
        return false;
    }
    // Existing stack is in a failed state
    if (cloudFormationStack.stackStatus.isFailure) {
        debug(`${deployName}: stack is in a failure state`);
        return false;
    }
    // We can skip deploy
    return true;
}
/**
 * Compares two list of tags, returns true if identical.
 */
function compareTags(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (const aTag of a) {
        const bTag = b.find((tag) => tag.Key === aTag.Key);
        if (!bTag || bTag.Value !== aTag.Value) {
            return false;
        }
    }
    return true;
}
function suffixWithErrors(msg, errors) {
    return errors && errors.length > 0 ? `${msg}: ${errors.join(", ")}` : msg;
}
