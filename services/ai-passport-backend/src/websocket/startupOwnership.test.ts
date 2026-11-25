import { afterEach, describe, expect, it } from 'bun:test';

import {
    activeStartups,
    isCurrentStartup,
    isStartupOwner,
    type ActiveStartup,
    type StartupSocket,
} from './startupOwnership';

const socket = (name: string): StartupSocket => ({ name }) as unknown as StartupSocket;

const startup = (requestId: string, ws: StartupSocket): ActiveStartup => ({
    requestId,
    controller: new AbortController(),
    ws,
});

describe('startup ownership', () => {
    afterEach(() => activeStartups.clear());

    it('requires the DID, request, and socket to match', () => {
        const firstSocket = socket('first');
        const secondSocket = socket('second');
        const active = startup('request-1', firstSocket);

        activeStartups.set('did:example:learner', active);

        expect(isStartupOwner('did:example:learner', 'request-1', firstSocket)).toBe(true);
        expect(isStartupOwner('did:example:learner', 'request-2', firstSocket)).toBe(false);
        expect(isStartupOwner('did:example:learner', 'request-1', secondSocket)).toBe(false);
    });

    it('stops treating an aborted or replaced request as current', () => {
        const firstSocket = socket('first');
        const secondSocket = socket('second');
        const first = startup('request-1', firstSocket);

        activeStartups.set('did:example:learner', first);
        expect(isCurrentStartup('did:example:learner', 'request-1', firstSocket)).toBe(true);

        first.controller.abort();
        expect(isCurrentStartup('did:example:learner', 'request-1', firstSocket)).toBe(false);

        activeStartups.set('did:example:learner', startup('request-2', secondSocket));
        expect(isCurrentStartup('did:example:learner', 'request-1', firstSocket)).toBe(false);
        expect(isCurrentStartup('did:example:learner', 'request-2', secondSocket)).toBe(true);
    });
});
