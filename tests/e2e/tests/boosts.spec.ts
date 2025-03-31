import { describe, test, expect } from 'vitest';

import { getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let a: LearnCard;
let b: LearnCard;

describe('Boosts', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
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
        expect(parents.records[0].uri).toEqual(parentBoostUri);

        // Get the parent boost's children
        const children = await a.invoke.getBoostChildren(parentBoostUri);
        expect(children.records).toHaveLength(1);
        expect(children.records[0].uri).toEqual(childBoostUri);
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
});
