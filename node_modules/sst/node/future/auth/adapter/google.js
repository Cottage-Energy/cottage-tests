import { Issuer } from "openid-client";
import { OidcAdapter } from "./oidc.js";
import { OauthAdapter } from "./oauth.js";
let issuer;
export function GoogleAdapter(config) {
    /* @__PURE__ */
    return async function () {
        if (!issuer) {
            issuer = await Issuer.discover("https://accounts.google.com");
        }
        if (config.mode === "oauth") {
            return OauthAdapter({
                issuer: issuer,
                ...config,
                params: {
                    ...(config.accessType && { access_type: config.accessType }),
                    ...config.params,
                },
            })();
        }
        return OidcAdapter({
            issuer: issuer,
            scope: "openid email profile",
            ...config,
        })();
    };
}
