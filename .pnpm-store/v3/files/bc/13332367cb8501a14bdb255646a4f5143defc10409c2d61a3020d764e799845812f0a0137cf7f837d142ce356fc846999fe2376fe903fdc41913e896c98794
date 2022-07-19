import { MetricAttributes } from '@opentelemetry/api-metrics';
import { InstrumentationLibrary } from '@opentelemetry/core';
export declare type Maybe<T> = T | undefined;
export declare function isNotNullish<T>(item: Maybe<T>): item is T;
/**
 * Converting the unordered attributes into unique identifier string.
 * @param attributes user provided unordered MetricAttributes.
 */
export declare function hashAttributes(attributes: MetricAttributes): string;
/**
 * Converting the instrumentation library object to a unique identifier string.
 * @param instrumentationLibrary
 */
export declare function instrumentationLibraryId(instrumentationLibrary: InstrumentationLibrary): string;
/**
 * Error that is thrown on timeouts.
 */
export declare class TimeoutError extends Error {
    constructor(message?: string);
}
/**
 * Adds a timeout to a promise and rejects if the specified timeout has elapsed. Also rejects if the specified promise
 * rejects, and resolves if the specified promise resolves.
 *
 * <p> NOTE: this operation will continue even after it throws a {@link TimeoutError}.
 *
 * @param promise promise to use with timeout.
 * @param timeout the timeout in milliseconds until the returned promise is rejected.
 */
export declare function callWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T>;
//# sourceMappingURL=utils.d.ts.map