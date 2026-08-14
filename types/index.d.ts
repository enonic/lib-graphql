// Type definitions for the Enonic XP GraphQL library (com.enonic.lib:lib-graphql).
// Covers three importable modules:
//   /lib/graphql             — schema builder, scalars, execution
//   /lib/graphql-connection  — Relay-style connection helper
//   /lib/graphql-rx          — reactive subscription plumbing
//
// Type names mirror the library documentation
// (https://developer.enonic.com/docs/graphql-library): OutputField,
// InterfaceField, InputField, ResolverEnvironment, ExecutionResult,
// ConnectionSource, PublishProcessor, SubscriptionSubscriber.

declare module "/lib/graphql" {
    // ---------------------------------------------------------------------
    // Opaque type handles
    // ---------------------------------------------------------------------
    // Consumers pass these around but do not introspect them. The `_kind`
    // brand is nominal — TypeScript never observes it at runtime.

    export interface GraphQLType {
        readonly _kind?: string;
    }

    export interface GraphQLScalarType extends GraphQLType {
        readonly _kind?: "Scalar";
    }

    export interface GraphQLObjectType extends GraphQLType {
        readonly _kind?: "Object";
        /** Returns the type's declared `name`. Used by `createConnectionType` to derive edge/connection names. */
        getName(): string;
    }

    export interface GraphQLInputObjectType extends GraphQLType {
        readonly _kind?: "InputObject";
    }

    export interface GraphQLInterfaceType extends GraphQLType {
        readonly _kind?: "Interface";
    }

    export interface GraphQLUnionType extends GraphQLType {
        readonly _kind?: "Union";
    }

    export interface GraphQLEnumType extends GraphQLType {
        readonly _kind?: "Enum";
    }

    export interface GraphQLTypeReference extends GraphQLType {
        readonly _kind?: "Reference";
    }

    /** Opaque schema handle produced by `createSchema` and consumed by `execute`. */
    export interface GraphQLSchema {
        readonly _kind?: "Schema";
    }

    // ---------------------------------------------------------------------
    // Scalars
    // ---------------------------------------------------------------------

    export const GraphQLInt: GraphQLScalarType;
    export const GraphQLFloat: GraphQLScalarType;
    export const GraphQLString: GraphQLScalarType;
    export const GraphQLBoolean: GraphQLScalarType;
    export const GraphQLID: GraphQLScalarType;

    /**
     * Extended `Date` scalar. Note: a named import (`import {Date} from '/lib/graphql'`)
     * shadows the global `Date` object in that file.
     */
    export const Date: GraphQLScalarType;
    export const DateTime: GraphQLScalarType;
    export const Time: GraphQLScalarType;
    export const Json: GraphQLScalarType;

    export const LocalDateTime: GraphQLScalarType;
    export const LocalTime: GraphQLScalarType;

    // ---------------------------------------------------------------------
    // Field / resolver types
    // ---------------------------------------------------------------------

    /**
     * Environment passed to every output-field `resolve` function.
     * Contains exactly three keys: `source`, `args` and `context`.
     * Generic parameters let callers narrow each where they know the shape.
     */
    export interface ResolverEnvironment<Source = unknown, Args = Record<string, unknown>, Context = unknown> {
        /** Value returned by the parent field. */
        source: Source;
        /** Arguments supplied for the current field. */
        args: Args;
        /** Context passed to `execute()`. */
        context: Context;
    }

    /** Alias kept for graphql-java familiarity. */
    export type DataFetchingEnvironment<
        Source = unknown,
        Args = Record<string, unknown>,
        Context = unknown
    > = ResolverEnvironment<Source, Args, Context>;

    /**
     * A fixed (non-function) resolver value. Kept separate from the function form
     * so resolver signatures stay checked instead of collapsing to `unknown`.
     */
    export type ResolvedValue = string | number | boolean | null | unknown[] | Record<string, unknown>;

    /**
     * Defines a field on an object type. The `resolve` member is optional;
     * when absent, the runtime reads a property with the field's name from
     * `env.source`. It may also be a fixed value instead of a function.
     *
     * A subscription field's resolver returns a publisher
     * (see `PublishProcessor`/`Flowable` in `/lib/graphql-rx`).
     *
     * `env.args` is typed as `any` in the default resolver signature so callers can
     * narrow it to a concrete interface in their own resolver's `env` annotation
     * without an explicit cast. The runtime never validates arg shape — the schema
     * does — so this matches actual behavior.
     */
    export interface OutputField<Source = unknown, Context = unknown> {
        type: GraphQLType;
        /** Map of argument names to GraphQL input types. */
        args?: Record<string, GraphQLType>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve?: ((env: ResolverEnvironment<Source, any, Context>) => unknown) | ResolvedValue;
    }

