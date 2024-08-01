import { BaseClient, Issuer } from "openid-client";
import { OauthBasicConfig } from "./oauth.js";
type AppleConfig = OauthBasicConfig & {
    issuer?: Issuer;
};
export declare const AppleAdapter: (config: AppleConfig) => () => Promise<{
    type: "success";
    properties: {
        tokenset: import("openid-client").TokenSet;
        client: BaseClient;
    };
} | {
    type: "step";
    properties: {
        statusCode: number;
        headers: {
            location: string;
        };
    };
} | undefined>;
export {};
