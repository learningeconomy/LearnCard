import { getUser } from './helpers/getClient';
import { Notifications } from '@accesslayer/notifications';
import {
    LCNProfile,
    LCNNotificationTypeEnumValidator,
    LCNNotificationTypeEnum,
} from '@learncard/types';
import { NotificationActionStatusEnumValidator } from '@models';
import { getTestNotification, addMinutesToDate } from './helpers/notifications';
import { NotificationMetaType, NotificationsSortEnumValidator } from 'types/notifications';

import { client } from '@mongo';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

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

describe('Notifications', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Notifications.deleteMany({});
    });

    describe('Send Notification', () => {
        it('should allow an authorized service to send a notification to a user', async () => {
            await expect(
                userA.clients.authorizedDidAuth.notifications.sendNotification(
                    getTestNotification(userA.learnCard.id.did(), userB.learnCard.id.did())
                )
            ).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.notifications.notifications({ options: { limit: 5 } })
            ).resolves.toMatchObject({
                hasMore: false,
                notifications: [
                    getTestNotification(userA.learnCard.id.did(), userB.learnCard.id.did()),
                ],
            });
        });
        it('should prevent an unauthorized service to send a notification to a user', async () => {
            await expect(
                userA.clients.fullAuth.notifications.sendNotification(
                    getTestNotification(userA.learnCard.id.did(), userB.learnCard.id.did())
                )
            ).rejects.toThrow();
        });
    });

    describe('Update Notification Meta', () => {
        it('should allow you to mark a notification as read', async () => {
            // Send 2 Notifications to userA from userB
            await sendTestNotifications(userA.learnCard.id.did(), userB.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
            ]);

            const notification = (
                await userA.clients.fullAuth.notifications.notifications({ options: { limit: 5 } })
            ).notifications[0];

            if (notification?._id) {
                expect(notification.read).toBe(false);
                await userA.clients.fullAuth.notifications.updateNotificationMeta({
                    _id: notification._id,
                    meta: { read: true },
                });
                expect(
                    (
                        await userA.clients.fullAuth.notifications.notifications({
                            options: { limit: 5 },
                        })
                    ).notifications[0]?.read
                ).toBe(true);
            } else {
                expect(notification?._id).toBeDefined();
            }
        });

        it('should allow you to mark a notification as archived', async () => {
            // Send 2 Notifications to userA from userB
            await sendTestNotifications(userA.learnCard.id.did(), userB.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
            ]);

            const notification = (
                await userA.clients.fullAuth.notifications.notifications({ options: { limit: 5 } })
            ).notifications[0];
            if (notification?._id) {
                expect(notification.archived).toBe(false);
                await userA.clients.fullAuth.notifications.updateNotificationMeta({
                    _id: notification._id,
                    meta: { archived: true },
                });
                expect(
                    (
                        await userA.clients.fullAuth.notifications.notifications({
                            options: { limit: 5 },
                        })
                    ).notifications[0]?.archived
                ).toBe(true);
            } else {
                expect(notification?._id).toBeDefined();
            }
        });

        it('should allow you to update the actionStatus of a notification', async () => {
            // Send 2 Notifications to userA from userB
            await sendTestNotifications(userA.learnCard.id.did(), userB.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
            ]);

            const notification = (
                await userA.clients.fullAuth.notifications.notifications({ options: { limit: 5 } })
            ).notifications[0];
            if (notification?._id) {
                expect(notification.actionStatus).toBeUndefined();
                await userA.clients.fullAuth.notifications.updateNotificationMeta({
                    _id: notification._id,
                    meta: { actionStatus: NotificationActionStatusEnumValidator.enum.COMPLETED },
                });
                expect(
                    (
                        await userA.clients.fullAuth.notifications.notifications({
                            options: { limit: 5 },
                        })
                    ).notifications[0]?.actionStatus
                ).toBe(NotificationActionStatusEnumValidator.enum.COMPLETED);
            } else {
                expect(notification?._id).toBeDefined();
            }
        });
    });

    describe('Mark all notifications read', () => {
        it('should allow you to mark all notifications for a user as read', async () => {
            // Send 2 Notifications to userA from userB
            await sendTestNotifications(userA.learnCard.id.did(), userB.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
            ]);

            const notifications = (
                await userA.clients.fullAuth.notifications.notifications({ options: { limit: 5 } })
            ).notifications;

            // check if notification is not read initially
            notifications.forEach(notification => {
                expect(notification.read).toBe(false);
            });

            //Mark all notifications as read
            await userA.clients.fullAuth.notifications.markAllNotificationsRead();

            const readNotifications = (
                await userA.clients.fullAuth.notifications.notifications({ options: { limit: 5 } })
            ).notifications;

            // check if notification are read
            readNotifications.forEach(notification => {
                expect(notification.read).toBe(true);
            });
        });
    });

    describe('Get Notifications', () => {
        it('should allow you to get a list of your notifications', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(userA.learnCard.id.did(), userB.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
            ]);
            // Mark 1 as read & archived
            await updateSomeNotifications(userA, { read: true, archived: true }, 1);
            // Send 1 Notification to userB from userA
            await sendTestNotifications(userB.learnCard.id.did(), userA.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
            ]);

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                    })
                ).notifications
            ).toHaveLength(4);

            expect(
                (
                    await userB.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                    })
                ).notifications
            ).toHaveLength(1);
        });

        it('should support retrieving notifications sent to a DID in the "to.did" field', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(
                { displayName: 'usera', profileId: 'usera', did: userA.learnCard.id.did() },
                userB.learnCard.id.did(),
                [
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                ]
            );

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                    })
                ).notifications
            ).toHaveLength(4);
        });

        it('should allow you to sort notifications CHRONOLOGICAL', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
                [
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                ],
                true
            );

            const notifications = (
                await userA.clients.fullAuth.notifications.notifications({
                    options: { limit: 5, sort: NotificationsSortEnumValidator.enum.CHRONOLOGICAL },
                })
            ).notifications;

            if (
                notifications[0]?.sent &&
                notifications[1]?.sent &&
                notifications[2]?.sent &&
                notifications[3]?.sent
            ) {
                expect(
                    new Date(notifications[0]?.sent).getTime() -
                        new Date(notifications[1]?.sent).getTime()
                ).toBeLessThan(0);

                expect(
                    new Date(notifications[1]?.sent).getTime() -
                        new Date(notifications[2]?.sent).getTime()
                ).toBeLessThan(0);

                expect(
                    new Date(notifications[2]?.sent).getTime() -
                        new Date(notifications[3]?.sent).getTime()
                ).toBeLessThan(0);
            } else {
                notifications.forEach(n => expect(n?.sent).toBeDefined());
            }
        });

        it('should allow you to sort notifications REVERSE_CHRONOLOGICAL', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
                [
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                ],
                true
            );

            const notifications = (
                await userA.clients.fullAuth.notifications.notifications({
                    options: {
                        limit: 5,
                        sort: NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL,
                    },
                })
            ).notifications;

            if (
                notifications[0]?.sent &&
                notifications[1]?.sent &&
                notifications[2]?.sent &&
                notifications[3]?.sent
            ) {
                expect(
                    new Date(notifications[0]?.sent).getTime() -
                        new Date(notifications[1]?.sent).getTime()
                ).toBeGreaterThan(0);

                expect(
                    new Date(notifications[1]?.sent).getTime() -
                        new Date(notifications[2]?.sent).getTime()
                ).toBeGreaterThan(0);

                expect(
                    new Date(notifications[2]?.sent).getTime() -
                        new Date(notifications[3]?.sent).getTime()
                ).toBeGreaterThan(0);
            } else {
                notifications.forEach(n => expect(n?.sent).toBeDefined());
            }
        });

        it('should allow you to paginate notifications, REVERSE_CHRONOLOGICAL', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
                [
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_REQUEST,
                ],
                true
            );

            const paginatedResults = await userA.clients.fullAuth.notifications.notifications({
                options: {
                    limit: 3,
                    sort: NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL,
                },
            });

            expect(paginatedResults.notifications).toHaveLength(3);
            expect(paginatedResults.hasMore).toBe(true);
            expect(paginatedResults.cursor).toBeDefined();

            const secondPaginationResults =
                await userA.clients.fullAuth.notifications.notifications({
                    options: {
                        limit: 3,
                        sort: NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL,
                        cursor: paginatedResults.cursor,
                    },
                });

            expect(secondPaginationResults.notifications).toHaveLength(3);
            expect(secondPaginationResults.hasMore).toBe(true);
            expect(secondPaginationResults.cursor).toBeDefined();

            const thirdPaginationResults = await userA.clients.fullAuth.notifications.notifications(
                {
                    options: {
                        limit: 3,
                        sort: NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL,
                        cursor: secondPaginationResults.cursor,
                    },
                }
            );

            expect(thirdPaginationResults.notifications).toHaveLength(2);
            expect(thirdPaginationResults.hasMore).toBe(false);
            expect(thirdPaginationResults.cursor).toBeDefined();
        });

        it('should allow you to paginate notifications, CHRONOLOGICAL', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
                [
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                    LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
                    LCNNotificationTypeEnumValidator.enum.PRESENTATION_REQUEST,
                ],
                true
            );

            const paginatedResults = await userA.clients.fullAuth.notifications.notifications({
                options: {
                    limit: 3,
                    sort: NotificationsSortEnumValidator.enum.CHRONOLOGICAL,
                },
            });

            expect(paginatedResults.notifications).toHaveLength(3);
            expect(paginatedResults.hasMore).toBe(true);
            expect(paginatedResults.cursor).toBeDefined();

            const secondPaginationResults =
                await userA.clients.fullAuth.notifications.notifications({
                    options: {
                        limit: 3,
                        sort: NotificationsSortEnumValidator.enum.CHRONOLOGICAL,
                        cursor: paginatedResults.cursor,
                    },
                });

            expect(secondPaginationResults.notifications).toHaveLength(3);
            expect(secondPaginationResults.hasMore).toBe(true);
            expect(secondPaginationResults.cursor).toBeDefined();

            const thirdPaginationResults = await userA.clients.fullAuth.notifications.notifications(
                {
                    options: {
                        limit: 3,
                        sort: NotificationsSortEnumValidator.enum.CHRONOLOGICAL,
                        cursor: secondPaginationResults.cursor,
                    },
                }
            );

            expect(thirdPaginationResults.notifications).toHaveLength(2);
            expect(thirdPaginationResults.hasMore).toBe(false);
            expect(thirdPaginationResults.cursor).toBeDefined();
        });

        it('should allow you to filter your notifications by type', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(userA.learnCard.id.did(), userB.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
            ]);
            // Mark 1 as read & archived
            await updateSomeNotifications(userA, { read: true, archived: true }, 1);
            // Send 1 Notification to userB from userA
            await sendTestNotifications(userB.learnCard.id.did(), userA.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
            ]);

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                        filters: { type: LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST },
                    })
                ).notifications
            ).toHaveLength(2);

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                        filters: { type: LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED },
                    })
                ).notifications
            ).toHaveLength(1);

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                        filters: {
                            type: LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                        },
                    })
                ).notifications
            ).toHaveLength(1);
        });

        it('should allow you to filter your notifications by read', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(userA.learnCard.id.did(), userB.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
            ]);
            // Mark 1 as read & archived
            await updateSomeNotifications(userA, { read: true, archived: true }, 1);
            // Send 1 Notification to userB from userA
            await sendTestNotifications(userB.learnCard.id.did(), userA.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
            ]);

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                        filters: { read: false },
                    })
                ).notifications
            ).toHaveLength(3);

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                        filters: { read: true },
                    })
                ).notifications
            ).toHaveLength(1);
        });

        it('should allow you to filter your notifications by archived', async () => {
            // Send 4 Notifications to userA from userB
            await sendTestNotifications(userA.learnCard.id.did(), userB.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.CONNECTION_REQUEST,
                LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
                LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
            ]);
            // Mark 1 as read & archived
            await updateSomeNotifications(userA, { read: true, archived: true }, 1);
            // Send 1 Notification to userB from userA
            await sendTestNotifications(userB.learnCard.id.did(), userA.learnCard.id.did(), [
                LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
            ]);

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                        filters: { archived: false },
                    })
                ).notifications
            ).toHaveLength(3);

            expect(
                (
                    await userA.clients.fullAuth.notifications.notifications({
                        options: { limit: 5 },
                        filters: { archived: true },
                    })
                ).notifications
            ).toHaveLength(1);
        });
    });
});

export const updateSomeNotifications = async (
    user: Awaited<ReturnType<typeof getUser>>,
    meta: NotificationMetaType,
    count: number
) => {
    for (let x = 0; x < count; x++) {
        const notification = (
            await user.clients.fullAuth.notifications.notifications({ options: { limit: 100 } })
        ).notifications[x];
        if (notification?._id) {
            await user.clients.fullAuth.notifications.updateNotificationMeta({
                _id: notification._id,
                meta,
            });
        }
    }
};

export const sendTestNotifications = async (
    to: string | LCNProfile,
    from: string | LCNProfile,
    types: LCNNotificationTypeEnum[],
    addMinuteSeparatedTimestamps: boolean = false
) => {
    // Send 4 Notifications to userA from userB
    await Promise.all(
        types.map(async (t, index) => {
            const sent = addMinuteSeparatedTimestamps
                ? addMinutesToDate(new Date(), index).toISOString()
                : undefined;
            return await userA.clients.authorizedDidAuth.notifications.sendNotification(
                getTestNotification(to, from, t, sent)
            );
        })
    );
};
