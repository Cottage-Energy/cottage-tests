import { createProxy } from "../util/index.js";
export const EventBus = 
/* @__PURE__ */ createProxy("EventBus");
import { EventBridgeClient, PutEventsCommand, } from "@aws-sdk/client-eventbridge";
import { useLoader } from "../util/loader.js";
import { Config } from "../config/index.js";
export function createEventBuilder(input) {
    const client = new EventBridgeClient({});
    const validator = input.validator;
    const metadataValidator = input.metadata ? validator(input.metadata) : null;
    return function event(type, schema) {
        const validate = validator(schema);
        async function publish(properties, metadata) {
            const result = await useLoader("sst.bus.publish", async (input) => {
                const size = 10;
                const promises = [];
                for (let i = 0; i < input.length; i += size) {
                    const chunk = input.slice(i, i + size);
                    promises.push(client.send(new PutEventsCommand({
                        Entries: chunk,
                    })));
                }
                const settled = await Promise.allSettled(promises);
                const result = new Array(input.length);
                for (let i = 0; i < result.length; i++) {
                    const item = settled[Math.floor(i / 10)];
                    if (item.status === "rejected") {
                        result[i] = item.reason;
                        continue;
                    }
                    result[i] = item.value;
                }
                return result;
            })({
                // @ts-expect-error
                EventBusName: EventBus[input.bus].eventBusName,
                // @ts-expect-error
                Source: Config.APP,
                Detail: JSON.stringify({
                    properties: validate(properties),
                    metadata: (() => {
                        if (metadataValidator) {
                            return metadataValidator(metadata);
                        }
                        if (input.metadataFn) {
                            return input.metadataFn();
                        }
                    })(),
                }),
                DetailType: type,
            });
            return result;
        }
        return {
            publish: publish,
            type,
            $input: {},
            $output: {},
            $metadata: {},
        };
    };
}
export function ZodValidator(schema) {
    return (input) => {
        return schema.parse(input);
    };
}
export function EventHandler(_events, cb) {
    return async (event) => {
        await cb({
            type: event["detail-type"],
            properties: event.detail.properties,
            metadata: event.detail.metadata,
            attempts: event.attempts ?? 0,
        });
    };
}
