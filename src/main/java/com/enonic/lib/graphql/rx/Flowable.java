package com.enonic.lib.graphql.rx;

import org.reactivestreams.Publisher;
import org.reactivestreams.Subscriber;

public class Flowable<T>
    implements Publisher<T>
{
    private io.reactivex.Flowable<T> flowable;

    public Flowable( final io.reactivex.Flowable<T> flowable )
    {
        this.flowable = flowable;
    }

    @Override
    public void subscribe( final Subscriber<? super T> subscriber )
    {
        flowable.subscribe( subscriber );
    }
}
