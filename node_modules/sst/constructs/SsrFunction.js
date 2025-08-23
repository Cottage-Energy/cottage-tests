import url from "url";
import path from "path";
import zlib from "zlib";
import fs from "fs/promises";
import spawn from "cross-spawn";
import { Construct } from "constructs";
import { Effect, Policy, PolicyStatement, } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Architecture, AssetCode, Runtime, Code, Function as CdkFunction, } from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Duration as CdkDuration, CustomResource, } from "aws-cdk-lib/core";
import { useProject } from "../project.js";
import { useRuntimeHandlers } from "../runtime/handlers.js";
import { useFunctions, } from "./Function.js";
import { Stack } from "./Stack.js";
import { getBindingEnvironments, getBindingPermissions, getBindingReferencedSecrets, } from "./util/binding.js";
import { attachPermissionsToRole } from "./util/permission.js";
import { toCdkSize } from "./util/size.js";
import { toCdkDuration } from "./util/duration.js";
import { useDeferredTasks } from "./deferred_task.js";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { Config } from "../config.js";
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
/////////////////////
// Construct
/////////////////////
export class SsrFunction extends Construct {
    id;
    /** @internal */
    _doNotAllowOthersToBind = true;
    function;
    functionUrl;
    assetReplacer;
    assetReplacerPolicy;
    missingSourcemap;
    props;
    constructor(scope, id, props) {
        super(scope, id);
        this.id = id;
        this.props = {
            timeout: 10,
            memorySize: 1024,
            streaming: false,
            injections: [],
            architecture: Architecture.ARM_64,
            ...props,
            environment: props.environment || {},
            permissions: props.permissions || [],
        };
        // Create function with placeholder code
        const assetBucket = "placeholder";
        const assetKey = "placeholder";
        const { assetReplacer, assetReplacerPolicy } = this.createCodeReplacer(assetBucket, assetKey);
        this.function = this.createFunction(assetBucket, assetKey);
        this.attachPermissions(props.permissions || []);
        this.bind(props.bind || []);
        this.function.node.addDependency(assetReplacer);
        this.createSecretPrefetcher();
        this.assetReplacer = assetReplacer;
        this.assetReplacerPolicy = assetReplacerPolicy;
        useDeferredTasks().add(async () => {
            const { bundle } = this.props;
            const { code, handler } = bundle
                ? await this.buildAssetFromBundle(bundle)
                : await this.buildAssetFromHandler();
            const codeConfig = code.bind(this.function);
            const assetBucket = codeConfig.s3Location?.bucketName;
            const assetKey = codeConfig.s3Location?.objectKey;
            this.updateCodeReplacer(assetBucket, assetKey);
            this.updateFunction(code, assetBucket, assetKey, handler);
        });
        const app = this.node.root;
        app.registerTypes(this);
    }
    get role() {
        return this.function.role;
    }
    get functionArn() {
        return this.function.functionArn;
    }
    get functionName() {
        return this.function.functionName;
    }
    get url() {
        return this.functionUrl?.url;
    }
    addEnvironment(key, value) {
        return this.function.addEnvironment(key, value);
    }
    addFunctionUrl(props) {
        this.functionUrl = this.function.addFunctionUrl(props);
        return this.functionUrl;
    }
    grantInvoke(grantee) {
        return this.function.grantInvoke(grantee);
    }
    attachPermissions(permissions) {
        attachPermissionsToRole(this.function.role, permissions);
    }
    _overrideMissingSourcemap() {
        this.missingSourcemap = true;
    }
    createFunction(assetBucket, assetKey) {
        const { architecture, runtime, timeout, memorySize, handler, logRetention, } = this.props;
        return new CdkFunction(this, `ServerFunction`, {
            ...this.props,
            handler: handler.split(path.sep).join(path.posix.sep),
            logRetention: logRetention ?? RetentionDays.THREE_DAYS,
            code: Code.fromBucket(Bucket.fromBucketName(this, "IServerFunctionBucket", assetBucket), assetKey),
            runtime: runtime === "nodejs22.x"
                ? Runtime.NODEJS_22_X
                : runtime === "nodejs20.x"
                    ? Runtime.NODEJS_20_X
                    : Runtime.NODEJS_18_X,
            architecture,
            memorySize: typeof memorySize === "string"
                ? toCdkSize(memorySize).toMebibytes()
                : memorySize,
            timeout: typeof timeout === "string"
                ? toCdkDuration(timeout)
                : CdkDuration.seconds(timeout),
            logRetentionRetryOptions: logRetention && { maxRetries: 100 },
        });
    }
    createCodeReplacer(assetBucket, assetKey) {
        const { environment } = this.props;
        // Note: Source code for the Lambda functions have "{{ ENV_KEY }}" in them.
        //       They need to be replaced with real values before the Lambda
        //       functions get deployed.
        // - "*.js" files: ie. Next.js server function
        // - "*.html" files: ie. SvelteKit prerendered pages data
        // - "*.json" files: ie. SvelteKit prerendered + SSR data
        const stack = Stack.of(this);
        const policy = new Policy(this, "AssetReplacerPolicy", {
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ["s3:GetObject", "s3:PutObject"],
                    resources: [`arn:${stack.partition}:s3:::${assetBucket}/*`],
                }),
            ],
        });
        stack.customResourceHandler.role?.attachInlinePolicy(policy);
        const resource = new CustomResource(this, "AssetReplacer", {
            serviceToken: stack.customResourceHandler.functionArn,
            resourceType: "Custom::AssetReplacer",
            properties: {
                bucket: assetBucket,
                key: assetKey,
                replacements: Object.entries(environment).map(([key, value]) => ({
                    files: "**/*.@(*js|json|html)",
                    search: `{{ ${key} }}`,
                    replace: value,
                })),
            },
        });
        resource.node.addDependency(policy);
        return { assetReplacer: resource, assetReplacerPolicy: policy };
    }
    createSecretPrefetcher() {
        const { prefetchSecrets } = this.props;
        if (!prefetchSecrets)
            return;
        const stack = Stack.of(this);
        // Create custom resource to prewarm on deploy
        const policy = new Policy(this, "SecretPrefetcherPolicy", {
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ["lambda:GetFunction", "lambda:UpdateFunctionConfiguration"],
                    resources: [this.function.functionArn],
                }),
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ["ssm:GetParameters"],
                    resources: [
                        `arn:${stack.partition}:ssm:${stack.region}:${stack.account}:parameter${Config.PREFIX.STAGE}*`,
                        `arn:${stack.partition}:ssm:${stack.region}:${stack.account}:parameter${Config.PREFIX.FALLBACK}*`,
                    ],
                }),
            ],
        });
        stack.customResourceHandler.role?.attachInlinePolicy(policy);
        const resource = new CustomResource(this, "SecretPrefetcher", {
            serviceToken: stack.customResourceHandler.functionArn,
            resourceType: "Custom::SecretPrefetcher",
            properties: {
                version: Date.now().toString(),
                functionName: this.function.functionName,
            },
        });
        resource.node.addDependency(policy);
    }
    bind(constructs) {
        const app = this.node.root;
        this.function.addEnvironment("SST_APP", app.name);
        this.function.addEnvironment("SST_STAGE", app.stage);
        this.function.addEnvironment("SST_SSM_PREFIX", useProject().config.ssmPrefix);
        // Get referenced secrets
        const referencedSecrets = [];
        constructs.forEach((r) => referencedSecrets.push(...getBindingReferencedSecrets(r)));
        [...constructs, ...referencedSecrets].forEach((r) => {
            // Bind environment
            const env = getBindingEnvironments(r);
            Object.entries(env).forEach(([key, value]) => this.function.addEnvironment(key, value));
            // Bind permissions
            const policyStatements = getBindingPermissions(r);
            this.attachPermissions(policyStatements);
        });
    }
    async buildAssetFromHandler() {
        const { handler, runtime, nodejs, copyFiles, architecture: enumArchitecture, } = this.props;
        const architecture = enumArchitecture === Architecture.X86_64 ? "x86_64" : "arm_64";
        useFunctions().add(this.node.addr, {
            handler,
            runtime,
            nodejs,
            architecture,
            copyFiles,
        });
        // build function
        const result = await useRuntimeHandlers().build(this.node.addr, "deploy");
        // create wrapper that calls the handler
        if (result.type === "error")
            throw new Error([
                `There was a problem bundling the SSR function for the "${this.node.id}" Site.`,
                ...result.errors,
            ].join("\n"));
        const newHandler = await this.writeWrapperFile(result.out, result.handler);
        // upload sourcemap
        const stack = Stack.of(this);
        if (result.sourcemap) {
            const data = await fs.readFile(result.sourcemap);
            await fs.writeFile(result.sourcemap, zlib.gzipSync(data));
            const asset = new Asset(this, "Sourcemap", {
                path: result.sourcemap,
            });
            await fs.rm(result.sourcemap);
            useFunctions().sourcemaps.add(stack.stackName, {
                asset,
                tarKey: this.functionArn,
            });
        }
        this.missingSourcemap = !result.sourcemap;
        return { code: AssetCode.fromAsset(result.out), handler: newHandler };
    }
    async buildAssetFromBundle(bundle) {
        const { handler } = this.props;
        const newHandler = await this.writeWrapperFile(bundle, handler);
        // Note: cannot point the bundle to the `.open-next/server-function`
        //       b/c the folder contains node_modules. And pnpm node_modules
        //       contains symlinks. CDK cannot zip symlinks correctly.
        //       https://github.com/aws/aws-cdk/issues/9251
        //       We will zip the folder ourselves.
        const outputPath = path.resolve(useProject().paths.artifacts, `SsrFunction-${this.node.id}-${this.node.addr}`);
        const script = path.resolve(__dirname, "../support/ssr-site-function-archiver.mjs");
        const result = spawn.sync("node", [script, path.join(bundle), path.join(outputPath, "server-function.zip")], { stdio: "inherit" });
        if (result.status !== 0) {
            throw new Error(`There was a problem generating the assets package.`);
        }
        return {
            code: AssetCode.fromAsset(path.join(outputPath, "server-function.zip")),
            handler: newHandler,
        };
    }
    async writeWrapperFile(bundle, handler) {
        const { streaming, injections } = this.props;
        if (injections.length === 0)
            return handler;
        const { dir: handlerDir, name: oldHandlerName, ext: oldHandlerExt, } = path.posix.parse(handler);
        const oldHandlerFunction = oldHandlerExt.replace(/^\./, "");
        const newHandlerName = "server-index";
        const newHandlerFunction = "handler";
        await fs.writeFile(path.join(bundle, handlerDir, `${newHandlerName}.mjs`), streaming
            ? [
                `export const ${newHandlerFunction} = awslambda.streamifyResponse(async (event, responseStream, context) => {`,
                ...injections,
                `  const { ${oldHandlerFunction}: rawHandler} = await import("./${oldHandlerName}.mjs");`,
                `  return rawHandler(event, responseStream, context);`,
                `});`,
            ].join("\n")
            : [
                `export const ${newHandlerFunction} = async (event, context) => {`,
                ...injections,
                `  const { ${oldHandlerFunction}: rawHandler} = await import("./${oldHandlerName}.mjs");`,
                `  return rawHandler(event, context);`,
                `};`,
            ].join("\n"));
        return path.posix.join(handlerDir, `${newHandlerName}.${newHandlerFunction}`);
    }
    updateCodeReplacer(assetBucket, assetKey) {
        const stack = Stack.of(this);
        const cfnReplacer = this.assetReplacer.node
            .defaultChild;
        cfnReplacer.addPropertyOverride("bucket", assetBucket);
        cfnReplacer.addPropertyOverride("key", assetKey);
        const cfnPolicy = this.assetReplacerPolicy.node.defaultChild;
        cfnPolicy.addPropertyOverride("PolicyDocument.Statement.0.Resource", `arn:${stack.partition}:s3:::${assetBucket}/*`);
    }
    updateFunction(code, assetBucket, assetKey, handler) {
        const cfnFunction = this.function.node.defaultChild;
        cfnFunction.handler = handler;
        cfnFunction.code = {
            s3Bucket: assetBucket,
            s3Key: assetKey,
        };
        code.bindToResource(cfnFunction);
    }
    /** @internal */
    getConstructMetadata() {
        return {
            type: "Function",
            data: {
                arn: this.functionArn,
                runtime: this.props.runtime,
                handler: this.props.handler,
                missingSourcemap: this.missingSourcemap === true ? true : undefined,
                localId: this.node.addr,
                secrets: [],
                prefetchSecrets: this.props.prefetchSecrets,
            },
        };
    }
    /** @internal */
    getBindings() {
        return undefined;
    }
}
