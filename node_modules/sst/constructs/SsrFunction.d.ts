import { Construct } from "constructs";
import { IGrantable } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { FunctionOptions, Function as CdkFunction, FunctionUrlOptions, FunctionUrl } from "aws-cdk-lib/aws-lambda";
import { NodeJSProps, FunctionCopyFilesProps } from "./Function.js";
import { SSTConstruct } from "./Construct.js";
import { BindingResource } from "./util/binding.js";
import { Permissions } from "./util/permission.js";
import { Size } from "./util/size.js";
import { Duration } from "./util/duration.js";
export interface SsrFunctionProps extends Omit<FunctionOptions, "memorySize" | "timeout" | "runtime"> {
    bundle?: string;
    handler: string;
    runtime?: "nodejs16.x" | "nodejs18.x" | "nodejs20.x" | "nodejs22.x";
    timeout?: number | Duration;
    memorySize?: number | Size;
    permissions?: Permissions;
    environment?: Record<string, string>;
    bind?: BindingResource[];
    nodejs?: NodeJSProps;
    copyFiles?: FunctionCopyFilesProps[];
    logRetention?: RetentionDays;
    streaming?: boolean;
    injections?: string[];
    prefetchSecrets?: boolean;
}
export declare class SsrFunction extends Construct implements SSTConstruct {
    readonly id: string;
    /** @internal */
    readonly _doNotAllowOthersToBind = true;
    function: CdkFunction;
    private functionUrl?;
    private assetReplacer;
    private assetReplacerPolicy;
    private missingSourcemap?;
    private props;
    constructor(scope: Construct, id: string, props: SsrFunctionProps);
    get role(): import("aws-cdk-lib/aws-iam").IRole | undefined;
    get functionArn(): string;
    get functionName(): string;
    get url(): string | undefined;
    addEnvironment(key: string, value: string): CdkFunction;
    addFunctionUrl(props?: FunctionUrlOptions): FunctionUrl;
    grantInvoke(grantee: IGrantable): import("aws-cdk-lib/aws-iam").Grant;
    attachPermissions(permissions: Permissions): void;
    _overrideMissingSourcemap(): void;
    private createFunction;
    private createCodeReplacer;
    private createSecretPrefetcher;
    private bind;
    private buildAssetFromHandler;
    private buildAssetFromBundle;
    private writeWrapperFile;
    private updateCodeReplacer;
    private updateFunction;
    /** @internal */
    getConstructMetadata(): {
        type: "Function";
        data: {
            arn: string;
            runtime: "nodejs16.x" | "nodejs18.x" | "nodejs20.x" | "nodejs22.x" | undefined;
            handler: string;
            missingSourcemap: boolean | undefined;
            localId: string;
            secrets: string[];
            prefetchSecrets: boolean | undefined;
        };
    };
    /** @internal */
    getBindings(): undefined;
}
