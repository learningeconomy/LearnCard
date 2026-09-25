import { describe, it, expect, vi } from 'vitest';
import * as Sentry from '@sentry/serverless';

import type { EscrowHold, MongoUserKeyType, RecoveryMethod } from '@models';
import type { TemplateNotification } from '../delivery';
import {
    notifyEscrowHoldEvent,
    type EscrowHoldNotifierDeps,
    type EscrowHoldEventKind,
} from './notifications';

const baseUserKey = (overrides: Partial<MongoUserKeyType> = {}): MongoUserKeyType => {
    const now = new Date();
    return {
        contactMethod: { type: 'email', value: 'owner@example.com' },
        authProviders: [{ type: 'firebase', id: 'user-1' }],
        primaryDid: 'did:key:owner',
        linkedDids: [],
        keyProvider: 'sss',
        shareVersion: 1,
        previousAuthShares: [],
        securityLevel: 'basic',
        recoveryMethods: [],
        migratedFromWeb3Auth: false,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
};

const baseHold = (overrides: Partial<EscrowHold> = {}): EscrowHold => {
    const now = new Date();
    return {
        holdRecord: {
            hold: {
                holdId: 'hold-1',
                did: 'did:key:owner',
                shareVersion: 1,
                blobHash: 'ab'.repeat(32),
                enrollmentEpoch: 1,
                releasePolicy: 'hold',
                clientEphemeralPublicKey: 'public-key',
                createdLo: 0,
                createdHi: 0,
                policyVersion: 1,
                signature: 'test-signature',
            },
            holdDurationMs: 0,
            ledgerSeq: 0,
        },
        _id: 'hold-1',
        authProvider: { type: 'firebase', id: 'user-1' },
        primaryDid: 'did:key:owner',
        shareVersion: 1,
        status: 'pending',
        identityProofType: 'auth-token',
        requestedAt: now,
        releaseAfter: now,
        releasePolicy: 'hold',
        clientEphemeralPublicKey: 'client-pub',
        resumeTokenHash: 'a'.repeat(64),
        notifications: [],
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
};

const confirmedRecoveryMethod = (confirmationEmail: string): RecoveryMethod => ({
    type: 'email',
    createdAt: new Date(),
    confirmationStatus: 'confirmed',
    confirmedAt: new Date(),
    confirmationEmail,
});

const pendingRecoveryMethod = (confirmationEmail: string): RecoveryMethod => ({
    type: 'email',
    createdAt: new Date(),
    confirmationStatus: 'pending',
    confirmationEmail,
});

const makeDeps = (overrides: Partial<EscrowHoldNotifierDeps> = {}) => {
    const sent: TemplateNotification[] = [];
    const pushCalls: unknown[] = [];
    const recorded: { holdId: string; kind: EscrowHoldEventKind }[] = [];
    const deps: EscrowHoldNotifierDeps = {
        send: async notification => {
            sent.push(notification as TemplateNotification);
        },
        sendPush: async (notification): ReturnType<EscrowHoldNotifierDeps['sendPush']> => {
            pushCalls.push(notification);
            return { successCount: 1, failureCount: 0, failedTokens: [] };
        },
        now: () => new Date('2026-01-01T00:00:00.000Z'),
        rotateCancelToken: async () => 'b'.repeat(64),
        recordNotification: async (holdId, kind) => {
            recorded.push({ holdId, kind });
        },
        ...overrides,
    };
    return { deps, sent, pushCalls, recorded };
};

describe('notifyEscrowHoldEvent', () => {
    it('emails every verified address deduped case-insensitively, excluding unconfirmed methods', async () => {
        const userKey = baseUserKey({
            contactMethod: { type: 'email', value: 'Owner@Example.com' },
            recoveryEmail: 'owner@example.com',
            recoveryEmailVerifiedAt: new Date(),
            recoveryMethods: [
                confirmedRecoveryMethod('secondary@example.com'),
                pendingRecoveryMethod('attacker@example.com'),
            ],
        });
        const hold = baseHold({ completedAt: new Date() });
        const { deps, sent } = makeDeps();

        await notifyEscrowHoldEvent({ kind: 'completed', hold, userKey }, deps);

        const recipients = sent.map(n => n.to).sort();
        expect(recipients).toEqual(['owner@example.com', 'secondary@example.com']);
    });

    it('excludes a recoveryEmail that lacks recoveryEmailVerifiedAt', async () => {
        const userKey = baseUserKey({
            contactMethod: { type: 'phone', value: '+15555550100' },
            recoveryEmail: 'unverified@example.com',
        });
        const hold = baseHold({ completedAt: new Date() });
        const { deps, sent } = makeDeps();

        await notifyEscrowHoldEvent({ kind: 'completed', hold, userKey }, deps);

        expect(sent).toHaveLength(0);
    });

    it('sends the started email with a cancel link built from the plaintext cancelToken, never rotating', async () => {
        const userKey = baseUserKey();
        const hold = baseHold();
        const rotateCancelToken = vi.fn(async () => {
            throw new Error('must not rotate for started');
        });
        const { deps, sent } = makeDeps({ rotateCancelToken });
        const cancelToken = 'a'.repeat(64);

        await notifyEscrowHoldEvent({ kind: 'started', hold, userKey, cancelToken }, deps);

        expect(rotateCancelToken).not.toHaveBeenCalled();
        expect(sent).toHaveLength(1);
        expect(sent[0]!.templateAlias).toBe('escrow-hold-started');
        expect(sent[0]!.templateModel.cancelUrl).toContain(cancelToken);
        expect(sent[0]!.templateModel.cancelUrl).toContain(hold._id);
    });

    it('rotates a fresh cancel token for reminder emails', async () => {
        const userKey = baseUserKey();
        const hold = baseHold();
        const rotateCancelToken = vi.fn(async () => 'c'.repeat(64));
        const { deps, sent } = makeDeps({ rotateCancelToken });

        await notifyEscrowHoldEvent({ kind: 'reminder', hold, userKey }, deps);

        expect(rotateCancelToken).toHaveBeenCalledWith(hold._id);
        expect(sent[0]!.templateAlias).toBe('escrow-hold-reminder');
        expect(sent[0]!.templateModel.cancelUrl).toContain('c'.repeat(64));
    });

    it('pin-locked with an active waiting-period hold rotates that hold (not the PIN hold) and links to it', async () => {
        const userKey = baseUserKey();
        // The PIN hold itself is already terminal by the time 'pin-locked' fires.
        const hold = baseHold({
            _id: 'pin-hold',
            releasePolicy: 'pin',
            status: 'cancelled',
            cancelledBy: 'system',
            cancelReason: 'pin-locked',
        });
        const activeHold = baseHold({
            _id: 'active-hold',
            releasePolicy: 'hold',
            status: 'pending',
        });
        const rotateCancelToken = vi.fn(async () => 'd'.repeat(64));
        const { deps, sent } = makeDeps({ rotateCancelToken });

        await notifyEscrowHoldEvent({ kind: 'pin-locked', hold, userKey, activeHold }, deps);

        expect(rotateCancelToken).toHaveBeenCalledExactlyOnceWith(activeHold._id);
        expect(sent[0]!.templateAlias).toBe('escrow-pin-locked');
        expect(sent[0]!.templateModel.cancelUrl).toContain('d'.repeat(64));
        expect(sent[0]!.templateModel.cancelUrl).toContain(activeHold._id);
        expect(sent[0]!.templateModel.releaseAfter).toBe(activeHold.releaseAfter.toISOString());
    });

    it('pin-locked without an active hold sends no cancelUrl/releaseAfter and never rotates the PIN hold', async () => {
        const userKey = baseUserKey();
        const hold = baseHold({
            _id: 'pin-hold',
            releasePolicy: 'pin',
            status: 'cancelled',
            cancelledBy: 'system',
            cancelReason: 'pin-locked',
        });
        const rotateCancelToken = vi.fn(async () => 'e'.repeat(64));
        const { deps, sent } = makeDeps({ rotateCancelToken });

        await notifyEscrowHoldEvent({ kind: 'pin-locked', hold, userKey }, deps);

        expect(rotateCancelToken).not.toHaveBeenCalled();
        expect(sent[0]!.templateAlias).toBe('escrow-pin-locked');
        expect(sent[0]!.templateModel).not.toHaveProperty('cancelUrl');
        expect(sent[0]!.templateModel).not.toHaveProperty('releaseAfter');
    });

    it('pin-locked treats a non-pending activeHold the same as no active hold', async () => {
        const userKey = baseUserKey();
        const hold = baseHold({ _id: 'pin-hold', releasePolicy: 'pin', status: 'cancelled' });
        const activeHold = baseHold({ _id: 'stale-hold', status: 'completed' });
        const rotateCancelToken = vi.fn(async () => 'f'.repeat(64));
        const { deps, sent } = makeDeps({ rotateCancelToken });

        await notifyEscrowHoldEvent({ kind: 'pin-locked', hold, userKey, activeHold }, deps);

        expect(rotateCancelToken).not.toHaveBeenCalled();
        expect(sent[0]!.templateModel).not.toHaveProperty('cancelUrl');
    });

    it('skips the reminder email entirely when a fresh token cannot be issued', async () => {
        const userKey = baseUserKey();
        const hold = baseHold();
        const { deps, sent } = makeDeps({ rotateCancelToken: async () => null });

        await notifyEscrowHoldEvent({ kind: 'reminder', hold, userKey }, deps);

        expect(sent).toHaveLength(0);
    });

    it('sends a push notification to the account DID for every kind', async () => {
        const userKey = baseUserKey({ contactMethod: { type: 'phone', value: '+15555550100' } });
        const hold = baseHold();
        const { deps, sent, pushCalls } = makeDeps();

        await notifyEscrowHoldEvent(
            { kind: 'started', hold, userKey, cancelToken: 'a'.repeat(64) },
            deps
        );

        expect(sent).toHaveLength(0);
        expect(pushCalls).toEqual([
            expect.objectContaining({ type: 'APP_NOTIFICATION', to: { did: userKey.primaryDid } }),
        ]);
    });

    it('records delivery and logs only safe metadata when one channel fails', async () => {
        const userKey = baseUserKey();
        const hold = baseHold();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const sentrySpy = vi.spyOn(Sentry, 'captureException').mockImplementation(() => 'event-id');
        const { deps, recorded } = makeDeps({
            send: async () => {
                throw new Error('Postmark rejected owner@example.com');
            },
        });

        await notifyEscrowHoldEvent(
            { kind: 'started', hold, userKey, cancelToken: 'a'.repeat(64) },
            deps
        );

        expect(recorded).toEqual([{ holdId: hold._id, kind: 'started' }]);
        expect(errorSpy).toHaveBeenCalled();
        expect(sentrySpy).toHaveBeenCalled();

        const loggedText = JSON.stringify([...errorSpy.mock.calls, ...sentrySpy.mock.calls]);
        expect(loggedText).not.toContain('owner@example.com');
        expect(loggedText).not.toContain(userKey.primaryDid);
        expect(loggedText).not.toContain('a'.repeat(64));

        errorSpy.mockRestore();
        sentrySpy.mockRestore();
    });

    it('never throws and records nothing when every channel fails', async () => {
        const userKey = baseUserKey();
        const hold = baseHold();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(Sentry, 'captureException').mockImplementation(() => 'event-id');
        const { deps, recorded } = makeDeps({
            send: async () => {
                throw new Error('email down');
            },
            sendPush: async () => {
                throw new Error('push down');
            },
        });

        await expect(
            notifyEscrowHoldEvent(
                { kind: 'started', hold, userKey, cancelToken: 'a'.repeat(64) },
                deps
            )
        ).resolves.toBeUndefined();
        expect(recorded).toHaveLength(0);

        vi.restoreAllMocks();
    });
});
