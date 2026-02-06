import type { TracingProvider, SpanContext, SpanResult } from '../types';

export class JsonTracingProvider implements TracingProvider {
    name = 'json';

    isEnabled(): boolean {
        return process.env.TRACE_JSON === 'true';
    }

    onSpanStart(_ctx: SpanContext): void {
        // JSON provider only logs on span end
    }

    onSpanEnd(ctx: SpanContext, result: SpanResult): void {
        console.log(
            JSON.stringify({
                type: 'TRACE_SPAN',
                traceId: ctx.traceId,
                spanId: ctx.spanId,
                parentSpanId: ctx.parentSpanId,
                op: ctx.op,
                name: ctx.name,
                durationMs: result.durationMs,
                status: result.status,
                timestamp: new Date(ctx.startTime).toISOString(),
                ...(ctx.data ?? {}),
            })
        );
    }
}
