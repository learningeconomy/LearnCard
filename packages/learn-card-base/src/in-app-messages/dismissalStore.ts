import type { InAppMessage, InAppMessageFrequency } from '@learncard/types';

const STORAGE_KEY = 'lcb-in-app-messages-seen';

const sessionSeen = new Set<string>();

const readSeenMap = (): Record<string, string> => {
    try {
        const raw = globalThis.localStorage?.getItem(STORAGE_KEY);

        return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
        return {};
    }
};

const writeSeenMap = (map: Record<string, string>): void => {
    try {
        globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        // Storage unavailable (private mode / SSR) — suppression degrades to session-only.
    }
};

const daysBetween = (fromIso: string, now: number): number => {
    const from = new Date(fromIso).getTime();

    if (Number.isNaN(from)) return Infinity;

    return (now - from) / (1000 * 60 * 60 * 24);
};

export const shouldSuppressMessage = (
    id: string,
    frequency: InAppMessageFrequency,
    now: number = Date.now()
): boolean => {
    if (frequency === 'always') return false;
    if (frequency === 'session') return sessionSeen.has(id);

    const lastSeen = readSeenMap()[id];

    if (frequency === 'once') return Boolean(lastSeen);

    if (typeof frequency === 'object' && 'everyDays' in frequency) {
        if (!lastSeen) return false;

        return daysBetween(lastSeen, now) < frequency.everyDays;
    }

    return false;
};

export const markMessageSeen = (
    id: string,
    frequency: InAppMessageFrequency,
    now: number = Date.now()
): void => {
    sessionSeen.add(id);

    if (frequency === 'always' || frequency === 'session') return;

    const map = readSeenMap();

    map[id] = new Date(now).toISOString();
    writeSeenMap(map);
};

export const filterSuppressed = (
    messages: InAppMessage[],
    now: number = Date.now()
): InAppMessage[] => messages.filter(m => !shouldSuppressMessage(m.id, m.frequency, now));

const resetListeners = new Set<() => void>();

export const onDismissalsReset = (listener: () => void): (() => void) => {
    resetListeners.add(listener);

    return () => resetListeners.delete(listener);
};

export const resetInAppMessageDismissals = (): void => {
    sessionSeen.clear();
    writeSeenMap({});
    resetListeners.forEach(listener => listener());
};
