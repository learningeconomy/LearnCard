import { atom } from 'nanostores';

export type TimingEvent = {
    operation: string;
    phase: 'start' | 'complete';
    duration?: number;
    metadata?: Record<string, unknown>;
    timestamp: string;
};

type ActiveOperation = {
    operation: string;
    startTime: number;
    metadata?: Record<string, unknown>;
};

export const timingEvents = atom<TimingEvent[]>([]);
export const activeOperations = atom<Map<string, ActiveOperation>>(new Map());
export const isDebugPanelOpen = atom(false);

export function addTimingEvent(event: TimingEvent) {
    const current = timingEvents.get();
    timingEvents.set([...current, event]);

    const active = activeOperations.get();

    if (event.phase === 'start') {
        active.set(event.operation, {
            operation: event.operation,
            startTime: performance.now(),
            metadata: event.metadata,
        });
        activeOperations.set(new Map(active));
    } else if (event.phase === 'complete') {
        active.delete(event.operation);
        activeOperations.set(new Map(active));
    }
}

export function clearTimingEvents() {
    timingEvents.set([]);
    activeOperations.set(new Map());
}

export function toggleDebugPanel() {
    isDebugPanelOpen.set(!isDebugPanelOpen.get());
}

export function openDebugPanel() {
    isDebugPanelOpen.set(true);
}

export function closeDebugPanel() {
    isDebugPanelOpen.set(false);
}
