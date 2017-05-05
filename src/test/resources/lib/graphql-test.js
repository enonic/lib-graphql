var graphQlLib = require('/lib/graphql');
var assert = require('/lib/xp/assert');

exports.test = function () {
    var schema = createSchema();
    var completeQuery = 'query($id:ID){getObject(id:$id){anId, anInteger, aFloat, aString, aBoolean, aList, aRelatedObject{id}}}';
    var completeResult = graphQlLib.execute(schema, completeQuery, {id: '0000-0000-0000-0001'});
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
    }, completeResult);


    var shortQuery = 'query{getObject(id:"0000-0000-0000-0001"){anId}}';
    var shortResult = graphQlLib.execute(schema, shortQuery, {id: '0000-0000-0000-0001'});
    assert.assertJsonEquals({
        data: {
            getObject: {
                anId: '0000-0000-0000-0001'
            }
        }
    }, shortResult);


    var nullQuery = 'query{getObject(id:"0000-0000-0000-0002"){anId}}';
    var nullResult = graphQlLib.execute(schema, nullQuery);
    assert.assertJsonEquals({
        data: {}
    }, nullResult);


    var customExceptionQuery = 'query{getObject{anId}}';
    var customExceptionResult = graphQlLib.execute(schema, customExceptionQuery);
    assert.assertJsonEquals({
        "data": {},
        "errors": [
            {
                "errorType": "DataFetchingException",
                "message": "Exception while fetching data: com.enonic.xp.resource.ResourceProblemException: [id] must be specified",
                "exception": {
                    "name": "com.enonic.xp.resource.ResourceProblemException",
                    "message": "[id] must be specified"
                }
            }
        ]
    }, customExceptionResult);


    var syntaxExceptionQuery = 'query{getObjects{anId}}';
    var syntaxExceptionResult = graphQlLib.execute(schema, syntaxExceptionQuery);
    assert.assertJsonEquals({
        "errors": [
            {
                "errorType": "ValidationError",
                "message": "Validation error of type FieldUndefined: Field getObjects is undefined",
                "locations": [
                    {
                        "line": 1,
                        "column": 7
                    }
                ],
                "validationErrorType": "FieldUndefined"
            }
        ]
    }, syntaxExceptionResult);
};

function createSchema() {
    return graphQlLib.createSchema({
        query: createRootQueryType()//,
        //mutation: createRootMutationType()
    });
}

function createRootQueryType() {
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
                    if (id) {
                        return id === '0000-0000-0000-0001' ? {id: '0000-0000-0000-0001'} : null;
                    }
                    throw "[id] must be specified";
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
