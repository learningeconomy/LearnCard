import { Profile, Credential, Boost, StatusList, CredentialActivity } from '@models';
import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { app as statusListsApp } from '../src/status-lists';
import { decodeBitstring } from '../src/helpers/status-list.helpers';
import * as notifications from '../src/helpers/notifications.helpers';
import { getClient, getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';

/**
 * Per-instance revoke / suspend / unsuspend coverage (LC-1862).
 *
 * PR #1271 added:
 *   1. An optional `credentialUri` to revoke/suspend/unsuspendBoostRecipient so an action targets a
 *      SPECIFIC credential instance (not just the most-recent), validated to be INSTANCE_OF the boost.
 *   2. Per-instance `status` (active/revoked/suspended) on getMyActivities + getBoostRecipients, read
 *      from each instance's CREDENTIAL_SENT relationship.
 *
 * These tests lock down the core claim ("re-issuing the same boost to the same recipient no longer
 * mislabels new instances"), the credentialUri validation/security boundary, the back-compat
 * fallback, and the status surfacing — none of which were previously covered.
 */

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

/** undefined / null status means "active" by the PR's own convention. */
const isActiveStatus = (status: unknown): boolean =>
    status === undefined || status === null || status === 'active';

// ---------------------------------------------------------------------------
// Bitstring status-list helpers (mirrors bitstring-status-list.spec.ts) for
// end-to-end, on-chain-of-truth verification that the RIGHT instance's bit flips.
// ---------------------------------------------------------------------------

const getStatusEntries = (credential: any): any[] => {
    if (!credential || typeof credential !== 'object') return [];

    const statuses = credential.credentialStatus;
    const entries = Array.isArray(statuses) ? statuses : statuses ? [statuses] : [];

    return [...entries, ...getStatusEntries(credential.boostCredential)];
};

const getEntryForPurpose = (credential: any, statusPurpose: 'revocation' | 'suspension') => {
    const entry = getStatusEntries(credential).find(
        (status: any) => status.statusPurpose === statusPurpose
    );
    if (!entry) throw new Error(`Missing ${statusPurpose} status entry`);
    return entry;
};

const getListId = (entry: any): string => {
    const id = entry.statusListCredential.split('/').pop();
    if (!id) throw new Error('Status list credential URL is missing an id');
    return id;
};

const isStatusBitSet = async (entry: any): Promise<boolean> => {
    const response = await statusListsApp.inject({
        method: 'GET',
        url: `/status-lists/${getListId(entry)}`,
    });
    expect(response.statusCode).toBe(200);

    const statusListCredential = JSON.parse(response.body);
    const encodedList = statusListCredential.credentialSubject.encodedList;
    const bitstring = decodeBitstring(encodedList, 131_072);
    const index = Number(entry.statusListIndex);
    const byte = bitstring[Math.floor(index / 8)] ?? 0;

    return (byte & (1 << index % 8)) !== 0;
};

const statusBoostTemplate = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2024-01-01T00:00:00.000Z',
    name: 'Per-Instance Status Boost',
    credentialSubject: {
        id: 'did:example:subject',
    },
};

/**
 * Issue + send + accept a single instance of an already-created status boost to userB, returning
 * the new instance's URI and resolved credential. Re-callable against the SAME boostUri to mint
 * additional distinct instances for the same recipient.
 */
const issueStatusInstanceToUserB = async (
    boostUri: string
): Promise<{ credentialUri: string; credential: any }> => {
    const signedCredential = await userA.learnCard.invoke.issueCredential({
        ...statusBoostTemplate,
        issuer: userA.learnCard.id.did(),
        validFrom: new Date().toISOString(),
        credentialSubject: { id: userB.learnCard.id.did() },
        boostId: boostUri,
    });

    const credentialUri = await userA.clients.fullAuth.boost.sendBoost({
        profileId: 'userb',
        uri: boostUri,
        credential: signedCredential,
    });

    await userB.clients.fullAuth.credential.acceptCredential({ uri: credentialUri });

    const credential = await userB.clients.fullAuth.storage.resolve({ uri: credentialUri });

    return { credentialUri, credential };
};

