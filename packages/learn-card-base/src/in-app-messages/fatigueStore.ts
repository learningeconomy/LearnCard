import type { InAppMessage, InAppMessageSettings } from '@learncard/types';

export const IN_APP_MESSAGE_FATIGUE_STORAGE_KEY = 'lcb-in-app-messages-fatigue';

const blockingShownThisSession = new Map<string, number>();
const lastShownInMemory = new Map<string, number>();
const listeners = new Set<() => void>();
export const onFatigueChanged = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const accountKey = (accountDid?: string): string => accountDid ?? 'anonymous';

const readLastBlockingShown = (accountDid?: string): number | null => {
    try {
        const raw = globalThis.localStorage?.getItem(IN_APP_MESSAGE_FATIGUE_STORAGE_KEY);

        if (!raw) return lastShownInMemory.get(accountKey(accountDid)) ?? null;

        const stored = JSON.parse(raw) as unknown;
        const value =
            typeof stored === 'object' && stored !== null
                ? (stored as Record<string, unknown>)[accountKey(accountDid)]
                : undefined;

        if (typeof value !== 'string') return null;

        const parsed = new Date(value).getTime();

        return Number.isNaN(parsed) ? null : parsed;
    } catch {
        return lastShownInMemory.get(accountKey(accountDid)) ?? null;
    }
};

const writeLastBlockingShown = (accountDid: string | undefined, now: number): void => {
    try {
        const raw = globalThis.localStorage?.getItem(IN_APP_MESSAGE_FATIGUE_STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : {};
        const stored =
            typeof parsed === 'object' && parsed !== null
                ? (parsed as Record<string, unknown>)
                : {};

        stored[accountKey(accountDid)] = new Date(now).toISOString();
        globalThis.localStorage?.setItem(
            IN_APP_MESSAGE_FATIGUE_STORAGE_KEY,
            JSON.stringify(stored)
        );
    } catch {
        // The session count still protects the current run when storage is unavailable.
    }
};

export const isBlockingPresentation = (presentation: string): boolean =>
    presentation === 'modal' || presentation === 'story' || presentation === 'iframe';

export const isFatigueControlled = (message: InAppMessage): boolean =>
    isBlockingPresentation(message.presentation) && message.dismissible && !message.bypassFatigue;

export const canShowBlocking = (
    settings: InAppMessageSettings,
    now: number = Date.now(),
    accountDid?: string
): boolean => {
    if (
        (blockingShownThisSession.get(accountKey(accountDid)) ?? 0) >=
        settings.maxBlockingPerSession
    )
        return false;

    const lastShown = readLastBlockingShown(accountDid);

    if (lastShown === null) return true;

    return now - lastShown >= settings.blockingCooldownHours * 60 * 60 * 1000;
};

export const shouldSuppressByFatigue = (
    message: InAppMessage,
    settings: InAppMessageSettings,
    now: number = Date.now(),
    accountDid?: string
): boolean => isFatigueControlled(message) && !canShowBlocking(settings, now, accountDid);

export const recordBlockingShown = (now: number = Date.now(), accountDid?: string): void => {
    const key = accountKey(accountDid);

    blockingShownThisSession.set(key, (blockingShownThisSession.get(key) ?? 0) + 1);
    lastShownInMemory.set(key, now);
    writeLastBlockingShown(accountDid, now);
    listeners.forEach(listener => listener());
};

export const getInAppMessageFatigueState = (
    accountDid?: string
): {
    blockingShownThisSession: number;
    lastBlockingShown: string | null;
} => {
    const lastShown = readLastBlockingShown(accountDid);

    return {
        blockingShownThisSession: blockingShownThisSession.get(accountKey(accountDid)) ?? 0,
        lastBlockingShown: lastShown === null ? null : new Date(lastShown).toISOString(),
    };
};

export const resetInAppMessageFatigue = (): void => {
    blockingShownThisSession.clear();
    lastShownInMemory.clear();

    try {
        globalThis.localStorage?.removeItem(IN_APP_MESSAGE_FATIGUE_STORAGE_KEY);
    } catch {
        // The in-memory state is still reset.
    }
    listeners.forEach(listener => listener());
};
