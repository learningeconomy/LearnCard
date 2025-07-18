import crypto from 'crypto';
import { describe, test, expect } from 'vitest';

import { getLearnCard, getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let a: LearnCard;
let b: LearnCard;
let c: LearnCard;
let d: LearnCard;
let e: LearnCard;
let f: LearnCard;

describe('Boosts', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
        c = await getLearnCardForUser('c');
        d = await getLearnCardForUser('d');
        e = await getLearnCardForUser('e');
        f = await getLearnCardForUser('f');
    });

    test('Users can create and send boosts', async () => {
        // Create a boost
        const boostUri = await a.invoke.createBoost(testUnsignedBoost);
        expect(boostUri).toBeDefined();

        // Get the boost
        const boost = await a.invoke.getBoost(boostUri);
        expect(boost).toBeDefined();

        // Send the boost to another user
        const sentBoostUri = await a.invoke.sendBoost(USERS.b.profileId, boostUri);
        expect(sentBoostUri).toBeDefined();

        // Check that user b received the boost
        const receivedCredentials = await b.invoke.getIncomingCredentials();
        expect(receivedCredentials.length).toBeGreaterThan(0);

        // Find the received boost
        const receivedBoost = receivedCredentials.find(cred => cred.uri === sentBoostUri);
        expect(receivedBoost).toBeDefined();
    });

    test('Users can delete a published boost', async () => {
        // Create a boost
        const boostUri = await a.invoke.createBoost(testUnsignedBoost);
        expect(boostUri).toBeDefined();

        // Get all boosts before deletion
        const boostsBefore = await a.invoke.getPaginatedBoosts();
        const countBefore = boostsBefore.records.length;

        // Delete the boost
        const result = await a.invoke.deleteBoost(boostUri);
        expect(result).toBeTruthy();

        // Verify the boost was deleted
        const boostsAfter = await a.invoke.getPaginatedBoosts();
        expect(boostsAfter.records).toHaveLength(countBefore - 1);

        // Trying to get the deleted boost should return undefined or fail
        try {
            const deletedBoost = await a.invoke.getBoost(boostUri);
            // If getBoost doesn't throw an error, the result should be undefined
            expect(deletedBoost).toBeUndefined();
        } catch (error) {
            // If getBoost throws an error, it's also acceptable
            expect(error).toBeDefined();
        }
    });

    test('Users cannot delete a published boost with children', async () => {
        // Create a parent boost
        const parentBoostUri = await a.invoke.createBoost(testUnsignedBoost);
        expect(parentBoostUri).toBeDefined();

        // Create a child boost
        const childBoostUri = await a.invoke.createChildBoost(parentBoostUri, testUnsignedBoost);
        expect(childBoostUri).toBeDefined();

        // Get all boosts before deletion attempt
        const boostsBefore = await a.invoke.getPaginatedBoosts();
        const countBefore = boostsBefore.records.length;

        // Try to delete the parent boost (should fail because it has children)
        try {
            await a.invoke.deleteBoost(parentBoostUri);
            // If we reach here, the test should fail because deletion should not succeed
            expect(true).toBe(false); // This line should not be reached
        } catch (error) {
            // Deletion should fail with an appropriate error
            expect(error).toBeDefined();
        }

        // Verify the parent boost was not deleted
        const boostsAfter = await a.invoke.getPaginatedBoosts();
        expect(boostsAfter.records).toHaveLength(countBefore);

        // The parent boost should still be accessible
        const parentBoost = await a.invoke.getBoost(parentBoostUri);
        expect(parentBoost).toBeDefined();

        // The child boost should still be accessible
        const childBoost = await a.invoke.getBoost(childBoostUri);
        expect(childBoost).toBeDefined();
    });

    test('Users can verify parent-child relationships between boosts', async () => {
        // Create a parent boost
        const parentBoostUri = await a.invoke.createBoost(testUnsignedBoost);

        // Create a child boost
        const childBoostUri = await a.invoke.createChildBoost(parentBoostUri, testUnsignedBoost);

        // Get the child boost's parents
        const parents = await a.invoke.getBoostParents(childBoostUri);
        expect(parents.records).toHaveLength(1);
        expect(parents.records[0]!.uri).toEqual(parentBoostUri);

        // Get the parent boost's children
        const children = await a.invoke.getBoostChildren(parentBoostUri);
        expect(children.records).toHaveLength(1);
        expect(children.records[0]!.uri).toEqual(childBoostUri);
    });

    test('Users can delete a child boost without affecting the parent', async () => {
        // Create a parent boost
        const parentBoostUri = await a.invoke.createBoost(testUnsignedBoost);

        // Create a child boost
        const childBoostUri = await a.invoke.createChildBoost(parentBoostUri, testUnsignedBoost);

        // Get all boosts before deletion
        const boostsBefore = await a.invoke.getPaginatedBoosts();
        const countBefore = boostsBefore.records.length;

        // Delete the child boost
        const result = await a.invoke.deleteBoost(childBoostUri);
        expect(result).toBeTruthy();

        // Verify the child boost was deleted
        const boostsAfter = await a.invoke.getPaginatedBoosts();
        expect(boostsAfter.records).toHaveLength(countBefore - 1);

        // The parent boost should still be accessible
        const parentBoost = await a.invoke.getBoost(parentBoostUri);
        expect(parentBoost).toBeDefined();

        // Get the parent boost's children - should be empty
        const children = await a.invoke.getBoostChildren(parentBoostUri);
        expect(children.records).toHaveLength(0);
    });

    describe('Connected Boost Recipients E2E', () => {
        // Helper function to send a boost and optionally have the recipient accept it
        async function e2eSendBoost({
            sender,
            recipientProfileId,
            recipientLc,
            boostUri,
            autoAccept = true,
        }: {
            sender: LearnCard;
            recipientProfileId: string;
            recipientLc: LearnCard;
            boostUri: string;
            autoAccept?: boolean;
        }) {
            const credentialUri = await sender.invoke.sendBoost(recipientProfileId, boostUri);
            if (autoAccept) {
                await recipientLc.invoke.acceptCredential(credentialUri);
            }
            return credentialUri;
        }

        test('should return an empty list if no recipients are connected', async () => {
            const uri = await a.invoke.createBoost(testUnsignedBoost);
            const result = await a.invoke.getConnectedBoostRecipients(uri);
            expect(result.records).toHaveLength(0);
            expect(result.cursor).toBeUndefined();
            expect(result.hasMore).toBeFalsy();
        });

        test('should return only directly connected recipients who received the boost', async () => {
            const uri = await a.invoke.createBoost(testUnsignedBoost);

            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.b.profileId,
                recipientLc: b,
                boostUri: uri,
            });
            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.c.profileId,
                recipientLc: c,
                boostUri: uri,
            });

            await a.invoke.connectWith(USERS.b.profileId);
            await b.invoke.acceptConnectionRequest(USERS.a.profileId);

            const result = await a.invoke.getConnectedBoostRecipients(uri);
            expect(result.records).toHaveLength(1);
            expect(result.records[0]?.to.profileId).toBe(USERS.b.profileId);
        });

        test('should return recipients connected via an auto-connect boost, if they also received the target boost', async () => {
            const autoConnectBoostUri = await d.invoke.createBoost(testUnsignedBoost, {
                autoConnectRecipients: true,
            });

            await e2eSendBoost({
                sender: d,
                recipientProfileId: USERS.a.profileId,
                recipientLc: a,
                boostUri: autoConnectBoostUri,
            });
            // User C also receives auto-connect from D, making A and C connected via D's boost (not directly tested here but sets up state)
            await e2eSendBoost({
                sender: d,
                recipientProfileId: USERS.c.profileId,
                recipientLc: c,
                boostUri: autoConnectBoostUri,
            });

            // Verify A is now connected to D
            const userAConnectionsToD = await a.invoke.getConnections();
            expect(
                userAConnectionsToD.find(conn => conn.profileId === USERS.d.profileId)
            ).toBeDefined();

            const targetBoostUri = await a.invoke.createBoost({
                ...testUnsignedBoost,
                name: 'TargetBoostByA',
            });

            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.b.profileId,
                recipientLc: b,
                boostUri: targetBoostUri,
            });
            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.d.profileId,
                recipientLc: d,
                boostUri: targetBoostUri,
            });

            let connectedRecipients = await a.invoke.getConnectedBoostRecipients(targetBoostUri);
            // D is connected to A via auto-connect boost and received targetBoost. B received targetBoost but is not connected yet.
            expect(connectedRecipients.records).toHaveLength(1);
            expect(connectedRecipients.records.map(r => r.to.profileId).sort()).toEqual([
                USERS.d.profileId,
            ]);

            // Now, User A directly connects with User B
            await a.invoke.connectWith(USERS.b.profileId);
            await b.invoke.acceptConnectionRequest(USERS.a.profileId);

            connectedRecipients = await a.invoke.getConnectedBoostRecipients(targetBoostUri);
            expect(connectedRecipients.records).toHaveLength(2);
            const profileIds = connectedRecipients.records.map(r => r.to.profileId).sort();
            expect(profileIds).toEqual([USERS.b.profileId, USERS.d.profileId].sort());
        });

        test("should handle 'includeUnacceptedBoosts' option correctly", async () => {
            const uri = await a.invoke.createBoost(testUnsignedBoost);

            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.b.profileId,
                recipientLc: b,
                boostUri: uri,
                autoAccept: true,
            });
            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.c.profileId,
                recipientLc: c,
                boostUri: uri,
                autoAccept: false,
            });

            await a.invoke.connectWith(USERS.b.profileId);
            await b.invoke.acceptConnectionRequest(USERS.a.profileId);
            await a.invoke.connectWith(USERS.c.profileId);
            await c.invoke.acceptConnectionRequest(USERS.a.profileId);

            let result = await a.invoke.getConnectedBoostRecipients(uri);
            expect(result.records).toHaveLength(2); // B (accepted) and C (not accepted but connected)

            result = await a.invoke.getConnectedBoostRecipients(uri, {
                includeUnacceptedBoosts: false,
            });
            expect(result.records).toHaveLength(1);
            expect(result.records[0]?.to.profileId).toBe(USERS.b.profileId);
        });

        test('should paginate correctly', async () => {
            const uri = await a.invoke.createBoost(testUnsignedBoost);
            const allUsers = { b, c, d, e, f };
            const recipientProfileIds = [
                USERS.b.profileId,
                USERS.c.profileId,
                USERS.d.profileId,
                USERS.e.profileId,
                USERS.f.profileId,
            ];

            for (const recipientId of recipientProfileIds) {
                const recipientUser = Object.entries(USERS).find(
                    ([_, u]) => u.profileId === recipientId
                );
                const recipientLc = (allUsers as any)[recipientUser![0]];

                await e2eSendBoost({
                    sender: a,
                    recipientProfileId: recipientId,
                    recipientLc,
                    boostUri: uri,
                });
                await a.invoke.connectWith(recipientId);
                await recipientLc.invoke.acceptConnectionRequest(USERS.a.profileId);
            }

            let page1 = await a.invoke.getConnectedBoostRecipients(uri, { limit: 2 });
            expect(page1.records).toHaveLength(2);
            expect(page1.hasMore).toBeTruthy();

            let page2 = await a.invoke.getConnectedBoostRecipients(uri, {
                limit: 2,
                cursor: page1.cursor,
            });
            expect(page2.records).toHaveLength(2);
            expect(page2.hasMore).toBeTruthy();

            let page3 = await a.invoke.getConnectedBoostRecipients(uri, {
                limit: 2,
                cursor: page2.cursor,
            });
            expect(page3.records).toHaveLength(1);
            expect(page3.hasMore).toBeFalsy();

            const allFetchedProfileIds = [...page1.records, ...page2.records, ...page3.records].map(
                r => r.to.profileId
            );
            expect(new Set(allFetchedProfileIds).size).toBe(5);
            expect(allFetchedProfileIds.sort()).toEqual(recipientProfileIds.sort());
        });

        test('should allow querying connected recipients', async () => {
            await b.invoke.updateProfile({ displayName: 'User B DisplayName E2E' });
            await c.invoke.updateProfile({ displayName: 'User C DisplayName E2E' });
            await d.invoke.updateProfile({ displayName: 'Another UserD E2E' });

            const uri = await a.invoke.createBoost(testUnsignedBoost);

            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.b.profileId,
                recipientLc: b,
                boostUri: uri,
            });
            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.c.profileId,
                recipientLc: c,
                boostUri: uri,
            });
            await e2eSendBoost({
                sender: a,
                recipientProfileId: USERS.d.profileId,
                recipientLc: d,
                boostUri: uri,
            });

            await a.invoke.connectWith(USERS.b.profileId);
            await b.invoke.acceptConnectionRequest(USERS.a.profileId);
            await a.invoke.connectWith(USERS.c.profileId);
            await c.invoke.acceptConnectionRequest(USERS.a.profileId);
            // D is a recipient but not connected to A

            let result = await a.invoke.getConnectedBoostRecipients(uri, {
                query: { profileId: USERS.b.profileId },
            });
            expect(result.records).toHaveLength(1);
            expect(result.records[0]?.to.profileId).toBe(USERS.b.profileId);

            result = await a.invoke.getConnectedBoostRecipients(uri, {
                query: { profileId: { $regex: /test/i } },
            });
            expect(result.records.map(r => r.to.profileId).sort()).toEqual(
                [USERS.b.profileId, USERS.c.profileId].sort()
            );

            result = await a.invoke.getConnectedBoostRecipients(uri, {
                query: { displayName: 'User C DisplayName E2E' },
            });
            expect(result.records).toHaveLength(1);
            expect(result.records[0]?.to.profileId).toBe(USERS.c.profileId);

            result = await a.invoke.getConnectedBoostRecipients(uri, {
                query: { displayName: { $regex: /displayname e2e/i } },
            });
            expect(result.records.map(r => r.to.profileId).sort()).toEqual(
                [USERS.b.profileId, USERS.c.profileId].sort()
            );

            result = await a.invoke.getConnectedBoostRecipients(uri, {
                query: { profileId: USERS.d.profileId },
            });
            expect(result.records).toHaveLength(0);
        });
    });

    test('Users can send a boost via signing authority using the HTTP route', async () => {
        const learnCard = await getLearnCard(crypto.randomBytes(32).toString('hex'));
        await learnCard.invoke.createServiceProfile({
            profileId: 'rando',
            displayName: 'Random User',
            bio: '',
            shortBio: '',
        });
        // Create and register a signing authority for user A
        const sa = await learnCard.invoke.createSigningAuthority('test-sa');
        expect(sa).toBeDefined();
        await learnCard.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);
        const saResult = await learnCard.invoke.getRegisteredSigningAuthority(sa.endpoint, sa.name);
        expect(saResult).toBeDefined();
        const signingAuthority = {
            endpoint: saResult.signingAuthority.endpoint,
            name: saResult.relationship.name,
        };

        // Create a boost as user A
        const boostUri = await learnCard.invoke.createBoost(testUnsignedBoost);
        expect(boostUri).toBeDefined();

        const grantId = await learnCard.invoke.addAuthGrant({
            status: 'active',
            id: 'test',
            name: 'test',
            challenge: 'auth-grant:test-challenge',
            createdAt: new Date().toISOString(),
            scope: 'boosts:write',
        });

        const token = await learnCard.invoke.getAPITokenForAuthGrant(grantId);

        // Prepare the payload for the HTTP request
        const payload = { boostUri, signingAuthority };

        // Send the boost using the HTTP route
        const response = await fetch(
            `http://localhost:4000/api/boost/send/via-signing-authority/${USERS.b.profileId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            }
        );
        expect(response.status).toBe(200);
        const sentBoostUri = await response.json();
        expect(typeof sentBoostUri).toBe('string');
        expect(sentBoostUri.length).toBeGreaterThan(0);

        // Check that user B received the boost
        const incomingCredentials = await b.invoke.getIncomingCredentials();

        expect(incomingCredentials.some(cred => cred.uri === sentBoostUri)).toBe(true);

        describe('Connected Boost Recipient Count E2E', () => {
            async function e2eSendBoost({
                sender,
                recipientProfileId,
                recipientLc,
                boostUri,
                autoAccept = true,
            }: {
                sender: LearnCard;
                recipientProfileId: string;
                recipientLc: LearnCard;
                boostUri: string;
                autoAccept?: boolean;
            }) {
                const credentialUri = await sender.invoke.sendBoost(recipientProfileId, boostUri);
                if (autoAccept) {
                    await recipientLc.invoke.acceptCredential(credentialUri);
                }
                return credentialUri;
            }

            test('should correctly count connected boost recipients', async () => {
                const uri = await a.invoke.createBoost(testUnsignedBoost);
                expect(await a.invoke.countConnectedBoostRecipients(uri)).toEqual(0);

                await e2eSendBoost({
                    sender: a,
                    recipientProfileId: USERS.b.profileId,
                    recipientLc: b,
                    boostUri: uri,
                });
                await e2eSendBoost({
                    sender: a,
                    recipientProfileId: USERS.c.profileId,
                    recipientLc: c,
                    boostUri: uri,
                });

                await a.invoke.connectWith(USERS.b.profileId);
                await b.invoke.acceptConnectionRequest(USERS.a.profileId);
                expect(await a.invoke.countConnectedBoostRecipients(uri)).toEqual(1);

                await a.invoke.connectWith(USERS.c.profileId);
                await c.invoke.acceptConnectionRequest(USERS.a.profileId);
                expect(await a.invoke.countConnectedBoostRecipients(uri)).toEqual(2);
            });

            test("should handle 'includeUnacceptedBoosts' option correctly for count", async () => {
                const uri = await a.invoke.createBoost(testUnsignedBoost);

                await e2eSendBoost({
                    sender: a,
                    recipientProfileId: USERS.b.profileId,
                    recipientLc: b,
                    boostUri: uri,
                    autoAccept: true,
                });
                await e2eSendBoost({
                    sender: a,
                    recipientProfileId: USERS.c.profileId,
                    recipientLc: c,
                    boostUri: uri,
                    autoAccept: false,
                });

                await a.invoke.connectWith(USERS.b.profileId);
                await b.invoke.acceptConnectionRequest(USERS.a.profileId);
                await a.invoke.connectWith(USERS.c.profileId);
                await c.invoke.acceptConnectionRequest(USERS.a.profileId);

                expect(await a.invoke.countConnectedBoostRecipients(uri)).toEqual(2);
                expect(await a.invoke.countConnectedBoostRecipients(uri, false)).toEqual(1);
            });
        });
    });

    test('Any user can create child boost if flag set on parent', async () => {
        // User A creates a parent boost with the universal-child flag
        // @ts-ignore – allow universal child flag not yet in typed SDK
        const parentBoostUri = await a.invoke.createBoost(testUnsignedBoost, {
            allowAnyoneToCreateChildren: true,
        });
        expect(parentBoostUri).toBeDefined();

        // User B attempts to create a child boost of A's boost – should succeed without role
        const childBoostUri = await b.invoke.createChildBoost(parentBoostUri, testUnsignedBoost);
        expect(childBoostUri).toBeDefined();

        // Verify relationship exists
        const parents = await b.invoke.getBoostParents(childBoostUri);
        expect(parents.records.some(record => record.uri === parentBoostUri)).toBe(true);

        const secondChildBoostUri = await b.invoke.createBoost(testUnsignedBoost);

        await b.invoke.makeBoostParent({
            parentUri: parentBoostUri,
            childUri: secondChildBoostUri,
        });

        const secondChildParents = await b.invoke.getBoostParents(secondChildBoostUri);
        expect(secondChildParents.records.some(record => record.uri === parentBoostUri)).toBe(true);
    });
});
