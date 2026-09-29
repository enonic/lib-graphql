// Import-style consumer of the built package: tsconfig.json here resolves the three module paths to
// build/types and checks the shipped .d.ts files themselves (skipLibCheck: false).
// require()-only consumption is a separate program, require-only.ts.
//
// Exercises a realistic schema:
//   - object type with a typed resolver reading source + args + context
//   - a fixed-value resolver (resolve as a value, not a function)
//   - reference() for self-referential types
//   - an enum + input object + interface + union
//   - a Relay-style connection built from graphql-connection, with a
//     ConnectionSource-returning resolver and cursor round-tripping
//   - createSchema() + execute() typed end-to-end, including the error shape
//   - execute() params form with query limits, and the deprecated positional form
//   - graphql-rx publish processor (filter chaining, subscribe), subscriber
//     (ExecutionResult delivery, cancelSubscription) and the subscription flow

import type {
    ExecutionResult,
    GraphQLInputObjectType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLUnionType,
    ResolverEnvironment,
    SchemaGenerator,
} from '/lib/graphql';
import * as graphQlLib from '/lib/graphql';
import type { ConnectionSource } from '/lib/graphql-connection';
import * as graphQlConnectionLib from '/lib/graphql-connection';
import type { Flowable, Throwable } from '/lib/graphql-rx';
import * as graphQlRxLib from '/lib/graphql-rx';

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
    name: 'Person',
    description: 'A person',
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
            type: graphQlLib.list(graphQlLib.reference('Person')),
            resolve: (env): string[] => env.source.children,
        },
        species: {
            type: graphQlLib.GraphQLString,
            resolve: 'homo sapiens',
        },
    },
});

// @ts-expect-error — `type` is required on every field.
schemaGenerator.createObjectType({ name: 'Broken', fields: { oops: { resolve: () => 1 } } });

schemaGenerator.createObjectType<Person>({
    name: 'Contextual',
    fields: {
        // @ts-expect-error — a contextually typed `env.source` is the declared Source, not `any`.
        nope: { type: graphQlLib.GraphQLString, resolve: (env) => env.source.nope },
    },
});

// Enum + input + interface + union — ensures each create* returns a distinct branded type.
const roleEnum = schemaGenerator.createEnumType({
    name: 'Role',
    values: ['ADMIN', 'USER'],
});

const priorityEnum = schemaGenerator.createEnumType({
    name: 'Priority',
    values: { LOW: 1, NORMAL: 2, HIGH: 3 },
});
void priorityEnum;

const filterInput = schemaGenerator.createInputObjectType({
    name: 'PersonFilter',
    fields: {
        minAge: { type: graphQlLib.GraphQLInt },
        role: { type: roleEnum },
    },
});

const namedInterface = schemaGenerator.createInterfaceType<Person>({
    name: 'Named',
    fields: {
        name: { type: graphQlLib.nonNull(graphQlLib.GraphQLString) },
    },
    typeResolver: (): GraphQLObjectType => personType,
});
void namedInterface;

const nodeUnion = schemaGenerator.createUnionType<Person>({
    name: 'Node',
    types: [personType, graphQlLib.reference('Person')],
    typeResolver: (): GraphQLObjectType => personType,
});
void nodeUnion;

// @ts-expect-error — an enum type is not an input object type.
export const enumAsInput: GraphQLInputObjectType = roleEnum;
// @ts-expect-error — an input object type is not an interface type.
export const inputAsInterface: GraphQLInterfaceType = filterInput;
// @ts-expect-error — an interface type is not a union type.
export const interfaceAsUnion: GraphQLUnionType = namedInterface;
// @ts-expect-error — a union type is not an interface type.
export const unionAsInterface: GraphQLInterfaceType = nodeUnion;

// Relay connection helper.
const personConnection: GraphQLObjectType = graphQlConnectionLib.createConnectionType(schemaGenerator, personType);

