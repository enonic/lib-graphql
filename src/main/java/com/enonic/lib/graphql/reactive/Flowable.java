package com.enonic.lib.graphql.reactive;

import java.util.function.Predicate;

import org.reactivestreams.Publisher;
import org.reactivestreams.Subscriber;
import org.reactivestreams.Subscription;

public class Flowable<T>
    implements Publisher<T>
{
    private final Publisher<T> source;

    public Flowable( final Publisher<T> source )
    {
        this.source = source;
    }

    @Override
    public void subscribe( final Subscriber<? super T> subscriber )
    {
        source.subscribe( subscriber );
    }

    public final Flowable<T> filter( final Predicate<? super T> predicate )
    {
        return new Flowable<>( subscriber -> source.subscribe( new FilteringSubscriber<>( subscriber, predicate ) ) );
    }

    private static final class FilteringSubscriber<T>
        implements Subscriber<T>, Subscription
    {
        private final Subscriber<? super T> downstream;

        private final Predicate<? super T> predicate;

        private Subscription upstream;

        FilteringSubscriber( final Subscriber<? super T> downstream, final Predicate<? super T> predicate )
        {
            this.downstream = downstream;
            this.predicate = predicate;
        }

        @Override
        public void onSubscribe( final Subscription subscription )
        {
            this.upstream = subscription;
            downstream.onSubscribe( this );
        }

        @Override
        public void onNext( final T item )
        {
            final boolean matches;
            try
            {
                matches = predicate.test( item );
            }
            catch ( final Throwable t )
            {
                upstream.cancel();
                downstream.onError( t );
                return;
            }

            if ( matches )
            {
                downstream.onNext( item );
            }
            else
            {
                // The dropped item consumed one unit of downstream demand; ask upstream to replace it.
                upstream.request( 1 );
            }
        }

        @Override
        public void onError( final Throwable throwable )
        {
            downstream.onError( throwable );
        }

        @Override
        public void onComplete()
        {
            downstream.onComplete();
        }

        @Override
        public void request( final long n )
        {
            upstream.request( n );
        }

        @Override
        public void cancel()
        {
            upstream.cancel();
        }
    }
}
