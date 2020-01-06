package com.enonic.lib.graphql;

public class SingleSubscriberPublisher
    extends graphql.execution.reactive.SingleSubscriberPublisher
{
    public void onNext( Object data )
    {
        offer( data );
    }

    public void onError( Throwable throwable )
    {
        offerError( throwable );
    }

    public void onComplete()
    {
        noMoreData();
    }
}
