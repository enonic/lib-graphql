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

exports.schemaGenerator = function () {
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
exports.execute = function (schema, query, variables, context) {
    return __.toNativeObject(graphQLHelper.execute(schema, query, __.toScriptValue(variables), context));
};

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

function forEachAttribute(object, callback) {
    if (object) {
        for (var fieldName in object) {
            if (object[fieldName]) {
                callback(object[fieldName]);
            }
        }
    }
}
