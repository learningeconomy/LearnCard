import { TracingManager } from './manager';
import { ConsoleTracingProvider } from './providers/console.provider';
import { SentryTracingProvider } from './providers/sentry.provider';
import { JsonTracingProvider } from './providers/json.provider';

const manager = new TracingManager();

// Register providers (they self-enable based on env)
manager.register(new ConsoleTracingProvider());
manager.register(new SentryTracingProvider());
manager.register(new JsonTracingProvider());

/**
 * Trace an async operation with timing and provider integration.
 *
 * @param op - Operation category (e.g., 'db', 'http', 'crypto')
 * @param name - Descriptive name for the operation
 * @param fn - Async function to trace
 * @param data - Optional metadata to attach to the span
 */
export const trace = <T>(
    op: string,
    name: string,
    fn: () => Promise<T>,
    data?: Record<string, unknown>
): Promise<T> => {
    return manager.trace(op, name, fn, data);
};

/**
 * Trace a database operation.
 */
export const traceDb = <T>(
    name: string,
    fn: () => Promise<T>,
    data?: Record<string, unknown>
): Promise<T> => {
    return trace('db', name, fn, data);
};

/**
 * Trace an HTTP client operation.
 */
export const traceHttp = <T>(
    name: string,
    fn: () => Promise<T>,
    data?: Record<string, unknown>
): Promise<T> => {
    return trace('http', name, fn, data);
};

/**
 * Trace a cryptographic operation.
 */
export const traceCrypto = <T>(
    name: string,
    fn: () => Promise<T>,
    data?: Record<string, unknown>
): Promise<T> => {
    return trace('crypto', name, fn, data);
};

/**
 * Trace an internal/business logic operation.
 */
export const traceInternal = <T>(
    name: string,
    fn: () => Promise<T>,
    data?: Record<string, unknown>
): Promise<T> => {
    return trace('internal', name, fn, data);
};

export type { TracingProvider, SpanContext, SpanResult, SpanStatus } from './types';
