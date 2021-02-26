var graphQlLib = require('/lib/graphql');
var assert = require('/lib/xp/testing');
var schemaGenerator = graphQlLib.schemaGenerator();

var database = [
    {
        name: 'Employee 1',
        dateOfBirth: '1980-03-03',
        creationTime: '2021-02-23T12:32:35',
        workingSchedule: {
            startTime: '09:00:00',
            endTime: '18:00'
        }
    },
    {
        name: 'Employee 2',
        dateOfBirth: '1981-12-03',
        creationTime: '2020-02-23T12:32:30',
        workingSchedule: {
            startTime: '09:00:00',
            endTime: '15:00'
        }
    }];

var employeeObjectType = schemaGenerator.createObjectType({
    name: 'Employee',
    description: 'TestScalars type.',
    fields: {
        name: {
            type: graphQlLib.GraphQLString,
            resolve: function (env) {
                return env.source.name;
            }
        },
        dateOfBirth: {
            type: graphQlLib.Date,
            resolve: function (env) {
                return env.source.dateOfBirth;
            }
        },
        creationTime: {
            type: graphQlLib.LocalDateTime,
            resolve: function (env) {
                return env.source.creationTime;
            }
        },
        workingScheduleStartTime: {
            type: graphQlLib.LocalTime,
            resolve: function (env) {
                return env.source.workingSchedule.startTime;
            }
        },
        workingScheduleEndTime: {
            type: graphQlLib.LocalTime,
            resolve: function (env) {
                return env.source.workingSchedule.endTime;
            }
        }
    }
});

var rootQueryType = schemaGenerator.createObjectType({
    name: 'Query',
    fields: {
        getEmployees: {
            type: graphQlLib.list(employeeObjectType),
            args: {
                dateOfBirth: graphQlLib.Date,
                creationTime: graphQlLib.LocalDateTime,
                endWorkAt: graphQlLib.LocalTime
            },
            resolve: function (env) {
                if (env.args.dateOfBirth) {
                    return database.filter(e => e.dateOfBirth === env.args.dateOfBirth);
                } else if (env.args.creationTime) {
                    return database.filter(e => e.creationTime === env.args.creationTime);
                } else if (env.args.endWorkAt) {
                    return database.filter(e => e.workingSchedule.endTime === env.args.endWorkAt);
                } else {
                    return [];
                }
            }
        }
    }
});

var schema = schemaGenerator.createSchema({
    query: rootQueryType
});

exports.post = function (req) {
    var body = JSON.parse(req.body);
    var result = graphQlLib.execute(schema, body.query, body.variables);
    return {
        contentType: 'application/json',
        body: result
    };
};

exports.test = function () {
    var query = 'query($dateOfBirth: Date){getEmployees(dateOfBirth:$dateOfBirth){name, dateOfBirth, creationTime, workingScheduleStartTime, workingScheduleEndTime}}';
    var variables = {dateOfBirth: '1980-03-03'};
    var result = exports.post({
        body: JSON.stringify({query: query, variables: variables})
    }).body;
    assert.assertJsonEquals({
        data: {
            getEmployees: [{
                name: 'Employee 1',
                dateOfBirth: '1980-03-03',
                creationTime: '2021-02-23T12:32:35',
                workingScheduleStartTime: '09:00:00',
                workingScheduleEndTime: '18:00:00'
            }]
        }
    }, result);


    query =
        'query($creationTime: LocalDateTime){getEmployees(creationTime:$creationTime){name, dateOfBirth, creationTime, workingScheduleStartTime, workingScheduleEndTime}}';
    variables = {creationTime: '2020-02-23T12:32:30'};
    result = exports.post({
        body: JSON.stringify({query: query, variables: variables})
    }).body;
    assert.assertJsonEquals({
        data: {
            getEmployees: [{
                name: 'Employee 2',
                dateOfBirth: '1981-12-03',
                creationTime: '2020-02-23T12:32:30',
                workingScheduleStartTime: '09:00:00',
                workingScheduleEndTime: '15:00:00'
            }]
        }
    }, result);

    query =
        'query($endWorkAt: LocalTime){getEmployees(endWorkAt:$endWorkAt){name, dateOfBirth, creationTime, workingScheduleStartTime, workingScheduleEndTime}}';
    variables = {endWorkAt: '15:00'};
    result = exports.post({
        body: JSON.stringify({query: query, variables: variables})
    }).body;
    assert.assertJsonEquals({
        data: {
            getEmployees: [{
                name: 'Employee 2',
                dateOfBirth: '1981-12-03',
                creationTime: '2020-02-23T12:32:30',
                workingScheduleStartTime: '09:00:00',
                workingScheduleEndTime: '15:00:00'
            }]
        }
    }, result);
};
