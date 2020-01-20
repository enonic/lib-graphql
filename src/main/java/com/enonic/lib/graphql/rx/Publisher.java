package com.enonic.lib.graphql.rx;

import org.reactivestreams.Subscriber;

import com.fasterxml.jackson.annotation.JsonIgnoreType;

@JsonIgnoreType
public class Publisher
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
