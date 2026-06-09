// Integration test for GraphQL subscriptions, in the style of graphql-example.js.
//
// A subscription field returns a Publisher of events (created via graphql-rx).
// graphql-java subscribes to it and, for every published event, executes the
// field selection using that event as the source - producing one ExecutionResult
// per event, which is delivered to the subscriber's onNext callback.

var graphQlLib = require('/lib/graphql');
var graphQlRxLib = require('/lib/graphql-rx');
var assert = require('/lib/xp/testing');

var schemaGenerator = graphQlLib.newSchemaGenerator();

// The published events are the source of the subscription field's type.
var messageObjectType = schemaGenerator.createObjectType({
    name: 'Message',
    fields: {
        text: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString),
            resolve: function (env) {
                return env.source.text;
            }
        }
    }
});

// A query type is mandatory for a valid schema.
var rootQueryType = schemaGenerator.createObjectType({
    name: 'Query',
    fields: {
        ping: {
            type: graphQlLib.GraphQLString,
            resolve: function () {
                return 'pong';
            }
        }
    }
});

// The subscription field returns the publisher of events.
var eventSource;
var rootSubscriptionType = schemaGenerator.createObjectType({
    name: 'Subscription',
    fields: {
        onMessage: {
            type: messageObjectType,
            resolve: function () {
                return eventSource;
            }
        }
    }
});

var schema = schemaGenerator.createSchema({
    query: rootQueryType,
    subscription: rootSubscriptionType
});

function newSubscriber(received) {
    return graphQlRxLib.createSubscriber({
        onNext: function (payload) {
            received.push(payload);
        }
    });
}

exports.test = function () {
    testDeliversEventsToSubscriber();
    testFilterDropsNonMatchingEvents();
};

function testDeliversEventsToSubscriber() {
    var processor = graphQlRxLib.createPublishProcessor();
    eventSource = processor;

    var result = graphQlLib.execute(schema, 'subscription { onMessage { text } }');

    var received = [];
    result.data.subscribe(newSubscriber(received));

    processor.onNext({text: 'first'});
    processor.onNext({text: 'second'});
    processor.onComplete();

    assert.assertJsonEquals([
        {data: {onMessage: {text: 'first'}}},
        {data: {onMessage: {text: 'second'}}}
    ], received);
}

function testFilterDropsNonMatchingEvents() {
    var processor = graphQlRxLib.createPublishProcessor();
    eventSource = processor.filter(function (event) {
        return event.text !== 'skip';
    });

    var result = graphQlLib.execute(schema, 'subscription { onMessage { text } }');

    var received = [];
    result.data.subscribe(newSubscriber(received));

    processor.onNext({text: 'keep'});
    processor.onNext({text: 'skip'});
    processor.onNext({text: 'last'});
    processor.onComplete();

    assert.assertJsonEquals([
        {data: {onMessage: {text: 'keep'}}},
        {data: {onMessage: {text: 'last'}}}
    ], received);
}
