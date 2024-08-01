export interface EventBusResources {
}
export declare const EventBus: EventBusResources;
import { PutEventsCommandOutput } from "@aws-sdk/client-eventbridge";
import { EventBridgeEvent } from "aws-lambda";
import { ZodObject, ZodSchema, z } from "zod";
/**
 * PutEventsCommandOutput is used in return type of createEvent, in case the consumer of SST builds
 * their project with declaration files, this is not portable. In order to allow TS to generate a
 * declaration file without reference to @aws-sdk/client-eventbridge, we must re-export the type.
 *
 * More information here: https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1519138189
 */
export { PutEventsCommandOutput };
export declare function createEventBuilder<Bus extends keyof typeof EventBus, MetadataFunction extends () => any, Validator extends (schema: any) => (input: any) => any, MetadataSchema extends Parameters<Validator>[0] | undefined>(input: {
    bus: Bus;
    metadata?: MetadataSchema;
    metadataFn?: MetadataFunction;
    validator: Validator;
}): <Type extends string, Schema extends Parameters<Validator>[0]>(type: Type, schema: Schema) => {
    publish: undefined extends MetadataSchema ? (properties: inferParser<Schema>["in"]) => Promise<PutEventsCommandOutput> : (properties: inferParser<Schema>["in"], metadata: inferParser<MetadataSchema>["in"]) => Promise<void>;
    type: Type;
    $input: inferParser<Schema>["in"];
    $output: inferParser<Schema>["out"];
    $metadata: ReturnType<MetadataFunction>;
};
export declare function ZodValidator<Schema extends ZodSchema>(schema: Schema): (input: z.input<Schema>) => z.output<Schema>;
export type ParserZodEsque<TInput, TParsedInput> = {
    _input: TInput;
    _output: TParsedInput;
};
export type ParserValibotEsque<TInput, TParsedInput> = {
    _types?: {
        input: TInput;
        output: TParsedInput;
    };
};
export type ParserMyZodEsque<TInput> = {
    parse: (input: any) => TInput;
};
export type ParserSuperstructEsque<TInput> = {
    create: (input: unknown) => TInput;
};
export type ParserCustomValidatorEsque<TInput> = (input: unknown) => Promise<TInput> | TInput;
export type ParserYupEsque<TInput> = {
    validateSync: (input: unknown) => TInput;
};
export type ParserScaleEsque<TInput> = {
    assert(value: unknown): asserts value is TInput;
};
export type ParserWithoutInput<TInput> = ParserCustomValidatorEsque<TInput> | ParserMyZodEsque<TInput> | ParserScaleEsque<TInput> | ParserSuperstructEsque<TInput> | ParserYupEsque<TInput>;
export type ParserWithInputOutput<TInput, TParsedInput> = ParserZodEsque<TInput, TParsedInput> | ParserValibotEsque<TInput, TParsedInput>;
export type Parser = ParserWithInputOutput<any, any> | ParserWithoutInput<any>;
export type inferParser<TParser extends Parser> = TParser extends ParserWithInputOutput<infer $TIn, infer $TOut> ? {
    in: $TIn;
    out: $TOut;
} : TParser extends ParserWithoutInput<infer $InOut> ? {
    in: $InOut;
    out: $InOut;
} : never;
export type inferEvent<T extends {
    shape: ZodObject<any>;
}> = z.infer<T["shape"]>;
type Event = {
    type: string;
    $output: any;
    $metadata: any;
};
type EventPayload<E extends Event> = {
    type: E["type"];
    properties: E["$output"];
    metadata: E["$metadata"];
    attempts: number;
};
export declare function EventHandler<Events extends Event>(_events: Events | Events[], cb: (evt: {
    [K in Events["type"]]: EventPayload<Extract<Events, {
        type: K;
    }>>;
}[Events["type"]]) => Promise<void>): (event: EventBridgeEvent<string, any> & {
    attempts?: number;
}) => Promise<void>;
