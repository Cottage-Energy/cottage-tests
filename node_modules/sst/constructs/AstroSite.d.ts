import { SsrSite, SsrSiteNormalizedProps, SsrSiteProps } from "./SsrSite.js";
import { AllowedMethods } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
/**
 * The `AstroSite` construct is a higher level CDK construct that makes it easy to create a Astro app.
 * @example
 * Deploys a Astro app in the `my-astro-app` directory.
 *
 * ```js
 * new AstroSite(stack, "web", {
 *   path: "my-astro-app/",
 * });
 * ```
 */
export declare class AstroSite extends SsrSite {
    props: SsrSiteNormalizedProps;
    constructor(scope: Construct, id: string, props?: SsrSiteProps);
    private static getBuildMeta;
    private static getCFRoutingFunction;
    protected plan(): {
        cloudFrontFunctions?: Record<string, import("./SsrSite.js").CloudFrontFunctionConfig> | undefined;
        edgeFunctions?: Record<string, import("./SsrSite.js").EdgeFunctionConfig> | undefined;
        origins: Record<string, import("./SsrSite.js").FunctionOriginConfig | import("./SsrSite.js").ImageOptimizationFunctionOriginConfig | import("./SsrSite.js").S3OriginConfig | import("./SsrSite.js").OriginGroupConfig>;
        edge: boolean;
        behaviors: {
            cacheType: "server" | "static";
            pattern?: string | undefined;
            origin: string;
            allowedMethods?: AllowedMethods | undefined;
            cfFunction?: string | undefined;
            edgeFunction?: string | undefined;
        }[];
        errorResponses?: import("aws-cdk-lib/aws-cloudfront").ErrorResponse[] | undefined;
        serverCachePolicy?: {
            allowedHeaders?: string[] | undefined;
        } | undefined;
        buildId?: string | undefined;
        warmer?: {
            function: string;
        } | undefined;
    };
    getConstructMetadata(): {
        data: {
            mode: "placeholder" | "deployed";
            path: string;
            runtime: "nodejs16.x" | "nodejs18.x" | "nodejs20.x" | "nodejs22.x";
            customDomainUrl: string | undefined;
            url: string | undefined;
            edge: boolean | undefined;
            server: string;
            secrets: string[];
            prefetchSecrets: boolean | undefined;
        };
        type: "AstroSite";
    };
}
