import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { TracingManager } from '../src/tracing/manager';
import type { TracingProvider, SpanContext, SpanResult } from '../src/tracing/types';

describe('TracingManager', () => {
    let manager: TracingManager;
    let mockProvider: TracingProvider;
    let startSpanCalls: SpanContext[];
    let endSpanCalls: Array<{ context: SpanContext; result: SpanResult }>;

    beforeEach(() => {
        manager = new TracingManager();
        startSpanCalls = [];
        endSpanCalls = [];

        mockProvider = {
            name: 'mock',
            isEnabled: () => true,
            onSpanStart: (ctx: SpanContext) => {
                startSpanCalls.push(ctx);
            },
            onSpanEnd: (ctx: SpanContext, result: SpanResult) => {
                endSpanCalls.push({ context: ctx, result });
            },
        };

        manager.register(mockProvider);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('trace()', () => {
        it('should call onSpanStart and onSpanEnd for a successful operation', async () => {
            const result = await manager.trace('test', 'operation', async () => 'result');

            expect(result).toBe('result');
            expect(startSpanCalls).toHaveLength(1);
            expect(endSpanCalls).toHaveLength(1);

            expect(startSpanCalls[0]!.op).toBe('test');
            expect(startSpanCalls[0]!.name).toBe('operation');
            expect(endSpanCalls[0]!.result.status).toBe('ok');
            expect(endSpanCalls[0]!.result.durationMs).toBeGreaterThanOrEqual(0);
        });

        it('should set error status when operation throws', async () => {
            const testError = new Error('test error');

            await expect(
                manager.trace('test', 'failing-op', async () => {
                    throw testError;
                })
            ).rejects.toThrow('test error');

            expect(startSpanCalls).toHaveLength(1);
            expect(endSpanCalls).toHaveLength(1);
            expect(endSpanCalls[0]!.result.status).toBe('error');
            expect(endSpanCalls[0]!.result.error).toBe(testError);
        });

        it('should generate unique trace and span IDs', async () => {
            await manager.trace('test', 'op1', async () => 'a');
            await manager.trace('test', 'op2', async () => 'b');

            expect(startSpanCalls[0]!.traceId).toBeDefined();
            expect(startSpanCalls[1]!.traceId).toBeDefined();
            expect(startSpanCalls[0]!.spanId).not.toBe(startSpanCalls[1]!.spanId);
        });

        it('should track parent-child relationships for nested traces', async () => {
            await manager.trace('parent', 'outer', async () => {
                await manager.trace('child', 'inner', async () => 'nested');

                return 'outer';
            });

            expect(startSpanCalls).toHaveLength(2);

            const outerSpan = startSpanCalls[0]!;
            const innerSpan = startSpanCalls[1]!;

            expect(outerSpan.parentSpanId).toBeUndefined();
            expect(innerSpan.parentSpanId).toBe(outerSpan.spanId);
            expect(innerSpan.traceId).toBe(outerSpan.traceId);
        });

        it('should attach metadata to spans', async () => {
            await manager.trace('test', 'with-meta', async () => 'result', {
                userId: '123',
                action: 'test',
            });

            expect(startSpanCalls[0]!.data).toEqual({
                userId: '123',
                action: 'test',
            });
        });

        it('should measure duration correctly', async () => {
            const delay = 50;

            await manager.trace('test', 'delayed', async () => {
                await new Promise(resolve => setTimeout(resolve, delay));

                return 'done';
            });

            expect(endSpanCalls[0]!.result.durationMs).toBeGreaterThanOrEqual(delay - 10);
        });
    });

    describe('register()', () => {
        it('should only register enabled providers', () => {
            const newManager = new TracingManager();
            const disabledCalls: SpanContext[] = [];

            const disabledProvider: TracingProvider = {
                name: 'disabled',
                isEnabled: () => false,
                onSpanStart: (ctx: SpanContext) => {
                    disabledCalls.push(ctx);
                },
                onSpanEnd: () => {},
            };

            newManager.register(disabledProvider);

            // Run a trace - disabled provider should not be called
            newManager.trace('test', 'op', async () => 'result');

            expect(disabledCalls).toHaveLength(0);
        });
    });

    describe('request isolation (AsyncLocalStorage)', () => {
        it('should isolate concurrent traces', async () => {
            const trace1Spans: SpanContext[] = [];
            const trace2Spans: SpanContext[] = [];

            const isolationProvider: TracingProvider = {
                name: 'isolation-test',
                isEnabled: () => true,
                onSpanStart: (ctx: SpanContext) => {
                    if (ctx.name.startsWith('trace1')) {
                        trace1Spans.push(ctx);
                    } else if (ctx.name.startsWith('trace2')) {
                        trace2Spans.push(ctx);
                    }
                },
                onSpanEnd: () => {},
            };

            const isolatedManager = new TracingManager();
            isolatedManager.register(isolationProvider);

            // Run two traces concurrently
            await Promise.all([
                isolatedManager.trace('test', 'trace1-outer', async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    await isolatedManager.trace('test', 'trace1-inner', async () => 'inner1');

                    return 'outer1';
                }),
                isolatedManager.trace('test', 'trace2-outer', async () => {
                    await isolatedManager.trace('test', 'trace2-inner', async () => 'inner2');

                    return 'outer2';
                }),
            ]);

            // Each trace should have its own trace ID
            expect(trace1Spans).toHaveLength(2);
            expect(trace2Spans).toHaveLength(2);

            const trace1Id = trace1Spans[0]!.traceId;
            const trace2Id = trace2Spans[0]!.traceId;

            expect(trace1Id).not.toBe(trace2Id);

            // All spans in trace1 should share the same trace ID
            expect(trace1Spans[1]!.traceId).toBe(trace1Id);

            // All spans in trace2 should share the same trace ID
            expect(trace2Spans[1]!.traceId).toBe(trace2Id);

            // Parent-child relationships should be correct within each trace
            expect(trace1Spans[1]!.parentSpanId).toBe(trace1Spans[0]!.spanId);
            expect(trace2Spans[1]!.parentSpanId).toBe(trace2Spans[0]!.spanId);
        });
    });
});
