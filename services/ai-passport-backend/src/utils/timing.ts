import type { ServerWebSocket } from 'bun';

export type TimingPhase = 'start' | 'end' | 'complete';

export interface TimingData {
    operation: string;
    phase: TimingPhase;
    duration?: number;
    metadata?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
    action?: string;
}

const activeTimers = new Map<string, number>();

export function startTiming(operation: string, metadata?: Record<string, unknown>): void {
    const key = `${operation}_${JSON.stringify(metadata || {})}`;
    activeTimers.set(key, performance.now());
}

export function endTiming(
    operation: string,
    metadata?: Record<string, unknown>
): TimingData | null {
    const key = `${operation}_${JSON.stringify(metadata || {})}`;
    const startTime = activeTimers.get(key);

    if (!startTime) return null;

    activeTimers.delete(key);
    const duration = Math.round(performance.now() - startTime);

    return {
        operation,
        phase: 'complete',
        duration,
        metadata,
        timestamp: new Date().toISOString(),
    };
}

export function sendTimingEvent(
    ws: ServerWebSocket<{ did: string; type?: string }>,
    timing: TimingData
): void {
    if (ws.readyState !== WebSocket.OPEN) return;

    try {
        ws.send(
            JSON.stringify({
                event: 'timing',
                data: timing,
            })
        );
    } catch {}
}

export type RequestTiming = {
    mark: (operation: string, metadata?: Record<string, unknown>) => void;
    markFirstDelta: (metadata?: Record<string, unknown>) => void;
};

export type RequestTimingOptions = {
    ws: ServerWebSocket<{ did: string; type?: string }>;
    requestId: string;
    action: string;
    now?: () => number;
    send?: (timing: TimingData) => void;
};

export function createRequestTiming({
    ws,
    requestId,
    action,
    now = () => performance.now(),
    send,
}: RequestTimingOptions): RequestTiming {
    const startedAt = now();
    let firstDeltaMarked = false;

    const mark = (operation: string, metadata?: Record<string, unknown>): void => {
        const timing: TimingData = {
            requestId,
            action,
            operation,
            phase: 'complete',
            duration: Math.round(now() - startedAt),
            metadata,
            timestamp: new Date().toISOString(),
        };

        if (send) {
            send(timing);
        } else {
            sendTimingEvent(ws, timing);
        }
    };

    return {
        mark,
        markFirstDelta: metadata => {
            if (firstDeltaMarked) return;

            firstDeltaMarked = true;
            mark('plan.first_delta', metadata);
        },
    };
}

export async function timeOperation<T>(
    ws: ServerWebSocket<{ did: string; type?: string }>,
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
): Promise<T> {
    const startTime = performance.now();

    sendTimingEvent(ws, {
        operation,
        phase: 'start',
        metadata,
        timestamp: new Date().toISOString(),
    });

    try {
        const result = await fn();
        const duration = Math.round(performance.now() - startTime);

        sendTimingEvent(ws, {
            operation,
            phase: 'complete',
            duration,
            metadata: { ...metadata, success: true },
            timestamp: new Date().toISOString(),
        });

        return result;
    } catch (error) {
        const duration = Math.round(performance.now() - startTime);

        sendTimingEvent(ws, {
            operation,
            phase: 'complete',
            duration,
            metadata: {
                ...metadata,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            timestamp: new Date().toISOString(),
        });

        throw error;
    }
}
