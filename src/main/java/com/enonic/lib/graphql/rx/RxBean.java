package com.enonic.lib.graphql.rx;

import org.reactivestreams.Subscriber;

import io.reactivex.processors.PublishProcessor;

import com.enonic.xp.script.ScriptValue;

public class RxBean
{
    public PublishProcessor<Object> createPublishProcessor()
    {
        return PublishProcessor.create();
    }

    public Subscriber createSubscriber( final ScriptValue onNext )
    {
        return new ExecutionResultSubscriber( onNext );
    }
}
