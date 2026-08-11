import {
    Boost,
    ClaimHook,
    Credential,
    CredentialActivity,
    Profile,
    Role,
    StatusList,
} from '@models';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app as statusListsApp } from '../src/status-lists';
import { decodeBitstring } from '../src/helpers/status-list.helpers';
import * as notifications from '../src/helpers/notifications.helpers';
import * as revokeHooks from '../src/helpers/revoke-hooks.helpers';
import * as statusListHelpers from '../src/helpers/status-list.helpers';
import { getIdFromUri } from '../src/helpers/uri.helpers';
import { getClient, getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

const statusBoostTemplate = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2024-01-01T00:00:00.000Z',
    name: 'Group Revocation Status Boost',
    credentialSubject: { id: 'did:example:subject' },
};

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

const isStatusBitSet = async (entry: any): Promise<boolean> => {
    const listId = entry.statusListCredential.split('/').pop();
    const response = await statusListsApp.inject({
        method: 'GET',
        url: `/status-lists/${listId}`,
    });
    expect(response.statusCode).toBe(200);

    const statusListCredential = JSON.parse(response.body);
    const bitstring = decodeBitstring(statusListCredential.credentialSubject.encodedList, 131_072);
    const index = Number(entry.statusListIndex);
    const byte = bitstring[Math.floor(index / 8)] ?? 0;
    return (byte & (1 << index % 8)) !== 0;
};

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
    return {
        credentialUri,
        credential: await userB.clients.fullAuth.storage.resolve({ uri: credentialUri }),
    };
};

const getConnectionCount = async (fromId: string, toId: string): Promise<number> => {
    const { neogma } = await import('@instance');
    const query = await neogma.queryRunner.run(
        `MATCH (:Profile {profileId: $fromId})-[r:CONNECTED_WITH]-(:Profile {profileId: $toId})
         RETURN count(r) AS count`,
        { fromId, toId }
    );
    return query.records[0]?.get('count').toNumber() ?? 0;
};

