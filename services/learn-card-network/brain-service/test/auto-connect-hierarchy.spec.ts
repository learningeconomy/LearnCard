import { describe, it, beforeAll, beforeEach, afterAll, expect, vi } from 'vitest';

import { LCNNotificationTypeEnumValidator } from '@learncard/types';

import { getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';

import * as Notifications from '@helpers/notifications.helpers';
import { neogma } from '@instance';
import { Profile, Boost, Credential, CredentialActivity } from '@models';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

describe('Auto-connect via parent boost with children', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
    });

    it('connects recipients of different child boosts when parent has autoConnectRecipients', async () => {
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            autoConnectRecipients: true,
        });

        const childUri1 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost },
        });

        const childUri2 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost },
        });

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            childUri1,
            true
        );

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userc', user: userC },
            childUri2,
            true
        );

        const bConnections = await userB.clients.fullAuth.profile.paginatedConnections();
        const cConnections = await userC.clients.fullAuth.profile.paginatedConnections();

        expect(bConnections.records.map(r => r.profileId)).toContain('userc');
        expect(cConnections.records.map(r => r.profileId)).toContain('userb');
    });

    it('disconnects those recipients when the parent autoConnectRecipients flag is toggled off', async () => {
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            autoConnectRecipients: true,
        });

        const childUri1 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost },
        });

        const childUri2 = await userA.clients.fullAuth.boost.createChildBoost({
            parentUri,
            boost: { credential: testUnsignedBoost },
        });

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            childUri1,
            true
        );

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userc', user: userC },
            childUri2,
            true
        );

        const beforeDeleteBConnections =
            await userB.clients.fullAuth.profile.paginatedConnections();
        const beforeDeleteCConnections =
            await userC.clients.fullAuth.profile.paginatedConnections();

        expect(beforeDeleteBConnections.records.map(r => r.profileId)).toContain('userc');
        expect(beforeDeleteCConnections.records.map(r => r.profileId)).toContain('userb');

        await userA.clients.fullAuth.boost.updateBoost({
            uri: parentUri,
            updates: { autoConnectRecipients: false, meta: { toggled: true } },
        });

        const afterDeleteBConnections = await userB.clients.fullAuth.profile.paginatedConnections();
        const afterDeleteCConnections = await userC.clients.fullAuth.profile.paginatedConnections();

        expect(afterDeleteBConnections.records.map(r => r.profileId)).not.toContain('userc');
        expect(afterDeleteCConnections.records.map(r => r.profileId)).not.toContain('userb');
    });

    it('reconciles a partial automatic connection batch on idempotent acceptance retry', async () => {
        const parentUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            autoConnectRecipients: true,
        });
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            parentUri,
            true
        );
        const credentialUri = await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userc', user: userC },
            parentUri,
            false
        );
        const originalRun = neogma.queryRunner.run.bind(neogma.queryRunner);
        let signalCreatorPairComplete: (() => void) | undefined;
        const creatorPairComplete = new Promise<void>(resolve => {
            signalCreatorPairComplete = resolve;
        });
        let failRecipientPair = true;
        const queryRunnerSpy = vi
            .spyOn(neogma.queryRunner, 'run')
            .mockImplementation(async (query, params) => {
                const isAutomaticPairWrite =
                    typeof query === 'string' &&
                    query.includes('MERGE (a)-[r:CONNECTED_WITH]') &&
                    params?.aId === 'userc';

                if (isAutomaticPairWrite && params?.bId === 'usera') {
                    const result = await originalRun(query, params);
                    signalCreatorPairComplete?.();
                    return result;
                }
                if (isAutomaticPairWrite && params?.bId === 'userb' && failRecipientPair) {
                    await creatorPairComplete;
                    failRecipientPair = false;
                    throw new Error('injected automatic recipient pair failure');
                }

                return originalRun(query, params);
            });
        const notificationSpy = vi
            .spyOn(Notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined);

        try {
            try {
                await expect(
                    userC.clients.fullAuth.credential.acceptCredential({ uri: credentialUri })
                ).rejects.toThrow('injected automatic recipient pair failure');

                const partialConnections =
                    await userC.clients.fullAuth.profile.paginatedConnections();
                expect(partialConnections.records.map(record => record.profileId).sort()).toEqual([
                    'usera',
                ]);
                expect(
                    await CredentialActivity.findMany({
                        where: { eventType: 'CLAIMED', credentialUri },
                    })
                ).toHaveLength(1);
            } finally {
                queryRunnerSpy.mockRestore();
            }

            await expect(
                userC.clients.fullAuth.credential.acceptCredential({ uri: credentialUri })
            ).resolves.toBe(true);

            const reconciledConnections =
                await userC.clients.fullAuth.profile.paginatedConnections();
            expect(reconciledConnections.records.map(record => record.profileId).sort()).toEqual([
                'usera',
                'userb',
            ]);
            expect(
                await CredentialActivity.findMany({
                    where: { eventType: 'CLAIMED', credentialUri },
                })
            ).toHaveLength(1);
            expect(
                notificationSpy.mock.calls.filter(
                    call => call[0]?.type === LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED
                )
            ).toHaveLength(1);

            const sourceResult = await neogma.queryRunner.run(
                `
                    MATCH (:Profile { profileId: 'userc' })-[connection:CONNECTED_WITH]-
                          (:Profile { profileId: 'userb' })
                    RETURN connection.sources AS sources
                    ORDER BY sources
                `
            );
            expect(sourceResult.records.map(record => record.get('sources') as string[])).toEqual([
                [`boost:${parentUri.split(':').at(-1)}`],
                [`boost:${parentUri.split(':').at(-1)}`],
            ]);
        } finally {
            queryRunnerSpy.mockRestore();
            notificationSpy.mockRestore();
        }
    });
});
