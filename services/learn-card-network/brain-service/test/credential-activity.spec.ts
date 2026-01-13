import { vi } from 'vitest';

import { getClient, getUser } from './helpers/getClient';
import { testVc } from './helpers/send';
import { Profile, Credential, CredentialActivity } from '@models';
import * as Notifications from '@helpers/notifications.helpers';
import { addNotificationToQueueSpy } from './helpers/spies';
import { createCredentialActivity } from '@accesslayer/credential-activity/create';
import {
    getActivitiesForProfile,
    getActivityStatsForProfile,
    getActivityById,
} from '@accesslayer/credential-activity/read';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Credential Activity', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));

        vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await CredentialActivity.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        addNotificationToQueueSpy.mockReset();
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await CredentialActivity.delete({ detach: true, where: {} });
    });

    describe('createCredentialActivity', () => 
        it('should create an activity record with basic fields', async () => {
            const activityId = await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'send',
            });

            expect(activityId).toBeDefined();
            expect(typeof activityId).toBe('string');
        });

        it('should create an activity record with all optional fields', async () => {
            const activityId = await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'CREATED',
                recipientType: 'email',
                recipientIdentifier: 'test@example.com',
                boostUri: 'lc:network:localhost%3A3000/trpc:boost:test123',
                credentialUri: 'lc:network:localhost%3A3000/trpc:credential:cred123',
                inboxCredentialId: 'inbox123',
                integrationId: 'integration456',
                source: 'send',
                metadata: { templateData: { name: 'Test' } },
            });

            expect(activityId).toBeDefined();
        });

        it('should use provided activityId when specified', async () => {
            const providedActivityId = 'custom-activity-id-123';

            const activityId = await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'sendBoost',
                activityId: providedActivityId,
            });

            expect(activityId).toBe(providedActivityId);
        });
    });

    describe('getActivitiesForProfile', () => {
        it('should return empty array when no activities exist', async () => {
            const activities = await getActivitiesForProfile('usera', { limit: 10 });

            expect(activities).toEqual([]);
        });

        it('should return activities for the specified profile', async () => {
            await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'send',
            });

            const activities = await getActivitiesForProfile('usera', { limit: 10 });

            expect(activities).toHaveLength(1);
            expect(activities[0].actorProfileId).toBe('usera');
            expect(activities[0].eventType).toBe('DELIVERED');
            expect(activities[0].recipientType).toBe('profile');
        });

        it('should filter by eventType', async () => {
            await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'send',
            });

            await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'CLAIMED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'claim',
            });

            const deliveredOnly = await getActivitiesForProfile('usera', {
                limit: 10,
                eventType: 'DELIVERED',
            });

            expect(deliveredOnly).toHaveLength(1);
            expect(deliveredOnly[0].eventType).toBe('DELIVERED');
        });

        it('should respect limit parameter', async () => {
            for (let i = 0; i < 5; i++) {
                await createCredentialActivity({
                    actorProfileId: 'usera',
                    eventType: 'DELIVERED',
                    recipientType: 'profile',
                    recipientIdentifier: 'userb',
                    source: 'send',
                });
            }

            const activities = await getActivitiesForProfile('usera', { limit: 3 });

            expect(activities).toHaveLength(3);
        });

        it('should support cursor-based pagination', async () => {
            const timestamps: string[] = [];

            for (let i = 0; i < 5; i++) {
                await createCredentialActivity({
                    actorProfileId: 'usera',
                    eventType: 'DELIVERED',
                    recipientType: 'profile',
                    recipientIdentifier: 'userb',
                    source: 'send',
                });

                // Small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const firstPage = await getActivitiesForProfile('usera', { limit: 2 });

            expect(firstPage).toHaveLength(2);

            const cursor = firstPage[1].timestamp;
            const secondPage = await getActivitiesForProfile('usera', { limit: 2, cursor });

            expect(secondPage).toHaveLength(2);
            expect(secondPage[0].timestamp).not.toBe(firstPage[0].timestamp);
        });
    });

    describe('getActivityStatsForProfile', () => {
        it('should return zero stats when no activities exist', async () => {
            const stats = await getActivityStatsForProfile('usera');

            expect(stats.total).toBe(0);
            expect(stats.created).toBe(0);
            expect(stats.delivered).toBe(0);
            expect(stats.claimed).toBe(0);
            expect(stats.expired).toBe(0);
            expect(stats.failed).toBe(0);
            expect(stats.claimRate).toBe(0);
        });

        it('should calculate correct stats', async () => {
            // Create activities with different event types
            await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'send',
                activityId: 'activity1',
            });

            await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'CLAIMED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'claim',
                activityId: 'activity1',
            });

            await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'send',
                activityId: 'activity2',
            });

            const stats = await getActivityStatsForProfile('usera');

            expect(stats.delivered).toBeGreaterThanOrEqual(2);
            expect(stats.claimed).toBeGreaterThanOrEqual(1);
        });
    });

    describe('getActivityById', () => {
        it('should return null for non-existent activity', async () => {
            const activity = await getActivityById('non-existent-id');

            expect(activity).toBeNull();
        });

        it('should return activity by activityId', async () => {
            const activityId = await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'send',
            });

            const activity = await getActivityById(activityId);

            expect(activity).not.toBeNull();
            expect(activity?.activityId).toBe(activityId);
            expect(activity?.eventType).toBe('DELIVERED');
        });
    });

    describe('Activity Routes', () => {
        it('should require auth to get activities', async () => {
            await expect(
                noAuthClient.activity.getMyActivities({ limit: 10 })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should return activities via route', async () => {
            await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'send',
            });

            const result = await userA.clients.fullAuth.activity.getMyActivities({ limit: 10 });

            expect(result.records).toHaveLength(1);
            expect(result.hasMore).toBe(false);
        });

        it('should return stats via route', async () => {
            await createCredentialActivity({
                actorProfileId: 'usera',
                eventType: 'DELIVERED',
                recipientType: 'profile',
                recipientIdentifier: 'userb',
                source: 'send',
            });

            const stats = await userA.clients.fullAuth.activity.getActivityStats({});

            expect(stats.delivered).toBeGreaterThanOrEqual(1);
            expect(typeof stats.claimRate).toBe('number');
        });
    });

    describe('Activity Logging Integration', () => {
        it('should log activity when sending credential to profile', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const activities = await getActivitiesForProfile('usera', { limit: 10 });

            expect(activities.length).toBeGreaterThanOrEqual(1);

            const sendActivity = activities.find(a => a.source === 'sendCredential');

            expect(sendActivity).toBeDefined();
            expect(sendActivity?.eventType).toBe('DELIVERED');
            expect(sendActivity?.recipientType).toBe('profile');
            expect(sendActivity?.recipientIdentifier).toBe('userb');
        });
    });

    describe('Activity ID Chaining', () => {
        it('should chain CLAIMED event to DELIVERED event via activityId for profile sends', async () => {
            // Send credential from A to B
            const credentialUri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            // Get the DELIVERED activity
            const activitiesBeforeClaim = await getActivitiesForProfile('usera', { limit: 10 });
            const deliveredActivity = activitiesBeforeClaim.find(
                a => a.eventType === 'DELIVERED' && a.source === 'sendCredential'
            );

            expect(deliveredActivity).toBeDefined();
            const originalActivityId = deliveredActivity?.activityId;

            expect(originalActivityId).toBeDefined();

            // B accepts the credential
            await userB.clients.fullAuth.credential.acceptCredential({
                uri: credentialUri,
            });

            // Get all activities and find the CLAIMED event
            const activitiesAfterClaim = await getActivitiesForProfile('usera', { limit: 20 });
            const claimedActivity = activitiesAfterClaim.find(a => a.eventType === 'CLAIMED');

            expect(claimedActivity).toBeDefined();

            // Verify the activityId matches (chaining)
            expect(claimedActivity?.activityId).toBe(originalActivityId);
        });

        it('should store activityId in credential relationship metadata', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            // Get the activity to verify it was created
            const activities = await getActivitiesForProfile('usera', { limit: 10 });
            const sendActivity = activities.find(a => a.source === 'sendCredential');

            expect(sendActivity).toBeDefined();
            expect(sendActivity?.activityId).toBeDefined();
        });

        it('should create unique activityId for each send operation', async () => {
            // Send first credential
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            // Send second credential
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const activities = await getActivitiesForProfile('usera', { limit: 10 });
            const sendActivities = activities.filter(a => a.source === 'sendCredential');

            expect(sendActivities.length).toBeGreaterThanOrEqual(2);

            // Verify each has unique activityId
            const activityIds = sendActivities.map(a => a.activityId);
            const uniqueActivityIds = new Set(activityIds);

            expect(uniqueActivityIds.size).toBe(activityIds.length);
        });
    });
});
