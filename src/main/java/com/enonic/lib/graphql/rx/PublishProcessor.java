package com.enonic.lib.graphql.rx;

import org.reactivestreams.Processor;
import org.reactivestreams.Subscriber;
import org.reactivestreams.Subscription;

import io.reactivex.FlowableSubscriber;
import io.reactivex.functions.Predicate;

public class PublishProcessor<T>
    implements org.reactivestreams.Publisher<T>, Processor<T, T>, FlowableSubscriber<T>

{
    private io.reactivex.processors.PublishProcessor<T> publishProcessor;

    public PublishProcessor( final io.reactivex.processors.PublishProcessor publishProcessor )
    {
        this.publishProcessor = publishProcessor;
    }

    @Override
    public void subscribe( final Subscriber<? super T> subscriber )
    {
        publishProcessor.subscribe( subscriber );
    }

    @Override
    public void onSubscribe( final Subscription subscription )
    {
        publishProcessor.onSubscribe( subscription );
    }

    @Override
    public void onNext( final T t )
    {
        publishProcessor.onNext( t );
    }

    @Override
    public void onError( final Throwable throwable )
    {
        publishProcessor.onError( throwable );
    }

    @Override
    public void onComplete()
    {
        publishProcessor.onComplete();
    }

    public final Flowable<T> filter( Predicate<? super T> predicate )
    {
        return new Flowable( publishProcessor.filter( predicate ) );
    }


}
