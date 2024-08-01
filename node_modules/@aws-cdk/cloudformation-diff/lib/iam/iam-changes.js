"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamChanges = void 0;
const service_spec_types_1 = require("@aws-cdk/service-spec-types");
const chalk = require("chalk");
const iam_identity_center_1 = require("./iam-identity-center");
const managed_policy_1 = require("./managed-policy");
const statement_1 = require("./statement");
const diffable_1 = require("../diffable");
const render_intrinsics_1 = require("../render-intrinsics");
const util_1 = require("../util");
/**
 * Changes to IAM statements and IAM identity center
 */
class IamChanges {
    constructor(props) {
        // each entry in a DiffableCollection is used to generate a single row of the security changes table that is presented for cdk diff and cdk deploy.
        this.statements = new diffable_1.DiffableCollection();
        this.managedPolicies = new diffable_1.DiffableCollection();
        this.ssoPermissionSets = new diffable_1.DiffableCollection();
        this.ssoAssignments = new diffable_1.DiffableCollection();
        this.ssoInstanceACAConfigs = new diffable_1.DiffableCollection();
        for (const propertyChange of props.propertyChanges) {
            this.readPropertyChange(propertyChange);
        }
        for (const resourceChange of props.resourceChanges) {
            this.readResourceChange(resourceChange);
        }
        this.statements.calculateDiff();
        this.managedPolicies.calculateDiff();
        this.ssoPermissionSets.calculateDiff();
        this.ssoAssignments.calculateDiff();
        this.ssoInstanceACAConfigs.calculateDiff();
    }
    get hasChanges() {
        return (this.statements.hasChanges
            || this.managedPolicies.hasChanges
            || this.ssoPermissionSets.hasChanges
            || this.ssoAssignments.hasChanges
            || this.ssoInstanceACAConfigs.hasChanges);
    }
    /**
     * Return whether the changes include broadened permissions
     *
     * Permissions are broadened if positive statements are added or
     * negative statements are removed, or if managed policies are added.
     */
    get permissionsBroadened() {
        return this.statements.additions.some(s => !s.isNegativeStatement)
            || this.statements.removals.some(s => s.isNegativeStatement)
            || this.managedPolicies.hasAdditions
            || this.ssoPermissionSets.hasAdditions
            || this.ssoAssignments.hasAdditions
            || this.ssoInstanceACAConfigs.hasAdditions;
    }
    /**
     * Return a summary table of changes
     */
    summarizeStatements() {
        const ret = [];
        const header = ['', 'Resource', 'Effect', 'Action', 'Principal', 'Condition'];
        // First generate all lines, then sort on Resource so that similar resources are together
        for (const statement of this.statements.additions) {
            const renderedStatement = statement.render();
            ret.push([
                '+',
                renderedStatement.resource,
                renderedStatement.effect,
                renderedStatement.action,
                renderedStatement.principal,
                renderedStatement.condition,
            ].map(s => chalk.green(s)));
        }
        for (const statement of this.statements.removals) {
            const renderedStatement = statement.render();
            ret.push([
                '-',
                renderedStatement.resource,
                renderedStatement.effect,
                renderedStatement.action,
                renderedStatement.principal,
                renderedStatement.condition,
            ].map(s => chalk.red(s)));
        }
        // Sort by 2nd column
        ret.sort((0, util_1.makeComparator)((row) => [row[1]]));
        ret.splice(0, 0, header);
        return ret;
    }
    summarizeManagedPolicies() {
        const ret = [];
        const header = ['', 'Resource', 'Managed Policy ARN'];
        for (const att of this.managedPolicies.additions) {
            ret.push([
                '+',
                att.identityArn,
                att.managedPolicyArn,
            ].map(s => chalk.green(s)));
        }
        for (const att of this.managedPolicies.removals) {
            ret.push([
                '-',
                att.identityArn,
                att.managedPolicyArn,
            ].map(s => chalk.red(s)));
        }
        // Sort by 2nd column
        ret.sort((0, util_1.makeComparator)((row) => [row[1]]));
        ret.splice(0, 0, header);
        return ret;
    }
    summarizeSsoAssignments() {
        const ret = [];
        const header = ['', 'Resource', 'InstanceArn', 'PermissionSetArn', 'PrincipalId', 'PrincipalType', 'TargetId', 'TargetType'];
        for (const att of this.ssoAssignments.additions) {
            ret.push([
                '+',
                att.cfnLogicalId || '',
                att.ssoInstanceArn || '',
                att.permissionSetArn || '',
                att.principalId || '',
                att.principalType || '',
                att.targetId || '',
                att.targetType || '',
            ].map(s => chalk.green(s)));
        }
        for (const att of this.ssoAssignments.removals) {
            ret.push([
                '-',
                att.cfnLogicalId || '',
                att.ssoInstanceArn || '',
                att.permissionSetArn || '',
                att.principalId || '',
                att.principalType || '',
                att.targetId || '',
                att.targetType || '',
            ].map(s => chalk.red(s)));
        }
        // Sort by resource name to ensure a unique value is used for sorting
        ret.sort((0, util_1.makeComparator)((row) => [row[1]]));
        ret.splice(0, 0, header);
        return ret;
    }
    summarizeSsoInstanceACAConfigs() {
        const ret = [];
        const header = ['', 'Resource', 'InstanceArn', 'AccessControlAttributes'];
        function formatAccessControlAttribute(aca) {
            return `Key: ${aca?.Key}, Values: [${aca?.Value?.Source.join(', ')}]`;
        }
        for (const att of this.ssoInstanceACAConfigs.additions) {
            ret.push([
                '+',
                att.cfnLogicalId || '',
                att.ssoInstanceArn || '',
                att.accessControlAttributes?.map(formatAccessControlAttribute).join('\n') || '',
            ].map(s => chalk.green(s)));
        }
        for (const att of this.ssoInstanceACAConfigs.removals) {
            ret.push([
                '-',
                att.cfnLogicalId || '',
                att.ssoInstanceArn || '',
                att.accessControlAttributes?.map(formatAccessControlAttribute).join('\n') || '',
            ].map(s => chalk.red(s)));
        }
        // Sort by resource name to ensure a unique value is used for sorting
        ret.sort((0, util_1.makeComparator)((row) => [row[1]]));
        ret.splice(0, 0, header);
        return ret;
    }
    summarizeSsoPermissionSets() {
        const ret = [];
        const header = ['', 'Resource', 'InstanceArn', 'PermissionSet name', 'PermissionsBoundary', 'CustomerManagedPolicyReferences'];
        function formatManagedPolicyRef(s) {
            return `Name: ${s?.Name || ''}, Path: ${s?.Path || ''}`;
        }
        function formatSsoPermissionsBoundary(ssoPb) {
            // ManagedPolicyArn OR CustomerManagedPolicyReference can be specified -- but not both.
            if (ssoPb?.ManagedPolicyArn !== undefined) {
                return `ManagedPolicyArn: ${ssoPb?.ManagedPolicyArn || ''}`;
            }
            else if (ssoPb?.CustomerManagedPolicyReference !== undefined) {
                return `CustomerManagedPolicyReference: {\n  ${formatManagedPolicyRef(ssoPb?.CustomerManagedPolicyReference)}\n}`;
            }
            else {
                return '';
            }
        }
        for (const att of this.ssoPermissionSets.additions) {
            ret.push([
                '+',
                att.cfnLogicalId || '',
                att.ssoInstanceArn || '',
                att.name || '',
                formatSsoPermissionsBoundary(att.ssoPermissionsBoundary),
                att.ssoCustomerManagedPolicyReferences?.map(formatManagedPolicyRef).join('\n') || '',
            ].map(s => chalk.green(s)));
        }
        for (const att of this.ssoPermissionSets.removals) {
            ret.push([
                '-',
                att.cfnLogicalId || '',
                att.ssoInstanceArn || '',
                att.name || '',
                formatSsoPermissionsBoundary(att.ssoPermissionsBoundary),
                att.ssoCustomerManagedPolicyReferences?.map(formatManagedPolicyRef).join('\n') || '',
            ].map(s => chalk.red(s)));
        }
        // Sort by resource name to ensure a unique value is used for sorting
        ret.sort((0, util_1.makeComparator)((row) => [row[1]]));
        ret.splice(0, 0, header);
        return ret;
    }
    /**
     * Return a machine-readable version of the changes.
     * This is only used in tests.
     *
     * @internal
     */
    _toJson() {
        return (0, util_1.deepRemoveUndefined)({
            statementAdditions: (0, util_1.dropIfEmpty)(this.statements.additions.map(s => s._toJson())),
            statementRemovals: (0, util_1.dropIfEmpty)(this.statements.removals.map(s => s._toJson())),
            managedPolicyAdditions: (0, util_1.dropIfEmpty)(this.managedPolicies.additions.map(s => s._toJson())),
            managedPolicyRemovals: (0, util_1.dropIfEmpty)(this.managedPolicies.removals.map(s => s._toJson())),
        });
    }
    readPropertyChange(propertyChange) {
        switch (propertyChange.scrutinyType) {
            case service_spec_types_1.PropertyScrutinyType.InlineIdentityPolicies:
                // AWS::IAM::{ Role | User | Group }.Policies
                this.statements.addOld(...this.readIdentityPolicies(propertyChange.oldValue, propertyChange.resourceLogicalId));
                this.statements.addNew(...this.readIdentityPolicies(propertyChange.newValue, propertyChange.resourceLogicalId));
                break;
            case service_spec_types_1.PropertyScrutinyType.InlineResourcePolicy:
                // Any PolicyDocument on a resource (including AssumeRolePolicyDocument)
                this.statements.addOld(...this.readResourceStatements(propertyChange.oldValue, propertyChange.resourceLogicalId));
                this.statements.addNew(...this.readResourceStatements(propertyChange.newValue, propertyChange.resourceLogicalId));
                break;
            case service_spec_types_1.PropertyScrutinyType.ManagedPolicies:
                // Just a list of managed policies
                this.managedPolicies.addOld(...this.readManagedPolicies(propertyChange.oldValue, propertyChange.resourceLogicalId));
                this.managedPolicies.addNew(...this.readManagedPolicies(propertyChange.newValue, propertyChange.resourceLogicalId));
                break;
        }
    }
    readResourceChange(resourceChange) {
        switch (resourceChange.scrutinyType) {
            case service_spec_types_1.ResourceScrutinyType.IdentityPolicyResource:
                // AWS::IAM::Policy
                this.statements.addOld(...this.readIdentityPolicyResource(resourceChange.oldProperties));
                this.statements.addNew(...this.readIdentityPolicyResource(resourceChange.newProperties));
                break;
            case service_spec_types_1.ResourceScrutinyType.ResourcePolicyResource:
                // AWS::*::{Bucket,Queue,Topic}Policy
                this.statements.addOld(...this.readResourcePolicyResource(resourceChange.oldProperties));
                this.statements.addNew(...this.readResourcePolicyResource(resourceChange.newProperties));
                break;
            case service_spec_types_1.ResourceScrutinyType.LambdaPermission:
                this.statements.addOld(...this.readLambdaStatements(resourceChange.oldProperties));
                this.statements.addNew(...this.readLambdaStatements(resourceChange.newProperties));
                break;
            case service_spec_types_1.ResourceScrutinyType.SsoPermissionSet:
                this.ssoPermissionSets.addOld(...this.readSsoPermissionSet(resourceChange.oldProperties, resourceChange.resourceLogicalId));
                this.ssoPermissionSets.addNew(...this.readSsoPermissionSet(resourceChange.newProperties, resourceChange.resourceLogicalId));
                break;
            case service_spec_types_1.ResourceScrutinyType.SsoAssignmentResource:
                this.ssoAssignments.addOld(...this.readSsoAssignments(resourceChange.oldProperties, resourceChange.resourceLogicalId));
                this.ssoAssignments.addNew(...this.readSsoAssignments(resourceChange.newProperties, resourceChange.resourceLogicalId));
                break;
            case service_spec_types_1.ResourceScrutinyType.SsoInstanceACAConfigResource:
                this.ssoInstanceACAConfigs.addOld(...this.readSsoInstanceACAConfigs(resourceChange.oldProperties, resourceChange.resourceLogicalId));
                this.ssoInstanceACAConfigs.addNew(...this.readSsoInstanceACAConfigs(resourceChange.newProperties, resourceChange.resourceLogicalId));
                break;
        }
    }
    /**
     * Parse a list of policies on an identity
     */
    readIdentityPolicies(policies, logicalId) {
        if (policies === undefined || !Array.isArray(policies)) {
            return [];
        }
        const appliesToPrincipal = 'AWS:${' + logicalId + '}';
        return (0, util_1.flatMap)(policies, (policy) => {
            // check if the Policy itself is not an intrinsic, like an Fn::If
            const unparsedStatement = policy.PolicyDocument?.Statement
                ? policy.PolicyDocument.Statement
                : policy;
            return defaultPrincipal(appliesToPrincipal, (0, statement_1.parseStatements)((0, render_intrinsics_1.renderIntrinsics)(unparsedStatement)));
        });
    }
    /**
     * Parse an IAM::Policy resource
     */
    readIdentityPolicyResource(properties) {
        if (properties === undefined) {
            return [];
        }
        properties = (0, render_intrinsics_1.renderIntrinsics)(properties);
        const principals = (properties.Groups || []).concat(properties.Users || []).concat(properties.Roles || []);
        return (0, util_1.flatMap)(principals, (principal) => {
            const ref = 'AWS:' + principal;
            return defaultPrincipal(ref, (0, statement_1.parseStatements)(properties.PolicyDocument.Statement));
        });
    }
    readSsoInstanceACAConfigs(properties, logicalId) {
        if (properties === undefined) {
            return [];
        }
        properties = (0, render_intrinsics_1.renderIntrinsics)(properties);
        return [new iam_identity_center_1.SsoInstanceACAConfig({
                cfnLogicalId: '${' + logicalId + '}',
                ssoInstanceArn: properties.InstanceArn,
                accessControlAttributes: properties.AccessControlAttributes,
            })];
    }
    readSsoAssignments(properties, logicalId) {
        if (properties === undefined) {
            return [];
        }
        properties = (0, render_intrinsics_1.renderIntrinsics)(properties);
        return [new iam_identity_center_1.SsoAssignment({
                cfnLogicalId: '${' + logicalId + '}',
                ssoInstanceArn: properties.InstanceArn,
                permissionSetArn: properties.PermissionSetArn,
                principalId: properties.PrincipalId,
                principalType: properties.PrincipalType,
                targetId: properties.TargetId,
                targetType: properties.TargetType,
            })];
    }
    readSsoPermissionSet(properties, logicalId) {
        if (properties === undefined) {
            return [];
        }
        properties = (0, render_intrinsics_1.renderIntrinsics)(properties);
        return [new iam_identity_center_1.SsoPermissionSet({
                cfnLogicalId: '${' + logicalId + '}',
                name: properties.Name,
                ssoInstanceArn: properties.InstanceArn,
                ssoCustomerManagedPolicyReferences: properties.CustomerManagedPolicyReferences,
                ssoPermissionsBoundary: properties.PermissionsBoundary,
            })];
    }
    readResourceStatements(policy, logicalId) {
        if (policy === undefined) {
            return [];
        }
        const appliesToResource = '${' + logicalId + '.Arn}';
        return defaultResource(appliesToResource, (0, statement_1.parseStatements)((0, render_intrinsics_1.renderIntrinsics)(policy.Statement)));
    }
    /**
     * Parse an AWS::*::{Bucket,Topic,Queue}policy
     */
    readResourcePolicyResource(properties) {
        if (properties === undefined) {
            return [];
        }
        properties = (0, render_intrinsics_1.renderIntrinsics)(properties);
        const policyKeys = Object.keys(properties).filter(key => key.indexOf('Policy') > -1);
        // Find the key that identifies the resource(s) this policy applies to
        const resourceKeys = Object.keys(properties).filter(key => !policyKeys.includes(key) && !key.endsWith('Name'));
        let resources = resourceKeys.length === 1 ? properties[resourceKeys[0]] : ['???'];
        // For some resources, this is a singleton string, for some it's an array
        if (!Array.isArray(resources)) {
            resources = [resources];
        }
        return (0, util_1.flatMap)(resources, (resource) => {
            return defaultResource(resource, (0, statement_1.parseStatements)(properties[policyKeys[0]].Statement));
        });
    }
    readManagedPolicies(policyArns, logicalId) {
        if (!policyArns) {
            return [];
        }
        const rep = '${' + logicalId + '}';
        return managed_policy_1.ManagedPolicyAttachment.parseManagedPolicies(rep, (0, render_intrinsics_1.renderIntrinsics)(policyArns));
    }
    readLambdaStatements(properties) {
        if (!properties) {
            return [];
        }
        return [(0, statement_1.parseLambdaPermission)((0, render_intrinsics_1.renderIntrinsics)(properties))];
    }
}
exports.IamChanges = IamChanges;
IamChanges.IamPropertyScrutinies = [
    service_spec_types_1.PropertyScrutinyType.InlineIdentityPolicies,
    service_spec_types_1.PropertyScrutinyType.InlineResourcePolicy,
    service_spec_types_1.PropertyScrutinyType.ManagedPolicies,
];
IamChanges.IamResourceScrutinies = [
    service_spec_types_1.ResourceScrutinyType.ResourcePolicyResource,
    service_spec_types_1.ResourceScrutinyType.IdentityPolicyResource,
    service_spec_types_1.ResourceScrutinyType.LambdaPermission,
    service_spec_types_1.ResourceScrutinyType.SsoAssignmentResource,
    service_spec_types_1.ResourceScrutinyType.SsoInstanceACAConfigResource,
    service_spec_types_1.ResourceScrutinyType.SsoPermissionSet,
];
/**
 * Set an undefined or wildcarded principal on these statements
 */
