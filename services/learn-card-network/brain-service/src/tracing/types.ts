export type SpanStatus = 'ok' | 'error';

export interface SpanContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    op: string;
    name: string;
    startTime: number;
    data?: Record<string, unknown>;
}

export interface SpanResult {
    endTime: number;
    durationMs: number;
    status: SpanStatus;
    error?: Error;
}

export interface TracingProvider {
    name: string;

    isEnabled(): boolean;

    onSpanStart(context: SpanContext): void;

    onSpanEnd(context: SpanContext, result: SpanResult): void;
}
