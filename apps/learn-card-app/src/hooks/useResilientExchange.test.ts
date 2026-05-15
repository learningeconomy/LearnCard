import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type {
    AttemptLog,
    OrchestratorTelemetryEvent,
} from 'learn-card-base';

import { AnalyticsEvents } from '../analytics/events';

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));

vi.mock('../analytics/context', () => ({
    useAnalytics: () => ({ track: trackMock }),
}));

import { useResilientExchange } from './useResilientExchange';

const emptyLog: AttemptLog = {
    signersTried: [],
    transportRetries: 0,
    trustGapsAccepted: 0,
};

const succeededEvent = (attemptNumber: number): OrchestratorTelemetryEvent => ({
    type: 'attempt_succeeded',
    attemptNumber,
    strategyId: 'did-key',
    durationMs: 10,
    attemptLog: emptyLog,
});

const findCalls = (event: string) =>
    trackMock.mock.calls.filter(([name]) => name === event);

describe('useResilientExchange', () => {
    beforeEach(() => {
        trackMock.mockReset();
    });

    it('attributes telemetry to a stable run id within a single run', () => {
        const { result } = renderHook(() => useResilientExchange({ surface: 'vci' }));

        act(() => {
            result.current.callbacks.onTelemetry(succeededEvent(1));
        });

        const attemptCalls = findCalls(AnalyticsEvents.OPENID_RESILIENCE_ATTEMPT);
        const outcomeCalls = findCalls(AnalyticsEvents.OPENID_RESILIENCE_OUTCOME);

        expect(attemptCalls).toHaveLength(1);
        expect(outcomeCalls).toHaveLength(1);
        expect(attemptCalls[0][1].exchange_run_id).toBe(
            outcomeCalls[0][1].exchange_run_id
        );
    });

    it('resetRun() synchronously updates the run id seen by an already-captured callbacks reference', () => {
        const { result } = renderHook(() => useResilientExchange({ surface: 'vci' }));

        const callbacksBefore = result.current.callbacks;

        act(() => {
            callbacksBefore.onTelemetry(succeededEvent(1));
        });
        const originalRunId = trackMock.mock.calls[0][1].exchange_run_id;
        trackMock.mockReset();

        act(() => {
            result.current.resetRun();
            callbacksBefore.onTelemetry(succeededEvent(1));
        });

        const newRunId = trackMock.mock.calls[0][1].exchange_run_id;

        expect(newRunId).toBeTruthy();
        expect(newRunId).not.toBe(originalRunId);
    });

    it('resetRun() clears the outcome-reported guard so a second run emits a new outcome event', () => {
        const { result } = renderHook(() => useResilientExchange({ surface: 'vci' }));

        act(() => {
            result.current.callbacks.onTelemetry(succeededEvent(1));
        });
        expect(findCalls(AnalyticsEvents.OPENID_RESILIENCE_OUTCOME)).toHaveLength(1);

        act(() => {
            result.current.resetRun();
            result.current.callbacks.onTelemetry(succeededEvent(1));
        });

        expect(findCalls(AnalyticsEvents.OPENID_RESILIENCE_OUTCOME)).toHaveLength(2);
    });

    it('keeps the callbacks reference stable across resetRun() calls', () => {
        const { result } = renderHook(() => useResilientExchange({ surface: 'vci' }));

        const before = result.current.callbacks;

        act(() => {
            result.current.resetRun();
        });

        expect(result.current.callbacks).toBe(before);
    });
});
