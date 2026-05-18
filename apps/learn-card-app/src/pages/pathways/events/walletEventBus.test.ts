import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CredentialIngestedEvent, WalletEvent } from '../types';

import { createWalletEventBus } from './walletEventBus';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let seq = 0;

beforeEach(() => {
    seq = 0;
});

const makeEvent = (
    overrides: Partial<CredentialIngestedEvent> = {},
): CredentialIngestedEvent => {
    seq += 1;

    return {
        kind: 'credential-ingested',
        eventId: `00000000-0000-4000-8000-${seq.toString(16).padStart(12, '0')}`,
        credentialUri: `urn:uuid:vc-${seq}`,
        vc: { type: ['VerifiableCredential'] },
        ingestedAt: '2026-04-22T00:00:00.000Z',
        source: 'claim-link',
        ...overrides,
    };
};

// ---------------------------------------------------------------------------
// Core fanout
// ---------------------------------------------------------------------------

describe('walletEventBus — fanout', () => {
    it('delivers a published event to every subscriber in registration order', () => {
        const bus = createWalletEventBus();
        const received: WalletEvent[][] = [[], []];

        bus.subscribe(e => received[0].push(e));
        bus.subscribe(e => received[1].push(e));

        const event = makeEvent();
        bus.publish(event);

        expect(received[0]).toEqual([event]);
        expect(received[1]).toEqual([event]);
    });

    it('unsubscribe stops delivery to that listener only', () => {
        const bus = createWalletEventBus();
        const kept = vi.fn();
        const dropped = vi.fn();

        bus.subscribe(kept);
        const stop = bus.subscribe(dropped);

        bus.publish(makeEvent());
        stop();
        bus.publish(makeEvent());

        expect(kept).toHaveBeenCalledTimes(2);
        expect(dropped).toHaveBeenCalledTimes(1);
    });

    it('a listener unsubscribing during its own callback does not skip siblings', () => {
        // Regression guard for the common pattern:
        //   const stop = bus.subscribe(event => { ...; stop(); });
        // If the iteration modifies the underlying set mid-pass the
        // second subscriber would be skipped.
        const bus = createWalletEventBus();
        const sibling = vi.fn();

        let stopSelf = () => {};
        stopSelf = bus.subscribe(() => stopSelf());
        bus.subscribe(sibling);

        bus.publish(makeEvent());

        expect(sibling).toHaveBeenCalledTimes(1);
    });

    it('a listener that throws does not block other listeners', () => {
        const bus = createWalletEventBus();
        const sibling = vi.fn();

        // Silence the console.error — we expect the warning.
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        bus.subscribe(() => {
            throw new Error('boom');
        });
        bus.subscribe(sibling);

        bus.publish(makeEvent());

        expect(sibling).toHaveBeenCalledTimes(1);

        spy.mockRestore();
    });
});

// ---------------------------------------------------------------------------
// Dedup
// ---------------------------------------------------------------------------

describe('walletEventBus — dedup by eventId', () => {
    it('fans out only once when the same eventId is published twice', () => {
        const bus = createWalletEventBus();
        const listener = vi.fn();

        bus.subscribe(listener);

        const event = makeEvent();
        bus.publish(event);
        bus.publish(event);

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('lets distinct eventIds through even with identical bodies', () => {
        const bus = createWalletEventBus();
        const listener = vi.fn();

        bus.subscribe(listener);

        bus.publish(makeEvent({ eventId: '00000000-0000-4000-8000-000000000001' }));
        bus.publish(makeEvent({ eventId: '00000000-0000-4000-8000-000000000002' }));

        expect(listener).toHaveBeenCalledTimes(2);
    });
});

// ---------------------------------------------------------------------------
// Recent buffer + replay
// ---------------------------------------------------------------------------

describe('walletEventBus — replay', () => {
    it('replays the buffered events to a late subscriber when requested', () => {
        const bus = createWalletEventBus();

        const e1 = makeEvent();
        const e2 = makeEvent();

        bus.publish(e1);
        bus.publish(e2);

        const received: WalletEvent[] = [];
        bus.subscribe(e => received.push(e), { replay: true });

        expect(received).toEqual([e1, e2]);
    });

    it('does not replay when the option is false', () => {
        const bus = createWalletEventBus();
        bus.publish(makeEvent());

        const listener = vi.fn();
        bus.subscribe(listener);

        expect(listener).not.toHaveBeenCalled();
    });

    it('truncates the replay buffer oldest-first when it exceeds the size', () => {
        const bus = createWalletEventBus({ recentBufferSize: 2 });

        const e1 = makeEvent();
        const e2 = makeEvent();
        const e3 = makeEvent();

        bus.publish(e1);
        bus.publish(e2);
        bus.publish(e3);

        expect(bus.recent()).toEqual([e2, e3]);
    });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('walletEventBus — validation', () => {
    it('rejects a malformed event via zod', () => {
        const bus = createWalletEventBus();

        expect(() =>
            bus.publish({
                kind: 'credential-ingested',
                // Missing eventId, credentialUri, etc.
            } as unknown as WalletEvent),
        ).toThrow();
    });

    it('respects the validate=false opt-out for tests', () => {
        const bus = createWalletEventBus({ validate: false });
        const listener = vi.fn();
        bus.subscribe(listener);

        // Forge a minimal event that would fail zod; bus accepts it.
        bus.publish({
            kind: 'credential-ingested',
            eventId: '00000000-0000-4000-8000-000000000001',
        } as unknown as WalletEvent);

        expect(listener).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('walletEventBus — reset', () => {
    it('clears subscribers, recent buffer, and dedup memory', () => {
        const bus = createWalletEventBus();
        const listener = vi.fn();

        const event = makeEvent();
        bus.subscribe(listener);
        bus.publish(event);

        bus.reset();

        expect(bus.recent()).toEqual([]);

        // Previously seen id publishes cleanly again now that the
        // dedup memory is cleared — also the prior subscriber is
        // gone, so `listener` shouldn't fire.
        bus.publish(event);
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
