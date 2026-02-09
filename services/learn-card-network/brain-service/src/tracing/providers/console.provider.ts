import type { TracingProvider, SpanContext, SpanResult } from '../types';

export class ConsoleTracingProvider implements TracingProvider {
    name = 'console';

    private depthMap = new Map<string, number>();

    isEnabled(): boolean {
        return process.env.TRACE_CONSOLE !== 'false';
    }

    onSpanStart(ctx: SpanContext): void {
        const currentDepth = this.depthMap.get(ctx.traceId) ?? 0;
        this.depthMap.set(ctx.traceId, currentDepth + 1);
    }

    onSpanEnd(ctx: SpanContext, result: SpanResult): void {
        const depth = (this.depthMap.get(ctx.traceId) ?? 1) - 1;
        const indent = '  '.repeat(depth);
        const status = result.status === 'error' ? '❌' : '✓';
        const prefix = `[TRACE:${ctx.traceId.slice(0, 6)}]`;

        console.log(`${prefix}${indent}${status} ${ctx.op}:${ctx.name} ${result.durationMs}ms`);

        if (depth === 0) {
            this.depthMap.delete(ctx.traceId);
        } else {
            this.depthMap.set(ctx.traceId, depth);
        }
    }
}
