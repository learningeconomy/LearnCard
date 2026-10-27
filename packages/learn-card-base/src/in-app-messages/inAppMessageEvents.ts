import { useEffect, useState } from 'react';

import type { CredentialSummary } from './credentialFacts';
import type { InAppMessageEvent } from './predicates';

const EVENT_RETENTION_MS = 30 * 60 * 1000;
const MAX_EVENTS = 50;

const events: InAppMessageEvent[] = [];
const listeners = new Set<() => void>();
const openedAccounts = new Set<string>();

export const emitAppOpenedOnce = (accountDid: string): void => {
    if (openedAccounts.has(accountDid)) return;
    openedAccounts.add(accountDid);
    emitInAppMessageEvent('app.opened', { accountDid });
};

const notify = (): void => listeners.forEach(listener => listener());

export const onInAppMessageEventsChanged = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const prune = (now: number = Date.now()): void => {
    const earliest = now - EVENT_RETENTION_MS;

    for (let index = events.length - 1; index >= 0; index -= 1) {
        if (events[index].occurredAt < earliest) events.splice(index, 1);
    }
    while (events.length > MAX_EVENTS) events.shift();
};

export const emitInAppMessageEvent = (
    event: InAppMessageEvent['event'],
    options: { credential?: CredentialSummary; accountDid?: string; occurredAt?: number } = {}
): void => {
    const occurredAt = options.occurredAt ?? Date.now();

    prune(occurredAt);
    events.push({
        event,
        occurredAt,
        ...(options.credential ? { credential: options.credential } : {}),
        ...(options.accountDid ? { accountDid: options.accountDid } : {}),
    });
    prune(occurredAt);
    notify();
};

export const getRecentInAppMessageEvents = (
    accountDid?: string,
    now: number = Date.now()
): InAppMessageEvent[] => {
    prune(now);

    return events.filter(event => !event.accountDid || event.accountDid === accountDid);
};

export const clearInAppMessageEvents = (): void => {
    events.splice(0, events.length);
    notify();
};

export const resetInAppMessageEventSession = (): void => {
    openedAccounts.clear();
    clearInAppMessageEvents();
};

export const useRecentInAppMessageEvents = (accountDid?: string): InAppMessageEvent[] => {
    const [state, setState] = useState(() => ({
        accountDid,
        snapshot: getRecentInAppMessageEvents(accountDid),
    }));

    useEffect(() => {
        const update = (): void =>
            setState({ accountDid, snapshot: getRecentInAppMessageEvents(accountDid) });

        update();
        listeners.add(update);
        const timer = setInterval(update, 60_000);

        return () => {
            listeners.delete(update);
            clearInterval(timer);
        };
    }, [accountDid]);

    return state.accountDid === accountDid ? state.snapshot : [];
};
