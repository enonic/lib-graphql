# GraphQL lib for Enonic XP

[![Actions Status](https://github.com/enonic/lib-graphql/workflows/Gradle%20Build/badge.svg)](https://github.com/enonic/lib-graphql/actions)
[![codecov](https://codecov.io/gh/enonic/lib-graphql/branch/master/graph/badge.svg)](https://codecov.io/gh/enonic/lib-graphql)
[![License](https://img.shields.io/github/license/enonic/lib-sql.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)

This is a library for implementing a GraphQL service on Enonic XP. 
It allows you to define a GraphQL schema and execute GraphQL queries against this schema.


## Compatibility

| Version | XP Version  | Dependency                       |
|---------|-------------|----------------------------------|
| 2.0.0   | 7.0.0       | com.enonic.lib:lib-graphql:2.0.0 |
| 1.1.1   | 7.0.0       | com.enonic.lib:lib-graphql:1.1.1 |
| 1.1.0   | 7.0.0       | com.enonic.lib:lib-graphql:1.1.0 |
| 1.0.0   | 7.0.0       | com.enonic.lib:lib-graphql:1.0.0 |
| 0.5.2   | 6.10.x      | com.enonic.lib:graphql:0.5.2 |
| 0.5.1   | 6.10.x      | com.enonic.lib:graphql:0.5.1 |
| 0.5.0   | 6.10.x      | com.enonic.lib:graphql:0.5.0 |


## Usage

To include this library into your project, you will need to add the Enonic repository to the repository list if not already done

```gradle
repositories {
    maven {
        url 'http://repo.enonic.com/public'
    }
}
```

After this, add the following dependency (where ``<version>`` is the library version to use):

```gradle
dependencies {
    include 'com.enonic.lib:graphql:<version>'
}
```

## API

The browse the list of constants and functions accessible through the library's API, please see [GraphQL Library API](./docs/api.adoc)

## Example

You can then use this library inside your javascript controller.
Below is an example of an Enonic XP service using the library.

```js
// Includes the library
var graphQlLib = require('/lib/graphql');

// For the simplicity of the example we will use a JS object as database.
// In a real life case you will rather retrieve nodes/contents/data using one of the following libraries: 
// '/lib/xp/content', '/lib/xp/node' or '/lib/sql'.
var database = {
    'James': {
        name: 'James',
        age: 42,
        children: ['John', 'Robert']
    },
    'John': {
        name: 'John',
        age: 12,
        children: []
    },
    'Robert': {
        name: 'Robert',
        age: 10,
        children: []
    }
};

var schemaGenerator = graphQlLib.newSchemaGenerator();

// Defines the object types. 
// Firstly, an object type 'Person' with a mandatory String field 'name', a mandatory Integer field 'age' 
// and an array of Person field 'children'.
var personObjectType = schemaGenerator.createObjectType({
    name: 'Person',
    description: 'A person type.',
    fields: {
        name: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString),
            resolve: function (env) {
                // The source on which is executed this function is one of the 3 person database objects
                // defined above. We will simply return the field 'name' of this object here.
                return env.source.name;
            }
        },
        age: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt)
            // If resolve is not defined a PropertyDataFetcher will be set. 
            // In this case it will return the field 'age' of the source on which is executed this function, 
            // similarly to the resolve function above
        },
        children: {
            // We use here a reference because the object type Person has not been defined yet.
            // If it had been defined it would have been: graphQlLib.list(personObjectType)
            type: graphQlLib.list(graphQlLib.reference('Person')),
            resolve: function (env) {
                // The source on which is executed this function is one of the 3 person database objects. 
                // We will use the field 'children' to retrieve the corresponding database objects.
                return env.source.children.map(function (childName) {
                    return database[childName];
                });
            }
        }
    }
});

// Defines a second object type 'Query', the root object type containing all the root retrieval requests.
var rootQueryType = schemaGenerator.createObjectType({
    name: 'Query',
    fields: {
        // Unique request getPersonByName taking a mandatory String 'name' as parameter and returning a person 
        getPersonByName: {
            type: personObjectType,
            args: {
                name: graphQlLib.nonNull(graphQlLib.GraphQLString)
            },
            resolve: function (env) {
                var name = env.args.name;
                return database[name];
            }
        }
    }
});

// Define the GraphQL schema
var schema = schemaGenerator.createSchema({
    query: rootQueryType
});

// POST request handler that will execute the query received as parameter against the schema defined above.
exports.post = function (req) {
    var body = JSON.parse(req.body);
    var result = JSON.stringify(graphQlLib.execute(schema, body.query, body.variables));
    return {
        contentType: 'application/json',
        body: result
    };
};


// Example of unit test for this service:
// Query: query($name:String!){getPersonByName(name:$name){name, age, children{name, age}}}
// Variables: {name: 'James'}
// The result is then:
// {
//   data: {
//     getPersonByName: {
//       name: 'James',
//       age: 42,
//       children: [
//         {
//           name: "John",
//           age: 12
//         },
//         {
//           name: "Robert",
//           age: 10
//         }
//       ]
//     }
//   }
// }
var assert = require('/lib/xp/assert');
exports.test = function () {
    var query = 'query($name:String!){getPersonByName(name:$name){name, age, children{name, age}}}';
    var variables = {name: 'James'};
    var result = exports.post({
        body: JSON.stringify({query: query, variables: variables})
    }).body;
    assert.assertJsonEquals({
        data: {
            getPersonByName: {
                name: 'James',
                age: 42,
                children: [
                    {
                        name: "John",
                        age: 12
                    },
                    {
                        name: "Robert",
                        age: 10
                    }
                ]
            }
        }
    }, result);
};
```
### Breaking changes

Since version 2.0.0 GraphQL Lib does not support creation functions directly instead of must be used the `schemaGenerator` object.
