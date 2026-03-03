import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

import type { TracingProvider, SpanContext, SpanResult, SpanStatus } from './types';

/**
 * Request-scoped trace context stored in AsyncLocalStorage.
 * This ensures concurrent requests don't interfere with each other's spans.
 */
interface TraceStore {
    traceId: string;
    spanStack: SpanContext[];
}

export class TracingManager {
    private providers: TracingProvider[] = [];

    private asyncLocalStorage = new AsyncLocalStorage<TraceStore>();

    register(provider: TracingProvider): void {
        if (provider.isEnabled()) {
            this.providers.push(provider);
            console.log(`[Tracing] Registered provider: ${provider.name}`);
        }
    }

    /**
     * Get or create request-scoped trace store.
     * Falls back to creating a new store if not in an async context.
     */
    private getStore(): TraceStore {
        const existing = this.asyncLocalStorage.getStore();

        if (existing) {
            return existing;
        }

        // Create new store for root span (will be used for this async context)
        return {
            traceId: randomUUID().replace(/-/g, '').slice(0, 16),
            spanStack: [],
        };
    }

    async trace<T>(
        op: string,
        name: string,
        fn: () => Promise<T>,
        data?: Record<string, unknown>
    ): Promise<T> {
        const store = this.getStore();
        const isRoot = !this.asyncLocalStorage.getStore();

        const context: SpanContext = {
            traceId: store.traceId,
            spanId: randomUUID().replace(/-/g, '').slice(0, 16),
            parentSpanId: store.spanStack[store.spanStack.length - 1]?.spanId,
            op,
            name,
            startTime: Date.now(),
            data,
        };

        store.spanStack.push(context);
        this.providers.forEach(p => p.onSpanStart(context));

        let status: SpanStatus = 'ok';
        let error: Error | undefined;

        const execute = async (): Promise<T> => {
            try {
                return await fn();
            } catch (e) {
                status = 'error';
                error = e as Error;
                throw e;
            } finally {
                const result: SpanResult = {
                    endTime: Date.now(),
                    durationMs: Date.now() - context.startTime,
                    status,
                    error,
                };

                this.providers.forEach(p => p.onSpanEnd(context, result));
                store.spanStack.pop();
            }
        };

        // If this is the root span, run within AsyncLocalStorage context
        if (isRoot) {
            return this.asyncLocalStorage.run(store, execute);
        }

        return execute();
    }
}
