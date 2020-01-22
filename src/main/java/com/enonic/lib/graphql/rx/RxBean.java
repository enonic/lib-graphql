package com.enonic.lib.graphql.rx;

import org.reactivestreams.Subscriber;

import com.enonic.xp.script.ScriptValue;

public class RxBean
{
    public PublishProcessor<Object> createPublishProcessor()
    {
        return new PublishProcessor( io.reactivex.processors.PublishProcessor.create() );
    }

    public Subscriber createSubscriber( final ScriptValue onNext )
    {
        return new ExecutionResultSubscriber( onNext );
    }
}
