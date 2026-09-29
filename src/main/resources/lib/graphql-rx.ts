/**
 * Subscription publishers and subscribers for `/lib/graphql`.
 *
 * ```js
 * var graphQlRxLib = require('/lib/graphql-rx');
 *
 * var processor = graphQlRxLib.createPublishProcessor();
 * var subscriber = graphQlRxLib.createSubscriber({
 *     onNext: function (result) {
 *         log.info('%s', result.data);
 *     },
 * });
 * ```
 *
 * @module /lib/graphql-rx
 */

import type { ScriptValue } from '@enonic-types/core';
import type { ExecutionResult } from './graphql';

declare global {
    interface XpLibraries {
        '/lib/graphql-rx': typeof import('./graphql-rx');
    }
}

/**
 * Structural stand-in for `java.lang.Throwable`. Construct one with `Java.type()` — a string or a
 * JavaScript `Error` is not accepted at runtime.
 */
export interface Throwable {
    getMessage(): string | null;
}

/** A subscriber returned by `createSubscriber()`. It has no constructor. */
export interface SubscriptionSubscriber {
    readonly _kind?: 'Subscriber';
    /** Cancels its active subscription. Calling it before subscription or more than once has no effect. */
    cancelSubscription(): void;
}

/** Alias kept for reactive-streams familiarity. */
export type Subscriber = SubscriptionSubscriber;

/**
 * A publisher of values. Filters can be chained; each `filter` call returns a new publisher and
 * leaves the source untouched.
 */
export interface Flowable<T = unknown> {
    /** Forwards only the values the predicate accepts. */
    filter(predicate: (value: T) => boolean): Flowable<T>;
    /** Subscribes a subscriber created with `createSubscriber()`. */
    subscribe(subscriber: SubscriptionSubscriber): void;
}

/**
 * A reactive event source returned by `createPublishProcessor()`. Push values with `onNext`, close
 * with `onComplete`, or fail with `onError`. Return one, optionally filtered, from a subscription
 * field resolver.
 */
export interface PublishProcessor<T = unknown> extends Flowable<T> {
    readonly _kind?: 'PublishProcessor';
    /** Publishes a value to active subscribers. It becomes the `source` of the subscription field's resolver. */
    onNext(value: T): void;
    /** Terminates the stream with an error. Takes a Java `Throwable` constructed with `Java.type()`. */
    onError(error: Throwable): void;
    /** Completes the stream. Subscribers receive no further events. */
    onComplete(): void;
}

export interface CreateSubscriberParams<Data = unknown> {
    /** Called with each mapped `ExecutionResult` produced by a subscription. */
    onNext?: (result: ExecutionResult<Data>) => void;
}

interface RxBean {
    createPublishProcessor(): PublishProcessor;
    createSubscriber(onNext: ScriptValue | null): SubscriptionSubscriber;
}

const rxBean = __.newBean<RxBean>('com.enonic.lib.graphql.reactive.RxBean');

/** Creates a publish processor that can be returned by a subscription field resolver. */
export function createPublishProcessor<T = unknown>(): PublishProcessor<T> {
    return rxBean.createPublishProcessor() as PublishProcessor<T>;
}

/** Creates a subscriber for the publisher returned as `data` by a subscription execution. */
export function createSubscriber<Data = unknown>(params: CreateSubscriberParams<Data>): SubscriptionSubscriber {
    const onNext = params.onNext === undefined ? null : params.onNext;
    return rxBean.createSubscriber(__.toScriptValue(onNext));
}