function defaultPrincipal(principal, statements) {
    statements.forEach(s => s.principals.replaceEmpty(principal));
    statements.forEach(s => s.principals.replaceStar(principal));
    return statements;
}
/**
 * Set an undefined or wildcarded resource on these statements
 */
function defaultResource(resource, statements) {
    statements.forEach(s => s.resources.replaceEmpty(resource));
    statements.forEach(s => s.resources.replaceStar(resource));
    return statements;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLWNoYW5nZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpYW0tY2hhbmdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxvRUFBeUY7QUFDekYsK0JBQStCO0FBQy9CLCtEQUF3STtBQUN4SSxxREFBOEU7QUFDOUUsMkNBQStGO0FBRy9GLDBDQUFpRDtBQUNqRCw0REFBd0Q7QUFDeEQsa0NBQW9GO0FBT3BGOztHQUVHO0FBQ0gsTUFBYSxVQUFVO0lBdUJyQixZQUFZLEtBQXNCO1FBUGxDLG1KQUFtSjtRQUNuSSxlQUFVLEdBQUcsSUFBSSw2QkFBa0IsRUFBYSxDQUFDO1FBQ2pELG9CQUFlLEdBQUcsSUFBSSw2QkFBa0IsRUFBMkIsQ0FBQztRQUNwRSxzQkFBaUIsR0FBRyxJQUFJLDZCQUFrQixFQUFvQixDQUFDO1FBQy9ELG1CQUFjLEdBQUcsSUFBSSw2QkFBa0IsRUFBaUIsQ0FBQztRQUN6RCwwQkFBcUIsR0FBRyxJQUFJLDZCQUFrQixFQUF3QixDQUFDO1FBR3JGLEtBQUssTUFBTSxjQUFjLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ25ELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsS0FBSyxNQUFNLGNBQWMsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDbkQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDcEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQzdDLENBQUM7SUFF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QUVZLGdDQUFxQixHQUFHO0lBQ3BDLHlDQUFvQixDQUFDLHNCQUFzQjtJQUMzQyx5Q0FBb0IsQ0FBQyxzQkFBc0I7SUFDM0MseUNBQW9CLENBQUMsZ0JBQWdCO0lBQ3JDLHlDQUFvQixDQUFDLHFCQUFxQjtJQUMxQyx5Q0FBb0IsQ0FBQyw0QkFBNEI7SUFDakQseUNBQW9CLENBQUMsZ0JBQWdCO0NBQ3RDLEFBUGtDLENBT2pDO0FBOFpKOztHQUVHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxTQUFpQixFQUFFLFVBQXVCO0lBQ2xFLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzlELFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzdELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsZUFBZSxDQUFDLFFBQWdCLEVBQUUsVUFBdUI7SUFDaEUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDNUQsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb3BlcnR5U2NydXRpbnlUeXBlLCBSZXNvdXJjZVNjcnV0aW55VHlwZSB9IGZyb20gJ0Bhd3MtY2RrL3NlcnZpY2Utc3BlYy10eXBlcyc7XG5pbXBvcnQgKiBhcyBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgeyBJU3NvSW5zdGFuY2VBQ0FDb25maWcsIElTc29QZXJtaXNzaW9uU2V0LCBTc29Bc3NpZ25tZW50LCBTc29JbnN0YW5jZUFDQUNvbmZpZywgU3NvUGVybWlzc2lvblNldCB9IGZyb20gJy4vaWFtLWlkZW50aXR5LWNlbnRlcic7XG5pbXBvcnQgeyBNYW5hZ2VkUG9saWN5QXR0YWNobWVudCwgTWFuYWdlZFBvbGljeUpzb24gfSBmcm9tICcuL21hbmFnZWQtcG9saWN5JztcbmltcG9ydCB7IHBhcnNlTGFtYmRhUGVybWlzc2lvbiwgcGFyc2VTdGF0ZW1lbnRzLCBTdGF0ZW1lbnQsIFN0YXRlbWVudEpzb24gfSBmcm9tICcuL3N0YXRlbWVudCc7XG5pbXBvcnQgeyBNYXliZVBhcnNlZCB9IGZyb20gJy4uL2RpZmYvbWF5YmUtcGFyc2VkJztcbmltcG9ydCB7IFByb3BlcnR5Q2hhbmdlLCBQcm9wZXJ0eU1hcCwgUmVzb3VyY2VDaGFuZ2UgfSBmcm9tICcuLi9kaWZmL3R5cGVzJztcbmltcG9ydCB7IERpZmZhYmxlQ29sbGVjdGlvbiB9IGZyb20gJy4uL2RpZmZhYmxlJztcbmltcG9ydCB7IHJlbmRlckludHJpbnNpY3MgfSBmcm9tICcuLi9yZW5kZXItaW50cmluc2ljcyc7XG5pbXBvcnQgeyBkZWVwUmVtb3ZlVW5kZWZpbmVkLCBkcm9wSWZFbXB0eSwgZmxhdE1hcCwgbWFrZUNvbXBhcmF0b3IgfSBmcm9tICcuLi91dGlsJztcblxuZXhwb3J0IGludGVyZmFjZSBJYW1DaGFuZ2VzUHJvcHMge1xuICBwcm9wZXJ0eUNoYW5nZXM6IFByb3BlcnR5Q2hhbmdlW107XG4gIHJlc291cmNlQ2hhbmdlczogUmVzb3VyY2VDaGFuZ2VbXTtcbn1cblxuLyoqXG4gKiBDaGFuZ2VzIHRvIElBTSBzdGF0ZW1lbnRzIGFuZCBJQU0gaWRlbnRpdHkgY2VudGVyXG4gKi9cbmV4cG9ydCBjbGFzcyBJYW1DaGFuZ2VzIHtcbiAgcHVibGljIHN0YXRpYyBJYW1Qcm9wZXJ0eVNjcnV0aW5pZXMgPSBbXG4gICAgUHJvcGVydHlTY3J1dGlueVR5cGUuSW5saW5lSWRlbnRpdHlQb2xpY2llcyxcbiAgICBQcm9wZXJ0eVNjcnV0aW55VHlwZS5JbmxpbmVSZXNvdXJjZVBvbGljeSxcbiAgICBQcm9wZXJ0eVNjcnV0aW55VHlwZS5NYW5hZ2VkUG9saWNpZXMsXG4gIF07XG5cbiAgcHVibGljIHN0YXRpYyBJYW1SZXNvdXJjZVNjcnV0aW5pZXMgPSBbXG4gICAgUmVzb3VyY2VTY3J1dGlueVR5cGUuUmVzb3VyY2VQb2xpY3lSZXNvdXJjZSxcbiAgICBSZXNvdXJjZVNjcnV0aW55VHlwZS5JZGVudGl0eVBvbGljeVJlc291cmNlLFxuICAgIFJlc291cmNlU2NydXRpbnlUeXBlLkxhbWJkYVBlcm1pc3Npb24sXG4gICAgUmVzb3VyY2VTY3J1dGlueVR5cGUuU3NvQXNzaWdubWVudFJlc291cmNlLFxuICAgIFJlc291cmNlU2NydXRpbnlUeXBlLlNzb0luc3RhbmNlQUNBQ29uZmlnUmVzb3VyY2UsXG4gICAgUmVzb3VyY2VTY3J1dGlueVR5cGUuU3NvUGVybWlzc2lvblNldCxcbiAgXTtcblxuICAvLyBlYWNoIGVudHJ5IGluIGEgRGlmZmFibGVDb2xsZWN0aW9uIGlzIHVzZWQgdG8gZ2VuZXJhdGUgYSBzaW5nbGUgcm93IG9mIHRoZSBzZWN1cml0eSBjaGFuZ2VzIHRhYmxlIHRoYXQgaXMgcHJlc2VudGVkIGZvciBjZGsgZGlmZiBhbmQgY2RrIGRlcGxveS5cbiAgcHVibGljIHJlYWRvbmx5IHN0YXRlbWVudHMgPSBuZXcgRGlmZmFibGVDb2xsZWN0aW9uPFN0YXRlbWVudD4oKTtcbiAgcHVibGljIHJlYWRvbmx5IG1hbmFnZWRQb2xpY2llcyA9IG5ldyBEaWZmYWJsZUNvbGxlY3Rpb248TWFuYWdlZFBvbGljeUF0dGFjaG1lbnQ+KCk7XG4gIHB1YmxpYyByZWFkb25seSBzc29QZXJtaXNzaW9uU2V0cyA9IG5ldyBEaWZmYWJsZUNvbGxlY3Rpb248U3NvUGVybWlzc2lvblNldD4oKTtcbiAgcHVibGljIHJlYWRvbmx5IHNzb0Fzc2lnbm1lbnRzID0gbmV3IERpZmZhYmxlQ29sbGVjdGlvbjxTc29Bc3NpZ25tZW50PigpO1xuICBwdWJsaWMgcmVhZG9ubHkgc3NvSW5zdGFuY2VBQ0FDb25maWdzID0gbmV3IERpZmZhYmxlQ29sbGVjdGlvbjxTc29JbnN0YW5jZUFDQUNvbmZpZz4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcm9wczogSWFtQ2hhbmdlc1Byb3BzKSB7XG4gICAgZm9yIChjb25zdCBwcm9wZXJ0eUNoYW5nZSBvZiBwcm9wcy5wcm9wZXJ0eUNoYW5nZXMpIHtcbiAgICAgIHRoaXMucmVhZFByb3BlcnR5Q2hhbmdlKHByb3BlcnR5Q2hhbmdlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCByZXNvdXJjZUNoYW5nZSBvZiBwcm9wcy5yZXNvdXJjZUNoYW5nZXMpIHtcbiAgICAgIHRoaXMucmVhZFJlc291cmNlQ2hhbmdlKHJlc291cmNlQ2hhbmdlKTtcbiAgICB9XG5cbiAgICB0aGlzLnN0YXRlbWVudHMuY2FsY3VsYXRlRGlmZigpO1xuICAgIHRoaXMubWFuYWdlZFBvbGljaWVzLmNhbGN1bGF0ZURpZmYoKTtcbiAgICB0aGlzLnNzb1Blcm1pc3Npb25TZXRzLmNhbGN1bGF0ZURpZmYoKTtcbiAgICB0aGlzLnNzb0Fzc2lnbm1lbnRzLmNhbGN1bGF0ZURpZmYoKTtcbiAgICB0aGlzLnNzb0luc3RhbmNlQUNBQ29uZmlncy5jYWxjdWxhdGVEaWZmKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGhhc0NoYW5nZXMoKSB7XG4gICAgcmV0dXJuICh0aGlzLnN0YXRlbWVudHMuaGFzQ2hhbmdlc1xuICAgICAgfHwgdGhpcy5tYW5hZ2VkUG9saWNpZXMuaGFzQ2hhbmdlc1xuICAgICAgfHwgdGhpcy5zc29QZXJtaXNzaW9uU2V0cy5oYXNDaGFuZ2VzXG4gICAgICB8fCB0aGlzLnNzb0Fzc2lnbm1lbnRzLmhhc0NoYW5nZXNcbiAgICAgIHx8IHRoaXMuc3NvSW5zdGFuY2VBQ0FDb25maWdzLmhhc0NoYW5nZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB3aGV0aGVyIHRoZSBjaGFuZ2VzIGluY2x1ZGUgYnJvYWRlbmVkIHBlcm1pc3Npb25zXG4gICAqXG4gICAqIFBlcm1pc3Npb25zIGFyZSBicm9hZGVuZWQgaWYgcG9zaXRpdmUgc3RhdGVtZW50cyBhcmUgYWRkZWQgb3JcbiAgICogbmVnYXRpdmUgc3RhdGVtZW50cyBhcmUgcmVtb3ZlZCwgb3IgaWYgbWFuYWdlZCBwb2xpY2llcyBhcmUgYWRkZWQuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHBlcm1pc3Npb25zQnJvYWRlbmVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlbWVudHMuYWRkaXRpb25zLnNvbWUocyA9PiAhcy5pc05lZ2F0aXZlU3RhdGVtZW50KVxuICAgICAgICB8fCB0aGlzLnN0YXRlbWVudHMucmVtb3ZhbHMuc29tZShzID0+IHMuaXNOZWdhdGl2ZVN0YXRlbWVudClcbiAgICAgICAgfHwgdGhpcy5tYW5hZ2VkUG9saWNpZXMuaGFzQWRkaXRpb25zXG4gICAgICAgIHx8IHRoaXMuc3NvUGVybWlzc2lvblNldHMuaGFzQWRkaXRpb25zXG4gICAgICAgIHx8IHRoaXMuc3NvQXNzaWdubWVudHMuaGFzQWRkaXRpb25zXG4gICAgICAgIHx8IHRoaXMuc3NvSW5zdGFuY2VBQ0FDb25maWdzLmhhc0FkZGl0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBzdW1tYXJ5IHRhYmxlIG9mIGNoYW5nZXNcbiAgICovXG4gIHB1YmxpYyBzdW1tYXJpemVTdGF0ZW1lbnRzKCk6IHN0cmluZ1tdW10ge1xuICAgIGNvbnN0IHJldDogc3RyaW5nW11bXSA9IFtdO1xuXG4gICAgY29uc3QgaGVhZGVyID0gWycnLCAnUmVzb3VyY2UnLCAnRWZmZWN0JywgJ0FjdGlvbicsICdQcmluY2lwYWwnLCAnQ29uZGl0aW9uJ107XG5cbiAgICAvLyBGaXJzdCBnZW5lcmF0ZSBhbGwgbGluZXMsIHRoZW4gc29ydCBvbiBSZXNvdXJjZSBzbyB0aGF0IHNpbWlsYXIgcmVzb3VyY2VzIGFyZSB0b2dldGhlclxuICAgIGZvciAoY29uc3Qgc3RhdGVtZW50IG9mIHRoaXMuc3RhdGVtZW50cy5hZGRpdGlvbnMpIHtcbiAgICAgIGNvbnN0IHJlbmRlcmVkU3RhdGVtZW50ID0gc3RhdGVtZW50LnJlbmRlcigpO1xuICAgICAgcmV0LnB1c2goW1xuICAgICAgICAnKycsXG4gICAgICAgIHJlbmRlcmVkU3RhdGVtZW50LnJlc291cmNlLFxuICAgICAgICByZW5kZXJlZFN0YXRlbWVudC5lZmZlY3QsXG4gICAgICAgIHJlbmRlcmVkU3RhdGVtZW50LmFjdGlvbixcbiAgICAgICAgcmVuZGVyZWRTdGF0ZW1lbnQucHJpbmNpcGFsLFxuICAgICAgICByZW5kZXJlZFN0YXRlbWVudC5jb25kaXRpb24sXG4gICAgICBdLm1hcChzID0+IGNoYWxrLmdyZWVuKHMpKSk7XG4gICAgfVxuICAgIGZvciAoY29uc3Qgc3RhdGVtZW50IG9mIHRoaXMuc3RhdGVtZW50cy5yZW1vdmFscykge1xuICAgICAgY29uc3QgcmVuZGVyZWRTdGF0ZW1lbnQgPSBzdGF0ZW1lbnQucmVuZGVyKCk7XG4gICAgICByZXQucHVzaChbXG4gICAgICAgICctJyxcbiAgICAgICAgcmVuZGVyZWRTdGF0ZW1lbnQucmVzb3VyY2UsXG4gICAgICAgIHJlbmRlcmVkU3RhdGVtZW50LmVmZmVjdCxcbiAgICAgICAgcmVuZGVyZWRTdGF0ZW1lbnQuYWN0aW9uLFxuICAgICAgICByZW5kZXJlZFN0YXRlbWVudC5wcmluY2lwYWwsXG4gICAgICAgIHJlbmRlcmVkU3RhdGVtZW50LmNvbmRpdGlvbixcbiAgICAgIF0ubWFwKHMgPT4gY2hhbGsucmVkKHMpKSk7XG4gICAgfVxuXG4gICAgLy8gU29ydCBieSAybmQgY29sdW1uXG4gICAgcmV0LnNvcnQobWFrZUNvbXBhcmF0b3IoKHJvdzogc3RyaW5nW10pID0+IFtyb3dbMV1dKSk7XG5cbiAgICByZXQuc3BsaWNlKDAsIDAsIGhlYWRlcik7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgcHVibGljIHN1bW1hcml6ZU1hbmFnZWRQb2xpY2llcygpOiBzdHJpbmdbXVtdIHtcbiAgICBjb25zdCByZXQ6IHN0cmluZ1tdW10gPSBbXTtcbiAgICBjb25zdCBoZWFkZXIgPSBbJycsICdSZXNvdXJjZScsICdNYW5hZ2VkIFBvbGljeSBBUk4nXTtcblxuICAgIGZvciAoY29uc3QgYXR0IG9mIHRoaXMubWFuYWdlZFBvbGljaWVzLmFkZGl0aW9ucykge1xuICAgICAgcmV0LnB1c2goW1xuICAgICAgICAnKycsXG4gICAgICAgIGF0dC5pZGVudGl0eUFybixcbiAgICAgICAgYXR0Lm1hbmFnZWRQb2xpY3lBcm4sXG4gICAgICBdLm1hcChzID0+IGNoYWxrLmdyZWVuKHMpKSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgYXR0IG9mIHRoaXMubWFuYWdlZFBvbGljaWVzLnJlbW92YWxzKSB7XG4gICAgICByZXQucHVzaChbXG4gICAgICAgICctJyxcbiAgICAgICAgYXR0LmlkZW50aXR5QXJuLFxuICAgICAgICBhdHQubWFuYWdlZFBvbGljeUFybixcbiAgICAgIF0ubWFwKHMgPT4gY2hhbGsucmVkKHMpKSk7XG4gICAgfVxuXG4gICAgLy8gU29ydCBieSAybmQgY29sdW1uXG4gICAgcmV0LnNvcnQobWFrZUNvbXBhcmF0b3IoKHJvdzogc3RyaW5nW10pID0+IFtyb3dbMV1dKSk7XG5cbiAgICByZXQuc3BsaWNlKDAsIDAsIGhlYWRlcik7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgcHVibGljIHN1bW1hcml6ZVNzb0Fzc2lnbm1lbnRzKCk6IHN0cmluZ1tdW10ge1xuICAgIGNvbnN0IHJldDogc3RyaW5nW11bXSA9IFtdO1xuICAgIGNvbnN0IGhlYWRlciA9IFsnJywgJ1Jlc291cmNlJywgJ0luc3RhbmNlQXJuJywgJ1Blcm1pc3Npb25TZXRBcm4nLCAnUHJpbmNpcGFsSWQnLCAnUHJpbmNpcGFsVHlwZScsICdUYXJnZXRJZCcsICdUYXJnZXRUeXBlJ107XG5cbiAgICBmb3IgKGNvbnN0IGF0dCBvZiB0aGlzLnNzb0Fzc2lnbm1lbnRzLmFkZGl0aW9ucykge1xuICAgICAgcmV0LnB1c2goW1xuICAgICAgICAnKycsXG4gICAgICAgIGF0dC5jZm5Mb2dpY2FsSWQgfHwgJycsXG4gICAgICAgIGF0dC5zc29JbnN0YW5jZUFybiB8fCAnJyxcbiAgICAgICAgYXR0LnBlcm1pc3Npb25TZXRBcm4gfHwgJycsXG4gICAgICAgIGF0dC5wcmluY2lwYWxJZCB8fCAnJyxcbiAgICAgICAgYXR0LnByaW5jaXBhbFR5cGUgfHwgJycsXG4gICAgICAgIGF0dC50YXJnZXRJZCB8fCAnJyxcbiAgICAgICAgYXR0LnRhcmdldFR5cGUgfHwgJycsXG4gICAgICBdLm1hcChzID0+IGNoYWxrLmdyZWVuKHMpKSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgYXR0IG9mIHRoaXMuc3NvQXNzaWdubWVudHMucmVtb3ZhbHMpIHtcbiAgICAgIHJldC5wdXNoKFtcbiAgICAgICAgJy0nLFxuICAgICAgICBhdHQuY2ZuTG9naWNhbElkIHx8ICcnLFxuICAgICAgICBhdHQuc3NvSW5zdGFuY2VBcm4gfHwgJycsXG4gICAgICAgIGF0dC5wZXJtaXNzaW9uU2V0QXJuIHx8ICcnLFxuICAgICAgICBhdHQucHJpbmNpcGFsSWQgfHwgJycsXG4gICAgICAgIGF0dC5wcmluY2lwYWxUeXBlIHx8ICcnLFxuICAgICAgICBhdHQudGFyZ2V0SWQgfHwgJycsXG4gICAgICAgIGF0dC50YXJnZXRUeXBlIHx8ICcnLFxuICAgICAgXS5tYXAocyA9PiBjaGFsay5yZWQocykpKTtcbiAgICB9XG5cbiAgICAvLyBTb3J0IGJ5IHJlc291cmNlIG5hbWUgdG8gZW5zdXJlIGEgdW5pcXVlIHZhbHVlIGlzIHVzZWQgZm9yIHNvcnRpbmdcbiAgICByZXQuc29ydChtYWtlQ29tcGFyYXRvcigocm93OiBzdHJpbmdbXSkgPT4gW3Jvd1sxXV0pKTtcbiAgICByZXQuc3BsaWNlKDAsIDAsIGhlYWRlcik7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgcHVibGljIHN1bW1hcml6ZVNzb0luc3RhbmNlQUNBQ29uZmlncygpOiBzdHJpbmdbXVtdIHtcbiAgICBjb25zdCByZXQ6IHN0cmluZ1tdW10gPSBbXTtcbiAgICBjb25zdCBoZWFkZXIgPSBbJycsICdSZXNvdXJjZScsICdJbnN0YW5jZUFybicsICdBY2Nlc3NDb250cm9sQXR0cmlidXRlcyddO1xuXG4gICAgZnVuY3Rpb24gZm9ybWF0QWNjZXNzQ29udHJvbEF0dHJpYnV0ZShhY2E6IElTc29JbnN0YW5jZUFDQUNvbmZpZy5BY2Nlc3NDb250cm9sQXR0cmlidXRlKTogc3RyaW5nIHtcbiAgICAgIHJldHVybiBgS2V5OiAke2FjYT8uS2V5fSwgVmFsdWVzOiBbJHthY2E/LlZhbHVlPy5Tb3VyY2Uuam9pbignLCAnKX1dYDtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGF0dCBvZiB0aGlzLnNzb0luc3RhbmNlQUNBQ29uZmlncy5hZGRpdGlvbnMpIHtcbiAgICAgIHJldC5wdXNoKFtcbiAgICAgICAgJysnLFxuICAgICAgICBhdHQuY2ZuTG9naWNhbElkIHx8ICcnLFxuICAgICAgICBhdHQuc3NvSW5zdGFuY2VBcm4gfHwgJycsXG4gICAgICAgIGF0dC5hY2Nlc3NDb250cm9sQXR0cmlidXRlcz8ubWFwKGZvcm1hdEFjY2Vzc0NvbnRyb2xBdHRyaWJ1dGUpLmpvaW4oJ1xcbicpIHx8ICcnLFxuICAgICAgXS5tYXAocyA9PiBjaGFsay5ncmVlbihzKSkpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGF0dCBvZiB0aGlzLnNzb0luc3RhbmNlQUNBQ29uZmlncy5yZW1vdmFscykge1xuICAgICAgcmV0LnB1c2goW1xuICAgICAgICAnLScsXG4gICAgICAgIGF0dC5jZm5Mb2dpY2FsSWQgfHwgJycsXG4gICAgICAgIGF0dC5zc29JbnN0YW5jZUFybiB8fCAnJyxcbiAgICAgICAgYXR0LmFjY2Vzc0NvbnRyb2xBdHRyaWJ1dGVzPy5tYXAoZm9ybWF0QWNjZXNzQ29udHJvbEF0dHJpYnV0ZSkuam9pbignXFxuJykgfHwgJycsXG4gICAgICBdLm1hcChzID0+IGNoYWxrLnJlZChzKSkpO1xuICAgIH1cblxuICAgIC8vIFNvcnQgYnkgcmVzb3VyY2UgbmFtZSB0byBlbnN1cmUgYSB1bmlxdWUgdmFsdWUgaXMgdXNlZCBmb3Igc29ydGluZ1xuICAgIHJldC5zb3J0KG1ha2VDb21wYXJhdG9yKChyb3c6IHN0cmluZ1tdKSA9PiBbcm93WzFdXSkpO1xuICAgIHJldC5zcGxpY2UoMCwgMCwgaGVhZGVyKTtcblxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBwdWJsaWMgc3VtbWFyaXplU3NvUGVybWlzc2lvblNldHMoKTogc3RyaW5nW11bXSB7XG4gICAgY29uc3QgcmV0OiBzdHJpbmdbXVtdID0gW107XG4gICAgY29uc3QgaGVhZGVyID0gWycnLCAnUmVzb3VyY2UnLCAnSW5zdGFuY2VBcm4nLCAnUGVybWlzc2lvblNldCBuYW1lJywgJ1Blcm1pc3Npb25zQm91bmRhcnknLCAnQ3VzdG9tZXJNYW5hZ2VkUG9saWN5UmVmZXJlbmNlcyddO1xuXG4gICAgZnVuY3Rpb24gZm9ybWF0TWFuYWdlZFBvbGljeVJlZihzOiBJU3NvUGVybWlzc2lvblNldC5DdXN0b21lck1hbmFnZWRQb2xpY3lSZWZlcmVuY2UgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIGBOYW1lOiAke3M/Lk5hbWUgfHwgJyd9LCBQYXRoOiAke3M/LlBhdGggfHwgJyd9YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb3JtYXRTc29QZXJtaXNzaW9uc0JvdW5kYXJ5KHNzb1BiOiBJU3NvUGVybWlzc2lvblNldC5QZXJtaXNzaW9uc0JvdW5kYXJ5IHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgICAgIC8vIE1hbmFnZWRQb2xpY3lBcm4gT1IgQ3VzdG9tZXJNYW5hZ2VkUG9saWN5UmVmZXJlbmNlIGNhbiBiZSBzcGVjaWZpZWQgLS0gYnV0IG5vdCBib3RoLlxuICAgICAgaWYgKHNzb1BiPy5NYW5hZ2VkUG9saWN5QXJuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGBNYW5hZ2VkUG9saWN5QXJuOiAke3Nzb1BiPy5NYW5hZ2VkUG9saWN5QXJuIHx8ICcnfWA7XG4gICAgICB9IGVsc2UgaWYgKHNzb1BiPy5DdXN0b21lck1hbmFnZWRQb2xpY3lSZWZlcmVuY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gYEN1c3RvbWVyTWFuYWdlZFBvbGljeVJlZmVyZW5jZToge1xcbiAgJHtmb3JtYXRNYW5hZ2VkUG9saWN5UmVmKHNzb1BiPy5DdXN0b21lck1hbmFnZWRQb2xpY3lSZWZlcmVuY2UpfVxcbn1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgYXR0IG9mIHRoaXMuc3NvUGVybWlzc2lvblNldHMuYWRkaXRpb25zKSB7XG4gICAgICByZXQucHVzaChbXG4gICAgICAgICcrJyxcbiAgICAgICAgYXR0LmNmbkxvZ2ljYWxJZCB8fCAnJyxcbiAgICAgICAgYXR0LnNzb0luc3RhbmNlQXJuIHx8ICcnLFxuICAgICAgICBhdHQubmFtZSB8fCAnJyxcbiAgICAgICAgZm9ybWF0U3NvUGVybWlzc2lvbnNCb3VuZGFyeShhdHQuc3NvUGVybWlzc2lvbnNCb3VuZGFyeSksXG4gICAgICAgIGF0dC5zc29DdXN0b21lck1hbmFnZWRQb2xpY3lSZWZlcmVuY2VzPy5tYXAoZm9ybWF0TWFuYWdlZFBvbGljeVJlZikuam9pbignXFxuJykgfHwgJycsXG4gICAgICBdLm1hcChzID0+IGNoYWxrLmdyZWVuKHMpKSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgYXR0IG9mIHRoaXMuc3NvUGVybWlzc2lvblNldHMucmVtb3ZhbHMpIHtcbiAgICAgIHJldC5wdXNoKFtcbiAgICAgICAgJy0nLFxuICAgICAgICBhdHQuY2ZuTG9naWNhbElkIHx8ICcnLFxuICAgICAgICBhdHQuc3NvSW5zdGFuY2VBcm4gfHwgJycsXG4gICAgICAgIGF0dC5uYW1lIHx8ICcnLFxuICAgICAgICBmb3JtYXRTc29QZXJtaXNzaW9uc0JvdW5kYXJ5KGF0dC5zc29QZXJtaXNzaW9uc0JvdW5kYXJ5KSxcbiAgICAgICAgYXR0LnNzb0N1c3RvbWVyTWFuYWdlZFBvbGljeVJlZmVyZW5jZXM/Lm1hcChmb3JtYXRNYW5hZ2VkUG9saWN5UmVmKS5qb2luKCdcXG4nKSB8fCAnJyxcbiAgICAgIF0ubWFwKHMgPT4gY2hhbGsucmVkKHMpKSk7XG4gICAgfVxuXG4gICAgLy8gU29ydCBieSByZXNvdXJjZSBuYW1lIHRvIGVuc3VyZSBhIHVuaXF1ZSB2YWx1ZSBpcyB1c2VkIGZvciBzb3J0aW5nXG4gICAgcmV0LnNvcnQobWFrZUNvbXBhcmF0b3IoKHJvdzogc3RyaW5nW10pID0+IFtyb3dbMV1dKSk7XG4gICAgcmV0LnNwbGljZSgwLCAwLCBoZWFkZXIpO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBtYWNoaW5lLXJlYWRhYmxlIHZlcnNpb24gb2YgdGhlIGNoYW5nZXMuXG4gICAqIFRoaXMgaXMgb25seSB1c2VkIGluIHRlc3RzLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHB1YmxpYyBfdG9Kc29uKCk6IElhbUNoYW5nZXNKc29uIHtcbiAgICByZXR1cm4gZGVlcFJlbW92ZVVuZGVmaW5lZCh7XG4gICAgICBzdGF0ZW1lbnRBZGRpdGlvbnM6IGRyb3BJZkVtcHR5KHRoaXMuc3RhdGVtZW50cy5hZGRpdGlvbnMubWFwKHMgPT4gcy5fdG9Kc29uKCkpKSxcbiAgICAgIHN0YXRlbWVudFJlbW92YWxzOiBkcm9wSWZFbXB0eSh0aGlzLnN0YXRlbWVudHMucmVtb3ZhbHMubWFwKHMgPT4gcy5fdG9Kc29uKCkpKSxcbiAgICAgIG1hbmFnZWRQb2xpY3lBZGRpdGlvbnM6IGRyb3BJZkVtcHR5KHRoaXMubWFuYWdlZFBvbGljaWVzLmFkZGl0aW9ucy5tYXAocyA9PiBzLl90b0pzb24oKSkpLFxuICAgICAgbWFuYWdlZFBvbGljeVJlbW92YWxzOiBkcm9wSWZFbXB0eSh0aGlzLm1hbmFnZWRQb2xpY2llcy5yZW1vdmFscy5tYXAocyA9PiBzLl90b0pzb24oKSkpLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZWFkUHJvcGVydHlDaGFuZ2UocHJvcGVydHlDaGFuZ2U6IFByb3BlcnR5Q2hhbmdlKSB7XG4gICAgc3dpdGNoIChwcm9wZXJ0eUNoYW5nZS5zY3J1dGlueVR5cGUpIHtcbiAgICAgIGNhc2UgUHJvcGVydHlTY3J1dGlueVR5cGUuSW5saW5lSWRlbnRpdHlQb2xpY2llczpcbiAgICAgICAgLy8gQVdTOjpJQU06OnsgUm9sZSB8IFVzZXIgfCBHcm91cCB9LlBvbGljaWVzXG4gICAgICAgIHRoaXMuc3RhdGVtZW50cy5hZGRPbGQoLi4udGhpcy5yZWFkSWRlbnRpdHlQb2xpY2llcyhwcm9wZXJ0eUNoYW5nZS5vbGRWYWx1ZSwgcHJvcGVydHlDaGFuZ2UucmVzb3VyY2VMb2dpY2FsSWQpKTtcbiAgICAgICAgdGhpcy5zdGF0ZW1lbnRzLmFkZE5ldyguLi50aGlzLnJlYWRJZGVudGl0eVBvbGljaWVzKHByb3BlcnR5Q2hhbmdlLm5ld1ZhbHVlLCBwcm9wZXJ0eUNoYW5nZS5yZXNvdXJjZUxvZ2ljYWxJZCkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUHJvcGVydHlTY3J1dGlueVR5cGUuSW5saW5lUmVzb3VyY2VQb2xpY3k6XG4gICAgICAgIC8vIEFueSBQb2xpY3lEb2N1bWVudCBvbiBhIHJlc291cmNlIChpbmNsdWRpbmcgQXNzdW1lUm9sZVBvbGljeURvY3VtZW50KVxuICAgICAgICB0aGlzLnN0YXRlbWVudHMuYWRkT2xkKC4uLnRoaXMucmVhZFJlc291cmNlU3RhdGVtZW50cyhwcm9wZXJ0eUNoYW5nZS5vbGRWYWx1ZSwgcHJvcGVydHlDaGFuZ2UucmVzb3VyY2VMb2dpY2FsSWQpKTtcbiAgICAgICAgdGhpcy5zdGF0ZW1lbnRzLmFkZE5ldyguLi50aGlzLnJlYWRSZXNvdXJjZVN0YXRlbWVudHMocHJvcGVydHlDaGFuZ2UubmV3VmFsdWUsIHByb3BlcnR5Q2hhbmdlLnJlc291cmNlTG9naWNhbElkKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQcm9wZXJ0eVNjcnV0aW55VHlwZS5NYW5hZ2VkUG9saWNpZXM6XG4gICAgICAgIC8vIEp1c3QgYSBsaXN0IG9mIG1hbmFnZWQgcG9saWNpZXNcbiAgICAgICAgdGhpcy5tYW5hZ2VkUG9saWNpZXMuYWRkT2xkKC4uLnRoaXMucmVhZE1hbmFnZWRQb2xpY2llcyhwcm9wZXJ0eUNoYW5nZS5vbGRWYWx1ZSwgcHJvcGVydHlDaGFuZ2UucmVzb3VyY2VMb2dpY2FsSWQpKTtcbiAgICAgICAgdGhpcy5tYW5hZ2VkUG9saWNpZXMuYWRkTmV3KC4uLnRoaXMucmVhZE1hbmFnZWRQb2xpY2llcyhwcm9wZXJ0eUNoYW5nZS5uZXdWYWx1ZSwgcHJvcGVydHlDaGFuZ2UucmVzb3VyY2VMb2dpY2FsSWQpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWFkUmVzb3VyY2VDaGFuZ2UocmVzb3VyY2VDaGFuZ2U6IFJlc291cmNlQ2hhbmdlKSB7XG4gICAgc3dpdGNoIChyZXNvdXJjZUNoYW5nZS5zY3J1dGlueVR5cGUpIHtcbiAgICAgIGNhc2UgUmVzb3VyY2VTY3J1dGlueVR5cGUuSWRlbnRpdHlQb2xpY3lSZXNvdXJjZTpcbiAgICAgICAgLy8gQVdTOjpJQU06OlBvbGljeVxuICAgICAgICB0aGlzLnN0YXRlbWVudHMuYWRkT2xkKC4uLnRoaXMucmVhZElkZW50aXR5UG9saWN5UmVzb3VyY2UocmVzb3VyY2VDaGFuZ2Uub2xkUHJvcGVydGllcykpO1xuICAgICAgICB0aGlzLnN0YXRlbWVudHMuYWRkTmV3KC4uLnRoaXMucmVhZElkZW50aXR5UG9saWN5UmVzb3VyY2UocmVzb3VyY2VDaGFuZ2UubmV3UHJvcGVydGllcykpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUmVzb3VyY2VTY3J1dGlueVR5cGUuUmVzb3VyY2VQb2xpY3lSZXNvdXJjZTpcbiAgICAgICAgLy8gQVdTOjoqOjp7QnVja2V0LFF1ZXVlLFRvcGljfVBvbGljeVxuICAgICAgICB0aGlzLnN0YXRlbWVudHMuYWRkT2xkKC4uLnRoaXMucmVhZFJlc291cmNlUG9saWN5UmVzb3VyY2UocmVzb3VyY2VDaGFuZ2Uub2xkUHJvcGVydGllcykpO1xuICAgICAgICB0aGlzLnN0YXRlbWVudHMuYWRkTmV3KC4uLnRoaXMucmVhZFJlc291cmNlUG9saWN5UmVzb3VyY2UocmVzb3VyY2VDaGFuZ2UubmV3UHJvcGVydGllcykpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUmVzb3VyY2VTY3J1dGlueVR5cGUuTGFtYmRhUGVybWlzc2lvbjpcbiAgICAgICAgdGhpcy5zdGF0ZW1lbnRzLmFkZE9sZCguLi50aGlzLnJlYWRMYW1iZGFTdGF0ZW1lbnRzKHJlc291cmNlQ2hhbmdlLm9sZFByb3BlcnRpZXMpKTtcbiAgICAgICAgdGhpcy5zdGF0ZW1lbnRzLmFkZE5ldyguLi50aGlzLnJlYWRMYW1iZGFTdGF0ZW1lbnRzKHJlc291cmNlQ2hhbmdlLm5ld1Byb3BlcnRpZXMpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFJlc291cmNlU2NydXRpbnlUeXBlLlNzb1Blcm1pc3Npb25TZXQ6XG4gICAgICAgIHRoaXMuc3NvUGVybWlzc2lvblNldHMuYWRkT2xkKC4uLnRoaXMucmVhZFNzb1Blcm1pc3Npb25TZXQocmVzb3VyY2VDaGFuZ2Uub2xkUHJvcGVydGllcywgcmVzb3VyY2VDaGFuZ2UucmVzb3VyY2VMb2dpY2FsSWQpKTtcbiAgICAgICAgdGhpcy5zc29QZXJtaXNzaW9uU2V0cy5hZGROZXcoLi4udGhpcy5yZWFkU3NvUGVybWlzc2lvblNldChyZXNvdXJjZUNoYW5nZS5uZXdQcm9wZXJ0aWVzLCByZXNvdXJjZUNoYW5nZS5yZXNvdXJjZUxvZ2ljYWxJZCkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUmVzb3VyY2VTY3J1dGlueVR5cGUuU3NvQXNzaWdubWVudFJlc291cmNlOlxuICAgICAgICB0aGlzLnNzb0Fzc2lnbm1lbnRzLmFkZE9sZCguLi50aGlzLnJlYWRTc29Bc3NpZ25tZW50cyhyZXNvdXJjZUNoYW5nZS5vbGRQcm9wZXJ0aWVzLCByZXNvdXJjZUNoYW5nZS5yZXNvdXJjZUxvZ2ljYWxJZCkpO1xuICAgICAgICB0aGlzLnNzb0Fzc2lnbm1lbnRzLmFkZE5ldyguLi50aGlzLnJlYWRTc29Bc3NpZ25tZW50cyhyZXNvdXJjZUNoYW5nZS5uZXdQcm9wZXJ0aWVzLCByZXNvdXJjZUNoYW5nZS5yZXNvdXJjZUxvZ2ljYWxJZCkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUmVzb3VyY2VTY3J1dGlueVR5cGUuU3NvSW5zdGFuY2VBQ0FDb25maWdSZXNvdXJjZTpcbiAgICAgICAgdGhpcy5zc29JbnN0YW5jZUFDQUNvbmZpZ3MuYWRkT2xkKC4uLnRoaXMucmVhZFNzb0luc3RhbmNlQUNBQ29uZmlncyhyZXNvdXJjZUNoYW5nZS5vbGRQcm9wZXJ0aWVzLCByZXNvdXJjZUNoYW5nZS5yZXNvdXJjZUxvZ2ljYWxJZCkpO1xuICAgICAgICB0aGlzLnNzb0luc3RhbmNlQUNBQ29uZmlncy5hZGROZXcoLi4udGhpcy5yZWFkU3NvSW5zdGFuY2VBQ0FDb25maWdzKHJlc291cmNlQ2hhbmdlLm5ld1Byb3BlcnRpZXMsIHJlc291cmNlQ2hhbmdlLnJlc291cmNlTG9naWNhbElkKSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBhIGxpc3Qgb2YgcG9saWNpZXMgb24gYW4gaWRlbnRpdHlcbiAgICovXG4gIHByaXZhdGUgcmVhZElkZW50aXR5UG9saWNpZXMocG9saWNpZXM6IGFueSwgbG9naWNhbElkOiBzdHJpbmcpOiBTdGF0ZW1lbnRbXSB7XG4gICAgaWYgKHBvbGljaWVzID09PSB1bmRlZmluZWQgfHwgIUFycmF5LmlzQXJyYXkocG9saWNpZXMpKSB7IHJldHVybiBbXTsgfVxuXG4gICAgY29uc3QgYXBwbGllc1RvUHJpbmNpcGFsID0gJ0FXUzokeycgKyBsb2dpY2FsSWQgKyAnfSc7XG5cbiAgICByZXR1cm4gZmxhdE1hcChwb2xpY2llcywgKHBvbGljeTogYW55KSA9PiB7XG4gICAgICAvLyBjaGVjayBpZiB0aGUgUG9saWN5IGl0c2VsZiBpcyBub3QgYW4gaW50cmluc2ljLCBsaWtlIGFuIEZuOjpJZlxuICAgICAgY29uc3QgdW5wYXJzZWRTdGF0ZW1lbnQgPSBwb2xpY3kuUG9saWN5RG9jdW1lbnQ/LlN0YXRlbWVudFxuICAgICAgICA/IHBvbGljeS5Qb2xpY3lEb2N1bWVudC5TdGF0ZW1lbnRcbiAgICAgICAgOiBwb2xpY3k7XG4gICAgICByZXR1cm4gZGVmYXVsdFByaW5jaXBhbChhcHBsaWVzVG9QcmluY2lwYWwsIHBhcnNlU3RhdGVtZW50cyhyZW5kZXJJbnRyaW5zaWNzKHVucGFyc2VkU3RhdGVtZW50KSkpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGFuIElBTTo6UG9saWN5IHJlc291cmNlXG4gICAqL1xuICBwcml2YXRlIHJlYWRJZGVudGl0eVBvbGljeVJlc291cmNlKHByb3BlcnRpZXM6IGFueSk6IFN0YXRlbWVudFtdIHtcbiAgICBpZiAocHJvcGVydGllcyA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBbXTsgfVxuXG4gICAgcHJvcGVydGllcyA9IHJlbmRlckludHJpbnNpY3MocHJvcGVydGllcyk7XG5cbiAgICBjb25zdCBwcmluY2lwYWxzID0gKHByb3BlcnRpZXMuR3JvdXBzIHx8IFtdKS5jb25jYXQocHJvcGVydGllcy5Vc2VycyB8fCBbXSkuY29uY2F0KHByb3BlcnRpZXMuUm9sZXMgfHwgW10pO1xuICAgIHJldHVybiBmbGF0TWFwKHByaW5jaXBhbHMsIChwcmluY2lwYWw6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgcmVmID0gJ0FXUzonICsgcHJpbmNpcGFsO1xuICAgICAgcmV0dXJuIGRlZmF1bHRQcmluY2lwYWwocmVmLCBwYXJzZVN0YXRlbWVudHMocHJvcGVydGllcy5Qb2xpY3lEb2N1bWVudC5TdGF0ZW1lbnQpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVhZFNzb0luc3RhbmNlQUNBQ29uZmlncyhwcm9wZXJ0aWVzOiBhbnksIGxvZ2ljYWxJZDogc3RyaW5nKTogU3NvSW5zdGFuY2VBQ0FDb25maWdbXSB7XG4gICAgaWYgKHByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gW107IH1cblxuICAgIHByb3BlcnRpZXMgPSByZW5kZXJJbnRyaW5zaWNzKHByb3BlcnRpZXMpO1xuXG4gICAgcmV0dXJuIFtuZXcgU3NvSW5zdGFuY2VBQ0FDb25maWcoe1xuICAgICAgY2ZuTG9naWNhbElkOiAnJHsnICsgbG9naWNhbElkICsgJ30nLFxuICAgICAgc3NvSW5zdGFuY2VBcm46IHByb3BlcnRpZXMuSW5zdGFuY2VBcm4sXG4gICAgICBhY2Nlc3NDb250cm9sQXR0cmlidXRlczogcHJvcGVydGllcy5BY2Nlc3NDb250cm9sQXR0cmlidXRlcyxcbiAgICB9KV07XG4gIH1cblxuICBwcml2YXRlIHJlYWRTc29Bc3NpZ25tZW50cyhwcm9wZXJ0aWVzOiBhbnksIGxvZ2ljYWxJZDogc3RyaW5nKTogU3NvQXNzaWdubWVudFtdIHtcbiAgICBpZiAocHJvcGVydGllcyA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBbXTsgfVxuXG4gICAgcHJvcGVydGllcyA9IHJlbmRlckludHJpbnNpY3MocHJvcGVydGllcyk7XG5cbiAgICByZXR1cm4gW25ldyBTc29Bc3NpZ25tZW50KHtcbiAgICAgIGNmbkxvZ2ljYWxJZDogJyR7JyArIGxvZ2ljYWxJZCArICd9JyxcbiAgICAgIHNzb0luc3RhbmNlQXJuOiBwcm9wZXJ0aWVzLkluc3RhbmNlQXJuLFxuICAgICAgcGVybWlzc2lvblNldEFybjogcHJvcGVydGllcy5QZXJtaXNzaW9uU2V0QXJuLFxuICAgICAgcHJpbmNpcGFsSWQ6IHByb3BlcnRpZXMuUHJpbmNpcGFsSWQsXG4gICAgICBwcmluY2lwYWxUeXBlOiBwcm9wZXJ0aWVzLlByaW5jaXBhbFR5cGUsXG4gICAgICB0YXJnZXRJZDogcHJvcGVydGllcy5UYXJnZXRJZCxcbiAgICAgIHRhcmdldFR5cGU6IHByb3BlcnRpZXMuVGFyZ2V0VHlwZSxcbiAgICB9KV07XG4gIH1cblxuICBwcml2YXRlIHJlYWRTc29QZXJtaXNzaW9uU2V0KHByb3BlcnRpZXM6IGFueSwgbG9naWNhbElkOiBzdHJpbmcpOiBTc29QZXJtaXNzaW9uU2V0W10ge1xuICAgIGlmIChwcm9wZXJ0aWVzID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIFtdOyB9XG5cbiAgICBwcm9wZXJ0aWVzID0gcmVuZGVySW50cmluc2ljcyhwcm9wZXJ0aWVzKTtcblxuICAgIHJldHVybiBbbmV3IFNzb1Blcm1pc3Npb25TZXQoe1xuICAgICAgY2ZuTG9naWNhbElkOiAnJHsnICsgbG9naWNhbElkICsgJ30nLFxuICAgICAgbmFtZTogcHJvcGVydGllcy5OYW1lLFxuICAgICAgc3NvSW5zdGFuY2VBcm46IHByb3BlcnRpZXMuSW5zdGFuY2VBcm4sXG4gICAgICBzc29DdXN0b21lck1hbmFnZWRQb2xpY3lSZWZlcmVuY2VzOiBwcm9wZXJ0aWVzLkN1c3RvbWVyTWFuYWdlZFBvbGljeVJlZmVyZW5jZXMsXG4gICAgICBzc29QZXJtaXNzaW9uc0JvdW5kYXJ5OiBwcm9wZXJ0aWVzLlBlcm1pc3Npb25zQm91bmRhcnksXG4gICAgfSldO1xuICB9XG5cbiAgcHJpdmF0ZSByZWFkUmVzb3VyY2VTdGF0ZW1lbnRzKHBvbGljeTogYW55LCBsb2dpY2FsSWQ6IHN0cmluZyk6IFN0YXRlbWVudFtdIHtcbiAgICBpZiAocG9saWN5ID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIFtdOyB9XG5cbiAgICBjb25zdCBhcHBsaWVzVG9SZXNvdXJjZSA9ICckeycgKyBsb2dpY2FsSWQgKyAnLkFybn0nO1xuICAgIHJldHVybiBkZWZhdWx0UmVzb3VyY2UoYXBwbGllc1RvUmVzb3VyY2UsIHBhcnNlU3RhdGVtZW50cyhyZW5kZXJJbnRyaW5zaWNzKHBvbGljeS5TdGF0ZW1lbnQpKSk7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgYW4gQVdTOjoqOjp7QnVja2V0LFRvcGljLFF1ZXVlfXBvbGljeVxuICAgKi9cbiAgcHJpdmF0ZSByZWFkUmVzb3VyY2VQb2xpY3lSZXNvdXJjZShwcm9wZXJ0aWVzOiBhbnkpOiBTdGF0ZW1lbnRbXSB7XG4gICAgaWYgKHByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gW107IH1cblxuICAgIHByb3BlcnRpZXMgPSByZW5kZXJJbnRyaW5zaWNzKHByb3BlcnRpZXMpO1xuXG4gICAgY29uc3QgcG9saWN5S2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZpbHRlcihrZXkgPT4ga2V5LmluZGV4T2YoJ1BvbGljeScpID4gLTEpO1xuXG4gICAgLy8gRmluZCB0aGUga2V5IHRoYXQgaWRlbnRpZmllcyB0aGUgcmVzb3VyY2UocykgdGhpcyBwb2xpY3kgYXBwbGllcyB0b1xuICAgIGNvbnN0IHJlc291cmNlS2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZpbHRlcihrZXkgPT4gIXBvbGljeUtleXMuaW5jbHVkZXMoa2V5KSAmJiAha2V5LmVuZHNXaXRoKCdOYW1lJykpO1xuICAgIGxldCByZXNvdXJjZXMgPSByZXNvdXJjZUtleXMubGVuZ3RoID09PSAxID8gcHJvcGVydGllc1tyZXNvdXJjZUtleXNbMF1dIDogWyc/Pz8nXTtcblxuICAgIC8vIEZvciBzb21lIHJlc291cmNlcywgdGhpcyBpcyBhIHNpbmdsZXRvbiBzdHJpbmcsIGZvciBzb21lIGl0J3MgYW4gYXJyYXlcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVzb3VyY2VzKSkge1xuICAgICAgcmVzb3VyY2VzID0gW3Jlc291cmNlc107XG4gICAgfVxuXG4gICAgcmV0dXJuIGZsYXRNYXAocmVzb3VyY2VzLCAocmVzb3VyY2U6IHN0cmluZykgPT4ge1xuICAgICAgcmV0dXJuIGRlZmF1bHRSZXNvdXJjZShyZXNvdXJjZSwgcGFyc2VTdGF0ZW1lbnRzKHByb3BlcnRpZXNbcG9saWN5S2V5c1swXV0uU3RhdGVtZW50KSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlYWRNYW5hZ2VkUG9saWNpZXMocG9saWN5QXJuczogYW55LCBsb2dpY2FsSWQ6IHN0cmluZyk6IE1hbmFnZWRQb2xpY3lBdHRhY2htZW50W10ge1xuICAgIGlmICghcG9saWN5QXJucykgeyByZXR1cm4gW107IH1cblxuICAgIGNvbnN0IHJlcCA9ICckeycgKyBsb2dpY2FsSWQgKyAnfSc7XG4gICAgcmV0dXJuIE1hbmFnZWRQb2xpY3lBdHRhY2htZW50LnBhcnNlTWFuYWdlZFBvbGljaWVzKHJlcCwgcmVuZGVySW50cmluc2ljcyhwb2xpY3lBcm5zKSk7XG4gIH1cblxuICBwcml2YXRlIHJlYWRMYW1iZGFTdGF0ZW1lbnRzKHByb3BlcnRpZXM/OiBQcm9wZXJ0eU1hcCk6IFN0YXRlbWVudFtdIHtcbiAgICBpZiAoIXByb3BlcnRpZXMpIHsgcmV0dXJuIFtdOyB9XG5cbiAgICByZXR1cm4gW3BhcnNlTGFtYmRhUGVybWlzc2lvbihyZW5kZXJJbnRyaW5zaWNzKHByb3BlcnRpZXMpKV07XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgYW4gdW5kZWZpbmVkIG9yIHdpbGRjYXJkZWQgcHJpbmNpcGFsIG9uIHRoZXNlIHN0YXRlbWVudHNcbiAqL1xuZnVuY3Rpb24gZGVmYXVsdFByaW5jaXBhbChwcmluY2lwYWw6IHN0cmluZywgc3RhdGVtZW50czogU3RhdGVtZW50W10pIHtcbiAgc3RhdGVtZW50cy5mb3JFYWNoKHMgPT4gcy5wcmluY2lwYWxzLnJlcGxhY2VFbXB0eShwcmluY2lwYWwpKTtcbiAgc3RhdGVtZW50cy5mb3JFYWNoKHMgPT4gcy5wcmluY2lwYWxzLnJlcGxhY2VTdGFyKHByaW5jaXBhbCkpO1xuICByZXR1cm4gc3RhdGVtZW50cztcbn1cblxuLyoqXG4gKiBTZXQgYW4gdW5kZWZpbmVkIG9yIHdpbGRjYXJkZWQgcmVzb3VyY2Ugb24gdGhlc2Ugc3RhdGVtZW50c1xuICovXG5mdW5jdGlvbiBkZWZhdWx0UmVzb3VyY2UocmVzb3VyY2U6IHN0cmluZywgc3RhdGVtZW50czogU3RhdGVtZW50W10pIHtcbiAgc3RhdGVtZW50cy5mb3JFYWNoKHMgPT4gcy5yZXNvdXJjZXMucmVwbGFjZUVtcHR5KHJlc291cmNlKSk7XG4gIHN0YXRlbWVudHMuZm9yRWFjaChzID0+IHMucmVzb3VyY2VzLnJlcGxhY2VTdGFyKHJlc291cmNlKSk7XG4gIHJldHVybiBzdGF0ZW1lbnRzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElhbUNoYW5nZXNKc29uIHtcbiAgc3RhdGVtZW50QWRkaXRpb25zPzogQXJyYXk8TWF5YmVQYXJzZWQ8U3RhdGVtZW50SnNvbj4+O1xuICBzdGF0ZW1lbnRSZW1vdmFscz86IEFycmF5PE1heWJlUGFyc2VkPFN0YXRlbWVudEpzb24+PjtcbiAgbWFuYWdlZFBvbGljeUFkZGl0aW9ucz86IEFycmF5PE1heWJlUGFyc2VkPE1hbmFnZWRQb2xpY3lKc29uPj47XG4gIG1hbmFnZWRQb2xpY3lSZW1vdmFscz86IEFycmF5PE1heWJlUGFyc2VkPE1hbmFnZWRQb2xpY3lKc29uPj47XG59XG4iXX0=