/** Fetch userA's DELIVERED activity rows for a given recipient (one row per issued instance). */
const getDeliveredActivitiesForUserB = async () => {
    const result = await userA.clients.fullAuth.activity.getMyActivities({ limit: 50 });

    return result.records.filter(
        (record: any) =>
            record.eventType === 'DELIVERED' &&
            (record.recipientProfile?.profileId === 'userb' ||
                record.recipientIdentifier === 'userb')
    );
};

describe('Per-instance revoke/suspend/unsuspend (LC-1862)', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
        await statusListsApp.ready();
    });

    let boostUri: string;

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await StatusList.delete({ detach: true, where: {} });
        await CredentialActivity.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

        boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await StatusList.delete({ detach: true, where: {} });
        await CredentialActivity.delete({ detach: true, where: {} });
    });

    // -------------------------------------------------------------------
    // Core claim: per-instance targeting via credentialUri
    // -------------------------------------------------------------------
    describe('credentialUri targets a specific instance', () => {
        it('revokes ONLY the targeted instance when the same boost was issued twice to the same recipient', async () => {
            // Two distinct issuances of the same boost to the same recipient.
            const firstUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );
            const secondUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            expect(firstUri).not.toEqual(secondUri);

            // Revoke ONLY the first instance, by URI.
            const result = await userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
                credentialUri: firstUri,
            });
            expect(result).toBe(true);

            const delivered = await getDeliveredActivitiesForUserB();
            expect(delivered.length).toBe(2);

            const revoked = delivered.filter((r: any) => r.status === 'revoked');
            const active = delivered.filter((r: any) => isActiveStatus(r.status));

            // Exactly one instance revoked, the sibling stays active — the regression this PR fixes.
            // (DELIVERED activity rows are logged before the credential URI exists, so they carry no
            // credentialUri; the next test pins exact-instance targeting via the bitstring status list.)
            expect(revoked.length).toBe(1);
            expect(active.length).toBe(1);
        });

        it('flips only the targeted instance bit on the bitstring status list', async () => {
            const statusBoostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: statusBoostTemplate,
            });

            const first = await issueStatusInstanceToUserB(statusBoostUri);
            const second = await issueStatusInstanceToUserB(statusBoostUri);

            const firstEntry = getEntryForPurpose(first.credential, 'revocation');
            const secondEntry = getEntryForPurpose(second.credential, 'revocation');

            // Guard: distinct instances must occupy distinct status-list slots, else the test is vacuous.
            expect(firstEntry.statusListIndex).not.toEqual(secondEntry.statusListIndex);

            expect(await isStatusBitSet(firstEntry)).toBe(false);
            expect(await isStatusBitSet(secondEntry)).toBe(false);

            await userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri: statusBoostUri,
                recipientProfileId: 'userb',
                credentialUri: first.credentialUri,
            });

            expect(await isStatusBitSet(firstEntry)).toBe(true);
            expect(await isStatusBitSet(secondEntry)).toBe(false);
        });
    });

    // -------------------------------------------------------------------
    // Security / validation boundary on credentialUri
    // -------------------------------------------------------------------
    describe('credentialUri validation', () => {
        it('rejects revoke when credentialUri is not an instance of the given boost', async () => {
            // userB holds an instance of a DIFFERENT boost.
            const otherBoostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const otherInstanceUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                otherBoostUri,
                true
            );

            // Also give userB a legit instance of `boostUri` so the recipient lookup passes and the
            // only thing that can fail is the INSTANCE_OF check.
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            await expect(
                userA.clients.fullAuth.boost.revokeBoostRecipient({
                    boostUri,
                    recipientProfileId: 'userb',
                    credentialUri: otherInstanceUri,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('rejects revoke when credentialUri does not resolve to any credential', async () => {
            const realUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            // Same URI shape, non-existent id segment → getCredentialByUri returns null.
            const missingUri = realUri.replace(/[^:]+$/, 'nonexistentcredentialid');

            await expect(
                userA.clients.fullAuth.boost.revokeBoostRecipient({
                    boostUri,
                    recipientProfileId: 'userb',
                    credentialUri: missingUri,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('rejects suspend when credentialUri is not an instance of the given boost', async () => {
            const otherBoostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const otherInstanceUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                otherBoostUri,
                true
            );

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            await expect(
                userA.clients.fullAuth.boost.suspendBoostRecipient({
                    boostUri,
                    recipientProfileId: 'userb',
                    credentialUri: otherInstanceUri,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('still enforces canRevoke permission when a credentialUri is supplied', async () => {
            const instanceUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            // userC has no permission on this boost — passing a valid credentialUri must not bypass it.
            await expect(
                userC.clients.fullAuth.boost.revokeBoostRecipient({
                    boostUri,
                    recipientProfileId: 'userb',
                    credentialUri: instanceUri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('still rejects unauthenticated callers when a credentialUri is supplied', async () => {
            const instanceUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            await expect(
                noAuthClient.boost.revokeBoostRecipient({
                    boostUri,
                    recipientProfileId: 'userb',
                    credentialUri: instanceUri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    // -------------------------------------------------------------------
    // Back-compat: omitting credentialUri keeps the most-recent fallback
    // -------------------------------------------------------------------
    describe('back-compat fallback (no credentialUri)', () => {
        it('revokes exactly one instance when credentialUri is omitted', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            const result = await userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });
            expect(result).toBe(true);

            const delivered = await getDeliveredActivitiesForUserB();
            const revoked = delivered.filter((r: any) => r.status === 'revoked');
            const active = delivered.filter((r: any) => isActiveStatus(r.status));

            // Fallback revokes a single (most-recent) instance, leaving the other active.
            expect(revoked.length).toBe(1);
            expect(active.length).toBe(1);
        });

        it('targets the most-recently-issued instance when credentialUri is omitted', async () => {
            const statusBoostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: statusBoostTemplate,
            });

            const first = await issueStatusInstanceToUserB(statusBoostUri);
            const second = await issueStatusInstanceToUserB(statusBoostUri);

            const firstEntry = getEntryForPurpose(first.credential, 'revocation');
            const secondEntry = getEntryForPurpose(second.credential, 'revocation');
            expect(firstEntry.statusListIndex).not.toEqual(secondEntry.statusListIndex);

            await userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri: statusBoostUri,
                recipientProfileId: 'userb',
            });

            // Fallback resolves the latest instance (ORDER BY received/sent date DESC LIMIT 1).
            expect(await isStatusBitSet(secondEntry)).toBe(true);
            expect(await isStatusBitSet(firstEntry)).toBe(false);
        });

        it('returns NOT_FOUND when the recipient has no instance of the boost', async () => {
            await expect(
                userA.clients.fullAuth.boost.revokeBoostRecipient({
                    boostUri,
                    recipientProfileId: 'userc',
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });
    });

    // -------------------------------------------------------------------
    // Per-instance status surfacing on getMyActivities
    // -------------------------------------------------------------------
    describe('status surfacing on getMyActivities', () => {
        it('reports a freshly issued instance as active', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            const delivered = await getDeliveredActivitiesForUserB();
            expect(delivered.length).toBe(1);
            expect(isActiveStatus(delivered[0]?.status)).toBe(true);
        });

        it('reports revoked status after revocation', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            await userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });

            const delivered = await getDeliveredActivitiesForUserB();
            expect(delivered.length).toBe(1);
            expect(delivered[0]?.status).toBe('revoked');
        });

        it('reports suspended status, then active again after unsuspend', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            await userA.clients.fullAuth.boost.suspendBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });

            let delivered = await getDeliveredActivitiesForUserB();
            expect(delivered.length).toBe(1);
            expect(delivered[0]?.status).toBe('suspended');

            await userA.clients.fullAuth.boost.unsuspendBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });

            delivered = await getDeliveredActivitiesForUserB();
            expect(delivered.length).toBe(1);
            expect(isActiveStatus(delivered[0]?.status)).toBe(true);
        });

        it('counts a revoked instance in getActivityStats (LC-1894 A3)', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );
            await userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });

            const stats = await userA.clients.fullAuth.activity.getActivityStats({
                boostUris: [boostUri],
            });
            expect(stats.revoked).toBe(1);
            expect(stats.suspended).toBe(0);
        });

        it('counts a suspended instance in getActivityStats (LC-1894 A3)', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );
            await userA.clients.fullAuth.boost.suspendBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });

            const stats = await userA.clients.fullAuth.activity.getActivityStats({
                boostUris: [boostUri],
            });
            expect(stats.suspended).toBe(1);
            expect(stats.revoked).toBe(0);
        });

        it('returns lifecycle status only to the credential holder', async () => {
            const credentialUri = await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            const holderStatuses =
                await userB.clients.fullAuth.activity.getMyCredentialLifecycleStatuses({
                    uris: [credentialUri],
                });
            expect(holderStatuses).toEqual({ [credentialUri]: 'active' });

            const issuerStatuses =
                await userA.clients.fullAuth.activity.getMyCredentialLifecycleStatuses({
                    uris: [credentialUri],
                });
            expect(issuerStatuses).toEqual({});
        });
    });

    // -------------------------------------------------------------------
    // status field on getBoostRecipients / getPaginatedBoostRecipients
    // -------------------------------------------------------------------
    describe('status field on boost recipients', () => {
        it('marks a suspended recipient with status="suspended" while keeping them in the list', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            await userA.clients.fullAuth.boost.suspendBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });

            const recipients = await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                uri: boostUri,
            });

            const userbRecord = recipients.records.find((r: any) => r.to?.profileId === 'userb');

            // Suspended recipients remain visible (unlike revoked, which are filtered out)...
            expect(userbRecord).toBeDefined();
            expect(userbRecord?.status).toBe('suspended');
        });

        it('clears the suspended status after unsuspend', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            await userA.clients.fullAuth.boost.suspendBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });
            await userA.clients.fullAuth.boost.unsuspendBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });

            const recipients = await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                uri: boostUri,
            });

            const userbRecord = recipients.records.find((r: any) => r.to?.profileId === 'userb');

            expect(userbRecord).toBeDefined();
            expect(isActiveStatus(userbRecord?.status)).toBe(true);
        });

        it('continues to filter revoked recipients out of the list entirely', async () => {
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                boostUri,
                true
            );

            await userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            });

            const recipients = await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                uri: boostUri,
            });

            expect(
                recipients.records.find((r: any) => r.to?.profileId === 'userb')
            ).toBeUndefined();
        });
    });

    // -------------------------------------------------------------------
    // Per-instance status beyond the historical 25-recipient cap (LC-1894 A2)
    //
    // PR #1271 surfaces each instance's status directly off its CREDENTIAL_SENT
    // relationship (coalesce(sent.status, received.status)) for EVERY activity row,
    // bounded only by the caller's `limit`. Earlier implementations overlaid status
    // from a separate query capped at 25 recipients, so the 26th+ recipient surfaced a
    // stale/default status. This guard locks the per-instance surfacing for >25
    // distinct recipients so the cap can't silently regress.
    // -------------------------------------------------------------------
    describe('status surfacing beyond the historical 25-recipient cap', () => {
        // 26 distinct recipient wallets — created once in beforeAll; profiles are re-created
        // per test by the outer beforeEach (which wipes the DB) plus the nested one below.
        const recipientCount = 26;
        const recipientUsers: Awaited<ReturnType<typeof getUser>>[] = [];

        beforeAll(async () => {
            for (let i = 0; i < recipientCount; i++) {
                // 26 distinct 64-char hex seeds (getDidKeyPlugin rejects non-hex).
                const seed = (i + 1).toString(16).padStart(2, '0').repeat(32);
                recipientUsers.push(await getUser(seed));
            }
        });

        beforeEach(async () => {
            for (let i = 0; i < recipientCount; i++) {
                await recipientUsers[i]!.clients.fullAuth.profile.createProfile({
                    profileId: `cap${i}`,
                });
            }
        });

        it('reports per-instance revoked status beyond the historical 25-recipient cap', async () => {
            // Issue the boost to 26 DISTINCT recipients. No accept is needed: revoke stamps the
            // CREDENTIAL_SENT relationship directly, which is exactly what getMyActivities reads.
            const recipientUris: string[] = [];
            for (let i = 0; i < recipientCount; i++) {
                recipientUris.push(
                    await sendBoost(
                        { profileId: 'usera', user: userA },
                        { profileId: `cap${i}`, user: recipientUsers[i]! },
                        boostUri,
                        false
                    )
                );
            }
            // Sanity: each recipient got a distinct credential instance.
            expect(new Set(recipientUris).size).toBe(recipientCount);

            // Revoke ONLY the 26th recipient (index 25 — past the old 25-row overlay cap).
            await userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'cap25',
            });

            const result = await userA.clients.fullAuth.activity.getMyActivities({
                boostUri,
                limit: 100,
            });

            const delivered = result.records.filter(r => r.eventType === 'DELIVERED');
            // All 26 DELIVERED rows surfaced despite the historical cap.
            expect(delivered).toHaveLength(recipientCount);

            const revokedRecord = delivered.find(r => r.recipientProfile?.profileId === 'cap25');
            const activeRecord = delivered.find(r => r.recipientProfile?.profileId === 'cap0');

            // The 26th recipient (beyond the historical cap) surfaces its real per-instance status.
            expect(revokedRecord).toBeDefined();
            expect(revokedRecord?.status).toBe('revoked');

            // A sibling instance beyond the cap stays active.
            expect(activeRecord).toBeDefined();
            expect(isActiveStatus(activeRecord?.status)).toBe(true);
        }, 60_000);
    });
});

