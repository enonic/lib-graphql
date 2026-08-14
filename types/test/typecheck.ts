// Compile-only smoke test for @enonic-types/lib-graphql.
// Exercises a realistic schema:
//   - object type with a typed resolver reading source + args + context
//   - a fixed-value resolver (resolve as a value, not a function)
//   - reference() for self-referential types
//   - an enum + input object + interface + union
//   - a Relay-style connection built from graphql-connection, with a
//     ConnectionSource-returning resolver and cursor round-tripping
//   - createSchema() + execute() typed end-to-end, including the error shape
//   - graphql-rx publish processor (filter chaining, subscribe), subscriber
//     (ExecutionResult delivery, cancelSubscription) and the subscription flow

import * as graphQlLib from "/lib/graphql";
import type {
    ExecutionResult,
    GraphQLObjectType,
    GraphQLSchema,
    ResolverEnvironment,
    SchemaGenerator,
} from "/lib/graphql";
import * as graphQlConnectionLib from "/lib/graphql-connection";
import type { ConnectionSource } from "/lib/graphql-connection";
import * as graphQlRxLib from "/lib/graphql-rx";
import type { Flowable, Throwable } from "/lib/graphql-rx";

interface Person {
    name: string;
    age: number;
    children: string[];
}

interface GetPersonArgs {
    name: string;
}

interface AppContext {
    userId: string;
}

const schemaGenerator: SchemaGenerator = graphQlLib.newSchemaGenerator();

// Object type with a typed resolver and a fixed-value resolver.
const personType: GraphQLObjectType = schemaGenerator.createObjectType<Person, AppContext>({
    name: "Person",
    description: "A person",
    fields: {
        name: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString),
            resolve: (env: ResolverEnvironment<Person, Record<string, unknown>, AppContext>): string => {
                return env.source.name;
            },
        },
        age: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
        },
        children: {
            type: graphQlLib.list(graphQlLib.reference("Person")),
            resolve: (env): string[] => env.source.children,
        },
        species: {
            type: graphQlLib.GraphQLString,
            resolve: "homo sapiens",
        },
    },
});

// @ts-expect-error — `type` is required on every field.
schemaGenerator.createObjectType({ name: "Broken", fields: { oops: { resolve: () => 1 } } });

// Enum + input + interface + union — ensures each create* returns a distinct branded type.
const roleEnum = schemaGenerator.createEnumType({
    name: "Role",
    values: ["ADMIN", "USER"],
});

const priorityEnum = schemaGenerator.createEnumType({
    name: "Priority",
    values: { LOW: 1, NORMAL: 2, HIGH: 3 },
});
void priorityEnum;

const filterInput = schemaGenerator.createInputObjectType({
    name: "PersonFilter",
    fields: {
        minAge: { type: graphQlLib.GraphQLInt },
        role: { type: roleEnum },
    },
});

const namedInterface = schemaGenerator.createInterfaceType<Person>({
    name: "Named",
    fields: {
        name: { type: graphQlLib.nonNull(graphQlLib.GraphQLString) },
    },
    typeResolver: (): GraphQLObjectType => personType,
});
void namedInterface;

const nodeUnion = schemaGenerator.createUnionType<Person>({
    name: "Node",
    types: [personType, graphQlLib.reference("Person")],
    typeResolver: (): GraphQLObjectType => personType,
});
void nodeUnion;

// Relay connection helper.
const personConnection: GraphQLObjectType = graphQlConnectionLib.createConnectionType(schemaGenerator, personType);

// getName() is exposed on GraphQLObjectType — used by createConnectionType internally.
const _connectionName: string = personConnection.getName();
void _connectionName;

// Root query with typed args + context, and a connection field whose resolver
// returns a ConnectionSource.
const queryType = schemaGenerator.createObjectType<undefined, AppContext>({
    name: "Query",
    fields: {
        getPersonByName: {
            type: personType,
            args: {
                name: graphQlLib.nonNull(graphQlLib.GraphQLString),
                filter: filterInput,
            },
            resolve: (env: ResolverEnvironment<undefined, GetPersonArgs, AppContext>): Person | null => {
                void env.context.userId;
                return { name: env.args.name, age: 0, children: [] };
            },
        },
        persons: {
            type: personConnection,
            resolve: (): ConnectionSource<Person> => ({
                total: 1,
                start: 0,
                hits: [{ name: "James", age: 42, children: [] }],
            }),
        },
    },
});

// Subscription root — resolver returns a (filtered) publisher.
const personProcessor = graphQlRxLib.createPublishProcessor<Person>();

const subscriptionType = schemaGenerator.createObjectType({
    name: "Subscription",
    fields: {
        personAdded: {
            type: personType,
            resolve: () => personProcessor.filter((person) => person.age >= 18),
        },
    },
});

const schema: GraphQLSchema = schemaGenerator.createSchema({
    query: queryType,
    subscription: subscriptionType,
    dictionary: [personType],
});

const result: ExecutionResult<{ getPersonByName: Person | null }> = graphQlLib.execute(
    schema,
    "query($name:String!){ getPersonByName(name:$name){ name age } }",
    { name: "James" },
    { userId: "42" } satisfies AppContext,
);

void result.data?.getPersonByName?.age;

// Error shape is fully typed.
const firstErrorLine: number | undefined = result.errors?.[0]?.locations?.[0]?.line;
void firstErrorLine;
void result.errors?.[0]?.exception?.name;

// @ts-expect-error — the runtime never emits `extensions`.
void result.extensions;

// Cursor helpers — encodeCursor coerces any value with String().
const cursor: string = graphQlConnectionLib.encodeCursor("42");
const numericCursor: string = graphQlConnectionLib.encodeCursor(20);
void numericCursor;
const decoded: number = parseInt(graphQlConnectionLib.decodeCursor(cursor), 10);
void decoded;

// Reactive: subscriber receives full ExecutionResults, not raw values.
const subscriber = graphQlRxLib.createSubscriber<{ personAdded: Person }>({
    onNext: (event): void => {
        void event.data?.personAdded.name;
        void event.errors?.[0]?.errorType;
    },
});

// Filters chain, and both processors and filtered publishers accept subscribers.
personProcessor
    .filter((person) => person.age >= 18)
    .filter((person) => person.children.length > 0)
    .subscribe(subscriber);
personProcessor.subscribe(subscriber);

personProcessor.onNext({ name: "James", age: 42, children: [] });

// onError takes a Java Throwable (constructed with Java.type() at runtime).
declare const throwable: Throwable;
personProcessor.onError(throwable);

// @ts-expect-error — a string is not a Throwable.
personProcessor.onError("boom");

// @ts-expect-error — a JavaScript Error is not a Throwable.
personProcessor.onError(new Error("boom"));

personProcessor.onComplete();

// Subscription flow: execute() returns the publisher as `data`.
const subscriptionResult = graphQlLib.execute<Flowable<{ personAdded: Person }>>(
    schema,
    "subscription { personAdded { name } }",
);
subscriptionResult.data?.subscribe(subscriber);

subscriber.cancelSubscription();
