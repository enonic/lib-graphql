var graphQlLib = require('/lib/graphql');
var graphQlConnectionLib = require('/lib/graphql-connection');
var graphQlRxLib = require('/lib/graphql-rx');
var assert = require('/lib/xp/testing');

function assertExports(expected, lib) {
    assert.assertJsonEquals(expected, Object.keys(lib).sort());
}

exports.testGraphqlExports = function () {
    assertExports([
        'Date',
        'DateTime',
        'GraphQLBoolean',
        'GraphQLFloat',
        'GraphQLID',
        'GraphQLInt',
        'GraphQLString',
        'Json',
        'LocalDateTime',
        'LocalTime',
        'Time',
        'execute',
        'list',
        'newSchemaGenerator',
        'nonNull',
        'reference'
    ], graphQlLib);
};

exports.testGraphqlConnectionExports = function () {
    assertExports(['createConnectionType', 'decodeCursor', 'encodeCursor'], graphQlConnectionLib);
};

exports.testGraphqlRxExports = function () {
    assertExports(['createPublishProcessor', 'createSubscriber'], graphQlRxLib);
};

exports.testScalarsAreTheJavaInstances = function () {
    var owners = {
        'graphql.Scalars': ['GraphQLInt', 'GraphQLFloat', 'GraphQLString', 'GraphQLBoolean', 'GraphQLID'],
        'graphql.scalars.ExtendedScalars': ['Date', 'DateTime', 'Time', 'Json'],
        'com.enonic.lib.graphql.CustomScalars': ['LocalDateTime', 'LocalTime']
    };

    for (var className in owners) {
        var owner = Java.type(className);
        var names = owners[className];
        for (var i = 0; i < names.length; i++) {
            assert.assertTrue(graphQlLib[names[i]] === owner[names[i]], names[i] + ' is not ' + className + '.' + names[i]);
        }
    }
};
