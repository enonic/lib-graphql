# @enonic-types/lib-graphql

TypeScript declarations for [lib-graphql](https://github.com/enonic/lib-graphql), the Enonic XP
GraphQL library. They are generated from the library source on every release, so the version
matches the jar.

Covers all three server-side modules:

- `/lib/graphql` — schema builder, scalars, execution
- `/lib/graphql-connection` — Relay-style connection helper
- `/lib/graphql-rx` — reactive subscription plumbing

## Setup

```bash
npm install --save-dev @enonic-types/lib-graphql
```

The package is types-only, so it belongs in `devDependencies`. Add it to both `types` and `paths`
in `tsconfig.json`:

```json
{
    "compilerOptions": {
        "types": ["@enonic-types/global", "@enonic-types/lib-graphql"],
        "paths": {
            "/lib/graphql": ["./node_modules/@enonic-types/lib-graphql/graphql.d.ts"],
            "/lib/graphql-connection": ["./node_modules/@enonic-types/lib-graphql/graphql-connection.d.ts"],
            "/lib/graphql-rx": ["./node_modules/@enonic-types/lib-graphql/graphql-rx.d.ts"]
        }
    }
}
```

Both entries are needed, one per module style. The `types` entry — next to
[`@enonic-types/global`](https://www.npmjs.com/package/@enonic-types/global) — loads the package's
`XpLibraries` augmentations, which is what types `require('/lib/graphql')` and its siblings; `paths`
alone does not type `require()` in a file that never imports the module. The `paths` entries are
what resolve `import ... from '/lib/graphql'`: TypeScript treats a module name starting with `/` as
a path, so no ambient declaration can stand in for them.

## Usage

```ts
import { execute, GraphQLInt, GraphQLString, newSchemaGenerator, nonNull } from '/lib/graphql';

const schemaGenerator = newSchemaGenerator();

const personType = schemaGenerator.createObjectType({
    name: 'Person',
    fields: {
        name: { type: nonNull(GraphQLString) },
        age: { type: GraphQLInt },
    },
});

const schema = schemaGenerator.createSchema({
    query: schemaGenerator.createObjectType({
        name: 'Query',
        fields: {
            person: { type: personType, resolve: () => ({ name: 'James', age: 42 }) },
        },
    }),
});

const result = execute<{ person: { name: string } }>({ schema, query: '{ person { name } }' });
```

A named import of the extended `Date` scalar (`import { Date } from '/lib/graphql'`) shadows the
global `Date` object in that file — prefer a namespace import (`graphQlLib.Date`) where that matters.

Full API reference: https://developer.enonic.com/docs/graphql-library
