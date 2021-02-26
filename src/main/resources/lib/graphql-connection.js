var graphQlLib = require('./graphql');

function createPageInfoType(schemaGenerator) {
    return schemaGenerator.createPageInfoObjectType({
        name: 'PageInfo',
        fields: {
            startCursor: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLString),
                resolve: function (env) {
                    return exports.encodeCursor(env.source.startCursor);
                }
            },
            endCursor: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLString),
                resolve: function (env) {
                    return exports.encodeCursor(env.source.endCursor);
                }
            },
            hasNext: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLBoolean),
                resolve: function (env) {
                    return env.source.hasNext;
                }
            }
        }
    });
}

function createEdgeType(schemaGenerator, type) {
    return schemaGenerator.createObjectType({
        name: type.getName() + 'Edge',
        fields: {
            node: {
                type: graphQlLib.nonNull(type),
                resolve: function (env) {
                    return env.source.node;
                }
            },
            cursor: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLString),
                resolve: function (env) {
                    return exports.encodeCursor(env.source.cursor);
                }
            }
        }
    });
}

exports.createConnectionType = function (schemaGenerator, type) {
    return schemaGenerator.createObjectType({
        name: type.getName() + 'Connection',
        fields: {
            totalCount: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
                resolve: function (env) {
                    return env.source.total;
                }
            },
            edges: {
                type: graphQlLib.list(createEdgeType(schemaGenerator, type)),
                resolve: function (env) {
                    var hits = env.source.hits;
                    var edges = [];
                    for (var i = 0; i < hits.length; i++) {
                        edges.push({
                            node: hits[i],
                            cursor: env.source.start + i
                        });
                    }
                    return edges;
                }
            },
            pageInfo: {
                type: createPageInfoType(schemaGenerator),
                resolve: function (env) {
                    var count = env.source.hits.length;
                    return {
                        startCursor: env.source.start,
                        endCursor: env.source.start + (count === 0 ? 0 : (count - 1)),
                        hasNext: (env.source.start + count) < env.source.total
                    }
                }
            }
        }
    });
};

exports.encodeCursor = function(value) {
    return Java.type('com.enonic.lib.graphql.CursorHelper').encode(value);
};

exports.decodeCursor = function(value) {
    return Java.type('com.enonic.lib.graphql.CursorHelper').decode(value);
};
