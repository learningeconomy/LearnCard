import { useEffect, useState } from 'react';

import type { CredentialSummary } from './credentialFacts';
import type { InAppMessageEvent } from './predicates';

const EVENT_RETENTION_MS = 30 * 60 * 1000;
const MAX_EVENTS = 50;

const events: InAppMessageEvent[] = [];
const listeners = new Set<() => void>();

const notify = (): void => listeners.forEach(listener => listener());

const prune = (now: number = Date.now()): void => {
    const earliest = now - EVENT_RETENTION_MS;

    while (events.length > 0 && events[0].occurredAt < earliest) events.shift();
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

        return () => {
            listeners.delete(update);
        };
    }, [accountDid]);

    return state.accountDid === accountDid ? state.snapshot : [];
};
