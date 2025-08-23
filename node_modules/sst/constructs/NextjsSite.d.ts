import { Construct } from "constructs";
import { Runtime, FunctionProps as CdkFunctionProps, Architecture } from "aws-cdk-lib/aws-lambda";
import { EdgeFunctionConfig, FunctionOriginConfig, SsrSite, SsrSiteNormalizedProps, SsrSiteProps } from "./SsrSite.js";
import { Size } from "./util/size.js";
import { Bucket } from "aws-cdk-lib/aws-s3";
type OpenNextS3Origin = {
    type: "s3";
    originPath: string;
    copy: {
        from: string;
        to: string;
        cached: boolean;
        versionedSubDir?: string;
    }[];
};
export interface NextjsSiteProps extends Omit<SsrSiteProps, "nodejs"> {
    /**
     * OpenNext version for building the Next.js site.
     * @default Latest OpenNext version
     * @example
     * ```js
     * openNextVersion: "2.2.4",
     * ```
     */
    openNextVersion?: string;
    /**
     * The server function is deployed to Lambda in a single region. Alternatively, you can enable this option to deploy to Lambda@Edge.
     * @default false
     */
    edge?: boolean;
    imageOptimization?: {
        /**
         * The amount of memory in MB allocated for image optimization function.
         * @default 1024 MB
         * @example
         * ```js
         * imageOptimization: {
         *   memorySize: "512 MB",
         * }
         * ```
         */
        memorySize?: number | Size;
        /**
         * If set to true, already computed image will return 304 Not Modified.
         * This means that image needs to be immutable, the etag will be computed based on the image href, format and width and the next BUILD_ID.
         * @default false
         * @example
         * ```js
         * imageOptimization: {
         *  staticImageOptimization: true,
         * }
         */
        staticImageOptimization?: boolean;
    };
    cdk?: SsrSiteProps["cdk"] & {
        revalidation?: Pick<CdkFunctionProps, "vpc" | "vpcSubnets">;
        /**
         * Override the CloudFront cache policy properties for responses from the
         * server rendering Lambda.
         *
         * @default
         * By default, the cache policy is configured to cache all responses from
         * the server rendering Lambda based on the query-key only. If you're using
         * cookie or header based authentication, you'll need to override the
         * cache policy to cache based on those values as well.
         *
         * ```js
         * serverCachePolicy: new CachePolicy(this, "ServerCache", {
         *   queryStringBehavior: CacheQueryStringBehavior.all()
         *   headerBehavior: CacheHeaderBehavior.allowList(
         *     "accept",
         *     "rsc",
         *     "next-router-prefetch",
         *     "next-router-state-tree",
         *     "next-url",
         *   ),
         *   cookieBehavior: CacheCookieBehavior.none()
         *   defaultTtl: Duration.days(0)
         *   maxTtl: Duration.days(365)
         *   minTtl: Duration.days(0)
         * })
         * ```
         */
        serverCachePolicy?: NonNullable<SsrSiteProps["cdk"]>["serverCachePolicy"];
    };
}
type NextjsSiteNormalizedProps = NextjsSiteProps & SsrSiteNormalizedProps;
/**
 * The `NextjsSite` construct is a higher level CDK construct that makes it easy to create a Next.js app.
 * @example
 * Deploys a Next.js app in the `my-next-app` directory.
 *
 * ```js
 * new NextjsSite(stack, "web", {
 *   path: "my-next-app/",
 * });
 * ```
 */
export declare class NextjsSite extends SsrSite {
    props: NextjsSiteNormalizedProps;
    private _routes?;
    private routesManifest?;
    private appPathRoutesManifest?;
    private appPathsManifest?;
    private pagesManifest?;
    private prerenderManifest?;
    private openNextOutput?;
    constructor(scope: Construct, id: string, props?: NextjsSiteProps);
    private createFunctionOrigin;
    private createEcsOrigin;
    private createEdgeOrigin;
    protected plan(bucket: Bucket): {
        cloudFrontFunctions?: {
            serverCfFunction: {
                constructId: string;
                injections: string[];
            };
        } | undefined;
        edgeFunctions?: Record<string, EdgeFunctionConfig> | undefined;
        origins: {
            s3: OpenNextS3Origin;
            imageOptimizer: {
                type: "image-optimization-function";
                function: {
                    description: string;
                    handler: string;
                    code: import("aws-cdk-lib/aws-lambda").AssetCode;
                    runtime: Runtime;
                    architecture: Architecture;
                    environment: {
                        OPENNEXT_STATIC_ETAG?: string | undefined;
                        BUCKET_NAME: string;
                        BUCKET_KEY_PREFIX: string;
                    };
                    permissions: string[];
                    memorySize: number;
                };
            };
            default: FunctionOriginConfig;
        };
        edge: boolean;
        behaviors: {
            cacheType: "server" | "static";
            pattern?: string | undefined;
            origin: "default" | "s3" | "imageOptimizer";
            allowedMethods?: import("aws-cdk-lib/aws-cloudfront").AllowedMethods | undefined;
            cfFunction?: "serverCfFunction" | undefined;
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
    private setMiddlewareEnv;
    private createRevalidationQueue;
    private createRevalidationTable;
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
        type: "NextjsSite";
    };
    private useRoutes;
    private useRoutesManifest;
    private useAppPathRoutesManifest;
    private useAppPathsManifest;
    private usePagesManifest;
    private usePrerenderManifest;
    private useCloudFrontFunctionCacheHeaderKey;
    private useCloudfrontGeoHeadersInjection;
    private getBuildId;
    private getSourcemapForAppRoute;
    private getSourcemapForPagesRoute;
    private handleMissingSourcemap;
    private static buildCloudWatchRouteName;
    private static buildCloudWatchRouteHash;
    static _test: {
        buildCloudWatchRouteName: typeof NextjsSite.buildCloudWatchRouteName;
    };
}
export {};
