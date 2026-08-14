# @enonic-types/lib-graphql

TypeScript type definitions for the [Enonic XP GraphQL library](https://developer.enonic.com/docs/graphql-library) (`com.enonic.lib:lib-graphql`).

Covers all three server-side modules:

- `/lib/graphql` — schema builder, scalars, execution
- `/lib/graphql-connection` — Relay-style connection helper
- `/lib/graphql-rx` — reactive subscription plumbing

## Install

```bash
npm install --save-dev @enonic-types/lib-graphql
```

Versions track the library itself — install the same version as the `com.enonic.lib:lib-graphql` dependency in your `build.gradle`.

## Setup

The declarations are ambient (`declare module "/lib/graphql"` etc.), so no `paths` mapping is needed — the package just has to be part of your TypeScript program. Add it to `types` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@enonic-types/lib-graphql"]
  }
}
```

Note: setting `types` disables automatic inclusion of other `@types`/`@enonic-types` packages, so list everything your project uses (e.g. `["@enonic-types/global", "@enonic-types/lib-graphql"]`).

Alternatively, reference it from any file in your program:

```ts
/// <reference types="@enonic-types/lib-graphql" />
```

## Usage

```ts
import {newSchemaGenerator, GraphQLString, GraphQLInt, nonNull, execute} from '/lib/graphql';

const schemaGenerator = newSchemaGenerator();

const personType = schemaGenerator.createObjectType({
    name: 'Person',
    fields: {
        name: {type: nonNull(GraphQLString)},
        age: {type: GraphQLInt}
    }
});
```

Heads-up: a named import of the extended `Date` scalar (`import {Date} from '/lib/graphql'`) shadows the global `Date` object in that file — prefer a namespace import (`graphQlLib.Date`) where that matters.

Full API reference: https://developer.enonic.com/docs/graphql-library