// ---------------------------------------------------------------------------
// Holder notifications on revoke / suspend / unsuspend (LC-1913 B1)
// ---------------------------------------------------------------------------
describe('Holder notifications on revoke/suspend/unsuspend (LC-1913)', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        await statusListsApp.ready();
    });

    let boostUri: string;

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await StatusList.delete({ detach: true, where: {} });
        await CredentialActivity.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await StatusList.delete({ detach: true, where: {} });
        await CredentialActivity.delete({ detach: true, where: {} });
    });

    /** Seed one claimed boost instance from userA -> userB, returning the credential URI. */
    const seedClaimedBoost = async (): Promise<string> =>
        sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );

    it('queues a CREDENTIAL_REVOKED notification to the holder on revoke', async () => {
        const recipientProfileId = 'userb';
        const credentialUri = await seedClaimedBoost();

        const spy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined as any);

        await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri,
            recipientProfileId,
            credentialUri,
        });

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'CREDENTIAL_REVOKED' }));
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
                to: expect.objectContaining({ profileId: 'userb' }),
                from: expect.objectContaining({ profileId: 'usera' }),
                data: expect.objectContaining({
                    vcUris: expect.arrayContaining([expect.any(String)]),
                }),
            })
        );
        spy.mockRestore();
    }, 20000);

    it('queues a CREDENTIAL_SUSPENDED notification to the holder on suspend', async () => {
        const recipientProfileId = 'userb';
        const credentialUri = await seedClaimedBoost();

        const spy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined as any);

        await userA.clients.fullAuth.boost.suspendBoostRecipient({
            boostUri,
            recipientProfileId,
            credentialUri,
        });

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'CREDENTIAL_SUSPENDED' }));
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
                to: expect.objectContaining({ profileId: 'userb' }),
                data: expect.objectContaining({
                    vcUris: expect.arrayContaining([expect.any(String)]),
                }),
            })
        );
        spy.mockRestore();
    }, 20000);

    it('queues a CREDENTIAL_UNSUSPENDED notification to the holder on unsuspend', async () => {
        const recipientProfileId = 'userb';
        const credentialUri = await seedClaimedBoost();

        // First suspend, so the unsuspend action succeeds.
        await userA.clients.fullAuth.boost.suspendBoostRecipient({
            boostUri,
            recipientProfileId,
            credentialUri,
        });

        const spy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined as any);

        await userA.clients.fullAuth.boost.unsuspendBoostRecipient({
            boostUri,
            recipientProfileId,
            credentialUri,
        });

        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'CREDENTIAL_UNSUSPENDED' })
        );
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
                to: expect.objectContaining({ profileId: 'userb' }),
                data: expect.objectContaining({
                    vcUris: expect.arrayContaining([expect.any(String)]),
                }),
            })
        );
        spy.mockRestore();
    }, 20000);

    it('does not fail the revoke when notification queuing throws', async () => {
        const recipientProfileId = 'userb';
        const credentialUri = await seedClaimedBoost();

        // Only mock AFTER seeding so the spy affects just the revoke's notification.
        const spy = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockRejectedValue(new Error('queue down'));

        // Should NOT throw despite the notification failure.
        const result = await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri,
            recipientProfileId,
            credentialUri,
        });

        expect(result).toBe(true);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    }, 20000);
});
