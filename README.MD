# GraphQL lib for Enonic XP

[![Actions Status](https://github.com/enonic/lib-graphql/workflows/Gradle%20Build/badge.svg)](https://github.com/enonic/lib-graphql/actions)
[![codecov](https://codecov.io/gh/enonic/lib-graphql/branch/master/graph/badge.svg)](https://codecov.io/gh/enonic/lib-graphql)
[![License](https://img.shields.io/github/license/enonic/lib-sql.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)

This is a library for implementing a GraphQL service on Enonic XP. 
It allows you to define a GraphQL schema and execute GraphQL queries against this schema.


## Documentation

Published at [developer.enonic.com/docs/graphql-library](https://developer.enonic.com/docs/graphql-library).

* [Overview and installation](./docs/index.adoc)
* [Usage](./docs/usage.adoc)
* [Reference](./docs/reference.adoc)
* [Release notes](./docs/release.adoc)


## Breaking changes

### 2.0.0
Functions can no longer be created directly, use the `schemaGenerator` object instead.
