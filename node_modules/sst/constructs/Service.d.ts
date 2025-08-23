import { Construct } from "constructs";
import { DockerCacheOption } from "aws-cdk-lib/core";
import { DistributionProps, ICachePolicy } from "aws-cdk-lib/aws-cloudfront";
import { DistributionDomainProps } from "./Distribution.js";
import { SSTConstruct } from "./Construct.js";
import { Permissions } from "./util/permission.js";
import { BindingProps, BindingResource } from "./util/binding.js";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { ContainerDefinitionOptions, CpuArchitecture, FargateService, FargateTaskDefinition, FargateServiceProps, ICluster, ScalableTaskCount } from "aws-cdk-lib/aws-ecs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { ApplicationLoadBalancer, ApplicationLoadBalancerProps, ApplicationTargetGroupProps, BaseApplicationListenerProps } from "aws-cdk-lib/aws-elasticloadbalancingv2";
declare const supportedCpus: {
    "0.25 vCPU": number;
    "0.5 vCPU": number;
    "1 vCPU": number;
    "2 vCPU": number;
    "4 vCPU": number;
    "8 vCPU": number;
    "16 vCPU": number;
};
export interface ServiceDomainProps extends DistributionDomainProps {
}
export interface ServiceCdkDistributionProps extends Omit<DistributionProps, "defaultBehavior"> {
}
export interface ServiceContainerCacheProps extends DockerCacheOption {
}
export interface ServiceProps {
    /**
     * Path to the directory where the app is located.
     * @default "."
     */
    path?: string;
    /**
     * The port number on the container.
     * @example
     * ```js
     * {
     *   port: 8000,
     * }
     *```
     */
    port: number;
    /**
     * Path to Dockerfile relative to the defined "path".
     * @default "Dockerfile"
     */
    file?: string;
    /**
     * The CPU architecture of the container.
     * @default "x86_64"
     * @example
     * ```js
     * {
     *   architecture: "arm64",
     * }
     * ```
     */
    architecture?: Lowercase<keyof Pick<typeof CpuArchitecture, "ARM64" | "X86_64">>;
    /**
     * The amount of CPU allocated.
     * @default "0.25 vCPU"
     * @example
     * ```js
     * {
     *   cpu: "1 vCPU",
     * }
     *```
     */
    cpu?: keyof typeof supportedCpus;
    /**
     * The amount of memory allocated.
     * @default "0.5 GB"
     * @example
     * ```js
     * {
     *   memory: "2 GB",
     * }
     *```
     */
    memory?: `${number} GB`;
    /**
     * The amount of ephemeral storage allocated, in GB.
     * @default "20 GB"
     * @example
     * ```js
     * {
     *   storage: "100 GB",
     * }
     * ```
     */
    storage?: `${number} GB`;
    scaling?: {
        /**
         * The minimum capacity for the cluster.
         * @default 1
         * @example
         * ```js
         * {
         *   scaling: {
         *    minContainers: 4,
         *    maxContainers: 16,
         *   },
         * }
         *```
         */
        minContainers?: number;
        /**
         * The maximum capacity for the cluster.
         * @default 1
         * @example
         * ```js
         * {
         *   scaling: {
         *    minContainers: 4,
         *    maxContainers: 16,
         *   },
         * }
         *```
         */
        maxContainers?: number;
        /**
         * Scales in or out to achieve a target cpu utilization. Set to `false` to disable.
         * @default 70
         * @example
         * ```js
         * {
         *   scaling: {
         *    cpuUtilization: 50,
         *    memoryUtilization: 50,
         *   },
         * }
         *```
         */
        cpuUtilization?: number | false;
        /**
         * Scales in or out to achieve a target memory utilization. Set to `false` to disable.
         * @default 70
         * @example
         * ```js
         * {
         *   scaling: {
         *    cpuUtilization: 50,
         *    memoryUtilization: 50,
         *   },
         * }
         *```
         */
        memoryUtilization?: number | false;
        /**
         * Scales in or out to achieve a target request count per container. Set to `false` to disable.
         * @default 500
         * @example
         * ```js
         * {
         *   scaling: {
         *    requestsPerContainer: 1000,
         *   },
         * }
         *```
         */
        requestsPerContainer?: number | false;
    };
    /**
     * Bind resources for the function
     *
     * @example
     * ```js
     * {
     *   bind: [STRIPE_KEY, bucket],
     * }
     * ```
     */
    bind?: BindingResource[];
    /**
     * The customDomain for this service. SST supports domains that are hosted
     * either on [Route 53](https://aws.amazon.com/route53/) or externally.
     *
     * Note that you can also migrate externally hosted domains to Route 53 by
     * [following this guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html).
     *
     * @example
     * ```js
     * {
     *   customDomain: "domain.com",
     * }
     * ```
     *
     * ```js
     * {
     *   customDomain: {
     *     domainName: "domain.com",
     *     domainAlias: "www.domain.com",
     *     hostedZone: "domain.com"
     *   }
     * }
     * ```
     */
    customDomain?: string | ServiceDomainProps;
    /**
     * Attaches the given list of permissions to the SSR function. Configuring this property is equivalent to calling `attachPermissions()` after the site is created.
     * @example
     * ```js
     * {
     *   permissions: ["ses"]
     * }
     * ```
     */
    permissions?: Permissions;
    /**
     * An object with the key being the environment variable name.
     *
     * @example
     * ```js
     * {
     *   environment: {
     *     API_URL: api.url,
     *     USER_POOL_CLIENT: auth.cognitoUserPoolClient.userPoolClientId,
     *   },
     * }
     * ```
     */
    environment?: Record<string, string>;
    /**
     * The duration logs are kept in CloudWatch Logs.
     * @default Logs retained indefinitely
     * @example
     * ```js
     * {
     *   logRetention: "one_week"
     * }
     * ```
     */
    logRetention?: Lowercase<keyof typeof RetentionDays>;
    /**
     * While deploying, SST waits for the CloudFront cache invalidation process to finish. This ensures that the new content will be served once the deploy command finishes. However, this process can sometimes take more than 5 mins. For non-prod environments it might make sense to pass in `false`. That'll skip waiting for the cache to invalidate and speed up the deploy process.
     * @default false
     * @example
     * ```js
     * {
     *   waitForInvalidation: true
     * }
     * ```
     */
    waitForInvalidation?: boolean;
    build?: {
        /**
         * Build args to pass to the docker build command.
         * @default No build args
         * @example
         * ```js
         * {
         *   build: {
         *     buildArgs: {
         *       FOO: "bar"
         *     }
         *   }
         * }
         * ```
         */
        buildArgs?: Record<string, string>;
        /**
         * SSH agent socket or keys to pass to the docker build command.
         * Docker BuildKit must be enabled to use the ssh flag
         * @default No --ssh flag is passed to the build command
         * @example
         * ```js
         * container: {
         *   buildSsh: "default"
         * }
         * ```
         */
        buildSsh?: string;
        /**
         * Cache from options to pass to the docker build command.
         * [DockerCacheOption](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecr_assets.DockerCacheOption.html)[].
         * @default No cache from options are passed to the build command
         * @example
         * ```js
         * container: {
         *   cacheFrom: [{ type: 'registry', params: { ref: 'ghcr.io/myorg/myimage:cache' }}],
         * }
         * ```
         */
        cacheFrom?: ServiceContainerCacheProps[];
        /**
         * Cache to options to pass to the docker build command.
         * [DockerCacheOption](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecr_assets.DockerCacheOption.html)[].
         * @default No cache to options are passed to the build command
         * @example
         * ```js
         * container: {
         *   cacheTo: { type: 'registry', params: { ref: 'ghcr.io/myorg/myimage:cache', mode: 'max', compression: 'zstd' }},
         * }
         * ```
         */
        cacheTo?: ServiceContainerCacheProps;
    };
    dev?: {
        /**
         * When running `sst dev, site is not deployed. This is to ensure `sst dev` can start up quickly.
         * @default false
         * @example
         * ```js
         * {
         *   dev: {
         *     deploy: true
         *   }
         * }
         * ```
         */
        deploy?: boolean;
        /**
         * The local site URL when running `sst dev`.
         * @example
         * ```js
         * {
         *   dev: {
         *     url: "http://localhost:3000"
         *   }
         * }
         * ```
         */
        url?: string;
    };
    cdk?: {
        /**
         * By default, SST creates a CloudFront distribution. Pass in a value to override the default settings this construct uses to create the CDK `Distribution` internally. Alternatively, set this to `false` to skip creating the distribution.
         * @default true
         * @example
         * ```js
         * {
         *   cdk: {
         *     cloudfrontDistribution: false
         *   }
         * }
         * ```
         */
        cloudfrontDistribution?: boolean | ServiceCdkDistributionProps;
        /**
         * By default, SST creates an Application Load Balancer to distribute requests across containers. Set this to `false` to skip creating the load balancer.
         * @default true
         * @example
         * ```js
         * {
         *   cdk: {
         *     applicationLoadBalancer: false
         *   }
         * }
         * ```
         */
        applicationLoadBalancer?: boolean | Omit<ApplicationLoadBalancerProps, "vpc">;
        /**
         * Customize the Application Load Balancer's target group.
         * @example
         * ```js
         * {
         *   cdk: {
         *     applicationLoadBalancerListener: {
         *       port: 8080
         *     }
         *   }
         * }
         * ```
         */
        applicationLoadBalancerListener?: BaseApplicationListenerProps;
        /**
         * Customize the Application Load Balancer's target group.
         * @example
         * ```js
         * {
         *   cdk: {
         *     applicationLoadBalancerTargetGroup: {
         *       healthCheck: {
         *         path: "/health"
         *       }
         *     }
         *   }
         * }
         * ```
         */
        applicationLoadBalancerTargetGroup?: ApplicationTargetGroupProps;
        /**
         * Customize the Fargate Service.
         * @example
         * ```js
         * {
         *   cdk: {
         *     fargateService: {
         *       circuitBreaker: { rollback: true }
         *     }
         *   }
         * }
         * ```
         */
        fargateService?: Omit<FargateServiceProps, "cluster" | "taskDefinition">;
        /**
         * Customizing the container definition for the ECS task.
         * @example
         * ```js
         * {
         *   cdk: {
         *     container: {
         *       healthCheck: {
         *         command: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"]
         *       }
         *     }
         *   }
         * }
         * ```
         */
        container?: Omit<ContainerDefinitionOptions, "image"> & {
            image?: ContainerDefinitionOptions["image"];
        };
        /**
         * Create the service in an existing ECS cluster.
         *
         * @example
         * ```js
         * import { Cluster } from "aws-cdk-lib/aws-ecs";
         *
         * {
         *   cdk: {
         *     cluster: Cluster.fromClusterArn(stack, "Cluster", "arn:aws:ecs:us-east-1:123456789012:cluster/my-cluster"),
         *   }
         * }
         * ```
         */
        cluster?: ICluster;
        /**
         * Create the service in the specified VPC. Note this will only work once deployed.
         *
         * @example
         * ```js
         * import { Vpc } from "aws-cdk-lib/aws-ec2";
         *
         * {
         *   cdk: {
         *     vpc: Vpc.fromLookup(stack, "VPC", {
         *       vpcId: "vpc-xxxxxxxxxx",
         *     }),
         *   }
         * }
         * ```
         */
        vpc?: IVpc;
        /**
         * By default, SST creates a CloudFront cache policy. Pass in a value to override the default policy.
         *
         * @example
         * ```js
         * import { CachePolicy } from "aws-cdk-lib/aws-cloudfront";
         *
         * {
         *   cdk: {
         *     cachePolicy: CachePolicy.fromCachePolicyId(stack, "CachePolicy", "83da9c7e-98b4-4e11-a168-04f0df8e2c65"),
         *   }
         * }
         * ```
         */
        cachePolicy?: ICachePolicy;
    };
}
type ServiceNormalizedProps = ServiceProps & {
    architecture: Exclude<ServiceProps["architecture"], undefined>;
    cpu: Exclude<ServiceProps["cpu"], undefined>;
    path: Exclude<ServiceProps["path"], undefined>;
    memory: Exclude<ServiceProps["memory"], undefined>;
    storage: Exclude<ServiceProps["storage"], undefined>;
    logRetention: Exclude<ServiceProps["logRetention"], undefined>;
};
/**
 * The `Service` construct is a higher level CDK construct that makes it easy to create modern web apps with Server Side Rendering capabilities.
 * @example
 * Deploys a service in the `app` directory.
 *
 * ```js
 * new Service(stack, "myApp", {
 *   path: "app",
 * });
 * ```
 */
