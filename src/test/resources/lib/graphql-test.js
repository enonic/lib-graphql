var graphQlLib = require('/lib/graphql');
var assert = require('/lib/xp/assert');

exports.test = function () {
    var database = {'0000-0000-0000-0001': {id: '0000-0000-0000-0001'}};
    var schema = createSchema(database);
    testCompleteQuery(schema);
    testShortQuery(schema);
    testMissingObjectQuery(schema);
    testInvalidSyntaxQuery(schema);
    testMutation(schema);
};

function testCompleteQuery(schema) {
    var query = 'query($id:ID){getObject(id:$id){anId, anInteger, aFloat, aString, aBoolean, aList, aRelatedObject{id}}}';
    var result = graphQlLib.execute(schema, query, {id: '0000-0000-0000-0001'});
    assert.assertJsonEquals({
        data: {
            getObject: {
                anId: '0000-0000-0000-0001',
                anInteger: 1,
                aFloat: 1.0,
                aString: 'content',
                aBoolean: false,
                aList: [
                    "first",
                    "second",
                    "third"
                ],
                aRelatedObject: {
                    id: "0000-0000-0000-0002"
                }
            }
        }
    }, result);
}

function testShortQuery(schema) {
    var query = '{getObject(id:"0000-0000-0000-0001"){anId}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        data: {
            getObject: {
                anId: '0000-0000-0000-0001'
            }
        }
    }, result);
}

function testMissingObjectQuery(schema) {
    var query = '{getObject(id:"0000-0000-0000-0002"){anId}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        data: {}
    }, result);
}

function testInvalidSyntaxQuery(schema) {
    var query = '{getObject(id:"0000-0000-0000-0001"){anId, aMissingField}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        "errors": [
            {
                "errorType": "ValidationError",
                "message": "Validation error of type FieldUndefined: Field aMissingField is undefined",
                "locations": [
                    {
                        "line": 1,
                        "column": 44
                    }
                ],
                "validationErrorType": "FieldUndefined"
            }
        ]
    }, result);
}

function testMutation(schema) {
    var query = 'mutation($id:ID){addObject(id:$id){anId, anInteger, aFloat, aString, aBoolean, aList, aRelatedObject{id}}}';
    var result = graphQlLib.execute(schema, query, {id: '0000-0000-0000-0002'});
    assert.assertJsonEquals({
        data: {
            addObject: {
                anId: '0000-0000-0000-0002',
                anInteger: 1,
                aFloat: 1.0,
                aString: 'content',
                aBoolean: false,
                aList: [
                    "first",
                    "second",
                    "third"
                ],
                aRelatedObject: {
                    id: "0000-0000-0000-0002"
                }
            }
        }
    }, result);
}

function createSchema(database) {
    return graphQlLib.createSchema({
        query: createRootQueryType(database),
        mutation: createRootMutationType(database)
    });
}

function createRootQueryType(database) {
    return graphQlLib.createObjectType({
        name: 'Query',
        fields: {
            getObject: {
                type: createObjectType(),
                args: {
                    id: graphQlLib.GraphQLID
                },
                data: function (env) {
                    var id = env.args.id;
                    return database[id];
                }
            }
        }
    });
}

function createRootMutationType(database) {
    return graphQlLib.createObjectType({
        name: 'Mutation',
        fields: {
            addObject: {
                type: createObjectType(),
                args: {
                    id: graphQlLib.GraphQLID
                },
                data: function (env) {
                    log.info('Test:' + JSON.stringify(env));
                    var id = env.args.id;
                    database[id] = {id: id};
                    return database[id];
                }
            }
        }
    });
}

function createObjectType() {
    return graphQlLib.createObjectType({
        name: 'ObjectType',
        description: 'An object type.',
        interfaces: [createInterfaceType()],
        fields: {
            anId: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLID),
                data: function (env) {
                    return env.source.id;
                }
            },
            anInteger: {
                type: graphQlLib.GraphQLInt,
                data: function (env) {
                    return 1;
                }
            },
            aFloat: {
                type: graphQlLib.GraphQLFloat,
                data: function (env) {
                    return 1.0;
                }
            },
            aString: {
                type: graphQlLib.GraphQLString,
                data: function (env) {
                    return 'content';
                }
            },
            aBoolean: {
                type: graphQlLib.GraphQLBoolean,
                data: function (env) {
                    return false;
                }
            },
            aList: {
                type: graphQlLib.list(graphQlLib.GraphQLString),
                data: function (env) {
                    return ['first', 'second', 'third'];
                }
            },
            aRelatedObject: {
                type: createSubObjectType(),
                data: function (env) {
                    return {
                        id: '0000-0000-0000-0002'
                    };
                }
            }
        }
    });
}

function createSubObjectType() {
    return graphQlLib.createObjectType({
        name: 'SubObjectType',
        fields: {
            id: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLID),
                data: function (env) {
                    return env.source.id;
                }
            }
        }
    });
}

function createInterfaceType() {
    return graphQlLib.createInterfaceType({
        name: 'InterfaceType',
        description: 'An interface type.',
        fields: {
            anId: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLID)
            }
        }
    });
}
