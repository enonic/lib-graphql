package com.enonic.lib.graphql.rx;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.reactivestreams.Subscriber;
import org.reactivestreams.Subscription;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class PublishProcessorTest
{
    @Test
    public void delivers_submitted_items_to_subscriber()
    {
        final PublishProcessor<Integer> processor = new PublishProcessor<>();
        final CollectingSubscriber<Integer> subscriber = new CollectingSubscriber<>();
        processor.subscribe( subscriber );

        processor.onNext( 1 );
        processor.onNext( 2 );
        processor.onComplete();

        assertEquals( List.of( 1, 2 ), subscriber.items );
        assertTrue( subscriber.completed );
    }

    @Test
    public void filter_forwards_only_matching_items()
    {
        final PublishProcessor<Integer> processor = new PublishProcessor<>();
        final CollectingSubscriber<Integer> subscriber = new CollectingSubscriber<>();
        processor.filter( value -> value % 2 == 0 ).subscribe( subscriber );

        processor.onNext( 1 );
        processor.onNext( 2 );
        processor.onNext( 3 );
        processor.onNext( 4 );
        processor.onComplete();

        assertEquals( List.of( 2, 4 ), subscriber.items );
        assertTrue( subscriber.completed );
    }

    @Test
    public void filter_propagates_predicate_failure_as_error()
    {
        final PublishProcessor<Integer> processor = new PublishProcessor<>();
        final CollectingSubscriber<Integer> subscriber = new CollectingSubscriber<>();
        processor.filter( value -> {
            throw new IllegalStateException( "boom" );
        } ).subscribe( subscriber );

        processor.onNext( 1 );

        assertTrue( subscriber.items.isEmpty() );
        assertTrue( subscriber.error instanceof IllegalStateException );
    }

    private static final class CollectingSubscriber<T>
        implements Subscriber<T>
    {
        private final List<T> items = new ArrayList<>();

        private boolean completed;

        private Throwable error;

        @Override
        public void onSubscribe( final Subscription subscription )
        {
            subscription.request( Long.MAX_VALUE );
        }

        @Override
        public void onNext( final T item )
        {
            items.add( item );
        }

        @Override
        public void onError( final Throwable throwable )
        {
            this.error = throwable;
        }

        @Override
        public void onComplete()
        {
            this.completed = true;
        }
    }
}
