package com.enonic.lib.graphql;

import org.reactivestreams.Subscription;

import graphql.ExecutionResult;

import com.enonic.xp.script.ScriptValue;

public class ExecutionResultSubscriber
    implements org.reactivestreams.Subscriber<ExecutionResult>
{
    private final ScriptValue onNext;

    private volatile Subscription subscription;

    public ExecutionResultSubscriber( ScriptValue onNext )
    {
        this.onNext = onNext;
    }

    @Override
    public void onSubscribe( final Subscription subscription )
    {
        this.subscription = subscription;
        subscription.request( 1 );
    }

    @Override
    public void onNext( final ExecutionResult executionResult )
    {
        final Subscription subscription = this.subscription;
        if ( subscription != null )
        {
            final Object data = executionResult.getData();
            System.out.println( "onNext:" + data );
            if ( onNext != null )
            {
                final ExecutionResultMapper executionResultMapper = new ExecutionResultMapper( executionResult );
                onNext.call( executionResultMapper );
            }
            subscription.request( 1 );
        }
    }

    @Override
    public void onError( final Throwable t )
    {

    }

    @Override
    public void onComplete()
    {

    }
}
