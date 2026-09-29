/**
 * GraphQL Library for Enonic XP.
 *
 * Builds application-specific GraphQL schemas from JavaScript and executes operations against them.
 * Targets XP 8+.
 *
 * ```js
 * var graphQlLib = require('/lib/graphql');
 *
 * var schemaGenerator = graphQlLib.newSchemaGenerator();
 * var schema = schemaGenerator.createSchema({
 *     query: schemaGenerator.createObjectType({
 *         name: 'Query',
 *         fields: {
 *             hello: { type: graphQlLib.GraphQLString, resolve: function () { return 'world'; } },
 *         },
 *     }),
 * });
 *
 * var result = graphQlLib.execute({ schema: schema, query: '{ hello }' });
 * ```
 *
 * @module /lib/graphql
 */

import type { ScriptValue } from '@enonic-types/core';

declare global {
    interface XpLibraries {
        '/lib/graphql': typeof import('./graphql');
    }
}

declare const Java: {
    type<T>(className: string): T;
};

// Opaque handles to graphql-java objects. The `_kind` brand is nominal and never observed at runtime.

export interface GraphQLType {
    readonly _kind?: string;
}

export interface GraphQLScalarType extends GraphQLType {
    readonly _kind?: 'Scalar';
}

export interface GraphQLObjectType extends GraphQLType {
    readonly _kind?: 'Object';
    /** Returns the type's declared `name`. */
    getName(): string;
}

export interface GraphQLInputObjectType extends GraphQLType {
    readonly _kind?: 'InputObject';
}

export interface GraphQLInterfaceType extends GraphQLType {
    readonly _kind?: 'Interface';
}

export interface GraphQLUnionType extends GraphQLType {
    readonly _kind?: 'Union';
}

export interface GraphQLEnumType extends GraphQLType {
    readonly _kind?: 'Enum';
}

export interface GraphQLTypeReference extends GraphQLType {
    readonly _kind?: 'Reference';
}

/** Opaque schema handle produced by `createSchema` and consumed by `execute`. */
export interface GraphQLSchema {
    readonly _kind?: 'Schema';
}

/**
 * Environment passed to every output-field `resolve` function.
 * Contains exactly three keys: `source`, `args` and `context`.
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
    Context = unknown,
> = ResolverEnvironment<Source, Args, Context>;

/**
 * A fixed (non-function) resolver value. Kept separate from the function form so resolver
 * signatures stay checked instead of collapsing to `unknown`.
 */
export type ResolvedValue = string | number | boolean | null | unknown[] | Record<string, unknown>;

/**
 * Defines a field on an object type. When `resolve` is absent, the runtime reads a property with
 * the field's name from `env.source`. It may also be a fixed value instead of a function.
 *
 * A subscription field's resolver returns a publisher (see `PublishProcessor` and `Flowable` in
 * `/lib/graphql-rx`).
 */
export interface OutputField<Source = unknown, Context = unknown> {
    type: GraphQLType;
    /** Map of argument names to GraphQL input types. */
    args?: Record<string, GraphQLType>;
    // biome-ignore lint/suspicious/noExplicitAny: lets a resolver annotate `env.args` with its own interface without a cast
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

export type GraphQLFieldMap<Source = unknown, Context = unknown> = Record<string, OutputField<Source, Context>>;

export type GraphQLInterfaceFieldMap = Record<string, InterfaceField>;

export type GraphQLInputFieldMap = Record<string, InputField>;

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
    interfaces?: (GraphQLInterfaceType | GraphQLTypeReference)[];
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
     * Must return an already-defined object type, not a reference.
     */
    typeResolver: (source: Source) => GraphQLObjectType;
}

export interface CreateUnionTypeParams<Source = unknown> {
    name: string;
    /** Possible types of the union. Must be non-empty. */
    types: (GraphQLObjectType | GraphQLTypeReference)[];
    typeResolver: (source: Source) => GraphQLObjectType;
    description?: string;
}

/**
 * Enum values are either a `string[]` (name === value) or a `Record<string, unknown>` mapping each
 * enum name to its backing value.
 */
