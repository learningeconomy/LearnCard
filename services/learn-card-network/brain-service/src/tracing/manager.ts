import { randomUUID } from 'crypto';

import type { TracingProvider, SpanContext, SpanResult, SpanStatus } from './types';

export class TracingManager {
    private providers: TracingProvider[] = [];

    private spanStack: SpanContext[] = [];

    private traceId: string | null = null;

    register(provider: TracingProvider): void {
        if (provider.isEnabled()) {
            this.providers.push(provider);
            console.log(`[Tracing] Registered provider: ${provider.name}`);
        }
    }

    async trace<T>(
        op: string,
        name: string,
        fn: () => Promise<T>,
        data?: Record<string, unknown>
    ): Promise<T> {
        // Start new trace if this is root span
        if (!this.traceId) {
            this.traceId = randomUUID().replace(/-/g, '').slice(0, 16);
        }

        const context: SpanContext = {
            traceId: this.traceId,
            spanId: randomUUID().replace(/-/g, '').slice(0, 16),
            parentSpanId: this.spanStack[this.spanStack.length - 1]?.spanId,
            op,
            name,
            startTime: Date.now(),
            data,
        };

        this.spanStack.push(context);
        this.providers.forEach(p => p.onSpanStart(context));

        let status: SpanStatus = 'ok';
        let error: Error | undefined;

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
            this.spanStack.pop();

            // Clear trace ID when root span ends
            if (this.spanStack.length === 0) {
                this.traceId = null;
            }
        }
    }
}
