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

// Defines the object types. 
// Firstly, an object type 'Person' with a mandatory String field 'name', a mandatory Integer field 'age' 
// and an array of Person field 'children'.
var personObjectType = graphQlLib.createObjectType({
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
var rootQueryType = graphQlLib.createObjectType({
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
var schema = graphQlLib.createSchema({
    query: rootQueryType
});

// POST request handler that will execute the query received as parameter against the schema defined above.
exports.post = function (req) {
    var body = JSON.parse(req.body);
    var result = graphQlLib.execute(schema, body.query, body.variables);
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
var assert = require('/lib/xp/testing');
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