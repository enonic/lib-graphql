// Tests for the params form of execute() and its per-execution query limits.

var graphQlLib = require('/lib/graphql');
var graphQlRxLib = require('/lib/graphql-rx');
var assert = require('/lib/xp/testing');

var schemaGenerator = graphQlLib.newSchemaGenerator();

var nodeType = schemaGenerator.createObjectType({
    name: 'Node',
    fields: {
        value: {
            type: graphQlLib.GraphQLString,
            resolve: function () {
                return 'leaf';
            }
        },
        child: {
            type: graphQlLib.reference('Node'),
            resolve: function () {
                return {};
            }
        }
    }
});

var rootQueryType = schemaGenerator.createObjectType({
    name: 'Query',
    fields: {
        node: {
            type: nodeType,
            resolve: function () {
                return {};
            }
        },
        greeting: {
            type: graphQlLib.GraphQLString,
            args: {
                name: graphQlLib.GraphQLString
            },
            resolve: function (env) {
                return 'Hello, ' + env.args.name + ' from ' + env.context.origin;
            }
        }
    }
});

var rootSubscriptionType = schemaGenerator.createObjectType({
    name: 'Subscription',
    fields: {
        onNode: {
            type: nodeType,
            resolve: function () {
                return graphQlRxLib.createPublishProcessor();
            }
        }
    }
});

var schema = schemaGenerator.createSchema({
    query: rootQueryType,
    subscription: rootSubscriptionType
});

exports.test = function () {
    testParamsFormMatchesPositionalForm();
    testPositionalFormIgnoresExtraArguments();
    testDepthWithinLimit();
    testDepthExceeded();
    testFieldsWithinLimit();
    testFieldsExceeded();
    testFragmentFieldsCountedAtEachSpread();
    testOmittedLimitKeepsDefault();
    testDefaultDepthLimitWithoutOptions();
    testSubscriptionRejectedByLimit();
    testBadFaithIntrospectionErrorShape();
    testFullIntrospectionNeedsDepth13();
    testInvalidFirstArgument();
    testInvalidParams();
    testInvalidLimits();
};

// Builds `{ node { child { child { ... value } } } }` where `value` sits at the given depth.
function nestedQuery(depth) {
    var open = '{ node {';
    var close = '} }';
    for (var i = 2; i < depth; i++) {
        open += ' child {';
        close = '} ' + close;
    }
    return open + ' value ' + close;
}

function assertSingleError(result, errorType, validationErrorType) {
    assert.assertEquals(undefined, result.data);
    assert.assertEquals(1, result.errors.length);
    assert.assertEquals(errorType, result.errors[0].errorType);
    assert.assertEquals(validationErrorType, result.errors[0].validationErrorType);
}

function assertValidationError(result, validationErrorType) {
    assertSingleError(result, 'ValidationError', validationErrorType);
}

function testParamsFormMatchesPositionalForm() {
    var query = 'query($name:String){greeting(name:$name)}';
    var variables = {name: 'Ada'};
    var context = {origin: 'test'};

    var expected = {data: {greeting: 'Hello, Ada from test'}};
    assert.assertJsonEquals(expected, graphQlLib.execute(schema, query, variables, context));
    assert.assertJsonEquals(expected, graphQlLib.execute({
        schema: schema,
        query: query,
        variables: variables,
        context: context
    }));
}

function testPositionalFormIgnoresExtraArguments() {
    var result = graphQlLib.execute(schema, nestedQuery(3), null, null, {maxDepth: 1});
    assert.assertJsonEquals({data: {node: {child: {value: 'leaf'}}}}, result);
}

function testDepthWithinLimit() {
    var result = graphQlLib.execute({schema: schema, query: nestedQuery(3), maxDepth: 3});
    assert.assertJsonEquals({data: {node: {child: {value: 'leaf'}}}}, result);
}

function testDepthExceeded() {
    var result = graphQlLib.execute({schema: schema, query: nestedQuery(4), maxDepth: 3});
    assertValidationError(result, 'MaxQueryDepthExceeded');
}

function testFieldsWithinLimit() {
    var result = graphQlLib.execute({schema: schema, query: '{ node { value child { value } } }', maxFieldsCount: 4});
    assert.assertJsonEquals({data: {node: {value: 'leaf', child: {value: 'leaf'}}}}, result);
}