export interface CreateEnumTypeParams {
    name: string;
    values: string[] | Record<string, unknown>;
    description?: string;
}

export interface SchemaGenerator {
    createSchema(params: CreateSchemaParams): GraphQLSchema;
    createObjectType<Source = unknown, Context = unknown>(
        params: CreateObjectTypeParams<Source, Context>,
    ): GraphQLObjectType;
    createInputObjectType(params: CreateInputObjectTypeParams): GraphQLInputObjectType;
    createInterfaceType<Source = unknown>(params: CreateInterfaceTypeParams<Source>): GraphQLInterfaceType;
    createUnionType<Source = unknown>(params: CreateUnionTypeParams<Source>): GraphQLUnionType;
    createEnumType(params: CreateEnumTypeParams): GraphQLEnumType;
    /**
     * Like `createObjectType`, but cached per generator: later calls on the same generator return
     * the type created by the first call.
     */
    createPageInfoObjectType<Source = unknown, Context = unknown>(
        params: CreateObjectTypeParams<Source, Context>,
    ): GraphQLObjectType;
}

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
 * For a subscription operation, `data` is a publisher rather than an object — type it with
 * `execute<Flowable>(...)` using `Flowable` from `/lib/graphql-rx`, then call `data.subscribe(...)`.
 */
export interface ExecutionResult<Data = unknown> {
    data?: Data;
    errors?: ExecutionError[];
}

/** Parameters of `execute()`. */
export interface ExecuteParams {
    /** Schema created with `schemaGenerator.createSchema()`. */
    schema: GraphQLSchema;
    /** GraphQL query, mutation, or subscription document. */
    query: string;
    /** Values for variables declared by the operation. */
    variables?: Record<string, unknown>;
    /** Application-specific value exposed to resolvers as `env.context`. */
    context?: unknown;
    /**
     * Maximum nesting depth, as a positive integer. Deeper queries are rejected with
     * `MaxQueryDepthExceeded`. Defaults to 100.
     */
    maxDepth?: number;
    /**
     * Maximum number of fields, as a positive integer. A fragment's fields count every time the
     * fragment is used. Larger queries are rejected with `MaxQueryFieldsExceeded`. Defaults to 100000.
     */
    maxFieldsCount?: number;
}

interface GraphQLHandler {
    list(type: GraphQLType): GraphQLType;
    nonNull(type: GraphQLType): GraphQLType;
    reference(typeKey: string): GraphQLTypeReference;
    execute(
        schema: GraphQLSchema,
        query: string,
        variables: ScriptValue | null,
        context: unknown,
        maxDepth: number | null,
        maxFieldsCount: number | null,
    ): ExecutionResult;
}

interface GraphQlBean {
    createSchema(
        query: GraphQLObjectType,
        mutation: GraphQLObjectType | null,
        subscription: GraphQLObjectType | null,
        dictionary: GraphQLObjectType[] | null,
    ): GraphQLSchema;
    createPageInfoObjectType(
        name: string,
        fields: ScriptValue,
        interfaces: ScriptValue | null,
        description: string | null,
    ): GraphQLObjectType;
    createObjectType(
        name: string,
        fields: ScriptValue,
        interfaces: ScriptValue | null,
        description: string | null,
    ): GraphQLObjectType;
    createInputObjectType(name: string, fields: ScriptValue, description: string | null): GraphQLInputObjectType;
    createInterfaceType(
        name: string,
        fields: ScriptValue,
        typeResolver: ScriptValue,
        description: string | null,
    ): GraphQLInterfaceType;
    createUnionType(
        name: string,
        types: ScriptValue,
        typeResolver: ScriptValue,
        description: string | null,
    ): GraphQLUnionType;
    createEnumType(name: string, values: ScriptValue, description: string | null): GraphQLEnumType;
}

type ScalarNames = 'GraphQLInt' | 'GraphQLFloat' | 'GraphQLString' | 'GraphQLBoolean' | 'GraphQLID';
type ExtendedScalarNames = 'Date' | 'DateTime' | 'Time' | 'Json';
type CustomScalarNames = 'LocalDateTime' | 'LocalTime';