    /** Alias kept for graphql-java familiarity. */
    export type GraphQLFieldConfig<Source = unknown, Context = unknown> = OutputField<Source, Context>;

    /** Defines a field on an interface — no `resolve`. */
    export interface InterfaceField {
        type: GraphQLType;
        /** Map of argument names to GraphQL input types. */
        args?: Record<string, GraphQLType>;
    }

    /** Defines a field on an input object. */
    export interface InputField {
        type: GraphQLType;
    }

    export type GraphQLFieldMap<Source = unknown, Context = unknown> = Record<
        string,
        OutputField<Source, Context>
    >;

    export type GraphQLInterfaceFieldMap = Record<string, InterfaceField>;

    export type GraphQLInputFieldMap = Record<string, InputField>;

    // ---------------------------------------------------------------------
    // Schema builder parameters
    // ---------------------------------------------------------------------

    export interface CreateSchemaParams {
        query: GraphQLObjectType;
        mutation?: GraphQLObjectType;
        subscription?: GraphQLObjectType;
        /** Additional types needed for reference resolution. */
        dictionary?: GraphQLObjectType[];
    }

    export interface CreateObjectTypeParams<Source = unknown, Context = unknown> {
        name: string;
        description?: string;
        fields: GraphQLFieldMap<Source, Context>;
        interfaces?: Array<GraphQLInterfaceType | GraphQLTypeReference>;
    }

    export interface CreateInputObjectTypeParams {
        name: string;
        description?: string;
        fields: GraphQLInputFieldMap;
    }

    export interface CreateInterfaceTypeParams<Source = unknown> {
        name: string;
        description?: string;
        fields: GraphQLInterfaceFieldMap;
        /**
         * Called at execution time to pick the concrete `GraphQLObjectType` for a runtime value.
         * Must return an already-defined object type (not a reference).
         */
        typeResolver: (source: Source) => GraphQLObjectType;
    }

    export interface CreateUnionTypeParams<Source = unknown> {
        name: string;
        /** Possible types of the union. Must be non-empty. */
        types: Array<GraphQLObjectType | GraphQLTypeReference>;
        typeResolver: (source: Source) => GraphQLObjectType;
        description?: string;
    }

    /**
     * Enum values can be provided as a `string[]` (name === value) or as a
     * `Record<string, unknown>` mapping enum-name -> backing value.
     */
    export interface CreateEnumTypeParams {
        name: string;
        values: string[] | Record<string, unknown>;
        description?: string;
    }

    // ---------------------------------------------------------------------
    // Schema generator
    // ---------------------------------------------------------------------

    export interface SchemaGenerator {
        createSchema(params: CreateSchemaParams): GraphQLSchema;
        createObjectType<Source = unknown, Context = unknown>(
            params: CreateObjectTypeParams<Source, Context>
        ): GraphQLObjectType;
        createInputObjectType(params: CreateInputObjectTypeParams): GraphQLInputObjectType;
        createInterfaceType<Source = unknown>(params: CreateInterfaceTypeParams<Source>): GraphQLInterfaceType;
        createUnionType<Source = unknown>(params: CreateUnionTypeParams<Source>): GraphQLUnionType;
        createEnumType(params: CreateEnumTypeParams): GraphQLEnumType;
        /**
         * Like `createObjectType`, but cached per generator: subsequent calls on the
         * same generator return the type created by the first call.
         */
        createPageInfoObjectType<Source = unknown, Context = unknown>(
            params: CreateObjectTypeParams<Source, Context>
        ): GraphQLObjectType;
    }

    export function newSchemaGenerator(): SchemaGenerator;

    // ---------------------------------------------------------------------
    // Type wrappers
    // ---------------------------------------------------------------------

    /** Wraps a type to indicate a list of that type (`[T]`). */
    export function list(type: GraphQLType): GraphQLType;

    /** Wraps a type to indicate a non-null occurrence (`T!`). */
    export function nonNull(type: GraphQLType): GraphQLType;

    /** Placeholder for a type identified by name — resolved when the schema is assembled. */
    export function reference(typeKey: string): GraphQLTypeReference;

    // ---------------------------------------------------------------------
    // Execution
    // ---------------------------------------------------------------------

    export interface ErrorLocation {
        line: number;
        column: number;
    }