function testFieldsExceeded() {
    var result = graphQlLib.execute({schema: schema, query: '{ node { value child { value } } }', maxFieldsCount: 3});
    assertValidationError(result, 'MaxQueryFieldsExceeded');
}

function testFragmentFieldsCountedAtEachSpread() {
    // `node` and `child` plus three fragment fields at each of the two spreads: 8 fields, not 5.
    var query = '{ node { ...NodeFields child { ...NodeFields } } } fragment NodeFields on Node { value child { value } }';

    var result = graphQlLib.execute({schema: schema, query: query, maxFieldsCount: 7});
    assertValidationError(result, 'MaxQueryFieldsExceeded');

    assert.assertNotNull(graphQlLib.execute({schema: schema, query: query, maxFieldsCount: 8}).data);
}

function testOmittedLimitKeepsDefault() {
    // Only the field count is limited, so the depth must still be capped by the default of 100.
    var result = graphQlLib.execute({schema: schema, query: nestedQuery(101), maxFieldsCount: 1000});
    assertValidationError(result, 'MaxQueryDepthExceeded');

    assert.assertNotNull(graphQlLib.execute({schema: schema, query: nestedQuery(100), maxFieldsCount: 1000}).data);
}

function testDefaultDepthLimitWithoutOptions() {
    assertValidationError(graphQlLib.execute(schema, nestedQuery(101)), 'MaxQueryDepthExceeded');
    assertValidationError(graphQlLib.execute({schema: schema, query: nestedQuery(101)}), 'MaxQueryDepthExceeded');
}

function testSubscriptionRejectedByLimit() {
    var result = graphQlLib.execute({schema: schema, query: 'subscription { onNode { child { value } } }', maxDepth: 2});
    assertValidationError(result, 'MaxQueryDepthExceeded');
}

function testBadFaithIntrospectionErrorShape() {
    // graphql-java allows each cyclic __Type field once per introspection operation.
    var query = '{ __schema { types { fields { type { fields { name } } } } } }';
    var result = graphQlLib.execute({schema: schema, query: query});
    assertSingleError(result, 'BadFaithIntrospection', undefined);
}

function testFullIntrospectionNeedsDepth13() {
    // A standard introspection query needs depth 13; over a limit it is rejected as bad faith.
    var query = Java.type('graphql.introspection.IntrospectionQuery').INTROSPECTION_QUERY;

    assert.assertNotNull(graphQlLib.execute({schema: schema, query: query, maxDepth: 13}).data);

    var result = graphQlLib.execute({schema: schema, query: query, maxDepth: 12});
    assertSingleError(result, 'BadFaithIntrospection', undefined);
}

function testInvalidFirstArgument() {
    var message = "Value 'params' must be an object or a schema created with createSchema()";
    assert.assertEquals(message, assert.assertThrows(function () {
        graphQlLib.execute(null, '{ node { value } }');
    }));
    assert.assertEquals(message, assert.assertThrows(function () {
        graphQlLib.execute('{ node { value } }');
    }));
}

function testInvalidParams() {
    var schemaMessage = "Value 'schema' is required and must be a schema created with createSchema()";
    assert.assertEquals(schemaMessage, assert.assertThrows(function () {
        graphQlLib.execute({query: '{ node { value } }'});
    }));
    assert.assertEquals(schemaMessage, assert.assertThrows(function () {
        graphQlLib.execute({schema: {}, query: '{ node { value } }'});
    }));
    assert.assertEquals("Value 'query' is required and must be a string", assert.assertThrows(function () {
        graphQlLib.execute({schema: schema});
    }));
}

function testInvalidLimits() {
    [0, -1, 1.5, '10', NaN, Infinity, 2147483648].forEach(function (value) {
        assert.assertEquals("Value 'maxDepth' must be a positive integer", assert.assertThrows(function () {
            graphQlLib.execute({schema: schema, query: '{ node { value } }', maxDepth: value});
        }));
        assert.assertEquals("Value 'maxFieldsCount' must be a positive integer", assert.assertThrows(function () {
            graphQlLib.execute({schema: schema, query: '{ node { value } }', maxFieldsCount: value});
        }));
    });
}