const graphQLHelper = __.newBean<GraphQLHandler>('com.enonic.lib.graphql.GraphQLHandler');

const Scalars = Java.type<Record<ScalarNames, GraphQLScalarType>>('graphql.Scalars');
export const GraphQLInt = Scalars.GraphQLInt;
export const GraphQLFloat = Scalars.GraphQLFloat;
export const GraphQLString = Scalars.GraphQLString;
export const GraphQLBoolean = Scalars.GraphQLBoolean;
export const GraphQLID = Scalars.GraphQLID;

const ExtendedScalars = Java.type<Record<ExtendedScalarNames, GraphQLScalarType>>('graphql.scalars.ExtendedScalars');
/**
 * Extended `Date` scalar. A named import (`import { Date } from '/lib/graphql'`) shadows the global
 * `Date` object in that file.
 */
const DateScalar = ExtendedScalars.Date;

export { DateScalar as Date };
export const DateTime = ExtendedScalars.DateTime;
export const Time = ExtendedScalars.Time;
export const Json = ExtendedScalars.Json;

const CustomScalars = Java.type<Record<CustomScalarNames, GraphQLScalarType>>('com.enonic.lib.graphql.CustomScalars');
export const LocalDateTime = CustomScalars.LocalDateTime;
export const LocalTime = CustomScalars.LocalTime;

export function newSchemaGenerator(): SchemaGenerator {
    const graphQlBean = __.newBean<GraphQlBean>('com.enonic.lib.graphql.GraphQlBean');

    return {
        createSchema: (params) => {
            const query = required(params, 'query');
            const mutation = optional(params, 'mutation');
            const subscription = optional(params, 'subscription');
            const dictionary = optional(params, 'dictionary');
            return graphQlBean.createSchema(query, mutation, subscription, dictionary);
        },

        createPageInfoObjectType: (params) => {
            const name = required(params, 'name');
            const fields = required(params, 'fields');
            forEachAttribute(fields, (field) => {
                required(field, 'type');
            });
            const interfaces = optional(params, 'interfaces');
            const description = optional(params, 'description');
            return graphQlBean.createPageInfoObjectType(
                name,
                __.toScriptValue(fields),
                __.toScriptValue(interfaces),
                description,
            );
        },

        createObjectType: (params) => {
            const name = required(params, 'name');
            const fields = required(params, 'fields');
            forEachAttribute(fields, (field) => {
                required(field, 'type');
            });
            const interfaces = optional(params, 'interfaces');
            const description = optional(params, 'description');
            return graphQlBean.createObjectType(
                name,
                __.toScriptValue(fields),
                __.toScriptValue(interfaces),
                description,
            );
        },

        createInputObjectType: (params) => {
            const name = required(params, 'name');
            const fields = required(params, 'fields');
            forEachAttribute(fields, (field) => {
                required(field, 'type');
            });
            const description = optional(params, 'description');
            return graphQlBean.createInputObjectType(name, __.toScriptValue(fields), description);
        },

        createInterfaceType: (params) => {
            const name = required(params, 'name');
            const fields = required(params, 'fields');
            forEachAttribute(fields, (field) => {
                required(field, 'type');
            });
            const typeResolver = required(params, 'typeResolver');
            const description = optional(params, 'description');
            return graphQlBean.createInterfaceType(
                name,
                __.toScriptValue(fields),
                __.toScriptValue(typeResolver),
                description,
            );
        },

        createUnionType: (params) => {
            const name = required(params, 'name');
            const types = required(params, 'types');
            if (types == null || types.length === 0) {
                throw "Value 'types' is required and cannot be empty";
            }
            const typeResolver = required(params, 'typeResolver');
            const description = optional(params, 'description');
            return graphQlBean.createUnionType(
                name,
                __.toScriptValue(types),
                __.toScriptValue(typeResolver),
                description,
            );
        },

        createEnumType: (params) => {
            const name = required(params, 'name');
            const values = required(params, 'values');
            const description = optional(params, 'description');
            return graphQlBean.createEnumType(name, __.toScriptValue(values), description);
        },
    };
}