export declare class Service extends Construct implements SSTConstruct {
    readonly id: string;
    private props;
    private doNotDeploy;
    private devFunction?;
    private vpc?;
    private cluster?;
    private container?;
    private taskDefinition?;
    private service?;
    private distribution?;
    private alb?;
    private scaling?;
    constructor(scope: Construct, id: string, props: ServiceProps);
    /**
     * The CloudFront URL of the website.
     */
    get url(): string | undefined;
    /**
     * If the custom domain is enabled, this is the URL of the website with the
     * custom domain.
     */
    get customDomainUrl(): string | undefined;
    /**
     * The internally created CDK resources.
     */
    get cdk(): {
        vpc: IVpc | undefined;
        cluster: ICluster | undefined;
        fargateService: FargateService | undefined;
        taskDefinition: FargateTaskDefinition | undefined;
        distribution: import("aws-cdk-lib/aws-cloudfront").IDistribution | undefined;
        applicationLoadBalancer: ApplicationLoadBalancer | undefined;
        hostedZone: import("aws-cdk-lib/aws-route53").IHostedZone | undefined;
        certificate: import("aws-cdk-lib/aws-certificatemanager").ICertificate | undefined;
        scaling: ScalableTaskCount | undefined;
    } | undefined;
    getConstructMetadata(): {
        type: "Service";
        data: {
            mode: "placeholder" | "deployed";
            path: string;
            customDomainUrl: string | undefined;
            url: string | undefined;
            devFunction: string | undefined;
            task: string | undefined;
            container: string | undefined;
            secrets: string[];
        };
    };
    /** @internal */
    getBindings(): BindingProps;
    /**
     * Binds additional resources to service.
     *
     * @example
     * ```js
     * service.bind([STRIPE_KEY, bucket]);
     * ```
     */
    bind(constructs: BindingResource[]): void;
    /**
     * Attaches the given list of permissions to allow the service
     * to access other AWS resources.
     *
     * @example
     * ```js
     * service.attachPermissions(["sns"]);
     * ```
     */
    attachPermissions(permissions: Permissions): void;
    /**
     * Attaches additional environment variable to the service.
     *
     * @example
     * ```js
     * service.addEnvironment({
     *   DEBUG: "*"
     * });
     * ```
     */
    addEnvironment(name: string, value: string): void;
    private validateServiceExists;
    private validateMemoryCpuAndStorage;
    private createVpc;
    private createCluster;
    private createService;
    private createLoadBalancer;
    private createAutoScaling;
    private createDistribution;
    private createDevFunction;
    private bindForService;
    private addEnvironmentForService;
    private attachPermissionsForService;
    private createNixpacksBuilder;
    private runNixpacksBuild;
    private runDockerBuild;
    private updateContainerImage;
}
export declare const useServices: () => {
    add(stack: string, name: string, props: ServiceNormalizedProps): void;
    readonly all: {
        stack: string;
        name: string;
        props: ServiceNormalizedProps;
    }[];
};
export {};
