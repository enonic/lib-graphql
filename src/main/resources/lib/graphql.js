var graphQLHelper = __.newBean('com.enonic.lib.graphql.GraphQLHandler');

//Scalars
var Scalars = Java.type('graphql.Scalars');
exports.GraphQLInt = Scalars.GraphQLInt;
exports.GraphQLFloat = Scalars.GraphQLFloat;
exports.GraphQLString = Scalars.GraphQLString;
exports.GraphQLBoolean = Scalars.GraphQLBoolean;
exports.GraphQLID = Scalars.GraphQLID;

var ExtendedScalars = Java.type('graphql.scalars.ExtendedScalars');
exports.Date = ExtendedScalars.Date;
exports.DateTime = ExtendedScalars.DateTime;
exports.Time = ExtendedScalars.Time;
exports.Json = ExtendedScalars.Json;

var CustomScalars = Java.type('com.enonic.lib.graphql.CustomScalars');
exports.LocalDateTime = CustomScalars.LocalDateTime;
exports.LocalTime = CustomScalars.LocalTime;

exports.newSchemaGenerator = function () {
    var graphQlBean = __.newBean('com.enonic.lib.graphql.GraphQlBean');

    return {
        createSchema: function (params) {
            var query = required(params, 'query');
            var mutation = optional(params, 'mutation');
            var subscription = optional(params, 'subscription');
            var additonalTypes = optional(params, 'dictionary');
            return graphQlBean.createSchema(query, mutation, subscription, additonalTypes);
        },

        createPageInfoObjectType: function (params) {
            var name = required(params, 'name');
            var fields = required(params, 'fields');
            forEachAttribute(fields, function (field) {
                required(field, 'type');
            });
            var interfaces = optional(params, 'interfaces');
            var description = optional(params, 'description');
            return graphQlBean.createPageInfoObjectType(name, __.toScriptValue(fields), __.toScriptValue(interfaces), description);
        },

        createObjectType: function (params) {
            var name = required(params, 'name');
            var fields = required(params, 'fields');
            forEachAttribute(fields, function (field) {
                required(field, 'type');
            });
            var interfaces = optional(params, 'interfaces');
            var description = optional(params, 'description');
            return graphQlBean.createObjectType(name, __.toScriptValue(fields), __.toScriptValue(interfaces), description);
        },

        createInputObjectType: function (params) {
            var name = required(params, 'name');
            var fields = required(params, 'fields');
            forEachAttribute(fields, function (field) {
                required(field, 'type');
            });
            var description = optional(params, 'description');
            return graphQlBean.createInputObjectType(name, __.toScriptValue(fields), description);
        },

        createInterfaceType: function (params) {
            var name = required(params, 'name');
            var fields = required(params, 'fields');
            forEachAttribute(fields, function (field) {
                required(field, 'type');
            });
            var typeResolver = required(params, 'typeResolver');
            var description = optional(params, 'description');
            return graphQlBean.createInterfaceType(name, __.toScriptValue(fields), __.toScriptValue(typeResolver), description);
        },

        createUnionType: function (params) {
            var name = required(params, 'name');
            var types = required(params, 'types');
            if (types == null || types.length === 0) {
                throw "Value 'types' is required and cannot be empty";
            }
            var typeResolver = required(params, 'typeResolver');
            var description = optional(params, 'description');
            return graphQlBean.createUnionType(name, __.toScriptValue(types), __.toScriptValue(typeResolver), description);
        },

        createEnumType: function (params) {
            var name = required(params, 'name');
            var values = required(params, 'values');
            var description = optional(params, 'description');
            return graphQlBean.createEnumType(name, __.toScriptValue(values), description);
        }
    };
};

//Schema util functions
exports.list = function (type) {
    return graphQLHelper.list(type);
};

exports.nonNull = function (type) {
    return graphQLHelper.nonNull(type);
};

exports.reference = function (typeKey) {
    return graphQLHelper.reference(typeKey);
};

//Query execution
var GraphQLSchema = Java.type('graphql.schema.GraphQLSchema');
var MAX_INTEGER = Java.type('java.lang.Integer').MAX_VALUE;

exports.execute = function (params, query, variables, context) {
    if (params instanceof GraphQLSchema) {
        return executeOperation(params, query, variables, context, null, null);
    }
    return executeWithParams(params);
};

function executeWithParams(params) {
    if (params == null || typeof params !== 'object') {
        throw "Value 'params' must be an object or a schema created with createSchema()";
    }
    var schema = params.schema;
    if (!(schema instanceof GraphQLSchema)) {
        throw "Value 'schema' is required and must be a schema created with createSchema()";
    }
    var query = params.query;
    if (typeof query !== 'string') {
        throw "Value 'query' is required and must be a string";
    }
    var variables = optional(params, 'variables');
    var context = optional(params, 'context');
    var maxDepth = optionalPositiveInteger(params, 'maxDepth');
    var maxFieldsCount = optionalPositiveInteger(params, 'maxFieldsCount');
    return executeOperation(schema, query, variables, context, maxDepth, maxFieldsCount);
}

function executeOperation(schema, query, variables, context, maxDepth, maxFieldsCount) {
    return __.toNativeObject(graphQLHelper.execute(schema, query, __.toScriptValue(variables), context, maxDepth, maxFieldsCount));
}

//Util functions
function required(params, name) {
    var value = params[name];
    if (value === undefined) {
        log.error('error:' + JSON.stringify(params));
        throw "Value '" + name + "' is required";
    }
    return value;
}

function optional(params, name) {
    var value = params[name];
    if (value === undefined) {
        return null;
    }
    return value;
}

function optionalPositiveInteger(params, name) {
    var value = optional(params, name);
    if (value === null) {
        return null;
    }
    if (typeof value !== 'number' || Math.floor(value) !== value || value < 1 || value > MAX_INTEGER) {
        throw "Value '" + name + "' must be a positive integer";
    }
    return value;
}

function forEachAttribute(object, callback) {
    if (object) {
        for (var fieldName in object) {
            if (object[fieldName]) {
                callback(object[fieldName]);
            }
        }
    }
}