    /** A validation or data-fetching error in an `ExecutionResult`. */
    export interface ExecutionError {
        errorType: string;
        message: string;
        locations?: ErrorLocation[];
        /** Present on validation errors. */
        validationErrorType?: string;
        /** Present on data-fetching errors caused by a thrown exception. */
        exception?: {
            name: string;
            message?: string;
        };
    }

    /**
     * The mapped result returned by `execute()` and delivered to subscription callbacks.
     *
     * For a subscription operation, `data` is a publisher rather than an object —
     * type it explicitly with `execute<Flowable>(...)` using `Flowable` from
     * `/lib/graphql-rx`, then call `data.subscribe(...)`.
     */
    export interface ExecutionResult<Data = unknown> {
        data?: Data;
        errors?: ExecutionError[];
    }

    /**
     * Runs a query against a schema. Arguments are positional; `variables` and
     * `context` are optional.
     */
    export function execute<Data = unknown>(
        schema: GraphQLSchema,
        query: string,
        variables?: Record<string, unknown>,
        context?: unknown
    ): ExecutionResult<Data>;
}

declare module "/lib/graphql-connection" {
    import type { GraphQLObjectType, SchemaGenerator } from "/lib/graphql";

    /**
     * The value a resolver must return for a field whose type was created by
     * `createConnectionType()`.
     */
    export interface ConnectionSource<Node = unknown> {
        /** Total number of available items. */
        total: number;
        /** Zero-based index of the first item in `hits`. */
        start: number;
        /** Items in the current page. */
        hits: Node[];
    }

    /**
     * Builds a Relay-style connection object type wrapping the given node type.
     * Arguments are positional. The connection is generated with
     * `<NodeType>Connection` / `<NodeType>Edge` names derived from `type.getName()`,
     * and exposes the fields `totalCount`, `edges` and `pageInfo`.
     */
    export function createConnectionType(
        schemaGenerator: SchemaGenerator,
        type: GraphQLObjectType
    ): GraphQLObjectType;

    /**
     * Base64-encodes a cursor value. The value is coerced with `String()`;
     * typically a start offset.
     */
    export function encodeCursor(value: unknown): string;

    /** Reverse of `encodeCursor`. Always returns a string — `parseInt` before arithmetic. */
    export function decodeCursor(value: string): string;
}

declare module "/lib/graphql-rx" {
    import type { ExecutionResult } from "/lib/graphql";

    /**
     * Structural stand-in for `java.lang.Throwable`. Construct one with
     * `Java.type()` — a string or a JavaScript `Error` is not accepted at runtime.
     */
    export interface Throwable {
        getMessage(): string | null;
    }

    /**
     * A subscriber returned by `createSubscriber()`. It has no constructor.
     */
    export interface SubscriptionSubscriber {
        readonly _kind?: "Subscriber";
        /**
         * Cancels its active subscription. Calling it before subscription or
         * more than once has no effect.
         */
        cancelSubscription(): void;
    }

    /** Alias kept for reactive-streams familiarity. */
    export type Subscriber = SubscriptionSubscriber;

    /**
     * A publisher of values. Filters can be chained; each `filter` call returns a
     * new publisher and leaves the source untouched.
     */
    export interface Flowable<T = unknown> {
        /** Forwards only the values the predicate accepts. */
        filter(predicate: (value: T) => boolean): Flowable<T>;
        /** Subscribes a subscriber created with `createSubscriber()`. */
        subscribe(subscriber: SubscriptionSubscriber): void;
    }

    /**
     * A reactive event source returned by `createPublishProcessor()`. Push values
     * via `onNext`, close via `onComplete`, or fail via `onError`. Return one
     * (optionally filtered) from a subscription field resolver.
     */
    export interface PublishProcessor<T = unknown> extends Flowable<T> {
        readonly _kind?: "PublishProcessor";
        /** Publishes a value to active subscribers. Becomes the `source` of the subscription field's resolver. */
        onNext(value: T): void;
        /** Terminates the stream with an error. Takes a Java `Throwable` constructed with `Java.type()`. */
        onError(error: Throwable): void;
        /** Completes the stream. Subscribers receive no further events. */
        onComplete(): void;
    }

    export interface CreateSubscriberParams<Data = unknown> {
        /** Called with each mapped `ExecutionResult` produced by a subscription. */
        onNext?: (result: ExecutionResult<Data>) => void;
    }

    /** Creates a publish processor that can be returned by a subscription field resolver. */
    export function createPublishProcessor<T = unknown>(): PublishProcessor<T>;

    /** Creates a subscriber for the publisher returned as `data` by a subscription execution. */
    export function createSubscriber<Data = unknown>(
        params: CreateSubscriberParams<Data>
    ): SubscriptionSubscriber;
}

export {};