/** Wraps a type to indicate a list of that type (`[T]`). */
export function list(type: GraphQLType): GraphQLType {
    return graphQLHelper.list(type);
}

/** Wraps a type to indicate a non-null occurrence (`T!`). */
export function nonNull(type: GraphQLType): GraphQLType {
    return graphQLHelper.nonNull(type);
}

/** Placeholder for a type identified by name — resolved when the schema is assembled. */
export function reference(typeKey: string): GraphQLTypeReference {
    return graphQLHelper.reference(typeKey);
}

const GraphQLSchemaClass = Java.type<new () => GraphQLSchema>('graphql.schema.GraphQLSchema');
const MAX_INTEGER = Java.type<{ MAX_VALUE: number }>('java.lang.Integer').MAX_VALUE;

/** Runs a GraphQL operation against a schema. */
export function execute<Data = unknown>(params: ExecuteParams): ExecutionResult<Data>;
/**
 * Runs a GraphQL operation against a schema. Arguments are positional; `variables` and `context` are
 * optional. Query limits are only available in the params form.
 *
 * @deprecated Use `execute({schema, query, variables, context})`. The positional form will be removed
 * in the next major version.
 */
export function execute<Data = unknown>(
    schema: GraphQLSchema,
    query: string,
    variables?: Record<string, unknown>,
    context?: unknown,
): ExecutionResult<Data>;
export function execute<Data = unknown>(
    params: ExecuteParams | GraphQLSchema,
    query?: string,
    variables?: Record<string, unknown>,
    context?: unknown,
): ExecutionResult<Data> {
    if (params instanceof GraphQLSchemaClass) {
        return executeOperation(params, query as string, variables, context, null, null);
    }
    return executeWithParams(params);
}

function executeWithParams<Data>(params: ExecuteParams): ExecutionResult<Data> {
    if (params == null || typeof params !== 'object') {
        throw "Value 'params' must be an object or a schema created with createSchema()";
    }
    const schema = params.schema;
    if (!(schema instanceof GraphQLSchemaClass)) {
        throw "Value 'schema' is required and must be a schema created with createSchema()";
    }
    const query = params.query;
    if (typeof query !== 'string') {
        throw "Value 'query' is required and must be a string";
    }
    const variables = optional(params, 'variables');
    const context = optional(params, 'context');
    const maxDepth = optionalPositiveInteger(params, 'maxDepth');
    const maxFieldsCount = optionalPositiveInteger(params, 'maxFieldsCount');
    return executeOperation(schema, query, variables, context, maxDepth, maxFieldsCount);
}

function executeOperation<Data>(
    schema: GraphQLSchema,
    query: string,
    variables: Record<string, unknown> | null | undefined,
    context: unknown,
    maxDepth: number | null,
    maxFieldsCount: number | null,
): ExecutionResult<Data> {
    return __.toNativeObject(
        graphQLHelper.execute(schema, query, __.toScriptValue(variables), context, maxDepth, maxFieldsCount),
    ) as ExecutionResult<Data>;
}

function required<T, K extends keyof T>(params: T, name: K): Exclude<T[K], undefined> {
    const value = params[name];
    if (value === undefined) {
        log.error(`error:${JSON.stringify(params)}`);
        throw `Value '${String(name)}' is required`;
    }
    return value as Exclude<T[K], undefined>;
}

function optional<T, K extends keyof T>(params: T, name: K): Exclude<T[K], undefined> | null {
    const value = params[name];
    return value === undefined ? null : (value as Exclude<T[K], undefined>);
}

function optionalPositiveInteger(params: ExecuteParams, name: 'maxDepth' | 'maxFieldsCount'): number | null {
    const value = optional(params, name);
    if (value === null) {
        return null;
    }
    if (typeof value !== 'number' || Math.floor(value) !== value || value < 1 || value > MAX_INTEGER) {
        throw `Value '${name}' must be a positive integer`;
    }
    return value;
}

function forEachAttribute<T>(object: Record<string, T> | null | undefined, callback: (value: T) => void): void {
    if (object) {
        for (const fieldName in object) {
            if (object[fieldName]) {
                callback(object[fieldName]);
            }
        }
    }
}
