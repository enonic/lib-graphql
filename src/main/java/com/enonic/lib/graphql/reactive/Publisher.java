package com.enonic.lib.graphql.reactive;

import org.reactivestreams.Subscriber;

public class Publisher<T>
{
    private final org.reactivestreams.Publisher publisher;

    public Publisher( final org.reactivestreams.Publisher publisher )
    {
        this.publisher = publisher;
    }

    public void subscribe( final Subscriber subscriber )
    {
        publisher.subscribe( subscriber );
    }
}
