import { describe, it, beforeAll, beforeEach, afterAll, expect } from 'vitest';

import { getUser } from './helpers/getClient';
import { seedListedApp, installAppForProfile } from './helpers/app-store.helpers';

import {
    AppStoreListing,
    Boost,
    Credential,
    Integration,
    Profile,
    Role,
    SigningAuthority,
} from '@models';
import { neogma } from '@instance';

import { createSigningAuthority } from '@accesslayer/signing-authority/create';
import { associateListingWithSigningAuthority } from '@accesslayer/app-store-listing/relationships/create';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const seedProfile = async (user: Awaited<ReturnType<typeof getUser>>, profileId: string) => {
    await user.clients.fullAuth.profile.createProfile({ profileId });
};

const seedListingWithSigningAuthority = async (ownerProfileId: string) => {
    const { listing, integration } = await seedListedApp(ownerProfileId, {
        slug: 'ai-tutor',
        display_name: 'AI Tutor',
    });

    const endpoint = 'https://example.com/sign';
    await createSigningAuthority(endpoint);
    await associateListingWithSigningAuthority(listing.listing_id, endpoint, {
        name: 'test-sa',
        did: 'did:key:test-ai-session-sa',
        isPrimary: true,
    });

    return { listing, integration };
};

const sampleSummaryData = (title = 'Intro to Cryptography') => ({
    title,
    summary: 'We explored how public/private key pairs enable signing and verification.',
    learned: ['Asymmetric encryption fundamentals', 'Digital signatures'],
    skills: [
        {
            title: 'Cryptography basics',
            description: 'Understands the difference between symmetric and asymmetric encryption.',
        },
    ],
    nextSteps: [
        {
            title: 'Explore zero-knowledge proofs',
            description: 'Dig into zk-SNARKs and their applications.',
            keywords: { occupations: ['Cryptographer'] },
        },
    ],
    reflections: [
        {
            title: 'What surprised me',
            description: 'That signatures are derived from the private key without revealing it.',
        },
    ],
});

