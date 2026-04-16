/**
 * LC-1644 Seed Performance App
 *
 * Seeds a complete app-store listing in Neo4j for benchmark purposes:
 *   Integration → AppStoreListing → Boost (with templateAlias)
 *
 * Also seeds:
 *   - Integration owner profile (needed for signing authority resolution)
 *   - SigningAuthority endpoint linked to the listing
 *
 * Cleanup is handled by the existing /delete-all endpoint in the test fixture.
 */

import neo4j from 'neo4j-driver';
import { randomUUID } from 'crypto';

const NEO4J_URI = 'bolt://localhost:7687';
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = 'this-is-the-password';

const EMBED_URL = 'https://perf-bench-app.example.com';

/** Minimal OBv3-style boost template JSON — just enough to pass parseRenderedTemplate */
const MINIMAL_BOOST_TEMPLATE = JSON.stringify({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: { id: 'did:web:placeholder' },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
        id: 'did:web:placeholder',
        type: 'AchievementSubject',
        achievement: {
            id: 'urn:uuid:perf-bench',
            type: 'Achievement',
            name: 'Performance Benchmark Credential',
            description: 'Issued by automated perf harness',
        },
    },
});

export interface SeededPerfApp {
    listingId: string;
    integrationId: string;
    boostId: string;
    templateAlias: string;
    displayName: string;
    embedUrl: string;
    ownerProfileId: string;
}

/**
 * Seeds a complete app-store listing + boost + integration + SA for benchmark.
 * Uses raw Neo4j queries to avoid import issues with brain-service internals.
 */
export const seedPerfApp = async (opts?: {
    templateAlias?: string;
    embedUrl?: string;
}): Promise<SeededPerfApp> => {
    const templateAlias = opts?.templateAlias || 'perf-bench-simple';
    const embedUrl = opts?.embedUrl || EMBED_URL;

    const listingId = randomUUID();
    const integrationId = randomUUID();
    const boostId = randomUUID();
    const ownerProfileId = `perf-bench-owner-${Date.now()}`;
    const displayName = `Perf Bench App ${Date.now()}`;
    const slug = `perf-bench-app-${Date.now()}`;
    const saEndpoint = 'http://localhost:9999/mock-sa';

    console.log(`[seedPerfApp] Connecting to Neo4j at ${NEO4J_URI}...`);
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    const session = driver.session();

    try {
        // 1. Create owner profile (Integration owner — needed for SA resolution chain)
        await session.run(
            `
            MERGE (p:Profile {profileId: $profileId})
            SET p.name = 'Perf Bench Owner',
                p.createdAt = datetime()
            `,
            { profileId: ownerProfileId }
        );

        // 2. Create Integration owned by the profile
        await session.run(
            `
            MATCH (p:Profile {profileId: $profileId})
            CREATE (i:Integration {id: $integrationId, name: 'Perf Bench Integration'})
            CREATE (p)-[:OWNS_INTEGRATION]->(i)
            `,
            { profileId: ownerProfileId, integrationId }
        );

        // 3. Create AppStoreListing with CURATED_LIST promotion
        await session.run(
            `
            MATCH (i:Integration {id: $integrationId})
            CREATE (l:AppStoreListing {
                listing_id: $listingId,
                display_name: $displayName,
                tagline: 'Performance benchmark app',
                full_description: 'Automated perf benchmark harness',
                icon_url: 'https://example.com/perf-icon.png',
                app_listing_status: 'LISTED',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: $launchConfigJson,
                category: 'tools',
                slug: $slug,
                promotion_level: 'CURATED_LIST',
                highlights_json: '[]',
                screenshots_json: '[]'
            })
            CREATE (i)-[:PUBLISHES_LISTING]->(l)
            `,
            {
                listingId,
                displayName,
                slug,
                integrationId,
                launchConfigJson: JSON.stringify({ url: embedUrl }),
            }
        );

        // 4. Create Boost with a valid template
        await session.run(
            `
            MATCH (l:AppStoreListing {listing_id: $listingId})
            CREATE (b:Boost {
                id: $boostId,
                name: 'Perf Bench Boost',
                type: 'BoostCredential',
                boost: $boostTemplate,
                status: 'PUBLISHED',
                category: 'benchmark'
            })
            CREATE (l)-[r:HAS_BOOST {templateAlias: $templateAlias, createdAt: datetime()}]->(b)
            `,
            {
                listingId,
                boostId,
                boostTemplate: MINIMAL_BOOST_TEMPLATE,
                templateAlias,
            }
        );

        // 5. Create SigningAuthority and link to listing
        //    When NODE_ENV=test in brain-service, SA endpoints are mocked so
        //    we just need a valid endpoint string in the graph.
        await session.run(
            `
            MATCH (l:AppStoreListing {listing_id: $listingId})
            MERGE (sa:SigningAuthority {endpoint: $saEndpoint})
            MERGE (l)-[r:USES_SIGNING_AUTHORITY {
                name: 'perf-bench-sa',
                did: 'did:web:localhost%3A4000',
                isPrimary: true
            }]->(sa)
            `,
            { listingId, saEndpoint }
        );

        console.log(`[seedPerfApp] Seeded: listing=${listingId} boost=${boostId} alias=${templateAlias}`);
    } finally {
        await session.close();
        await driver.close();
    }

    return {
        listingId,
        integrationId,
        boostId,
        templateAlias,
        displayName,
        embedUrl,
        ownerProfileId,
    };
};
