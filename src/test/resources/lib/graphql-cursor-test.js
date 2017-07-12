var graphQlConnectionLib = require('/lib/graphql-connection');
var assert = require('/lib/xp/assert');

exports.test = function () {
    assert.assertEquals('dGVzdA==', graphQlConnectionLib.encodeCursor('test'));
    assert.assertEquals('test', graphQlConnectionLib.decodeCursor('dGVzdA=='));
    assert.assertEquals('MQ==', graphQlConnectionLib.encodeCursor(1));
    assert.assertEquals('1', graphQlConnectionLib.decodeCursor('MQ=='));
};
