// Compile-only smoke test for @enonic-types/lib-graphql.
// Exercises a realistic schema:
//   - object type with a typed resolver reading source + args + context
//   - reference() for self-referential types
//   - an enum + input object + interface + union
//   - a Relay-style connection built from graphql-connection
//   - createSchema() + execute() typed end-to-end
//   - graphql-rx publish processor + subscriber

import * as graphQlLib from "/lib/graphql";
import type {
    DataFetchingEnvironment,
    ExecutionResult,
    GraphQLObjectType,
    GraphQLSchema,
    SchemaGenerator,
} from "/lib/graphql";
import * as graphQlConnectionLib from "/lib/graphql-connection";
import * as graphQlRxLib from "/lib/graphql-rx";

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

// Object type with a typed resolver.
const personType: GraphQLObjectType = schemaGenerator.createObjectType<Person, AppContext>({
    name: "Person",
    description: "A person",
    fields: {
        name: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString),
            resolve: (env: DataFetchingEnvironment<Person, Record<string, unknown>, AppContext>): string => {
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
    },
});

// Enum + input + interface + union — ensures each create* returns a distinct branded type.
const roleEnum = schemaGenerator.createEnumType({
    name: "Role",
    values: ["ADMIN", "USER"],
});

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

const nodeUnion = schemaGenerator.createUnionType<Person>({
    name: "Node",
    types: [personType, graphQlLib.reference("Person")],
    typeResolver: (): GraphQLObjectType => personType,
});

// Suppress "unused" warnings on the branded handles above.
void namedInterface;
void nodeUnion;

// Relay connection helper.
const personConnection: GraphQLObjectType = graphQlConnectionLib.createConnectionType(schemaGenerator, personType);

// getName() is exposed on GraphQLObjectType — used by createConnectionType internally.
const _connectionName: string = personConnection.getName();

// Root query with typed args + context.
const queryType = schemaGenerator.createObjectType<undefined, AppContext>({
    name: "Query",
    fields: {
        getPersonByName: {
            type: personType,
            args: {
                name: graphQlLib.nonNull(graphQlLib.GraphQLString),
                filter: filterInput,
            },
            resolve: (env: DataFetchingEnvironment<undefined, GetPersonArgs, AppContext>): Person | null => {
                void env.context.userId;
                return { name: env.args.name, age: 0, children: [] };
            },
        },
        persons: {
            type: personConnection,
        },
    },
});

const schema: GraphQLSchema = schemaGenerator.createSchema({
    query: queryType,
    dictionary: [personType],
});

const result: ExecutionResult<{ getPersonByName: Person | null }> = graphQlLib.execute(
    schema,
    "query($name:String!){ getPersonByName(name:$name){ name age } }",
    { name: "James" },
    { userId: "42" } satisfies AppContext,
);

void result.data?.getPersonByName?.age;

// Cursor helpers.
const cursor: string = graphQlConnectionLib.encodeCursor("42");
const decoded: string = graphQlConnectionLib.decodeCursor(cursor);
void decoded;

// Reactive.
const processor = graphQlRxLib.createPublishProcessor<Person>();
processor.onNext({ name: "James", age: 42, children: [] });
processor.onComplete();

const subscriber = graphQlRxLib.createSubscriber<Person>({
    onNext: (person: Person): void => {
        void person.name;
    },
});
void subscriber;
