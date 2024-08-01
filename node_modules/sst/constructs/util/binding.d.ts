import { SSTConstruct } from "../Construct.js";
import { Secret } from "../Secret.js";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
export interface BindingProps {
    clientPackage: string;
    permissions: Record<string, string[]>;
    variables: Record<string, {
        type: "plain";
        value: string;
    } | {
        type: "secret";
    } | {
        type: "secret_reference";
        secret: Secret;
    } | {
        type: "site_url";
        value: string;
    } | {
        type: "auth_id";
        value: string;
    }>;
}
export type BindingResource = SSTConstruct | {
    resource: SSTConstruct;
    permissions: {
        actions: string[];
        resources: string[];
    }[];
};
export declare function getBindingEnvironments(r: BindingResource): Record<string, string>;
export declare function getBindingParameters(r: BindingResource): void;
export declare function getBindingPermissions(r: BindingResource): PolicyStatement[];
export declare function getBindingType(r: BindingResource): {
    clientPackage: string;
    variables: string[];
} | undefined;
export declare function getBindingReferencedSecrets(r: BindingResource): Secret[];
export declare function getEnvironmentKey(c: SSTConstruct, prop: string): string;
export declare function getParameterPath(c: SSTConstruct, prop: string): string;
export declare function getParameterFallbackPath(c: SSTConstruct, prop: string): string;
export declare function placeholderSecretValue(): string;
export declare function placeholderSecretReferenceValue(secret: Secret): string;
