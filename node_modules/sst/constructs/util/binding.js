import * as ssm from "aws-cdk-lib/aws-ssm";
import { isSSTConstruct } from "../Construct.js";
import { Config } from "../../config.js";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
export function getBindingEnvironments(r) {
    const c = isSSTConstruct(r) ? r : r.resource;
    const binding = c.getBindings();
    let environment = {};
    if (binding) {
        Object.entries(binding.variables).forEach(([prop, variable]) => {
            const envName = getEnvironmentKey(c, prop);
            if (variable.type === "plain") {
                environment[envName] = variable.value;
            }
            else if (variable.type === "secret" || variable.type === "site_url") {
                environment[envName] = placeholderSecretValue();
            }
            else if (variable.type === "secret_reference") {
                environment[envName] = placeholderSecretReferenceValue(variable.secret);
            }
            else if (variable.type === "auth_id") {
                environment["AUTH_ID"] = variable.value;
            }
        });
    }
    return environment;
}
export function getBindingParameters(r) {
    const c = isSSTConstruct(r) ? r : r.resource;
    const binding = c.getBindings();
    if (!binding) {
        return;
    }
    Object.entries(binding.variables).forEach(([prop, variable]) => {
        const resId = `Parameter_${prop}`;
        if (!c.node.tryFindChild(resId)) {
            if (variable.type === "plain" || variable.type === "site_url") {
                new ssm.StringParameter(c, resId, {
                    parameterName: getParameterPath(c, prop),
                    stringValue: variable.value,
                });
            }
            else if (variable.type === "secret_reference") {
                new ssm.StringParameter(c, resId, {
                    parameterName: getParameterPath(c, prop),
                    stringValue: placeholderSecretReferenceValue(variable.secret),
                });
            }
        }
    });
}
export function getBindingPermissions(r) {
    if (isSSTConstruct(r)) {
        return Object.entries(r.getBindings()?.permissions ?? {}).map(([action, resources]) => new PolicyStatement({
            actions: [action],
            effect: Effect.ALLOW,
            resources,
        }));
    }
    return r.permissions.map((p) => {
        return new PolicyStatement({
            actions: p.actions,
            effect: Effect.ALLOW,
            resources: p.resources,
        });
    });
}
export function getBindingType(r) {
    const c = isSSTConstruct(r) ? r : r.resource;
    const binding = c.getBindings();
    if (!binding) {
        return;
    }
    return {
        clientPackage: binding.clientPackage,
        variables: Object.keys(binding.variables),
    };
}
export function getBindingReferencedSecrets(r) {
    const c = isSSTConstruct(r) ? r : r.resource;
    const binding = c.getBindings();
    const secrets = [];
    if (binding) {
        Object.values(binding.variables).forEach((variable) => {
            if (variable.type === "secret_reference") {
                secrets.push(variable.secret);
            }
        });
    }
    return secrets;
}
export function getEnvironmentKey(c, prop) {
    return Config.envFor({
        type: c.constructor.name,
        id: c.id,
        prop: prop,
    });
}
export function getParameterPath(c, prop) {
    const construct = c.constructor.name;
    return Config.pathFor({
        id: c.id,
        type: construct,
        prop: prop,
    });
}
export function getParameterFallbackPath(c, prop) {
    const construct = c.constructor.name;
    return Config.pathFor({
        id: c.id,
        type: construct,
        prop: prop,
        fallback: true,
    });
}
export function placeholderSecretValue() {
    return "__FETCH_FROM_SSM__";
}
export function placeholderSecretReferenceValue(secret) {
    return "__FETCH_FROM_SECRET__:" + secret.name;
}