describe('sendAiSessionCredential (App Event)', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        // Clean up in dependency order so Neo4j DETACH cascades cleanly.
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await seedProfile(userA, 'usera');
        await seedProfile(userB, 'userb');
    });

    afterAll(async () => {
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    it('creates a new topic + session boost on first call', async () => {
        const { listing } = await seedListingWithSigningAuthority('usera');
        await installAppForProfile('userb', listing.listing_id);

        const result = await userB.clients.fullAuth.appStore.appEvent({
            listingId: listing.listing_id,
            event: {
                type: 'send-ai-session-credential',
                sessionTitle: 'Session 1',
                summaryData: sampleSummaryData(),
            },
        });

        expect(result.isNewTopic).toBe(true);
        expect(result.topicUri).toBeTruthy();
        expect(result.topicCredentialUri).toBeTruthy();
        expect(result.sessionBoostUri).toBeTruthy();
        expect(result.sessionCredentialUri).toBeTruthy();

        // Exactly one AI Topic boost exists for this listing
        const topicBoostResult = await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing {listing_id: $listingId})-[:CREATED_BY]->(b:Boost)
             WHERE b.category IN ['ai-topic', 'AI Topic']
             RETURN count(b) AS count`,
            { listingId: listing.listing_id }
        );
        expect(topicBoostResult.records[0]?.get('count').toNumber()).toBe(1);

        // Exactly one session boost exists
        const sessionBoostResult = await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing {listing_id: $listingId})-[:CREATED_BY]->(b:Boost)
             WHERE b.category = 'ai-summary'
             RETURN count(b) AS count`,
            { listingId: listing.listing_id }
        );
        expect(sessionBoostResult.records[0]?.get('count').toNumber()).toBe(1);
    });

    it('reuses the topic boost and returns isNewTopic=false on subsequent calls', async () => {
        const { listing } = await seedListingWithSigningAuthority('usera');
        await installAppForProfile('userb', listing.listing_id);

        const first = await userB.clients.fullAuth.appStore.appEvent({
            listingId: listing.listing_id,
            event: {
                type: 'send-ai-session-credential',
                sessionTitle: 'Session 1',
                summaryData: sampleSummaryData('Session 1'),
            },
        });

        const second = await userB.clients.fullAuth.appStore.appEvent({
            listingId: listing.listing_id,
            event: {
                type: 'send-ai-session-credential',
                sessionTitle: 'Session 2',
                summaryData: sampleSummaryData('Session 2'),
            },
        });

        expect(first.isNewTopic).toBe(true);
        expect(second.isNewTopic).toBe(false);

        // Same topic URI across both calls
        expect(second.topicUri).toBe(first.topicUri);

        // Still returns the topic credential URI on the second call
        // (verifies Fix 4: direct lookup by boostId)
        expect(second.topicCredentialUri).toBeTruthy();
        expect(second.topicCredentialUri).toBe(first.topicCredentialUri);

        // Different session credential URIs across calls
        expect(second.sessionBoostUri).not.toBe(first.sessionBoostUri);
        expect(second.sessionCredentialUri).not.toBe(first.sessionCredentialUri);

        // Only ONE topic boost in the graph after two calls
        const topicBoostResult = await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing {listing_id: $listingId})-[:CREATED_BY]->(b:Boost)
             WHERE b.category IN ['ai-topic', 'AI Topic']
             RETURN count(b) AS count`,
            { listingId: listing.listing_id }
        );
        expect(topicBoostResult.records[0]?.get('count').toNumber()).toBe(1);

        // Two session boosts
        const sessionBoostResult = await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing {listing_id: $listingId})-[:CREATED_BY]->(b:Boost)
             WHERE b.category = 'ai-summary'
             RETURN count(b) AS count`,
            { listingId: listing.listing_id }
        );
        expect(sessionBoostResult.records[0]?.get('count').toNumber()).toBe(2);
    });

    it('links session boosts to the topic boost via PARENT_OF', async () => {
        const { listing } = await seedListingWithSigningAuthority('usera');
        await installAppForProfile('userb', listing.listing_id);

        await userB.clients.fullAuth.appStore.appEvent({
            listingId: listing.listing_id,
            event: {
                type: 'send-ai-session-credential',
                sessionTitle: 'Session 1',
                summaryData: sampleSummaryData('Session 1'),
            },
        });

        await userB.clients.fullAuth.appStore.appEvent({
            listingId: listing.listing_id,
            event: {
                type: 'send-ai-session-credential',
                sessionTitle: 'Session 2',
                summaryData: sampleSummaryData('Session 2'),
            },
        });

        const parentOfResult = await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing {listing_id: $listingId})-[:CREATED_BY]->(topic:Boost)
             WHERE topic.category IN ['ai-topic', 'AI Topic']
             MATCH (topic)-[:PARENT_OF]->(session:Boost)
             WHERE session.category = 'ai-summary'
             RETURN count(session) AS count`,
            { listingId: listing.listing_id }
        );

        expect(parentOfResult.records[0]?.get('count').toNumber()).toBe(2);
    });

    it('writes dual CREDENTIAL_SENT attribution (Profile + AppStoreListing) for session credentials', async () => {
        // Regression guard for the dual-attribution invariant preserved by
        // createSentCredentialRelationship. getBoostRecipients and sibling
        // queries rely on the Profile -> CREDENTIAL_SENT -> Credential edge
        // even when the issuer is an AppStoreListing.
        const { listing } = await seedListingWithSigningAuthority('usera');
        await installAppForProfile('userb', listing.listing_id);

        await userB.clients.fullAuth.appStore.appEvent({
            listingId: listing.listing_id,
            event: {
                type: 'send-ai-session-credential',
                sessionTitle: 'Session 1',
                summaryData: sampleSummaryData('Session 1'),
            },
        });

        // Session credentials attributed via the Profile edge (owner profile)
        const profileEdges = await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: 'usera'})-[r:CREDENTIAL_SENT]->(c:Credential)
             MATCH (c)-[:INSTANCE_OF]->(b:Boost)
             WHERE b.category = 'ai-summary' AND r.to = 'userb'
             RETURN count(r) AS count`
        );
        expect(profileEdges.records[0]?.get('count').toNumber()).toBe(1);

        // Session credentials also attributed via the AppStoreListing edge
        const listingEdges = await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing {listing_id: $listingId})-[r:CREDENTIAL_SENT]->(c:Credential)
             MATCH (c)-[:INSTANCE_OF]->(b:Boost)
             WHERE b.category = 'ai-summary' AND r.to = 'userb'
             RETURN count(r) AS count`,
            { listingId: listing.listing_id }
        );
        expect(listingEdges.records[0]?.get('count').toNumber()).toBe(1);
    });

    it('rejects missing sessionTitle', async () => {
        const { listing } = await seedListingWithSigningAuthority('usera');
        await installAppForProfile('userb', listing.listing_id);

        await expect(
            userB.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: {
                    type: 'send-ai-session-credential',
                    summaryData: sampleSummaryData(),
                },
            })
        ).rejects.toThrow();
    });

    it('rejects missing summaryData', async () => {
        const { listing } = await seedListingWithSigningAuthority('usera');
        await installAppForProfile('userb', listing.listing_id);

        await expect(
            userB.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: {
                    type: 'send-ai-session-credential',
                    sessionTitle: 'Session 1',
                },
            })
        ).rejects.toThrow();
    });

    it('rejects callers who have not installed the app and do not own the integration', async () => {
        const { listing } = await seedListingWithSigningAuthority('usera');
        // userB has neither installed nor owns the integration

        await expect(
            userB.clients.fullAuth.appStore.appEvent({
                listingId: listing.listing_id,
                event: {
                    type: 'send-ai-session-credential',
                    sessionTitle: 'Session 1',
                    summaryData: sampleSummaryData(),
                },
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
});
