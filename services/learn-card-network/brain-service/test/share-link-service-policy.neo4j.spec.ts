import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuid } from 'uuid';
import { neogma } from '@instance';
import { computeShareLinkRequestHash } from '@helpers/share-link-lifecycle';
import {
    claimRecoverableReservation,
    finalizeReservation,
    reserveReplacement,
} from '../src/accesslayer/share-link';
import { composeShareLinkPolicy } from '../src/helpers/share-link-policy/resolver';
import { resolveCurrentShareLinkPolicy } from '../src/helpers/share-link-policy/production';
import { withShareLinkRead } from '../src/accesslayer/share-link/transaction';
import { clearLifecycleGraph, reserveShareFixture } from './helpers/share-link-fixtures';

const NOW = new Date('2026-10-05T12:00:00.000Z');
const EXPIRY = '2026-10-25T12:00:00.000Z';
const NAMESPACE = 'service-policy-test';

const cases = [
    {
        name: 'resolved adult service without notifications',
        dob: '1990-01-01',
        service: true,
        type: 'organization',
        managed: true,
        oldMinor: false,
        resolved: true,
        notify: false,
        expected: true,
    },
    {
        name: 'resolved minor-age service with notifications',
        dob: '2020-01-01',
        service: true,
        type: 'organization',
        managed: true,
        oldMinor: true,
        resolved: true,
        notify: true,
        expected: true,
    },
    {
        name: 'unknown service snapshot',
        dob: null,
        service: true,
        type: 'organization',
        managed: true,
        oldMinor: null,
        resolved: false,
        notify: true,
        expected: true,
    },
    {
        name: 'legacy explicit child with service flag',
        dob: '1990-01-01',
        service: true,
        type: 'child',
        managed: true,
        oldMinor: true,
        resolved: true,
        notify: true,
        expected: false,
    },
    {
        name: 'managed personal adult',
        dob: '1990-01-01',
        service: false,
        type: 'adult',
        managed: true,
        oldMinor: false,
        resolved: true,
        notify: true,
        expected: false,
    },
    {
        name: 'unmanaged personal adult with resolved restriction',
        dob: '1990-01-01',
        service: false,
        type: 'adult',
        managed: false,
        oldMinor: false,
        resolved: true,
        notify: true,
        expected: false,
    },
];

const createLegacyShare = async (
    ownerProfileId: string,
    oldMinor: boolean | null,
    resolved: boolean
) => {
    const created = await reserveShareFixture({
        namespace: NAMESPACE,
        ownerProfileId,
        expiresAt: EXPIRY,
        now: NOW,
    });
    const finalized = await finalizeReservation({ ...created, now: NOW });
    await neogma.queryRunner.run(
        `MATCH (s:ShareLink {id: $shareId})
         SET s.minorPolicyIsMinor = $oldMinor, s.minorPolicyResolved = $resolved,
             s.minorPolicyViewCountingEnabled = false, s.minorPolicyDefaultExpiryDays = 30`,
        { shareId: created.shareId, oldMinor, resolved }
    );
    return { ...created, committed: finalized.share };
};

const createOwner = async (
    ownerProfileId: string,
    dob: string | null,
    service: boolean,
    type: string,
    managed: boolean
) => {
    await neogma.queryRunner.run(
        'CREATE (:Profile {profileId: $profileId, dob: $dob, isServiceProfile: $service, type: $type})',
        { profileId: ownerProfileId, dob, service, type }
    );
    if (managed) {
        await neogma.queryRunner.run(
            'MATCH (p:Profile {profileId: $profileId}) CREATE (p)-[:MANAGED_BY]->(:Profile {profileId: $managerId})',
            { profileId: ownerProfileId, managerId: `${ownerProfileId}-manager` }
        );
    }
};
const deleteOwner = async (ownerProfileId: string) => {
    await neogma.queryRunner.run(
        'MATCH (p:Profile) WHERE p.profileId IN [$profileId, $managerId] DETACH DELETE p',
        { profileId: ownerProfileId, managerId: `${ownerProfileId}-manager` }
    );
};

