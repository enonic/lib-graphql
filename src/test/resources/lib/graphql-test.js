var graphQlLib = require('/lib/graphql');
var graphQlConnectionLib = require('/lib/graphql-connection');
var assert = require('/lib/xp/assert');

exports.test = function () {
    var database = {
        map: {
            '0000-0000-0000-0001': {id: '0000-0000-0000-0001'}
        },
        array: ['0000-0000-0000-0001']
    };
    var schema = createSchema(database);
    testShortQuery(schema);
    testCompleteQuery(schema);
    testShortConnection(schema);
    testInterface(schema);
    testUnion(schema);
    testConnection(schema);
    testMissingObjectQuery(schema);
    testInvalidSyntaxQuery(schema);
    testFailingQuery(schema);
    testMutation(schema);
};

function testShortQuery(schema) {
    var query = '{getObject(id:"0000-0000-0000-0001"){id}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        data: {
            getObject: {
                id: '0000-0000-0000-0001'
            }
        }
    }, result);
}

function testCompleteQuery(schema) {
    var query = 'query($id:ID){getObject(id:$id){id, anInteger, aFloat, aString, aBoolean, aList,anEnum, aRelatedObject{id}}}';
    var result = graphQlLib.execute(schema, query, {id: '0000-0000-0000-0001'});
    assert.assertJsonEquals({
        data: {
            getObject: {
                id: '0000-0000-0000-0001',
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

function testMissingObjectQuery(schema) {
    var query = '{getObject(id:"0000-0000-0000-0002"){id}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        data: {}
    }, result);
}

function testShortConnection(schema) {
    var query = '{getObjectConnection{edges{node{id}}}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        data: {
            getObjectConnection: {
                edges: [
                    {
                        node: {
                            id: "0000-0000-0000-0001"
                        }
                    }
                ]
            }
        }
    }, result);
}

function testInterface(schema) {
    var query = '{getInterface(id:"0000-0000-0000-0001"){id}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        data: {
            getInterface: {
                id: '0000-0000-0000-0001'
            }
        }
    }, result);
}

function testUnion(schema) {
    var query = '{getUnion(id:"0000-0000-0000-0001"){... on ObjectType{id}}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        data: {
            getUnion: {
                id: '0000-0000-0000-0001'
            }
        }
    }, result);
}


function testConnection(schema) {
    var query = '{getObjectConnection(first:1){ totalCount,edges{node{id},cursor},pageInfo{startCursor,endCursor,hasNext}}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        data: {
            getObjectConnection: {
                totalCount: 1,
                edges: [
                    {
                        node: {
                            id: "0000-0000-0000-0001"
                        },
                        cursor: "MA=="
                    }
                ],
                pageInfo: {
                    startCursor: "MA==",
                    endCursor: "MA==",
                    hasNext: false
                }
            }
        }
    }, result);
}

function testInvalidSyntaxQuery(schema) {
    var query = '{getObject(id:"0000-0000-0000-0001"){id, aMissingField}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        "errors": [
            {
                "errorType": "ValidationError",
                "message": "Validation error of type FieldUndefined: Field aMissingField is undefined",
                "locations": [
                    {
                        "line": 1,
                        "column": 42
                    }
                ],
                "validationErrorType": "FieldUndefined"
            }
        ]
    }, result);
}

function testFailingQuery(schema) {
    var query = '{getObject(id:"0000-0000-0000-0001"){id, aFailingField}}';
    var result = graphQlLib.execute(schema, query);
    assert.assertJsonEquals({
        "data": {
            "getObject": {
                "id": "0000-0000-0000-0001"
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
    var query = 'mutation($id:ID!, $object: InputObjectType!){addObject(id:$id,object:$object){id, anInteger, aFloat, aString, aBoolean, aList, aRelatedObject{id}}}';
    var result = graphQlLib.execute(schema, query, {id: '0000-0000-0000-0002', object: {id: '0000-0000-0000-0002'}});
    assert.assertJsonEquals({
        data: {
            addObject: {
                id: '0000-0000-0000-0002',
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
        mutation: createRootMutationType(database),
        dictionary: [createSubObjectType()]
    });
}

var objectType;
function createRootQueryType(database) {
    objectType = createObjectType();
    return graphQlLib.createObjectType({
        name: 'Query',
        fields: {
            getInterface: {
                type: graphQlLib.reference('InterfaceType'),
                args: {
                    id: graphQlLib.GraphQLID
                },
                resolve: function (env) {
                    var id = env.args.id;
                    return database.map[id];
                }
            },
            getUnion: {
                type: createUnionType(),
                args: {
                    id: graphQlLib.GraphQLID
                },
                resolve: function (env) {
                    var id = env.args.id;
                    return database.map[id];
                }
            },
            getObject: {
                type: objectType,
                args: {
                    id: graphQlLib.GraphQLID
                },
                resolve: function (env) {
                    var id = env.args.id;
                    return database.map[id];
                }
            },
            getObjectConnection: {
                type: graphQlConnectionLib.createConnectionType(objectType),
                args: {
                    after: graphQlLib.GraphQLString,
                    first: graphQlLib.GraphQLInt
                },
                resolve: function (env) {
                    var start = (env.args.after && parseInt(graphQlConnectionLib.decodeCursor(env.args.after))) || 0;
                    var first = env.args.first;
                    var objectKeys = first ? database.array.slice(start, start + first) : database.array.slice(start);
                    return {
                        total: database.array.length,
                        start: start,
                        hits: objectKeys.map(function (key) {
                            return database.map[key];
                        })
                    };
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
                    database.map[id] = env.args.object;
                    database.array.push(id);
                    return database.map[id];
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
            id: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLID)
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
                type: graphQlLib.reference('SubObjectType'),
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
        typeResolver: function () {
            return objectType
        },
        description: 'An interface type.',
        fields: {
            id: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLID)
            }
        }
    });
}

function createUnionType() {
    return graphQlLib.createUnionType({
        name: 'UnionType',
        typeResolver: function () {
            return objectType
        },
        description: 'A union type.',
        types: [objectType]
    });
}

function createInputObjectType() {
    return graphQlLib.createInputObjectType({
        name: 'InputObjectType',
        description: 'An input object type.',
        fields: {
            id: {
                type: graphQlLib.nonNull(graphQlLib.GraphQLID)
            }
        }
    });
}
