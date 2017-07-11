var graphQlBean = __.newBean('com.enonic.lib.graphql.GraphQlBean');

//Scalars
var Scalars = Java.type('graphql.Scalars')
exports.GraphQLInt = Scalars.GraphQLInt;
exports.GraphQLFloat = Scalars.GraphQLFloat;
exports.GraphQLString = Scalars.GraphQLString;
exports.GraphQLBoolean = Scalars.GraphQLBoolean;
exports.GraphQLID = Scalars.GraphQLID;


//Schema creation
exports.createSchema = function (params) {
    var query = required(params, 'query');
    var mutation = optional(params, 'mutation');
    return graphQlBean.createSchema(query, mutation);
};

exports.createObjectType = function (params) {
    var name = required(params, 'name');
    var fields = required(params, 'fields');
    forEachAttribute(fields, function(field){
        required(field, 'type');
        required(field, 'resolve');
    });
    var interfaces = optional(params, 'interfaces');
    var description = optional(params, 'description');
    return graphQlBean.createObjectType(name, __.toScriptValue(fields), __.toScriptValue(interfaces), description);
};

exports.createInputObjectType = function (params) {
    var name = required(params, 'name');
    var fields = required(params, 'fields');
    forEachAttribute(fields, function(field){
        required(field, 'type');
    });
    var description = optional(params, 'description');
    return graphQlBean.createInputObjectType(name, __.toScriptValue(fields), description);
};

exports.createInterfaceType = function (params) {
    var name = required(params, 'name');
    var fields = required(params, 'fields');
    forEachAttribute(fields, function(field){
        required(field, 'type');
    });
    var description = optional(params, 'description');
    return graphQlBean.createInterfaceType(name, __.toScriptValue(fields), description);
};

exports.createEnumType = function (params) {
    var name = required(params, 'name');
    var values = required(params, 'values');
    var description = optional(params, 'description');
    return graphQlBean.createEnumType(name, __.toScriptValue(values), description);
};


//Schema util functions
exports.list = function (type) {
    return graphQlBean.list(type);
};

exports.nonNull = function (type) {
    return graphQlBean.nonNull(type);
};

exports.reference = function (typeKey) {
    return graphQlBean.reference(typeKey);
};


//Query execution
exports.execute = function (schema, query, variables) {
    return __.toNativeObject(graphQlBean.execute(schema, query, __.toScriptValue(variables)));
};

//Util functions
function required(params, name) {
    var value = params[name];
    if (value === undefined) {
        log.info('error:' + JSON.stringify(params) );
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
