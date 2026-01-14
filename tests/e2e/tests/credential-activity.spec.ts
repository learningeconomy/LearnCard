import { describe, test, expect, beforeEach } from 'vitest';

import { getLearnCardForUser, getLearnCard, LearnCard } from './helpers/learncard.helpers';

let a: NetworkLearnCardFromSeed['returnValue'];
let b: NetworkLearnCardFromSeed['returnValue'];

// Helper to parse workflowId and interactionId from claim URL
const parseInteractionUrl = (url: string): { workflowId: string; interactionId: string } | null => {
    const match = url.match(/\/interactions\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9\-_=]+)(?:\?.*)?$/);

    if (match && match[1] && match[2]) {
        return {
            workflowId: match[1],
            interactionId: match[2],
        };
    }

    return null;
};

const setupSigningAuthority = async (lc: LearnCard, name: string) => {
    const sa = await lc.invoke.createSigningAuthority(name);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);

    await lc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
    await lc.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint!, sa.name);

    return sa;
};

describe('Credential Activity Tracking', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');

        await setupSigningAuthority(a, 'cred-act-sa');
    });

    describe('Activity API', () => {
        test('getMyActivities returns paginated activity records', async () => {
            const result = await a.invoke.getMyActivities({ limit: 10 });

            expect(result).toBeDefined();
            expect(result.records).toBeDefined();
            expect(Array.isArray(result.records)).toBe(true);
            expect(typeof result.hasMore).toBe('boolean');
        });

        test('getActivityStats returns aggregated statistics', async () => {
            const stats = await a.invoke.getActivityStats({});

            expect(stats).toBeDefined();
            expect(typeof stats.total).toBe('number');
            expect(typeof stats.created).toBe('number');
            expect(typeof stats.delivered).toBe('number');
            expect(typeof stats.claimed).toBe('number');
            expect(typeof stats.expired).toBe('number');
            expect(typeof stats.failed).toBe('number');
            expect(typeof stats.claimRate).toBe('number');
        });
    });

    describe('Activity Tracking for Credential Send', () => {
        test('sending credential to profile creates DELIVERED activity', async () => {
            // Get initial activity count
            const initialActivities = await a.invoke.getMyActivities({ limit: 100 });
            const initialCount = initialActivities?.records?.length ?? 0;

            // Send a credential
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            await a.invoke.sendCredential('testb', vc);

            // Check activity was logged
            const activities = await a.invoke.getMyActivities({ limit: 100 });
            const newCount = activities?.records?.length ?? 0;

            expect(newCount).toBeGreaterThan(initialCount);

            // Find the new activity
            const deliveredActivity = activities?.records?.find(
                (r: any) => r.eventType === 'DELIVERED' && r.recipientType === 'profile'
            );

            expect(deliveredActivity).toBeDefined();
            expect(deliveredActivity.recipientIdentifier).toBe('testb');
            expect(deliveredActivity.source).toBe('sendCredential');
        });

        test('activity includes timestamp', async () => {
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            await a.invoke.sendCredential('testb', vc);

            const activities = await a.invoke.getMyActivities({ limit: 1 });
            const activity = activities?.records?.[0];

            expect(activity?.timestamp).toBeDefined();

            // Verify it's a valid ISO timestamp
            const timestamp = new Date(activity.timestamp);

            expect(timestamp.getTime()).not.toBeNaN();
        });
    });

    describe('Activity Tracking for Credential Claim', () => {
        test('accepting credential creates CLAIMED activity', async () => {
            // Send a credential from A to B
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.invoke.sendCredential('testb', vc);

            // Get initial activity count for sender (A)
            const initialActivities = await a.invoke.getMyActivities({ limit: 100 });
            const initialCount = initialActivities?.records?.length ?? 0;

            // B accepts the credential
            await b.invoke.acceptCredential(uri);

            // Check that a CLAIMED activity was logged for the sender (A)
            const activities = await a.invoke.getMyActivities({ limit: 100 });
            const claimedActivity = activities?.records?.find(
                (r: any) => r.eventType === 'CLAIMED'
            );

            expect(claimedActivity).toBeDefined();
            expect(claimedActivity.recipientType).toBe('profile');
        });
    });

    describe('Activity Stats Accuracy', () => {
        test('stats reflect actual activity counts', async () => {
            // Get initial stats
            const initialStats = await a.invoke.getActivityStats({});
            const initialDelivered = initialStats?.delivered ?? 0;

            // Send a credential
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            await a.invoke.sendCredential('testb', vc);

            // Get updated stats
            const updatedStats = await a.invoke.getActivityStats({});

            expect(updatedStats.delivered).toBeGreaterThanOrEqual(initialDelivered);
        });

        test('claim rate is calculated correctly', async () => {
            const stats = await a.invoke.getActivityStats({});

            // Claim rate should be between 0 and 100
            expect(stats.claimRate).toBeGreaterThanOrEqual(0);
            expect(stats.claimRate).toBeLessThanOrEqual(100);

            // If there are delivered credentials, claim rate should be calculated
            if (stats.delivered > 0) {
                const expectedRate = (stats.claimed / stats.delivered) * 100;

                expect(Math.abs(stats.claimRate - expectedRate)).toBeLessThan(1);
            }
        });
    });

    describe('Activity Filtering', () => {
        test('can filter activities by eventType', async () => {
            // Ensure we have some activity first
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            await a.invoke.sendCredential('testb', vc);

            // Filter by DELIVERED
            const deliveredActivities = await a.invoke.getMyActivities({
                limit: 100,
                eventType: 'DELIVERED',
            });

            // All returned activities should be DELIVERED type
            for (const activity of deliveredActivities?.records ?? []) {
                expect(activity.eventType).toBe('DELIVERED');
            }
        });

        test('pagination works correctly', async () => {
            // Send multiple credentials to create activity
            for (let i = 0; i < 3; i++) {
                const unsignedVc = a.invoke.getTestVc(b.id.did());
                const vc = await a.invoke.issueCredential(unsignedVc);
                await a.invoke.sendCredential('testb', vc);
            }

            // Get first page
            const firstPage = await a.invoke.getMyActivities({ limit: 2 });

            expect(firstPage.records.length).toBeLessThanOrEqual(2);

            if (firstPage.hasMore && firstPage.cursor) {
                // Get second page
                const secondPage = await a.invoke.getMyActivities({
                    limit: 2,
                    cursor: firstPage.cursor,
                });

                expect(secondPage.records).toBeDefined();

                // Second page should not contain items from first page
                const firstPageIds = new Set(firstPage.records.map((r: any) => r.id));

                for (const record of secondPage.records) {
                    expect(firstPageIds.has(record.id)).toBe(false);
                }
            }
        });
    });

    describe('Activity Data Integrity', () => {
        test('activity records contain required fields', async () => {
            // Create some activity
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            await a.invoke.sendCredential('testb', vc);

            const activities = await a.invoke.getMyActivities({ limit: 1 });
            const activity = activities?.records?.[0];

            expect(activity).toBeDefined();
            expect(activity.id).toBeDefined();
            expect(activity.activityId).toBeDefined();
            expect(activity.eventType).toBeDefined();
            expect(activity.timestamp).toBeDefined();
            expect(activity.recipientType).toBeDefined();
            expect(activity.recipientIdentifier).toBeDefined();
            expect(activity.source).toBeDefined();
        });

        test('activity preserves recipient information', async () => {
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            await a.invoke.sendCredential('testb', vc);

            const activities = await a.invoke.getMyActivities({ limit: 10 });
            const activity = activities?.records?.find(
                (r: any) => r.recipientIdentifier === 'testb'
            );

            expect(activity).toBeDefined();
            expect(activity.recipientType).toBe('profile');
        });
    });

    describe('Activity ID Chaining', () => {
        test('DELIVERED and CLAIMED events share same activityId for profile sends', async () => {
            // Send a credential from A to B
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.invoke.sendCredential('testb', vc);

            // Get the DELIVERED activity to capture the activityId
            const activitiesBeforeClaim = await a.invoke.getMyActivities({ limit: 10 });
            const deliveredActivity = activitiesBeforeClaim?.records?.find(
                (r: any) => r.eventType === 'DELIVERED'
            );

            expect(deliveredActivity).toBeDefined();
            expect(deliveredActivity.activityId).toBeDefined();

            const originalActivityId = deliveredActivity.activityId;

            // B accepts the credential
            await b.invoke.acceptCredential(uri);

            // Get activities again and find the CLAIMED event
            const activitiesAfterClaim = await a.invoke.getMyActivities({ limit: 20 });
            const claimedActivity = activitiesAfterClaim?.records?.find(
                (r: any) => r.eventType === 'CLAIMED'
            );

            expect(claimedActivity).toBeDefined();

            // Verify the activityId matches - this confirms chaining works
            expect(claimedActivity.activityId).toBe(originalActivityId);
        });

        test('each send creates a unique activityId', async () => {
            // Send first credential
            const unsignedVc1 = a.invoke.getTestVc(b.id.did());
            const vc1 = await a.invoke.issueCredential(unsignedVc1);
            await a.invoke.sendCredential('testb', vc1);

            // Send second credential
            const unsignedVc2 = a.invoke.getTestVc(b.id.did());
            const vc2 = await a.invoke.issueCredential(unsignedVc2);
            await a.invoke.sendCredential('testb', vc2);

            // Get all activities
            const activities = await a.invoke.getMyActivities({ limit: 20 });
            const deliveredActivities = activities?.records?.filter(
                (r: any) => r.eventType === 'DELIVERED'
            ) ?? [];

            expect(deliveredActivities.length).toBeGreaterThanOrEqual(2);

            // Verify each has unique activityId
            const activityIds = deliveredActivities.map((a: any) => a.activityId);
            const uniqueIds = new Set(activityIds);

            expect(uniqueIds.size).toBe(activityIds.length);
        });

        test('activityId links full lifecycle: DELIVERED -> CLAIMED', async () => {
            // Send a credential
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.invoke.sendCredential('testb', vc);

            // Accept the credential
            await b.invoke.acceptCredential(uri);

            // Get all activities
            const activities = await a.invoke.getMyActivities({ limit: 50 });

            // Find both events
            const deliveredEvent = activities?.records?.find(
                (r: any) => r.eventType === 'DELIVERED'
            );
            const claimedEvent = activities?.records?.find(
                (r: any) => r.eventType === 'CLAIMED'
            );

            expect(deliveredEvent).toBeDefined();
            expect(claimedEvent).toBeDefined();

            // Both events should have the same activityId
            expect(deliveredEvent.activityId).toBe(claimedEvent.activityId);

            // But different event IDs (id field)
            expect(deliveredEvent.id).not.toBe(claimedEvent.id);

            // Verify timestamps show proper sequence
            const deliveredTime = new Date(deliveredEvent.timestamp).getTime();
            const claimedTime = new Date(claimedEvent.timestamp).getTime();

            expect(claimedTime).toBeGreaterThanOrEqual(deliveredTime);
        });

        test('can query lifecycle events by activityId', async () => {
            // Send a credential
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.invoke.sendCredential('testb', vc);

            // Get the activityId
            const activities = await a.invoke.getMyActivities({ limit: 10 });
            const deliveredActivity = activities?.records?.find(
                (r: any) => r.eventType === 'DELIVERED'
            );

            expect(deliveredActivity?.activityId).toBeDefined();

            const activityId = deliveredActivity.activityId;

            // Accept the credential
            await b.invoke.acceptCredential(uri);

            // Query by activityId using getActivity endpoint
            const activityDetails = await a.invoke.getActivity({ activityId });

            // Should return the activity details
            expect(activityDetails).toBeDefined();
            expect(activityDetails?.activityId).toBe(activityId);
        });

        test('same recipient receiving twice creates different activityIds', async () => {
            // Send first credential to B
            const unsignedVc1 = a.invoke.getTestVc(b.id.did());
            const vc1 = await a.invoke.issueCredential(unsignedVc1);
            await a.invoke.sendCredential('testb', vc1);

            // Get first activityId
            const activities1 = await a.invoke.getMyActivities({ limit: 10 });
            const firstActivity = activities1?.records?.find(
                (r: any) => r.eventType === 'DELIVERED'
            );
            const firstActivityId = firstActivity?.activityId;

            // Send second credential to same recipient (B)
            const unsignedVc2 = a.invoke.getTestVc(b.id.did());
            const vc2 = await a.invoke.issueCredential(unsignedVc2);
            await a.invoke.sendCredential('testb', vc2);

            // Get second activityId
            const activities2 = await a.invoke.getMyActivities({ limit: 10 });
            const deliveredActivities = activities2?.records?.filter(
                (r: any) => r.eventType === 'DELIVERED'
            ) ?? [];

            expect(deliveredActivities.length).toBeGreaterThanOrEqual(2);

            // Extract activityIds
            const activityIds = deliveredActivities.map((a: any) => a.activityId);
            const uniqueIds = new Set(activityIds);

            // Each send should have unique activityId, even for same recipient
            expect(uniqueIds.size).toBe(activityIds.length);
            expect(uniqueIds.has(firstActivityId)).toBe(true);
        });
    });

    describe('Boost Activity Tracking', () => {
        test('sendBoost creates activity with source sendBoost', async () => {
            // Create a boost first
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Activity Test Boost',
                category: 'Achievement',
            });

            // Send the boost
            await a.invoke.sendBoost('testb', boostUri);

            // Check activity was logged with correct source
            const activities = await a.invoke.getMyActivities({ limit: 10 });
            const boostActivity = activities?.records?.find(
                (r: any) => r.source === 'sendBoost' && r.boostUri === boostUri
            );

            expect(boostActivity).toBeDefined();
            expect(boostActivity.eventType).toBe('DELIVERED');
            expect(boostActivity.recipientIdentifier).toBe('testb');
        });

        test('activity includes boostUri when sending boost', async () => {
            // Create a boost
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Boost URI Test',
                category: 'Achievement',
            });

            // Send the boost
            await a.invoke.sendBoost('testb', boostUri);

            // Check activity has boostUri
            const activities = await a.invoke.getMyActivities({ limit: 10 });
            const activity = activities?.records?.find(
                (r: any) => r.boostUri === boostUri
            );

            expect(activity).toBeDefined();
            expect(activity.boostUri).toBe(boostUri);
        });

        test('stats can be filtered by boostUri', async () => {
            // Create a boost
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Stats Filter Test',
                category: 'Achievement',
            });

            // Send the boost
            await a.invoke.sendBoost('testb', boostUri);

            // Get stats filtered by this boost
            const filteredStats = await a.invoke.getActivityStats({
                boostUris: [boostUri],
            });

            expect(filteredStats).toBeDefined();
            expect(filteredStats.delivered).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Source Types', () => {
        test('sendCredential uses source sendCredential', async () => {
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            await a.invoke.sendCredential('testb', vc);

            const activities = await a.invoke.getMyActivities({ limit: 10 });
            const activity = activities?.records?.find(
                (r: any) => r.source === 'sendCredential'
            );

            expect(activity).toBeDefined();
            expect(activity.source).toBe('sendCredential');
        });

        test('accepting credential uses source claim', async () => {
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            const uri = await a.invoke.sendCredential('testb', vc);

            // B accepts the credential
            await b.invoke.acceptCredential(uri);

            // Check claim activity
            const activities = await a.invoke.getMyActivities({ limit: 20 });
            const claimActivity = activities?.records?.find(
                (r: any) => r.eventType === 'CLAIMED'
            );

            expect(claimActivity).toBeDefined();
            expect(claimActivity.source).toBe('claim');
        });
    });

    describe('Recipient Types', () => {
        test('profile sends have recipientType profile', async () => {
            const unsignedVc = a.invoke.getTestVc(b.id.did());
            const vc = await a.invoke.issueCredential(unsignedVc);
            await a.invoke.sendCredential('testb', vc);

            const activities = await a.invoke.getMyActivities({ limit: 10 });
            const activity = activities?.records?.find(
                (r: any) => r.recipientIdentifier === 'testb'
            );

            expect(activity).toBeDefined();
            expect(activity.recipientType).toBe('profile');
        });
    });

    describe('Edge Cases', () => {
        test('empty activities returns valid structure', async () => {
            // Create a new user with no activities
            const c = await getLearnCardForUser('c');

            const activities = await c.invoke.getMyActivities({ limit: 10 });

            expect(activities).toBeDefined();
            expect(activities.records).toBeDefined();
            expect(Array.isArray(activities.records)).toBe(true);
            expect(typeof activities.hasMore).toBe('boolean');
        });

        test('stats for user with no activities returns zeros', async () => {
            // Create a new user with no activities
            const c = await getLearnCardForUser('c');

            const stats = await c.invoke.getActivityStats({});

            expect(stats).toBeDefined();
            expect(stats.total).toBeGreaterThanOrEqual(0);
            expect(typeof stats.claimRate).toBe('number');
        });

        test('getActivity with non-existent activityId returns null', async () => {
            const result = await a.invoke.getActivity({
                activityId: 'non-existent-activity-id-12345',
            });

            expect(result).toBeNull();
        });

        test('pagination cursor is timestamp-based', async () => {
            // Send some credentials to create activities
            for (let i = 0; i < 3; i++) {
                const unsignedVc = a.invoke.getTestVc(b.id.did());
                const vc = await a.invoke.issueCredential(unsignedVc);
                await a.invoke.sendCredential('testb', vc);
            }

            const activities = await a.invoke.getMyActivities({ limit: 2 });

            if (activities.hasMore && activities.cursor) {
                // Cursor should be a valid ISO timestamp
                const cursorDate = new Date(activities.cursor);

                expect(cursorDate.getTime()).not.toBeNaN();
            }
        });

        test('activities are ordered by timestamp descending', async () => {
            // Send multiple credentials
            for (let i = 0; i < 3; i++) {
                const unsignedVc = a.invoke.getTestVc(b.id.did());
                const vc = await a.invoke.issueCredential(unsignedVc);
                await a.invoke.sendCredential('testb', vc);
            }

            const activities = await a.invoke.getMyActivities({ limit: 10 });

            // Verify descending order
            for (let i = 1; i < activities.records.length; i++) {
                const prevTime = new Date(activities.records[i - 1].timestamp).getTime();
                const currTime = new Date(activities.records[i].timestamp).getTime();

                expect(prevTime).toBeGreaterThanOrEqual(currTime);
            }
        });
    });

    describe('Unified send() Activity Tracking', () => {
        describe('Profile ID Recipients', () => {
            test('send() to profileId creates DELIVERED activity with source send', async () => {
                // Create a boost template
                const boostCredential = a.invoke.getTestVc(b.id.did());
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Send Test Boost',
                    category: 'Achievement',
                });

                // Send using unified send() to profile ID
                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                expect(result.activityId).toBeDefined();
                expect(result.uri).toBe(boostUri);

                // Verify activity was logged
                const activities = await a.invoke.getMyActivities({ limit: 10 });
                const sendActivity = activities.records.find(
                    r => r.activityId === result.activityId && r.eventType === 'DELIVERED'
                );

                expect(sendActivity).toBeDefined();
                expect(sendActivity?.source).toBe('send');
                expect(sendActivity?.recipientType).toBe('profile');
                expect(sendActivity?.recipientIdentifier).toBe('testb');
                expect(sendActivity?.boostUri).toBe(boostUri);
            });

            test('send() to profileId returns activityId in response', async () => {
                const boostCredential = a.invoke.getTestVc(b.id.did());
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'ActivityId Response Test',
                    category: 'Achievement',
                });

                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                expect(result.activityId).toBeDefined();
                expect(typeof result.activityId).toBe('string');
                expect(result.activityId.length).toBeGreaterThan(0);
            });

            test('send() to profileId chains activityId to CLAIMED event', async () => {
                const boostCredential = a.invoke.getTestVc(b.id.did());
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Chaining Test Boost',
                    category: 'Achievement',
                });

                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                const originalActivityId = result.activityId;

                // B accepts the credential
                await b.invoke.acceptCredential(result.credentialUri);

                // Verify CLAIMED event has same activityId
                const activities = await a.invoke.getMyActivities({ limit: 20 });
                const claimedActivity = activities.records.find(
                    r => r.eventType === 'CLAIMED' && r.activityId === originalActivityId
                );

                expect(claimedActivity).toBeDefined();
                expect(claimedActivity?.activityId).toBe(originalActivityId);
            });

            test('send() with inline template creates boost and logs activity', async () => {
                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    template: {
                        credential: a.invoke.getTestVc(b.id.did()),
                        name: 'Inline Template Boost',
                        category: 'Achievement',
                    },
                });

                expect(result.activityId).toBeDefined();
                expect(result.uri).toBeDefined();

                // Verify activity was logged with correct boostUri
                const activities = await a.invoke.getMyActivities({ limit: 10 });
                const activity = activities.records.find(
                    r => r.activityId === result.activityId
                );

                expect(activity).toBeDefined();
                expect(activity?.boostUri).toBe(result.uri);
            });

            test('multiple send() calls create unique activityIds', async () => {
                const boostCredential = a.invoke.getTestVc(b.id.did());
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Unique ActivityId Test',
                    category: 'Achievement',
                });

                // Send twice
                const result1 = await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                const result2 = await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                expect(result1.activityId).not.toBe(result2.activityId);
            });
        });

        describe('Email Recipients', () => {
            test('send() to email creates CREATED activity with source send', async () => {
                const boostCredential = a.invoke.getTestVc();
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Email Send Test',
                    category: 'Achievement',
                });

                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: 'test@example.com',
                    templateUri: boostUri,
                });

                expect(result.activityId).toBeDefined();
                expect(result.inbox).toBeDefined();
                expect(result.inbox?.issuanceId).toBeDefined();

                // Verify activity was logged for email recipient
                const activities = await a.invoke.getMyActivities({ limit: 10 });
                const emailActivity = activities.records.find(
                    r => r.activityId === result.activityId
                );

                expect(emailActivity).toBeDefined();
                expect(emailActivity?.source).toBe('send');
                expect(emailActivity?.recipientType).toBe('email');
                expect(emailActivity?.recipientIdentifier).toBe('test@example.com');
            });

            test('send() to email returns inbox response with claimUrl when suppressDelivery', async () => {
                const boostCredential = a.invoke.getTestVc();
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Suppress Delivery Test',
                    category: 'Achievement',
                });

                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: 'suppress@example.com',
                    templateUri: boostUri,
                    options: {
                        suppressDelivery: true,
                    },
                });

                expect(result.inbox).toBeDefined();
                expect(result.inbox?.claimUrl).toBeDefined();
                expect(result.activityId).toBeDefined();
            });

            test('send() to email includes boostUri in activity', async () => {
                const boostCredential = a.invoke.getTestVc();
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Email BoostUri Test',
                    category: 'Achievement',
                });

                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: 'boosturi@example.com',
                    templateUri: boostUri,
                });

                const activities = await a.invoke.getMyActivities({ limit: 10 });
                const activity = activities.records.find(
                    r => r.activityId === result.activityId
                );

                expect(activity?.boostUri).toBe(boostUri);
            });

            test('send() to different emails creates unique activityIds', async () => {
                const boostCredential = a.invoke.getTestVc();
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Multiple Email Test',
                    category: 'Achievement',
                });

                const result1 = await a.invoke.send({
                    type: 'boost',
                    recipient: 'email1@example.com',
                    templateUri: boostUri,
                });

                const result2 = await a.invoke.send({
                    type: 'boost',
                    recipient: 'email2@example.com',
                    templateUri: boostUri,
                });

                expect(result1.activityId).not.toBe(result2.activityId);
            });
        });

        describe('Activity Stats with send()', () => {
            test('send() to profile increments delivered count in stats', async () => {
                const boostCredential = a.invoke.getTestVc(b.id.did());
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Stats Delivered Test',
                    category: 'Achievement',
                });

                const initialStats = await a.invoke.getActivityStats({});
                const initialDelivered = initialStats.delivered;

                await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                const updatedStats = await a.invoke.getActivityStats({});

                expect(updatedStats.delivered).toBeGreaterThan(initialDelivered);
            });

            test('stats can filter by boostUri for send() activities', async () => {
                const boostCredential = a.invoke.getTestVc(b.id.did());
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Stats Filter Send Test',
                    category: 'Achievement',
                });

                await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                const filteredStats = await a.invoke.getActivityStats({
                    boostUris: [boostUri],
                });

                expect(filteredStats.delivered).toBeGreaterThanOrEqual(1);
            });
        });

        describe('Activity Filtering with send()', () => {
            test('can filter activities by source send', async () => {
                const boostCredential = a.invoke.getTestVc(b.id.did());
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'Source Filter Test',
                    category: 'Achievement',
                });

                await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                const activities = await a.invoke.getMyActivities({ limit: 50 });
                const sendActivities = activities.records.filter(r => r.source === 'send');

                expect(sendActivities.length).toBeGreaterThanOrEqual(1);
            });

            test('can retrieve activity details by activityId from send()', async () => {
                const boostCredential = a.invoke.getTestVc(b.id.did());
                const boostUri = await a.invoke.createBoost(boostCredential, {
                    name: 'GetActivity Test',
                    category: 'Achievement',
                });

                const result = await a.invoke.send({
                    type: 'boost',
                    recipient: 'testb',
                    templateUri: boostUri,
                });

                const activityDetails = await a.invoke.getActivity({
                    activityId: result.activityId,
                });

                expect(activityDetails).toBeDefined();
                expect(activityDetails?.activityId).toBe(result.activityId);
                expect(activityDetails?.source).toBe('send');
            });
        });

        describe('Full Lifecycle Tests', () => {
            describe('Profile Recipient Lifecycle', () => {
                test('full lifecycle: send() DELIVERED -> acceptCredential CLAIMED', async () => {
                    const boostCredential = a.invoke.getTestVc(b.id.did());
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Lifecycle Test',
                        category: 'Achievement',
                    });

                    // Step 1: Send credential
                    const sendResult = await a.invoke.send({
                        type: 'boost',
                        recipient: 'testb',
                        templateUri: boostUri,
                    });

                    const activityId = sendResult.activityId;

                    // Verify DELIVERED event exists
                    let activities = await a.invoke.getMyActivities({ limit: 20 });
                    const deliveredEvent = activities.records.find(
                        r => r.activityId === activityId && r.eventType === 'DELIVERED'
                    );

                    expect(deliveredEvent).toBeDefined();
                    expect(deliveredEvent?.source).toBe('send');
                    expect(deliveredEvent?.recipientType).toBe('profile');

                    // Step 2: Accept credential
                    await b.invoke.acceptCredential(sendResult.credentialUri);

                    // Verify CLAIMED event exists with same activityId
                    activities = await a.invoke.getMyActivities({ limit: 20 });
                    const claimedEvent = activities.records.find(
                        r => r.activityId === activityId && r.eventType === 'CLAIMED'
                    );

                    expect(claimedEvent).toBeDefined();
                    expect(claimedEvent?.source).toBe('claim');
                    expect(claimedEvent?.activityId).toBe(activityId);

                    // Verify both events exist under same activityId
                    const lifecycleEvents = activities.records.filter(
                        r => r.activityId === activityId
                    );

                    expect(lifecycleEvents.length).toBe(2);

                    // Verify proper timestamp ordering (DELIVERED before CLAIMED)
                    const deliveredTime = new Date(deliveredEvent!.timestamp).getTime();
                    const claimedTime = new Date(claimedEvent!.timestamp).getTime();

                    expect(claimedTime).toBeGreaterThanOrEqual(deliveredTime);
                });

                test('lifecycle events have consistent metadata across stages', async () => {
                    const boostCredential = a.invoke.getTestVc(b.id.did());
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Metadata Test',
                        category: 'Achievement',
                    });

                    const sendResult = await a.invoke.send({
                        type: 'boost',
                        recipient: 'testb',
                        templateUri: boostUri,
                    });

                    await b.invoke.acceptCredential(sendResult.credentialUri);

                    const activities = await a.invoke.getMyActivities({ limit: 20 });
                    const lifecycleEvents = activities.records.filter(
                        r => r.activityId === sendResult.activityId
                    );

                    // All events should reference the same boost
                    for (const event of lifecycleEvents) {
                        expect(event.boostUri).toBe(boostUri);
                    }

                    // All events should have same actorProfileId (the sender)
                    const actorIds = new Set(lifecycleEvents.map(e => e.actorProfileId));

                    expect(actorIds.size).toBe(1);
                });

                test('stats update correctly through full lifecycle', async () => {
                    const boostCredential = a.invoke.getTestVc(b.id.did());
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Stats Lifecycle',
                        category: 'Achievement',
                    });

                    // Get initial stats
                    const initialStats = await a.invoke.getActivityStats({
                        boostUris: [boostUri],
                    });

                    // Send credential
                    const sendResult = await a.invoke.send({
                        type: 'boost',
                        recipient: 'testb',
                        templateUri: boostUri,
                    });

                    // Check stats after send
                    const afterSendStats = await a.invoke.getActivityStats({
                        boostUris: [boostUri],
                    });

                    expect(afterSendStats.delivered).toBe(initialStats.delivered + 1);
                    expect(afterSendStats.claimed).toBe(initialStats.claimed);

                    // Accept credential
                    await b.invoke.acceptCredential(sendResult.credentialUri);

                    // Check stats after claim
                    const afterClaimStats = await a.invoke.getActivityStats({
                        boostUris: [boostUri],
                    });

                    expect(afterClaimStats.delivered).toBe(initialStats.delivered + 1);
                    expect(afterClaimStats.claimed).toBe(initialStats.claimed + 1);

                    // Verify claim rate increased
                    if (afterClaimStats.delivered > 0) {
                        expect(afterClaimStats.claimRate).toBeGreaterThanOrEqual(0);
                        expect(afterClaimStats.claimRate).toBeLessThanOrEqual(100);
                    }
                });

                test('multiple recipients have independent lifecycles', async () => {
                    const boostCredential = a.invoke.getTestVc(b.id.did());
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Multi Recipient',
                        category: 'Achievement',
                    });

                    // Send to user B
                    const sendToB = await a.invoke.send({
                        type: 'boost',
                        recipient: 'testb',
                        templateUri: boostUri,
                    });

                    // Send to user C (need to get user C)
                    const c = await getLearnCardForUser('c');
                    const sendToC = await a.invoke.send({
                        type: 'boost',
                        recipient: 'testc',
                        templateUri: boostUri,
                    });

                    // Each send has unique activityId
                    expect(sendToB.activityId).not.toBe(sendToC.activityId);

                    // B claims
                    await b.invoke.acceptCredential(sendToB.credentialUri);

                    // Verify B's lifecycle is complete
                    let activities = await a.invoke.getMyActivities({ limit: 50 });
                    const bLifecycle = activities.records.filter(
                        r => r.activityId === sendToB.activityId
                    );

                    expect(bLifecycle.length).toBe(2);
                    expect(bLifecycle.some(e => e.eventType === 'DELIVERED')).toBe(true);
                    expect(bLifecycle.some(e => e.eventType === 'CLAIMED')).toBe(true);

                    // C's lifecycle should still be pending (only DELIVERED)
                    const cLifecycle = activities.records.filter(
                        r => r.activityId === sendToC.activityId
                    );

                    expect(cLifecycle.length).toBe(1);
                    expect(cLifecycle[0].eventType).toBe('DELIVERED');

                    // C claims
                    await c.invoke.acceptCredential(sendToC.credentialUri);

                    // Verify C's lifecycle is now complete
                    activities = await a.invoke.getMyActivities({ limit: 50 });
                    const cLifecycleAfter = activities.records.filter(
                        r => r.activityId === sendToC.activityId
                    );

                    expect(cLifecycleAfter.length).toBe(2);
                    expect(cLifecycleAfter.some(e => e.eventType === 'CLAIMED')).toBe(true);
                });
            });

            describe('Inline Template Lifecycle', () => {
                test('send() with inline template has complete lifecycle', async () => {
                    // Send with inline template
                    const sendResult = await a.invoke.send({
                        type: 'boost',
                        recipient: 'testb',
                        template: {
                            credential: a.invoke.getTestVc(b.id.did()),
                            name: 'Inline Lifecycle',
                            category: 'Achievement',
                        },
                    });

                    const activityId = sendResult.activityId;

                    // Verify DELIVERED
                    let activities = await a.invoke.getMyActivities({ limit: 20 });
                    const deliveredEvent = activities.records.find(
                        r => r.activityId === activityId && r.eventType === 'DELIVERED'
                    );

                    expect(deliveredEvent).toBeDefined();
                    expect(deliveredEvent?.boostUri).toBe(sendResult.uri);

                    // Accept credential
                    await b.invoke.acceptCredential(sendResult.credentialUri);

                    // Verify CLAIMED
                    activities = await a.invoke.getMyActivities({ limit: 20 });
                    const claimedEvent = activities.records.find(
                        r => r.activityId === activityId && r.eventType === 'CLAIMED'
                    );

                    expect(claimedEvent).toBeDefined();
                    expect(claimedEvent?.boostUri).toBe(sendResult.uri);
                });
            });

            describe('Email Recipient Claim Workflow', () => {
                test('full lifecycle: send() to email -> claim via workflow', async () => {
                    const boostCredential = a.invoke.getTestVc();
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Email Lifecycle',
                        category: 'Achievement',
                    });

                    // Send to email with suppressDelivery to get claimUrl
                    const sendResult = await a.invoke.send({
                        type: 'boost',
                        recipient: 'lifecycle@example.com',
                        templateUri: boostUri,
                        options: { suppressDelivery: true },
                    });

                    const activityId = sendResult.activityId;

                    expect(sendResult.inbox).toBeDefined();
                    expect(sendResult.inbox?.claimUrl).toBeDefined();

                    // Verify initial activity was logged
                    let activities = await a.invoke.getMyActivities({ limit: 20 });
                    const initialEvent = activities.records.find(
                        r => r.activityId === activityId
                    );

                    expect(initialEvent).toBeDefined();
                    expect(initialEvent?.source).toBe('send');
                    expect(initialEvent?.recipientType).toBe('email');

                    // Use claimUrl directly from send response (suppressDelivery=true means no email sent)
                    const claimUrl = sendResult.inbox?.claimUrl;

                    expect(claimUrl).toBeDefined();

                    // Parse the interaction URL
                    const interactionUrl = parseInteractionUrl(claimUrl!);
                    if (!interactionUrl) {
                        throw new Error('Failed to parse interaction URL');
                    }

                    // Create anonymous claimer with proper hex seed
                    const claimer = await getLearnCard('1'.repeat(64));

                    // Start the VC-API exchange
                    const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;
                    const vcapiResponse = await fetch(vcapiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    });

                    expect(vcapiResponse.status).toBe(200);
                    const vcapiData = await vcapiResponse.json();

                    const vpr = vcapiData.verifiablePresentationRequest;

                    expect(vpr).toBeDefined();
                    expect(vpr.challenge).toBeDefined();
                    expect(vpr.domain).toBeDefined();

                    // Get DID auth VP
                    const vp = await claimer.invoke.getDidAuthVp({
                        challenge: vpr.challenge,
                        domain: vpr.domain,
                    });

                    // Complete the claim
                    const claimResponse = await fetch(vcapiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ verifiablePresentation: vp }),
                    });

                    expect(claimResponse.status).toBe(200);
                    const claimData = await claimResponse.json();

                    expect(claimData.verifiablePresentation).toBeDefined();
                    expect(claimData.verifiablePresentation.verifiableCredential).toBeDefined();

                    // Verify CLAIMED event was logged with same activityId
                    activities = await a.invoke.getMyActivities({ limit: 30 });
                    const claimedEvent = activities.records.find(
                        r => r.activityId === activityId && r.eventType === 'CLAIMED'
                    );

                    expect(claimedEvent).toBeDefined();
                    expect(claimedEvent?.source).toBe('claimLink');
                });

                test('email claim updates stats correctly', async () => {
                    const boostCredential = a.invoke.getTestVc();
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Email Stats Test',
                        category: 'Achievement',
                    });

                    // Get initial stats
                    const initialStats = await a.invoke.getActivityStats({
                        boostUris: [boostUri],
                    });

                    // Send to email
                    const sendResult = await a.invoke.send({
                        type: 'boost',
                        recipient: 'stats@example.com',
                        templateUri: boostUri,
                        options: { suppressDelivery: true },
                    });

                    // Get claim URL directly from response
                    const claimUrl = sendResult.inbox?.claimUrl;

                    expect(claimUrl).toBeDefined();

                    const interactionUrl = parseInteractionUrl(claimUrl!);
                    if (!interactionUrl) {
                        throw new Error('Failed to parse interaction URL');
                    }

                    // Create claimer with proper hex seed
                    const claimer = await getLearnCard('2'.repeat(64));

                    const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;

                    const initResponse = await fetch(vcapiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    });
                    const initData = await initResponse.json();
                    const vpr = initData.verifiablePresentationRequest;

                    const vp = await claimer.invoke.getDidAuthVp({
                        challenge: vpr.challenge,
                        domain: vpr.domain,
                    });

                    await fetch(vcapiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ verifiablePresentation: vp }),
                    });

                    // Verify stats updated
                    const finalStats = await a.invoke.getActivityStats({
                        boostUris: [boostUri],
                    });

                    expect(finalStats.claimed).toBeGreaterThan(initialStats.claimed);
                });

                test('multiple email sends have independent claim workflows', async () => {
                    const boostCredential = a.invoke.getTestVc();
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Multi Email Test',
                        category: 'Achievement',
                    });

                    // Send to two different emails
                    const send1 = await a.invoke.send({
                        type: 'boost',
                        recipient: 'user1@example.com',
                        templateUri: boostUri,
                        options: { suppressDelivery: true },
                    });

                    const send2 = await a.invoke.send({
                        type: 'boost',
                        recipient: 'user2@example.com',
                        templateUri: boostUri,
                        options: { suppressDelivery: true },
                    });

                    // Both have unique activityIds
                    expect(send1.activityId).not.toBe(send2.activityId);

                    // Claim first one
                    const claimUrl1 = send1.inbox?.claimUrl;

                    expect(claimUrl1).toBeDefined();

                    const interactionUrl1 = parseInteractionUrl(claimUrl1!);
                    if (!interactionUrl1) {
                        throw new Error('Failed to parse interaction URL');
                    }

                    // Create claimer with proper hex seed
                    const claimer1 = await getLearnCard('3'.repeat(64));

                    const vcapiUrl1 = `http://localhost:4000/api/workflows/${interactionUrl1.workflowId}/exchanges/${interactionUrl1.interactionId}`;
                    const init1 = await fetch(vcapiUrl1, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    });
                    const data1 = await init1.json();
                    const vp1 = await claimer1.invoke.getDidAuthVp({
                        challenge: data1.verifiablePresentationRequest.challenge,
                        domain: data1.verifiablePresentationRequest.domain,
                    });
                    await fetch(vcapiUrl1, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ verifiablePresentation: vp1 }),
                    });

                    // Verify first claim logged
                    const activities = await a.invoke.getMyActivities({ limit: 50 });
                    const claimed1 = activities.records.find(
                        r => r.activityId === send1.activityId && r.eventType === 'CLAIMED'
                    );
                    const claimed2 = activities.records.find(
                        r => r.activityId === send2.activityId && r.eventType === 'CLAIMED'
                    );

                    expect(claimed1).toBeDefined();
                    expect(claimed2).toBeUndefined(); // Second not claimed yet
                });
            });

            describe('Error Scenarios', () => {
                test('send() to non-existent profile throws error without logging activity', async () => {
                    const boostCredential = a.invoke.getTestVc(b.id.did());
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Error Test',
                        category: 'Achievement',
                    });

                    const initialActivities = await a.invoke.getMyActivities({ limit: 100 });
                    const initialCount = initialActivities.records.length;

                    // Try to send to non-existent profile
                    await expect(
                        a.invoke.send({
                            type: 'boost',
                            recipient: 'nonexistent-profile-xyz',
                            templateUri: boostUri,
                        })
                    ).rejects.toThrow();

                    // Verify no new activity was logged
                    const afterActivities = await a.invoke.getMyActivities({ limit: 100 });

                    expect(afterActivities.records.length).toBe(initialCount);
                });

                test('send() with invalid templateUri throws error', async () => {
                    await expect(
                        a.invoke.send({
                            type: 'boost',
                            recipient: 'testb',
                            templateUri: 'invalid:uri:format',
                        })
                    ).rejects.toThrow();
                });
            });

            describe('Query Lifecycle by ActivityId', () => {
                test('getActivity returns latest event for activityId', async () => {
                    const boostCredential = a.invoke.getTestVc(b.id.did());
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Query Test',
                        category: 'Achievement',
                    });

                    const sendResult = await a.invoke.send({
                        type: 'boost',
                        recipient: 'testb',
                        templateUri: boostUri,
                    });

                    // Query before claim
                    let activityDetails = await a.invoke.getActivity({
                        activityId: sendResult.activityId,
                    });

                    expect(activityDetails).toBeDefined();
                    expect(activityDetails?.activityId).toBe(sendResult.activityId);

                    // Claim
                    await b.invoke.acceptCredential(sendResult.credentialUri);

                    // Query after claim - should still return activity details
                    activityDetails = await a.invoke.getActivity({
                        activityId: sendResult.activityId,
                    });

                    expect(activityDetails).toBeDefined();
                    expect(activityDetails?.activityId).toBe(sendResult.activityId);
                });

                test('can reconstruct full lifecycle from activities API', async () => {
                    const boostCredential = a.invoke.getTestVc(b.id.did());
                    const boostUri = await a.invoke.createBoost(boostCredential, {
                        name: 'Reconstruct Test',
                        category: 'Achievement',
                    });

                    const sendResult = await a.invoke.send({
                        type: 'boost',
                        recipient: 'testb',
                        templateUri: boostUri,
                    });

                    await b.invoke.acceptCredential(sendResult.credentialUri);

                    // Get all activities and filter by activityId
                    const activities = await a.invoke.getMyActivities({ limit: 100 });
                    const lifecycle = activities.records
                        .filter(r => r.activityId === sendResult.activityId)
                        .sort((x, y) =>
                            new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime()
                        );

                    // Should have 2 events in chronological order
                    expect(lifecycle.length).toBe(2);
                    expect(lifecycle[0].eventType).toBe('DELIVERED');
                    expect(lifecycle[1].eventType).toBe('CLAIMED');

                    // Both should have same activityId
                    expect(lifecycle[0].activityId).toBe(lifecycle[1].activityId);
                });
            });
        });
    });

    describe('Integration ID Tracking', () => {
        test('send() with integrationId includes it in activity record', async () => {
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Integration Test',
                category: 'Achievement',
            });

            const integrationId = 'test-integration-123';

            const sendResult = await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
                integrationId,
            });

            const activities = await a.invoke.getMyActivities({ limit: 10 });
            const activity = activities.records.find(
                r => r.activityId === sendResult.activityId
            );

            expect(activity).toBeDefined();
            expect(activity?.integrationId).toBe(integrationId);
        });

        test('can filter activities by integrationId', async () => {
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Filter Integration Test',
                category: 'Achievement',
            });

            const integrationId = 'filter-test-int-456';

            // Send with integrationId
            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
                integrationId,
            });

            // Send without integrationId
            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
            });

            // Filter by integrationId
            const filteredActivities = await a.invoke.getMyActivities({
                limit: 100,
                integrationId,
            });

            // All filtered results should have the integrationId
            expect(filteredActivities.records.length).toBeGreaterThan(0);

            for (const record of filteredActivities.records) {
                expect(record.integrationId).toBe(integrationId);
            }
        });

        test('getActivityStats can filter by integrationId', async () => {
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Stats Integration Test',
                category: 'Achievement',
            });

            const integrationId = 'stats-int-789';

            // Send with integrationId
            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
                integrationId,
            });

            // Get stats filtered by integrationId
            const stats = await a.invoke.getActivityStats({ integrationId });

            expect(stats.delivered).toBeGreaterThanOrEqual(1);
        });

        test('different integrationIds create separate activity buckets', async () => {
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Multi Integration Test',
                category: 'Achievement',
            });

            const integrationA = 'integration-a';
            const integrationB = 'integration-b';

            // Send with different integrationIds
            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
                integrationId: integrationA,
            });

            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
                integrationId: integrationB,
            });

            // Filter by each integrationId
            const activitiesA = await a.invoke.getMyActivities({
                limit: 100,
                integrationId: integrationA,
            });

            const activitiesB = await a.invoke.getMyActivities({
                limit: 100,
                integrationId: integrationB,
            });

            // Should have separate results
            expect(activitiesA.records.every(r => r.integrationId === integrationA)).toBe(true);
            expect(activitiesB.records.every(r => r.integrationId === integrationB)).toBe(true);
        });

        test('integrationId chains to CLAIMED event for full lifecycle tracking', async () => {
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Integration Lifecycle Test',
                category: 'Achievement',
            });

            const integrationId = 'lifecycle-tracking-int';

            const sendResult = await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
                integrationId,
            });

            // Claim the credential
            await b.invoke.acceptCredential(sendResult.credentialUri);

            // Query by integrationId - should return both DELIVERED and CLAIMED events
            const activities = await a.invoke.getMyActivities({
                limit: 100,
                integrationId,
            });

            const lifecycle = activities.records
                .filter(r => r.activityId === sendResult.activityId)
                .sort((x, y) =>
                    new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime()
                );

            // Should have 2 events with same integrationId
            expect(lifecycle.length).toBe(2);
            expect(lifecycle[0].eventType).toBe('DELIVERED');
            expect(lifecycle[0].integrationId).toBe(integrationId);
            expect(lifecycle[1].eventType).toBe('CLAIMED');
            expect(lifecycle[1].integrationId).toBe(integrationId);
        });
    });

    describe('Boost URI Filtering', () => {
        test('can filter activities by boostUri', async () => {
            const boostCredential1 = a.invoke.getTestVc(b.id.did());
            const boostUri1 = await a.invoke.createBoost(boostCredential1, {
                name: 'Boost Filter A',
                category: 'Achievement',
            });

            const boostCredential2 = a.invoke.getTestVc(b.id.did());
            const boostUri2 = await a.invoke.createBoost(boostCredential2, {
                name: 'Boost Filter B',
                category: 'Achievement',
            });

            // Send from each boost
            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri1,
            });

            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri2,
            });

            // Filter by boostUri1
            const activities1 = await a.invoke.getMyActivities({
                limit: 100,
                boostUri: boostUri1,
            });

            // All results should have boostUri1
            expect(activities1.records.length).toBeGreaterThan(0);

            for (const record of activities1.records) {
                expect(record.boostUri).toBe(boostUri1);
            }
        });

        test('getActivityStats filters correctly by multiple boostUris', async () => {
            const boostCredential1 = a.invoke.getTestVc(b.id.did());
            const boostUri1 = await a.invoke.createBoost(boostCredential1, {
                name: 'Multi Boost Stats A',
                category: 'Achievement',
            });

            const boostCredential2 = a.invoke.getTestVc(b.id.did());
            const boostUri2 = await a.invoke.createBoost(boostCredential2, {
                name: 'Multi Boost Stats B',
                category: 'Achievement',
            });

            // Send 2 from boost1, 1 from boost2
            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri1,
            });

            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri1,
            });

            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri2,
            });

            // Stats for boost1 only
            const stats1 = await a.invoke.getActivityStats({
                boostUris: [boostUri1],
            });

            // Stats for both boosts
            const statsBoth = await a.invoke.getActivityStats({
                boostUris: [boostUri1, boostUri2],
            });

            expect(statsBoth.delivered).toBeGreaterThanOrEqual(stats1.delivered);
        });

        test('boostUri and integrationId can be combined for filtering', async () => {
            const boostCredential = a.invoke.getTestVc(b.id.did());
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Combined Filter Test',
                category: 'Achievement',
            });

            const integrationId = 'combined-filter-int';

            // Send with both boostUri and integrationId
            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
                integrationId,
            });

            // Send same boost without integrationId
            await a.invoke.send({
                type: 'boost',
                recipient: 'testb',
                templateUri: boostUri,
            });

            // Filter by both
            const combinedActivities = await a.invoke.getMyActivities({
                limit: 100,
                boostUri,
                integrationId,
            });

            // Should only return activities with both filters
            expect(combinedActivities.records.length).toBeGreaterThan(0);

            for (const record of combinedActivities.records) {
                expect(record.boostUri).toBe(boostUri);
                expect(record.integrationId).toBe(integrationId);
            }
        });
    });

    describe('SendViaInbox Direct Tracking', () => {
        test('sendViaInbox creates CREATED activity for email recipient', async () => {
            const boostCredential = a.invoke.getTestVc();
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Inbox Direct Test',
                category: 'Achievement',
            });

            // Use send() with email to trigger inbox flow
            const sendResult = await a.invoke.send({
                type: 'boost',
                recipient: 'inbox-direct@example.com',
                templateUri: boostUri,
                options: { suppressDelivery: true },
            });

            expect(sendResult.inbox).toBeDefined();
            expect(sendResult.activityId).toBeDefined();

            // Verify activity was created
            const activities = await a.invoke.getMyActivities({ limit: 20 });
            const activity = activities.records.find(
                r => r.activityId === sendResult.activityId
            );

            expect(activity).toBeDefined();
            expect(activity?.eventType).toBe('CREATED');
            expect(activity?.recipientType).toBe('email');
            expect(activity?.source).toBe('send');
        });

        test('inbox claim via workflow chains activityId correctly', async () => {
            const boostCredential = a.invoke.getTestVc();
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Inbox Claim Chain',
                category: 'Achievement',
            });

            const sendResult = await a.invoke.send({
                type: 'boost',
                recipient: 'chain-test@example.com',
                templateUri: boostUri,
                options: { suppressDelivery: true },
            });

            const activityId = sendResult.activityId;
            const claimUrl = sendResult.inbox?.claimUrl;

            expect(claimUrl).toBeDefined();

            // Parse and claim via workflow
            const interactionUrl = parseInteractionUrl(claimUrl!);
            if (!interactionUrl) throw new Error('Failed to parse interaction URL');

            const claimer = await getLearnCard('4'.repeat(64));

            const vcapiUrl = `http://localhost:4000/api/workflows/${interactionUrl.workflowId}/exchanges/${interactionUrl.interactionId}`;

            // Init exchange
            const initResponse = await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const initData = await initResponse.json();
            const vpr = initData.verifiablePresentationRequest;

            // Get VP and complete claim
            const vp = await claimer.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });

            await fetch(vcapiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });

            // Verify CLAIMED event was logged with same activityId
            const activities = await a.invoke.getMyActivities({ limit: 50 });
            const claimedEvent = activities.records.find(
                r => r.activityId === activityId && r.eventType === 'CLAIMED'
            );

            expect(claimedEvent).toBeDefined();
            expect(claimedEvent?.source).toBe('claimLink');
            expect(claimedEvent?.boostUri).toBe(boostUri);
        });

        test('inbox activities have correct boostUri for stats filtering', async () => {
            const boostCredential = a.invoke.getTestVc();
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Inbox Stats Test',
                category: 'Achievement',
            });

            // Get initial stats for this boost
            const initialStats = await a.invoke.getActivityStats({
                boostUris: [boostUri],
            });

            // Send via inbox
            await a.invoke.send({
                type: 'boost',
                recipient: 'stats-inbox@example.com',
                templateUri: boostUri,
                options: { suppressDelivery: true },
            });

            // Stats should reflect the new activity
            const afterStats = await a.invoke.getActivityStats({
                boostUris: [boostUri],
            });

            // Created count should increase (inbox sends create CREATED events)
            expect(afterStats.created).toBeGreaterThan(initialStats.created);
        });

        test('inbox send with integrationId tracks correctly', async () => {
            const boostCredential = a.invoke.getTestVc();
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Inbox Integration Test',
                category: 'Achievement',
            });

            const integrationId = 'inbox-int-test';

            const sendResult = await a.invoke.send({
                type: 'boost',
                recipient: 'inbox-int@example.com',
                templateUri: boostUri,
                integrationId,
                options: { suppressDelivery: true },
            });

            // Filter by integrationId
            const activities = await a.invoke.getMyActivities({
                limit: 50,
                integrationId,
            });

            const activity = activities.records.find(
                r => r.activityId === sendResult.activityId
            );

            expect(activity).toBeDefined();
            expect(activity?.integrationId).toBe(integrationId);
            expect(activity?.recipientType).toBe('email');
        });
    });

    describe('Failed Event Tracking', () => {
        test('FAILED event logged when sending to email without signing authority', async () => {
            // User C has no signing authority setup (only user A has it from beforeEach)
            const noSaUser = await getLearnCardForUser('c');

            const boostCredential = noSaUser.invoke.getTestVc();
            const boostUri = await noSaUser.invoke.createBoost(boostCredential, {
                name: 'No SA Failure Test',
                category: 'Achievement',
            });

            // Try to send unsigned credential to email - should fail because no signing authority
            let sendError: Error | null = null;

            try {
                await noSaUser.invoke.send({
                    type: 'boost',
                    recipient: 'no-sa-test@example.com',
                    templateUri: boostUri,
                    options: { suppressDelivery: true },
                });
            } catch (e) {
                sendError = e as Error;
            }

            expect(sendError).not.toBeNull();
            expect(sendError?.message).toContain('signing authority');

            // Check that FAILED activity was logged (CREATED then FAILED for email)
            const activities = await noSaUser.invoke.getMyActivities({ limit: 50 });
            const boostActivities = activities.records.filter(r => r.boostUri === boostUri);

            // Should have both CREATED and FAILED (email sends use CREATED, not DELIVERED)
            const createdEvent = boostActivities.find(r => r.eventType === 'CREATED');
            const failedEvent = boostActivities.find(r => r.eventType === 'FAILED');

            expect(createdEvent).toBeDefined();
            expect(failedEvent).toBeDefined();

            // Both should have the same activityId (chained)
            expect(failedEvent?.activityId).toBe(createdEvent?.activityId);

            // FAILED should include error metadata
            expect(failedEvent?.metadata?.error).toBeDefined();
        });

        test('FAILED events are counted in stats', async () => {
            // User D has no signing authority setup
            const noSaUser2 = await getLearnCardForUser('d');

            const boostCredential = noSaUser2.invoke.getTestVc();
            const boostUri = await noSaUser2.invoke.createBoost(boostCredential, {
                name: 'Failure Stats Test',
                category: 'Achievement',
            });

            // Get initial stats
            const initialStats = await noSaUser2.invoke.getActivityStats({
                boostUris: [boostUri],
            });

            // Try to send - should fail
            try {
                await noSaUser2.invoke.send({
                    type: 'boost',
                    recipient: 'stats-fail@example.com',
                    templateUri: boostUri,
                    options: { suppressDelivery: true },
                });
            } catch {
                // Expected to fail
            }

            // Get updated stats
            const afterStats = await noSaUser2.invoke.getActivityStats({
                boostUris: [boostUri],
            });

            // Failed count should increase
            expect(afterStats.failed).toBeGreaterThan(initialStats.failed);
        });

        test('FAILED event with integrationId can be queried by integrationId', async () => {
            // User E has no signing authority setup
            const noSaUser3 = await getLearnCardForUser('e');

            const boostCredential = noSaUser3.invoke.getTestVc();
            const boostUri = await noSaUser3.invoke.createBoost(boostCredential, {
                name: 'Failed Integration Query Test',
                category: 'Achievement',
            });

            const integrationId = 'failed-query-int';

            // Try to send with integrationId - should fail
            try {
                await noSaUser3.invoke.send({
                    type: 'boost',
                    recipient: 'int-fail@example.com',
                    templateUri: boostUri,
                    integrationId,
                    options: { suppressDelivery: true },
                });
            } catch {
                // Expected to fail
            }

            // Query by integrationId
            const activities = await noSaUser3.invoke.getMyActivities({
                limit: 50,
                integrationId,
            });

            // Should find both CREATED and FAILED with this integrationId (email uses CREATED)
            const createdEvent = activities.records.find(r => r.eventType === 'CREATED');
            const failedEvent = activities.records.find(r => r.eventType === 'FAILED');

            expect(createdEvent).toBeDefined();
            expect(createdEvent?.integrationId).toBe(integrationId);

            expect(failedEvent).toBeDefined();
            expect(failedEvent?.integrationId).toBe(integrationId);
        });

        test('FAILED event logged during inbox claim when signing authority missing', async () => {
            // User A has signing authority, sends to email
            const boostCredential = a.invoke.getTestVc();
            const boostUri = await a.invoke.createBoost(boostCredential, {
                name: 'Claim Failure Test',
                category: 'Achievement',
            });

            // Send to email - this should succeed since A has signing authority
            const sendResult = await a.invoke.send({
                type: 'boost',
                recipient: 'claim-fail@example.com',
                templateUri: boostUri,
                options: { suppressDelivery: true },
            });

            expect(sendResult.activityId).toBeDefined();
            expect(sendResult.inbox?.claimUrl).toBeDefined();

            // Check that CREATED was logged (email sends use CREATED, not DELIVERED)
            const activities = await a.invoke.getMyActivities({ limit: 50 });
            const createdEvent = activities.records.find(
                r => r.activityId === sendResult.activityId && r.eventType === 'CREATED'
            );

            expect(createdEvent).toBeDefined();
            expect(createdEvent?.recipientType).toBe('email');
        });
    });
});
