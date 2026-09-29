/**
 * Cursor and Relay-style connection helpers for `/lib/graphql`.
 *
 * ```js
 * var graphQlConnectionLib = require('/lib/graphql-connection');
 *
 * var personConnectionType = graphQlConnectionLib.createConnectionType(schemaGenerator, personType);
 * ```
 *
 * @module /lib/graphql-connection
 */

import {
    GraphQLBoolean,
    GraphQLInt,
    type GraphQLObjectType,
    GraphQLString,
    list,
    nonNull,
    type SchemaGenerator,
} from './graphql';

declare global {
    interface XpLibraries {
        '/lib/graphql-connection': typeof import('./graphql-connection');
    }
}

declare const Java: {
    type<T>(className: string): T;
};

/**
 * The value a resolver must return for a field whose type was created by `createConnectionType()`.
 */
export interface ConnectionSource<Node = unknown> {
    /** Total number of available items. */
    total: number;
    /** Zero-based index of the first item in `hits`. */
    start: number;
    /** Items in the current page. */
    hits: Node[];
}

interface Edge {
    node: unknown;
    cursor: number;
}

interface PageInfo {
    startCursor: number;
    endCursor: number;
    hasNext: boolean;
}

interface CursorHelper {
    encode(value: string): string;
    decode(value: string): string;
}

function createPageInfoType(schemaGenerator: SchemaGenerator): GraphQLObjectType {
    return schemaGenerator.createPageInfoObjectType<PageInfo>({
        name: 'PageInfo',
        fields: {
            startCursor: {
                type: nonNull(GraphQLString),
                resolve: (env) => encodeCursor(env.source.startCursor),
            },
            endCursor: {
                type: nonNull(GraphQLString),
                resolve: (env) => encodeCursor(env.source.endCursor),
            },
            hasNext: {
                type: nonNull(GraphQLBoolean),
                resolve: (env) => env.source.hasNext,
            },
        },
    });
}

function createEdgeType(schemaGenerator: SchemaGenerator, type: GraphQLObjectType): GraphQLObjectType {
    return schemaGenerator.createObjectType<Edge>({
        name: `${type.getName()}Edge`,
        fields: {
            node: {
                type: nonNull(type),
                resolve: (env) => env.source.node,
            },
            cursor: {
                type: nonNull(GraphQLString),
                resolve: (env) => encodeCursor(env.source.cursor),
            },
        },
    });
}

/**
 * Builds a Relay-style connection object type wrapping the given node type. Arguments are positional.
 * The connection and its edge are named `<NodeType>Connection` and `<NodeType>Edge` after
 * `type.getName()`, and the connection exposes the fields `totalCount`, `edges` and `pageInfo`.
 */
export function createConnectionType(schemaGenerator: SchemaGenerator, type: GraphQLObjectType): GraphQLObjectType {
    return schemaGenerator.createObjectType<ConnectionSource>({
        name: `${type.getName()}Connection`,
        fields: {
            totalCount: {
                type: nonNull(GraphQLInt),
                resolve: (env) => env.source.total,
            },
            edges: {
                type: list(createEdgeType(schemaGenerator, type)),
                resolve: (env) => {
                    const hits = env.source.hits;
                    const edges: Edge[] = [];
                    for (let i = 0; i < hits.length; i++) {
                        edges.push({
                            node: hits[i],
                            cursor: env.source.start + i,
                        });
                    }
                    return edges;
                },
            },
            pageInfo: {
                type: createPageInfoType(schemaGenerator),
                resolve: (env): PageInfo => {
                    const count = env.source.hits.length;
                    return {
                        startCursor: env.source.start,
                        endCursor: env.source.start + (count === 0 ? 0 : count - 1),
                        hasNext: env.source.start + count < env.source.total,
                    };
                },
            },
        },
    });
}

/** Base64-encodes a cursor value. The value is coerced with `String()`; typically a start offset. */
export function encodeCursor(value: unknown): string {
    return Java.type<CursorHelper>('com.enonic.lib.graphql.CursorHelper').encode(String(value));
}

/** Reverse of `encodeCursor`. Always returns a string — `parseInt` it before arithmetic. */
export function decodeCursor(value: string): string {
    return Java.type<CursorHelper>('com.enonic.lib.graphql.CursorHelper').decode(String(value));
}