describe('explicit service share policy refresh', () => {
    beforeEach(clearLifecycleGraph);
    afterAll(clearLifecycleGraph);

    it.each(cases)('$name preserves expiry and applies only eligible tracking', async row => {
        const ownerProfileId = `service-owner-${uuid()}`;
        await createOwner(ownerProfileId, row.dob, row.service, row.type, row.managed);
        try {
            const created = await createLegacyShare(ownerProfileId, row.oldMinor, row.resolved);
            const policy = await withShareLinkRead(tx =>
                resolveCurrentShareLinkPolicy(tx, ownerProfileId, NOW)
            );
            const request = {
                namespace: NAMESPACE,
                ownerProfileId,
                shareId: created.shareId,
                expectedVersion: created.committed.version,
                clientRequestId: uuid(),
                requestHash: 'explicit-service-edit',
                title: 'Updated title',
                notifyOnView: row.notify,
                leaseOwner: 'owner-edit',
                policy,
                now: NOW,
            };
            const reserved = await reserveReplacement(request);
            if (reserved.outcome !== 'reserved')
                throw new Error('expected explicit edit reservation');
            const finalized = await finalizeReservation({
                ...reserved.reservation,
                resolveCurrentPolicy: resolveCurrentShareLinkPolicy,
                now: NOW,
            });
            expect(finalized.share.minorPolicyViewCountingEnabled).toBe(row.expected);
            expect(finalized.share.notifyOnView).toBe(row.expected && row.notify);
            expect(finalized.share.expiresAt).toBe(EXPIRY);
            expect(finalized.share.minorPolicyDefaultExpiryDays).toBe(30);
            const replayed = await reserveReplacement({
                ...request,
                policy: composeShareLinkPolicy('adult', false, true),
            });
            expect(replayed.outcome).toBe('already_committed');
            if (replayed.outcome === 'already_committed') {
                expect(replayed.current.minorPolicyViewCountingEnabled).toBe(row.expected);
                expect(replayed.current.expiresAt).toBe(EXPIRY);
            }
        } finally {
            await deleteOwner(ownerProfileId);
        }
    });

    it.each(['replay', 'recovery'] as const)(
        'keeps a restricted reservation restricted during %s even if the owner is now a service',
        async mode => {
            const ownerProfileId = `service-owner-${uuid()}`;
            await createOwner(ownerProfileId, '2020-01-01', false, 'adult', true);
            try {
                const created = await createLegacyShare(ownerProfileId, true, true);
                const request = {
                    namespace: NAMESPACE,
                    ownerProfileId,
                    shareId: created.shareId,
                    expectedVersion: created.committed.version,
                    clientRequestId: uuid(),
                    requestHash: computeShareLinkRequestHash('update', {
                        id: created.shareId,
                        notifyOnView: true,
                    }),
                    notifyOnView: true,
                    leaseOwner: 'owner-edit',
                    leaseMs: 1000,
                    policy: composeShareLinkPolicy('minor', true),
                    now: NOW,
                };
                const reserved = await reserveReplacement(request);
                if (reserved.outcome !== 'reserved')
                    throw new Error('expected restricted reservation');
                await neogma.queryRunner.run(
                    'MATCH (p:Profile {profileId: $profileId}) SET p.isServiceProfile = true, p.type = $type',
                    { profileId: ownerProfileId, type: 'organization' }
                );
                const finalizeAt = mode === 'recovery' ? new Date(NOW.getTime() + 2000) : NOW;
                const resumed =
                    mode === 'recovery'
                        ? await claimRecoverableReservation({
                              namespace: NAMESPACE,
                              ownerProfileId,
                              shareId: created.shareId,
                              operationId: reserved.reservation.operationId,
                              leaseOwner: 'recovery-worker',
                              now: finalizeAt,
                          })
                        : await reserveReplacement({
                              ...request,
                              policy: composeShareLinkPolicy('minor', true, true),
                          });
                if (resumed.outcome !== 'claimed' && resumed.outcome !== 'reserved')
                    throw new Error('expected existing reservation');
                const finalized = await finalizeReservation({
                    ...resumed.reservation,
                    resolveCurrentPolicy: resolveCurrentShareLinkPolicy,
                    now: finalizeAt,
                });
                expect(finalized.share.minorPolicyViewCountingEnabled).toBe(false);
                expect(finalized.share.notifyOnView).toBe(false);
                expect(finalized.share.expiresAt).toBe(EXPIRY);
            } finally {
                await deleteOwner(ownerProfileId);
            }
        }
    );

    it('tightens a stale permissive service reservation when the locked owner is explicitly a child', async () => {
        const ownerProfileId = `service-owner-${uuid()}`;
        await createOwner(ownerProfileId, '1990-01-01', true, 'organization', true);
        try {
            const created = await createLegacyShare(ownerProfileId, false, true);
            const reserved = await reserveReplacement({
                namespace: NAMESPACE,
                ownerProfileId,
                shareId: created.shareId,
                expectedVersion: created.committed.version,
                clientRequestId: uuid(),
                requestHash: 'stale-service-edit',
                notifyOnView: true,
                leaseOwner: 'owner-edit',
                policy: composeShareLinkPolicy('adult', true, true),
                now: NOW,
            });
            if (reserved.outcome !== 'reserved') throw new Error('expected reservation');
            await neogma.queryRunner.run(
                'MATCH (p:Profile {profileId: $profileId}) SET p.type = $type',
                { profileId: ownerProfileId, type: 'child' }
            );
            const finalized = await finalizeReservation({
                ...reserved.reservation,
                resolveCurrentPolicy: resolveCurrentShareLinkPolicy,
                now: NOW,
            });
            expect(finalized.share.minorPolicyViewCountingEnabled).toBe(false);
            expect(finalized.share.notifyOnView).toBe(false);
            expect(finalized.share.minorPolicyIsMinor).toBe(true);
        } finally {
            await deleteOwner(ownerProfileId);
        }
    });
});
