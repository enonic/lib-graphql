GraphQL lib for Enonic XP
=========================

[![License](https://img.shields.io/github/license/enonic/lib-sql.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)

This is a library for implementing a GraphQL service on Enonic XP. 
It allows you to define a GraphQL schema and execute GraphQL queries against this schema.


Compatibility
-------------

| Version | XP Version -| Dependency                       |
|---------|-------------|----------------------------------|
| 0.1.0   | 6.10.x      | com.enonic.lib:lib-graphql:0.1.0 |


Usage
-----

First, you will need to add Enonic repository to the repository list:

```gradle
repositories {
    maven {
        url 'http://repo.enonic.com/public'
    }
}
```

After this, add the following dependency (where ``<version>`` is the actual version to use):

```gradle
dependencies {
    include 'com.enonic.lib:lib-sql:<version>'
}
```

The last step is to include the graphql-java this library uses in your app. This is done by adding it as an ``include`` dependency. Here's
an example on how to include the graphql-java:

```gradle
dependencies {
    include 'com.graphql-java:graphql-java:2.3.0'
}
```

Example
-------

You can then use this inside your javascript controller or other parts of your app.
Here's an example of using it inside a controller:

```js
// Includes the library
var graphQlLib = require('/lib/graphql');

// For the simplicity of the example we will use a JS object as database.
// In a real life case you will rather retrieve nodes/contents/data using one of the following libraries: '/lib/xp/content', 
// '/lib/xp/node' or '/lib/sql'.
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

// First defines the object types. 
// In this case: an object type 'Person' with a mandatory String field 'name', a mandatory Integer field 'age' and an array of Person 
// field 'children'.
var personObjectType = graphQlLib.createObjectType({
    name: 'Person',
    description: 'A person type.',
    fields: {
        name: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLString),
            resolve: function (env) {
                //The source on which is executed this function is one of the 3 person database objects defined above. 
                // We will simply return the field 'name' of this object here.
                return env.source.name;
            }
        },
        age: {
            type: graphQlLib.nonNull(graphQlLib.GraphQLInt),
            resolve: function (env) {
                //The source on which is executed this function is one of the 3 person database objects defined above. 
                // We will simply return the field 'age' of this object here.
                return env.source.age;
            }
        },
        children: {
            // We use here a reference because the object type Person has not been defined yet.
            // If it had been defined it would have been: graphQlLib.list(personObjectType)
            type: graphQlLib.list(graphQlLib.reference('Person')),
            resolve: function (env) {
                //The source on which is executed this function is one of the 3 person database objects defined above. 
                // We will use the field 'children' to retrieve the corresponding database objects.
                return env.source.children.map(function (childName) {
                    return database[childName];
                });
            }
        }
    }
});

// Defines a second object type 'Query', the root object type containing all the root retrieval requests.
var rootQueryType = graphQlLib.createObjectType({
    name: 'Query',
    fields: {
        //We have here a unique request getPersonByName taking a mandatory String 'name' as parameter and returning a person 
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
var schema = graphQlLib.createSchema({
    query: rootQueryType
});

// Here is an example of a POST request handler that will execute the query received as parameter against the schema defined above.
exports.post = function (req) {
    var body = JSON.parse(req.body);
    var result = graphQlLib.execute(schema, body.query, body.variables);
    return {
        contentType: 'application/json',
        body: result
    };
};


// Example of unit test for this service:
// We send the following query: query($name:String!){getPersonByName(name:$name){name, age, children{name, age}}}
// With the following variables: {name: 'James'}
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