import * as Sentry from '@sentry/serverless';

import type { TracingProvider, SpanContext, SpanResult } from '../types';

interface SentrySpanLike {
    finish(): void;
    setStatus(status: string): void;
    startChild(opts: { op: string; description: string; data?: Record<string, unknown> }): SentrySpanLike;
}

export class SentryTracingProvider implements TracingProvider {
    name = 'sentry';

    private spans = new Map<string, SentrySpanLike>();

    private rootSpans = new Map<string, SentrySpanLike>();

    isEnabled(): boolean {
        return Boolean(process.env.SENTRY_DSN);
    }

    onSpanStart(ctx: SpanContext): void {
        let span: SentrySpanLike | undefined;

        if (!ctx.parentSpanId) {
            // Root span - try to get the active transaction or start a new one
            const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();

            if (transaction) {
                span = transaction.startChild({
                    op: ctx.op,
                    description: ctx.name,
                    data: ctx.data,
                }) as SentrySpanLike;
            }

            if (span) {
                this.rootSpans.set(ctx.traceId, span);
            }
        } else {
            // Child span - get parent and create child
            const parentSpan = this.spans.get(ctx.parentSpanId) || this.rootSpans.get(ctx.traceId);

            if (parentSpan) {
                span = parentSpan.startChild({
                    op: ctx.op,
                    description: ctx.name,
                    data: ctx.data,
                });
            }
        }

        if (span) {
            this.spans.set(ctx.spanId, span);
        }
    }

    onSpanEnd(ctx: SpanContext, result: SpanResult): void {
        const span = this.spans.get(ctx.spanId);

        if (span) {
            if (result.status === 'error') {
                span.setStatus('internal_error');
            } else {
                span.setStatus('ok');
            }

            span.finish();
            this.spans.delete(ctx.spanId);
        }

        // Clean up root span reference when trace ends
        if (!ctx.parentSpanId) {
            this.rootSpans.delete(ctx.traceId);
        }
    }
}
