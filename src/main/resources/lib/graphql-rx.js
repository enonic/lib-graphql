const rxBean = __.newBean('com.enonic.lib.graphql.rx.RxBean');

exports.createPublishProcessor = function () {
    return rxBean.createPublishProcessor();
};

exports.createSubscriber = function (params) {
    const onNext = optional(params, 'onNext');
    return rxBean.createSubscriber(__.toScriptValue(onNext));
};

function optional(params, name) {
    var value = params[name];
    if (value === undefined) {
        return null;
    }
    return value;
}