// getName() is exposed on GraphQLObjectType — used by createConnectionType internally.
const _connectionName: string = personConnection.getName();
void _connectionName;

// Root query with typed args + context, and a connection field whose resolver
// returns a ConnectionSource.
const queryType = schemaGenerator.createObjectType<undefined, AppContext>({
    name: 'Query',
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
                hits: [{ name: 'James', age: 42, children: [] }],
            }),
        },
    },
});

// Subscription root — resolver returns a (filtered) publisher.
const personProcessor = graphQlRxLib.createPublishProcessor<Person>();

const subscriptionType = schemaGenerator.createObjectType({
    name: 'Subscription',
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

const result: ExecutionResult<{ getPersonByName: Person | null }> = graphQlLib.execute({
    schema,
    query: 'query($name:String!){ getPersonByName(name:$name){ name age } }',
    variables: { name: 'James' },
    context: { userId: '42' } satisfies AppContext,
    maxDepth: 10,
    maxFieldsCount: 100,
});

void result.data?.getPersonByName?.age;

// Error shape is fully typed.
const firstErrorLine: number | undefined = result.errors?.[0]?.locations?.[0]?.line;
void firstErrorLine;
void result.errors?.[0]?.exception?.name;

// @ts-expect-error — the runtime never emits `extensions`.
void result.extensions;

// The deprecated positional form still typechecks.
const positionalResult: ExecutionResult = graphQlLib.execute(schema, '{ getPersonByName(name:"James"){ name } }');
void positionalResult;

// @ts-expect-error — `query` is required in the params form.
graphQlLib.execute({ schema });

// @ts-expect-error — limits are numbers.
graphQlLib.execute({ schema, query: '{ __typename }', maxDepth: '10' });

// Cursor helpers — encodeCursor coerces any value with String().
const cursor: string = graphQlConnectionLib.encodeCursor('42');
const numericCursor: string = graphQlConnectionLib.encodeCursor(20);
void numericCursor;
const decoded: number = parseInt(graphQlConnectionLib.decodeCursor(cursor), 10);
void decoded;

// @ts-expect-error — the value is required.
graphQlConnectionLib.encodeCursor();

// @ts-expect-error — a connection is an object type, not a union type.
export const connectionAsUnion: GraphQLUnionType = graphQlConnectionLib.createConnectionType(
    schemaGenerator,
    personType,
);

// Reactive: subscriber receives full ExecutionResults, not raw values.
const subscriber = graphQlRxLib.createSubscriber<{ personAdded: Person }>({
    onNext: (event): void => {
        void event.data?.personAdded.name;
        void event.errors?.[0]?.errorType;
        // @ts-expect-error — `data` carries the subscriber's Data type, not `any`.
        void event.data?.personAdded.nope;
    },
});

// Filters chain, and both processors and filtered publishers accept subscribers.
personProcessor
    .filter((person) => person.age >= 18)
    .filter((person) => person.children.length > 0)
    .subscribe(subscriber);
personProcessor.subscribe(subscriber);

personProcessor.onNext({ name: 'James', age: 42, children: [] });

// onError takes a Java Throwable (constructed with Java.type() at runtime).
declare const throwable: Throwable;
personProcessor.onError(throwable);

// @ts-expect-error — a string is not a Throwable.
personProcessor.onError('boom');

// @ts-expect-error — a JavaScript Error is not a Throwable.
personProcessor.onError(new Error('boom'));

personProcessor.onComplete();

// Subscription flow: execute() returns the publisher as `data`.
const subscriptionResult = graphQlLib.execute<Flowable<{ personAdded: Person }>>({
    schema,
    query: 'subscription { personAdded { name } }',
});
subscriptionResult.data?.subscribe(subscriber);

// @ts-expect-error — the publisher's values carry the declared event type.
subscriptionResult.data?.filter((event) => event.nope);

subscriber.cancelSubscription();
