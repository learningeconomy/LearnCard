import { getUser } from './helpers/getClient';
import { getPushTokensCollection } from '@accesslayer/pushtokens';

import { client } from '@mongo';

let userA: Awaited<ReturnType<typeof getUser>>;

beforeAll(async () => {
    try {
        await client.connect();
    } catch (error) {
        console.error(error);
    }
});

afterAll(async () => {
    try {
        await client.close();
    } catch (error) {
        console.error(error);
    }
});

describe('Push Tokens', () => {
    beforeAll(async () => {
        userA = await getUser();
    });

    beforeEach(async () => {
        await getPushTokensCollection().deleteMany({});
    });

    describe('registerDeviceForPushNotifications', () => {
        it('should allow you to register a device for push with a token', async () => {
            await expect(
                userA.clients.fullAuth.notifications.registerDeviceForPushNotifications({
                    token: 'useratoken',
                })
            ).resolves.not.toThrow();

            expect(
                (await getPushTokensCollection().findOne({ token: 'useratoken' }))?.token
            ).toEqual('useratoken');
        });

        it('should prevent multiple entries of the same token for one did', async () => {
            await expect(
                userA.clients.fullAuth.notifications.registerDeviceForPushNotifications({
                    token: 'useratoken',
                })
            ).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.notifications.registerDeviceForPushNotifications({
                    token: 'useratoken',
                })
            ).resolves.not.toThrow();

            expect(
                await getPushTokensCollection().find({ token: 'useratoken' }).toArray()
            ).toHaveLength(1);
        });
    });

    describe('unregisterDeviceForPushNotifications', () => {
        it('should allow you to unregister a device for push with a token', async () => {
            await userA.clients.fullAuth.notifications.registerDeviceForPushNotifications({
                token: 'useratoken',
            });
            await expect(
                userA.clients.fullAuth.notifications.unregisterDeviceForPushNotifications({
                    token: 'useratoken',
                })
            ).resolves.not.toThrow();

            expect(
                (await getPushTokensCollection().findOne({ token: 'useratoken' }))?.token
            ).toBeUndefined();
        });
    });
});