describe('Revoke Boost Recipient Group (LC-1950)', { timeout: 30_000 }, () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
        await statusListsApp.ready();
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await StatusList.delete({ detach: true, where: {} });
        await CredentialActivity.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
    });

    afterEach(() => vi.restoreAllMocks());

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await StatusList.delete({ detach: true, where: {} });
        await CredentialActivity.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
    });

    it('revokes every active, suspended, and pending instance without allowing unsuspend to revive it', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        const userARef = { profileId: 'usera', user: userA };
        const userBRef = { profileId: 'userb', user: userB };
        const activeUri = await sendBoost(userARef, userBRef, boostUri, true);
        const suspendedUri = await sendBoost(userARef, userBRef, boostUri, true);
        const pendingUri = await sendBoost(userARef, userBRef, boostUri, false);

        await userA.clients.fullAuth.boost.suspendBoostRecipient({
            boostUri,
            recipientProfileId: 'userb',
            credentialUri: suspendedUri,
        });

        const result = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
            boostUri,
            recipientProfileId: 'userb',
        });
        expect(new Set(result.revokedCredentialUris)).toEqual(
            new Set([activeUri, suspendedUri, pendingUri])
        );
        expect(result.alreadyRevokedCredentialUris).toEqual([]);
        expect(result.failedCredentialUris).toEqual([]);

        const statuses = await userB.clients.fullAuth.activity.getMyCredentialLifecycleStatuses({
            uris: [activeUri, suspendedUri, pendingUri],
        });
        expect(statuses).toEqual({
            [activeUri]: 'revoked',
            [suspendedUri]: 'revoked',
            [pendingUri]: 'revoked',
        });

        await expect(
            userA.clients.fullAuth.boost.unsuspendBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
                credentialUri: suspendedUri,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(
            await userB.clients.fullAuth.activity.getMyCredentialLifecycleStatuses({
                uris: [suspendedUri],
            })
        ).toEqual({ [suspendedUri]: 'revoked' });
    }, 15_000);

    it('authorizes before group mutation and rejects unauthenticated access', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );

        await expect(
            userC.clients.fullAuth.boost.revokeBoostRecipientGroup({
                boostUri,
                recipientProfileId: 'userb',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            noAuthClient.boost.revokeBoostRecipientGroup({ boostUri, recipientProfileId: 'userb' })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('classifies a retry as already revoked and emits no duplicate notification', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
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
        const notificationSpy = vi.spyOn(notifications, 'addNotificationToQueue');
        notificationSpy.mockClear();

        const input = { boostUri, recipientProfileId: 'userb' };
        const first = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
        expect(first.revokedCredentialUris).toHaveLength(2);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { vcUris: expect.arrayContaining(first.revokedCredentialUris) },
            })
        );

        notificationSpy.mockClear();
        const second = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
        expect(second.revokedCredentialUris).toEqual([]);
        expect(new Set(second.alreadyRevokedCredentialUris)).toEqual(
            new Set(first.revokedCredentialUris)
        );
        expect(second.failedCredentialUris).toEqual([]);
        expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('sets revocation bits for every status-enabled instance', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: statusBoostTemplate,
        });
        const first = await issueStatusInstanceToUserB(boostUri);
        const second = await issueStatusInstanceToUserB(boostUri);
        const firstEntry = getEntryForPurpose(first.credential, 'revocation');
        const secondEntry = getEntryForPurpose(second.credential, 'revocation');

        await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
            boostUri,
            recipientProfileId: 'userb',
        });

        expect(await isStatusBitSet(firstEntry)).toBe(true);
        expect(await isStatusBitSet(secondEntry)).toBe(true);
    });

    it('rejects singular revocation when the status-list update throws', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: statusBoostTemplate,
        });
        const { credentialUri } = await issueStatusInstanceToUserB(boostUri);
        vi.spyOn(statusListHelpers, 'setCredentialBitstringStatusWithResult').mockRejectedValueOnce(
            new Error('intentional status-list failure')
        );
        const notificationSpy = vi.spyOn(notifications, 'addNotificationToQueue');
        notificationSpy.mockClear();

        await expect(
            userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
                credentialUri,
            })
        ).rejects.toThrow('Failed to update credential status list');
        expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('rejects singular revocation when the status-list update reports failure', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: statusBoostTemplate,
        });
        const { credentialUri } = await issueStatusInstanceToUserB(boostUri);
        vi.spyOn(statusListHelpers, 'setCredentialBitstringStatusWithResult').mockResolvedValueOnce(
            'failed'
        );
        const notificationSpy = vi.spyOn(notifications, 'addNotificationToQueue');
        notificationSpy.mockClear();

        await expect(
            userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
                credentialUri,
            })
        ).rejects.toThrow('Failed to update credential status list');
        expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('authoritatively revokes legacy credentials while logging a migration gap', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        const uri = await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const result = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
            boostUri,
            recipientProfileId: 'userb',
        });
        expect(result.revokedCredentialUris).toEqual([uri]);
        expect(warnSpy).toHaveBeenCalledWith(
            '[revokeBoostRecipientGroup] migration-gap',
            expect.objectContaining({ credentialId: expect.any(String), reason: 'missing-entry' })
        );
    });

    it('repairs legacy received-side revocation without changing its audit time or notifying', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        const credentialUri = await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );
        const credentialId = getIdFromUri(credentialUri);
        const legacyRevokedAt = '2025-01-02T03:04:05.000Z';
        const { neogma } = await import('@instance');
        await neogma.queryRunner.run(
            `MATCH (:Profile)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential:Credential {id: $credentialId})
             MATCH (credential)-[received:CREDENTIAL_RECEIVED]->(:Profile {profileId: $profileId})
             SET sent.status = null,
                 received.status = "revoked",
                 received.revokedAt = $legacyRevokedAt
             REMOVE sent.revokedAt`,
            { credentialId, profileId: 'userb', legacyRevokedAt }
        );
        const notificationSpy = vi.spyOn(notifications, 'addNotificationToQueue');
        notificationSpy.mockClear();
        const hookSpy = vi.spyOn(revokeHooks, 'processRevokeHooksStrict');

        const result = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
            boostUri,
            recipientProfileId: 'userb',
        });

        expect(result.revokedCredentialUris).toEqual([]);
        expect(result.alreadyRevokedCredentialUris).toEqual([credentialUri]);
        expect(result.failedCredentialUris).toEqual([]);
        expect(notificationSpy).not.toHaveBeenCalled();
        expect(hookSpy).toHaveBeenCalledWith(
            expect.objectContaining({ profileId: 'userb' }),
            expect.objectContaining({ id: credentialId })
        );

        const audit = await neogma.queryRunner.run(
            `MATCH (:Profile)-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential:Credential {id: $credentialId})
             MATCH (credential)-[received:CREDENTIAL_RECEIVED]->(:Profile {profileId: $profileId})
             RETURN sent.status AS sentStatus,
                    sent.revokedAt AS sentRevokedAt,
                    received.revokedAt AS receivedRevokedAt`,
            { credentialId, profileId: 'userb' }
        );
        expect(audit.records[0]?.get('sentStatus')).toBe('revoked');
        expect(audit.records[0]?.get('sentRevokedAt')).toBe(legacyRevokedAt);
        expect(audit.records[0]?.get('receivedRevokedAt')).toBe(legacyRevokedAt);
    });

    it('retries cleanup hooks for already revoked credentials after a partial failure', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        const successfulUri = await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );
        const failingUri = await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );
        const failingCredentialId = getIdFromUri(failingUri);
        const realProcessRevokeHooks = revokeHooks.processRevokeHooksStrict;
        const notificationSpy = vi.spyOn(notifications, 'addNotificationToQueue');
        notificationSpy.mockClear();
        let failingCredentialHookCalls = 0;
        const processRevokeHooksSpy = vi
            .spyOn(revokeHooks, 'processRevokeHooksStrict')
            .mockImplementation(async (profile, credential) => {
                if (credential.id === failingCredentialId && failingCredentialHookCalls++ === 0)
                    throw new Error('intentional hook failure');
                return realProcessRevokeHooks(profile, credential);
            });

        const input = { boostUri, recipientProfileId: 'userb' };
        const firstResult = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
        expect(firstResult.failedCredentialUris).toEqual([failingUri]);
        expect(firstResult.revokedCredentialUris).toContain(successfulUri);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { vcUris: expect.arrayContaining([successfulUri, failingUri]) },
            })
        );

        const secondResult = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
        expect(secondResult.failedCredentialUris).toEqual([]);
        expect(secondResult.alreadyRevokedCredentialUris).toContain(failingUri);
        expect(failingCredentialHookCalls).toBe(2);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(processRevokeHooksSpy).toHaveBeenCalledWith(
            expect.objectContaining({ profileId: 'userb' }),
            expect.objectContaining({ id: failingCredentialId })
        );
    });

    it('retries failed status-list updates for already revoked credentials', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: statusBoostTemplate,
        });
        await issueStatusInstanceToUserB(boostUri);
        const { credentialUri: newestCredentialUri, credential: newestCredential } =
            await issueStatusInstanceToUserB(boostUri);
        const newestRevocationEntry = getEntryForPurpose(newestCredential, 'revocation');
        const realStatusUpdate = statusListHelpers.setCredentialBitstringStatusWithResult;
        const statusUpdateSpy = vi
            .spyOn(statusListHelpers, 'setCredentialBitstringStatusWithResult')
            .mockResolvedValueOnce('failed')
            .mockImplementation(realStatusUpdate);
        const notificationSpy = vi.spyOn(notifications, 'addNotificationToQueue');
        notificationSpy.mockClear();

        const input = { boostUri, recipientProfileId: 'userb' };
        const firstResult = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
        expect(firstResult.failedCredentialUris).toContain(newestCredentialUri);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { vcUris: expect.arrayContaining([newestCredentialUri]) },
            })
        );

        statusUpdateSpy.mockRestore();
        const retryResult = await userA.clients.fullAuth.boost.revokeBoostRecipientGroup(input);
        expect(retryResult.failedCredentialUris).toEqual([]);
        expect(retryResult.alreadyRevokedCredentialUris).toContain(newestCredentialUri);
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(await isStatusBitSet(newestRevocationEntry)).toBe(true);
    });

    it('removes permissions and admin roles granted by repeated claim instances', async () => {
        const claimUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        const targetUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        await userA.clients.fullAuth.claimHook.createClaimHook({
            hook: {
                type: 'GRANT_PERMISSIONS',
                data: { claimUri, targetUri, permissions: { canIssue: true } },
            },
        });
        await userA.clients.fullAuth.claimHook.createClaimHook({
            hook: { type: 'ADD_ADMIN', data: { claimUri, targetUri } },
        });
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            claimUri,
            true
        );
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            claimUri,
            true
        );
        expect(
            (await userB.clients.fullAuth.boost.getBoostPermissions({ uri: targetUri })).canIssue
        ).toBe(true);
        const adminRoleId = (
            await userB.clients.fullAuth.boost.getBoostPermissions({ uri: targetUri })
        ).role;
        expect(adminRoleId).toBeTruthy();

        await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
            boostUri: claimUri,
            recipientProfileId: 'userb',
        });
        const permissions = await userB.clients.fullAuth.boost.getBoostPermissions({
            uri: targetUri,
        });
        expect(permissions.canIssue).toBeFalsy();
        expect(permissions.role).not.toBe(adminRoleId);
    });

    it('removes autoConnectRecipients connections after revoking the group', async () => {
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            autoConnectRecipients: true,
        });
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );
        expect(await getConnectionCount('usera', 'userb')).toBeGreaterThan(0);

        await userA.clients.fullAuth.boost.revokeBoostRecipientGroup({
            boostUri,
            recipientProfileId: 'userb',
        });
        expect(await getConnectionCount('usera', 'userb')).toBe(0);
    });
});
