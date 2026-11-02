import { beforeEach, describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { Boost } from '@models';
import { sendAppCredentialWithActivity } from '@helpers/app-credential-delivery.helpers';
import { getBoostUri } from '@helpers/boost.helpers';
import type { CredentialIssuer } from '../src/types/issuer';

const domain = 'localhost%3A3000';
const issuer: CredentialIssuer = {
    type: 'appStoreListing',
    listing: { listing_id: 'race-listing', display_name: 'Race Test App' },
    ownerProfile: { profileId: 'race-owner' },
} as CredentialIssuer;
const credential = {
    protected: 'header',
    iv: 'iv',
    ciphertext: 'ciphertext',
    tag: 'tag',
    recipients: [],
};

// The integration and CI inbox configs both supply a fresh Testcontainers database.
// No environment-configured development or deployed database is used.
describe('app credential delivery graph (real Neo4j)', () => {
    beforeEach(async () => {
        await neogma.queryRunner.run('MATCH (n) DETACH DELETE n');
        await neogma.queryRunner.run(`
            CREATE (owner:Profile {profileId: 'race-owner'}),
                   (learner:Profile {profileId: 'race-learner'}),
                   (listing:AppStoreListing {listing_id: 'race-listing'}),
                   (boost:Boost {id: 'race-boost'})
            CREATE (owner)-[:PUBLISHED]->(listing), (listing)-[:HAS_BOOST]->(boost)
        `);
    });

    const issue = async (sequence: number): Promise<string> => {
        const boost = await Boost.findOne({ where: { id: 'race-boost' } });
        if (!boost) throw new Error('Missing fixture boost');
        return sendAppCredentialWithActivity(
            {
                actorProfileId: 'race-owner',
                recipientType: 'profile',
                recipientIdentifier: 'race-learner',
                recipientProfileId: 'race-learner',
                boostUri: getBoostUri(boost.id, domain),
                integrationId: 'race-integration',
                listingId: 'race-listing',
                source: 'appEvent',
                metadata: { sequence },
            },
            {
                from: issuer,
                to: { profileId: 'race-learner' },
                boost,
                credential,
                domain,
                skipNotification: true,
                listingId: 'race-listing',
                integrationId: 'race-integration',
                metadata: { sequence },
            }
        );
    };

    const assertGraph = async (expected: number): Promise<void> => {
        const { records } = await neogma.queryRunner.run(`
            MATCH (c:Credential)
            RETURN c.credential AS payload,
                [(p:Profile)-[r:CREDENTIAL_SENT]->(c) | properties(r)] AS profileEdges,
                [(l:AppStoreListing)-[r:CREDENTIAL_SENT]->(c) | properties(r)] AS listingEdges,
                [(c)-[:INSTANCE_OF]->(b:Boost) | b.id] AS boosts
        `);
        expect(records).toHaveLength(expected);
        for (const row of records) {
            expect(JSON.parse(row.get('payload'))).toEqual(credential);
            expect(row.get('profileEdges')).toHaveLength(1);
            expect(row.get('listingEdges')).toHaveLength(1);
            expect(row.get('boosts')).toEqual(['race-boost']);
            const [edge] = row.get('listingEdges');
            expect(edge.to).toBe('race-learner');
            expect(edge.integrationId).toBe('race-integration');
            expect(edge.activityId).toBe(row.get('profileEdges')[0].activityId);
            const result = await neogma.queryRunner.run(
                `
                MATCH (:AppStoreListing {listing_id: 'race-listing'})-[:PERFORMED_BY_LISTING]->(a:CredentialActivity {activityId: $activityId})
                MATCH (:Profile {profileId: 'race-owner'})-[:PERFORMED]->(a)
                MATCH (a)-[:TO_RECIPIENT]->(:Profile {profileId: 'race-learner'})
                MATCH (a)-[:FOR_BOOST]->(:Boost {id: 'race-boost'})
                RETURN a.metadata AS metadata
            `,
                { activityId: edge.activityId }
            );
            expect(result.records).toHaveLength(1);
            expect(JSON.parse(result.records[0].get('metadata')).sequence).toBe(
                Number(edge['metadata.sequence'])
            );
        }
    };

    it('repeated sends create exactly one linked activity and each required delivery edge', async () => {
        for (let i = 0; i < 30; i++) await issue(i);
        await assertGraph(30);
    });

    it('independent simultaneous sends keep their own activity and attribution', async () => {
        const uris = await Promise.all(Array.from({ length: 8 }, (_, i) => issue(i)));
        expect(new Set(uris).size).toBe(8);
        await assertGraph(8);
    });
});
