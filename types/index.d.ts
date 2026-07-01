// Type definitions for @enonic/lib-graphql
// Covers three importable modules:
//   /lib/graphql             — schema builder, scalars, execution
//   /lib/graphql-connection  — Relay-style connection helper
//   /lib/graphql-rx          — reactive subscription plumbing

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

    // Extended scalars (>= 1.2.0)
    export const Date: GraphQLScalarType;
    export const DateTime: GraphQLScalarType;
    export const Time: GraphQLScalarType;
    export const Json: GraphQLScalarType;

    // Custom scalars (>= 2.0.0)
    export const LocalDateTime: GraphQLScalarType;
    export const LocalTime: GraphQLScalarType;

    // ---------------------------------------------------------------------
    // Field / resolver types
    // ---------------------------------------------------------------------

    /**
     * Environment passed to every field `resolve` function.
     * Generic parameters let callers narrow `source`/`args`/`context` where they know the shape;
     * the defaults reflect what the Java bridge actually guarantees (nothing).
     */
    export interface DataFetchingEnvironment<Source = unknown, Args = Record<string, unknown>, Context = unknown> {
        source: Source;
        args: Args;
        context: Context;
    }

    /**
     * A field definition in an object/interface type. The `resolve` function is optional;
     * when absent, the runtime uses graphql-java's `PropertyDataFetcher`, which reads the
     * matching property off `source`.
     *
     * `env.args` is typed as `any` in the default resolver signature so callers can narrow
     * it to a concrete interface in their own resolver's `env: DataFetchingEnvironment<...>`
     * annotation without an explicit cast. The runtime never validates arg shape — the
     * schema does — so this matches actual behavior.
     */
    export interface GraphQLFieldConfig<Source = unknown, Context = unknown> {
        type: GraphQLType;
        args?: Record<string, GraphQLType>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve?: (env: DataFetchingEnvironment<Source, any, Context>) => unknown;
    }

    /** Fields for input object types — no `args`, no `resolve`. */
    export interface GraphQLInputFieldConfig {
        type: GraphQLType;
    }

    export type GraphQLFieldMap<Source = unknown, Context = unknown> = Record<
        string,
        GraphQLFieldConfig<Source, Context>
    >;

    export type GraphQLInputFieldMap = Record<string, GraphQLInputFieldConfig>;

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

    export interface CreateInterfaceTypeParams<Source = unknown, Context = unknown> {
        name: string;
        description?: string;
        fields: GraphQLFieldMap<Source, Context>;
        /**
         * Called at execution time to pick the concrete `GraphQLObjectType` for a runtime value.
         * Must return an already-defined object type (not a reference).
         */
        typeResolver: (source: Source) => GraphQLObjectType;
    }

    export interface CreateUnionTypeParams<Source = unknown> {
        name: string;
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
        createInterfaceType<Source = unknown, Context = unknown>(
            params: CreateInterfaceTypeParams<Source, Context>
        ): GraphQLInterfaceType;
        createUnionType<Source = unknown>(params: CreateUnionTypeParams<Source>): GraphQLUnionType;
        createEnumType(params: CreateEnumTypeParams): GraphQLEnumType;
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

    /** GraphQL execution result — shape mirrors the graphql-java `ExecutionResult` structure. */
    export interface ExecutionResult<Data = unknown> {
        data?: Data;
        errors?: unknown[];
        extensions?: Record<string, unknown>;
    }

    /**
     * Runs a query against a schema. `variables` and `context` are optional at runtime;
     * omitted values are passed through to graphql-java as null.
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
     * Builds a Relay-style connection object type wrapping the given node type.
     * The connection is generated with `<NodeType>Connection` / `<NodeType>Edge` names
     * derived from `type.getName()`.
     */
    export function createConnectionType(
        schemaGenerator: SchemaGenerator,
        type: GraphQLObjectType
    ): GraphQLObjectType;

    /** Base64-encodes an opaque cursor value. */
    export function encodeCursor(value: string | number): string;

    /** Reverse of `encodeCursor`. */
    export function decodeCursor(value: string): string;
}

declare module "/lib/graphql-rx" {
    /**
     * Opaque handle backed by a graphql-java `PublishProcessor`. Push values via `onNext`,
     * close via `onComplete`, or fail via `onError`. Return one from a subscription resolver.
     */
    export interface PublishProcessor<T = unknown> {
        readonly _kind?: "PublishProcessor";
        onNext(value: T): void;
        onError(error: unknown): void;
        onComplete(): void;
    }

    /** Opaque handle backed by a graphql-java `Subscriber`. Wired to receive push updates. */
    export interface Subscriber<T = unknown> {
        readonly _kind?: "Subscriber";
    }

    export interface CreateSubscriberParams<T = unknown> {
        onNext?: (value: T) => void;
    }

    export function createPublishProcessor<T = unknown>(): PublishProcessor<T>;

    export function createSubscriber<T = unknown>(params: CreateSubscriberParams<T>): Subscriber<T>;
}

export {};
