import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuid } from 'uuid';
import { neogma } from '@instance';
import { computeShareLinkRequestHash } from '@helpers/share-link-lifecycle';
import {
    abandonReservation,
    claimRecoverableReservation,
    finalizeReservation,
    reserveCreate,
    reserveReplacement,
} from '../src/accesslayer/share-link';
import { composeShareLinkPolicy } from '../src/helpers/share-link-policy/resolver';
import { resolveCurrentShareLinkPolicy } from '../src/helpers/share-link-policy/production';
import { withShareLinkRead } from '../src/accesslayer/share-link/transaction';
import {
    clearLifecycleGraph,
    contentBinding,
    nextShareId,
    reserveShareFixture,
} from './helpers/share-link-fixtures';
import type { ShareLinkPolicySnapshot } from '../src/helpers/share-link-policy/types';
import type { ReserveShareLinkResult } from '../src/accesslayer/share-link/types';

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

    it.each([
        'replay',
        'recovery',
        'expired-replay',
        'abandoned-replay',
        'legacy-expired-replay',
        'legacy-abandoned-replay',
    ] as const)(
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
                if (mode.startsWith('legacy-')) {
                    await neogma.queryRunner.run(
                        `MATCH (o:ShareLinkOperation {operationId: $operationId})
                         REMOVE o.policyIsMinor, o.policyResolved,
                                o.policyDefaultExpiryDays, o.policyViewCountingEnabled`,
                        { operationId: reserved.reservation.operationId }
                    );
                }
                const finalizeAt = mode === 'replay' ? NOW : new Date(NOW.getTime() + 2000);
                if (mode.endsWith('abandoned-replay')) {
                    expect(
                        (await abandonReservation({ ...reserved.reservation, now: finalizeAt }))
                            .outcome
                    ).toBe('abandoned');
                }
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
                              now: finalizeAt,
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

                // A new explicit edit may refresh the service policy; only retries
                // of the original logical request must retain its restriction.
                const fresh = await reserveReplacement({
                    ...request,
                    expectedVersion: finalized.share.version,
                    clientRequestId: uuid(),
                    policy: composeShareLinkPolicy('minor', true, true),
                    now: finalizeAt,
                });
                if (fresh.outcome !== 'reserved') throw new Error('expected fresh reservation');
                const refreshed = await finalizeReservation({
                    ...fresh.reservation,
                    resolveCurrentPolicy: resolveCurrentShareLinkPolicy,
                    now: finalizeAt,
                });
                expect(refreshed.share.minorPolicyViewCountingEnabled).toBe(true);
                expect(refreshed.share.notifyOnView).toBe(true);
                expect(refreshed.share.expiresAt).toBe(EXPIRY);
            } finally {
                await deleteOwner(ownerProfileId);
            }
        }
    );

    it.each(['create', 'update'] as const)(
        'retains a tightened %s policy across expired replacement and subsequent cleanup',
        async kind => {
            const ownerProfileId = `service-owner-${uuid()}`;
            await createOwner(ownerProfileId, '1990-01-01', true, 'organization', true);
            try {
                const created =
                    kind === 'update' ? await createLegacyShare(ownerProfileId, false, true) : null;
                const shareId = created?.shareId ?? nextShareId();
                const request = {
                    namespace: NAMESPACE,
                    ownerProfileId,
                    shareId,
                    clientRequestId: uuid(),
                    requestHash: computeShareLinkRequestHash(kind, {
                        id: shareId,
                        notifyOnView: true,
                    }),
                    title: 'Repeated retry',
                    expiresAt: EXPIRY,
                    notifyOnView: true,
                    leaseOwner: 'owner-edit',
                    leaseMs: 1000,
                };
                const reserve = (
                    policy: ShareLinkPolicySnapshot,
                    now: Date
                ): Promise<ReserveShareLinkResult> =>
                    kind === 'create'
                        ? reserveCreate({
                              ...request,
                              policy,
                              now,
                              selectedCount: 1,
                              content: contentBinding(shareId),
                          })
                        : reserveReplacement({
                              ...request,
                              policy,
                              now,
                              expectedVersion: created?.committed.version ?? 1,
                          });
                const permissive = composeShareLinkPolicy('adult', false, true);
                const restrictive = composeShareLinkPolicy('minor', true);
                const initial = await reserve(permissive, NOW);
                if (initial.outcome !== 'reserved') throw new Error('expected initial reservation');
                const retryAt = new Date(NOW.getTime() + 2000);
                const tightened = await reserve(restrictive, retryAt);
                if (tightened.outcome !== 'reserved')
                    throw new Error('expected replacement reservation');
                expect(tightened.reservation.operationId).not.toBe(initial.reservation.operationId);
                expect(tightened.reservation.policy).toEqual(restrictive);
                expect(
                    (await abandonReservation({ ...tightened.reservation, now: retryAt })).outcome
                ).toBe('abandoned');
                const retried = await reserve(permissive, retryAt);
                if (retried.outcome !== 'reserved')
                    throw new Error('expected cleanup retry reservation');
                expect(retried.reservation.policy).toEqual(restrictive);
                const finalized = await finalizeReservation({
                    ...retried.reservation,
                    resolveCurrentPolicy: resolveCurrentShareLinkPolicy,
                    now: retryAt,
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
