package com.enonic.lib.graphql.rx;

import java.util.concurrent.Flow;
import java.util.concurrent.SubmissionPublisher;
import java.util.function.Predicate;

import org.reactivestreams.FlowAdapters;
import org.reactivestreams.Subscriber;

public class PublishProcessor<T>
    implements org.reactivestreams.Publisher<T>
{
    private final SubmissionPublisher<T> submissionPublisher;

    public PublishProcessor()
    {
        // Deliver synchronously on the thread that calls onNext, so the downstream subscriber
        // (which invokes JavaScript) runs in the caller's XP execution context rather than on a
        // pooled thread.
        this.submissionPublisher = new SubmissionPublisher<>( Runnable::run, Flow.defaultBufferSize() );
    }

    @Override
    public void subscribe( final Subscriber<? super T> subscriber )
    {
        submissionPublisher.subscribe( FlowAdapters.toFlowSubscriber( subscriber ) );
    }

    public void onNext( final T item )
    {
        submissionPublisher.submit( item );
    }

    public void onError( final Throwable throwable )
    {
        submissionPublisher.closeExceptionally( throwable );
    }

    public void onComplete()
    {
        submissionPublisher.close();
    }

    public final Flowable<T> filter( final Predicate<? super T> predicate )
    {
        return new Flowable<>( this ).filter( predicate );
    }
}
