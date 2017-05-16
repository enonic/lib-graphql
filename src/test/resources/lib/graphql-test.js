var graphQlLib = require('/lib/graphql');
var assert = require('/lib/xp/assert');

exports.test = function () {
    var database = {'0000-0000-0000-0001': {id: '0000-0000-0000-0001'}};
    var schema = createSchema(database);
    testCompleteQuery(schema);
    testShortQuery(schema);
    testMissingObjectQuery(schema);
    testInvalidSyntaxQuery(schema);
    testFailingQuery(schema);
    testMutation(schema);
};

function testCompleteQuery(schema) {
    var query = 'query($id:ID){getObject(id:$id){anId, anInteger, aFloat, aString, aBoolean, aList,anEnum, aRelatedObject{id}}}';
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
                anEnum: "secondValue",
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

function testFailingQuery(schema) {
    var query = '{getObject(id:"0000-0000-0000-0001"){anId, aFailingField}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        "data": {
            "getObject": {
                "anId": "0000-0000-0000-0001"
            }
        },
        "errors": [
            {
                "errorType": "DataFetchingException",
                "message": "Exception while fetching data: com.enonic.xp.resource.ResourceProblemException: Error while retrieving aFailingField",
                "exception": {
                    "name": "com.enonic.xp.resource.ResourceProblemException",
                    "message": "Error while retrieving aFailingField"
                }
            }
        ]
    }, result);
}

function testMutation(schema) {
    var query = 'mutation($id:ID!, $object: InputObjectType!){addObject(id:$id,object:$object){anId, anInteger, aFloat, aString, aBoolean, aList, aRelatedObject{id}}}';
    var result = graphQlLib.execute(schema, query, {id: '0000-0000-0000-0002', object: {id: '0000-0000-0000-0002'}});
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
                resolve: function (env) {
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
                    id: graphQlLib.nonNull(graphQlLib.GraphQLID),
                    object: graphQlLib.nonNull(createInputObjectType())
                },
                resolve: function (env) {
                    var id = env.args.id;
                    database[id] = env.args.object;
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
                resolve: function (env) {
                    return env.source.id;
                }
            },
            anInteger: {
                type: graphQlLib.GraphQLInt,
                resolve: function (env) {
                    return 1;
                }
            },
            aFloat: {
                type: graphQlLib.GraphQLFloat,
                resolve: function (env) {
                    return 1.0;
                }
            },
            aString: {
                type: graphQlLib.GraphQLString,
                resolve: function (env) {
                    return 'content';
                }
            },
            aBoolean: {
                type: graphQlLib.GraphQLBoolean,
                resolve: function (env) {
                    return false;
                }
            },
            aList: {
                type: graphQlLib.list(graphQlLib.GraphQLString),
                resolve: function (env) {
                    return ['first', 'second', 'third'];
                }
            },
            anEnum: {
                type: createEnumType(),
                resolve: function (env) {
                    return 'secondValue';
                }
            },
            aRelatedObject: {
                type: createSubObjectType(),
                resolve: function (env) {
                    return {
                        id: '0000-0000-0000-0002'
                    };
                }
            },
            aFailingField: {
                type: graphQlLib.GraphQLString,
                resolve: function (env) {
                    throw 'Error while retrieving aFailingField';
                }
            }
        }
    });
}

function createEnumType() {
    return graphQlLib.createEnumType({
        name: 'EnumType',
        values: {
            firstValue: 'firstValue',
            secondValue: 'secondValue'
        }
    });
}

function createSubObjectType() {
    return graphQlLib.createObjectType({
        name: 'SubObjectType',
        fields: {
            id: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLID),
                resolve: function (env) {
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

function createInputObjectType() {
    return graphQlLib.createInputObjectType({
        name: 'InputObjectType',
        description: 'An input object type.',
        fields: {
            id: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLID),
                resolve: function (env) {
                    return env.source.id;
                }
            }
        }
    });
}
