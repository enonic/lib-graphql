// require()-only consumer: nothing here imports the modules, so typing comes solely from the XpLibraries
// hooks in the built package, which tsconfig.require.json pulls in the way a consumer's `types` entry does.
// XpRequire falls back to `unknown`, not `any`, so a module whose hook the entry file misses fails here.

const graphQlLib = require('/lib/graphql');
const graphQlConnectionLib = require('/lib/graphql-connection');
const graphQlRxLib = require('/lib/graphql-rx');

const schemaGenerator = graphQlLib.newSchemaGenerator();

const itemType = schemaGenerator.createObjectType({
    name: 'Item',
    fields: {
        id: { type: graphQlLib.nonNull(graphQlLib.GraphQLID) },
        created: { type: graphQlLib.Date },
    },
});

const processor = graphQlRxLib.createPublishProcessor<{ id: string }>();

const schema = schemaGenerator.createSchema({
    query: schemaGenerator.createObjectType({
        name: 'Query',
        fields: {
            items: {
                type: graphQlConnectionLib.createConnectionType(schemaGenerator, itemType),
                resolve: () => ({ total: 0, start: 0, hits: [] }),
            },
        },
    }),
    subscription: schemaGenerator.createObjectType({
        name: 'Subscription',
        fields: {
            itemAdded: { type: itemType, resolve: () => processor },
        },
    }),
});

export const result = graphQlLib.execute<{ items: { totalCount: number } }>({
    schema,
    query: '{ items { totalCount } }',
});
export const totalCount: number | undefined = result.data?.items.totalCount;

export const cursor: string = graphQlConnectionLib.encodeCursor(10);

export const subscriber = graphQlRxLib.createSubscriber({
    onNext: (event) => {
        void event.errors;
    },
});
processor.subscribe(subscriber);

// @ts-expect-error `query` is required in the params form
graphQlLib.execute({ schema });

// @ts-expect-error decodeCursor returns a string, not a number
export const decoded: number = graphQlConnectionLib.decodeCursor(cursor);

// @ts-expect-error a publish processor has no `emit`
processor.emit({ id: '1' });
