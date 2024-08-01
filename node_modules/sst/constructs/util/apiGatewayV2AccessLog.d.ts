import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import { WebSocketStage, HttpStage } from "aws-cdk-lib/aws-apigatewayv2";
export interface AccessLogProps {
    format?: string;
    destinationArn?: string;
    retention?: Lowercase<keyof typeof logs.RetentionDays>;
}
export declare function buildAccessLogData(scope: Construct, accessLog: boolean | string | AccessLogProps | undefined, apiStage: WebSocketStage | HttpStage, isDefaultStage: boolean): logs.LogGroup | undefined;
export declare function cleanupLogGroupName(str: string): string;
