/**
 * LC-1644 benchmark seed helper.
 *
 * Creates all Neo4j + MongoDB records needed for a bench run:
 *   Profile (issuer) → CREATED_BY → Integration → PUBLISHES_LISTING → AppStoreListing
 *   AppStoreListing -HAS_BOOST→ Boost (with templateAlias)
 *   AppStoreListing -USES_SIGNING_AUTHORITY→ SigningAuthority (+ MongoDB SA)
 *
 * The issuer Profile has CREATED_BY on the Integration so appEvent's
 * isIntegrationAssociatedWithProfile fallback passes.
 *
 * No OWNS_INTEGRATION link — that was confirmed broken for listing discovery
 * in Task 2.5 debug.  CREATED_BY is sufficient for the owner-check path.
 */

import { Neogma } from 'neogma';
import { MongoClient } from 'mongodb';
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME ?? 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? 'this-is-the-password';
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/?replicaSet=rs0';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? 'lca-api';
const BRAIN_DOMAIN = process.env.DOMAIN_NAME ?? 'localhost%3A4000';

// Deterministic identifiers so re-runs are idempotent
const ISSUER_PROFILE_ID = 'perf-bench-issuer';
const SLUG = 'perf-bench-app';
const TEMPLATE_ALIAS = 'bench-badge';
const SA_ENDPOINT = process.env.SA_ENDPOINT ?? 'http://localhost:5100/api';
const SA_SEED = process.env.SA_SEED ?? 'b'.repeat(64);
// Must match TEST_SEED in bench-appevent.ts — determines the authenticated DID
const ISSUER_SEED = process.env.TEST_SEED ?? '1'.repeat(64);
// Staging-SA overrides. When pointing at a remote SA (e.g. staging), set these
// to the SA's actual DID/name/owner — otherwise the SA service rejects the
// request because the triple (ownerDid, name, did) must match a registered SA.
const SA_DID_OVERRIDE = process.env.SA_DID;          // e.g. did:key:z6MkoGc...
const SA_NAME_OVERRIDE = process.env.SA_NAME;        // e.g. 'test'
const SA_OWNER_DID_OVERRIDE = process.env.SA_OWNER_DID; // e.g. did:web:staging...:users:babystrange

export interface SeedResult {
    listingId: string;
    templateAlias: string;
    issuerProfileId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const deriveDidKeyFromSeed = (hexSeed: string): string => {
    const seedBytes = Buffer.from(hexSeed.slice(0, 64), 'hex');
    const keyPair = nacl.sign.keyPair.fromSeed(seedBytes);
    const multicodec = Buffer.concat([Buffer.from('ed01', 'hex'), Buffer.from(keyPair.publicKey)]);
    return `did:key:z${bs58.encode(multicodec)}`;
};

const getAppDidWeb = (domain: string, appSlug: string): string =>
    `did:web:${domain}:app:${appSlug}`;

const buildCredentialTemplate = (): string =>
    JSON.stringify({
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: { id: 'did:example:issuer', type: ['Profile'], name: 'Perf Bench App' },
        issuanceDate: '{{issuedAt}}',
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: {
                id: `urn:uuid:${uuid()}`,
                type: ['Achievement'],
                name: 'Perf Bench Achievement',
                description: 'Credential issued by perf bench',
                criteria: { narrative: 'Earned through the benchmark run' },
            },
        },
    });

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

export async function seedBench(): Promise<SeedResult> {
    const neogma = new Neogma({
        url: NEO4J_URI,
        username: NEO4J_USERNAME,
        password: NEO4J_PASSWORD,
    });
    const run = neogma.queryRunner.run.bind(neogma.queryRunner);

    try {
        // 1. Issuer Profile (MERGE = idempotent)
        await run(
            `MERGE (p:Profile {profileId: $profileId})
             ON CREATE SET p.displayName = $displayName,
                           p.shortBio    = $shortBio,
                           p.did         = $did
             RETURN p`,
            {
                profileId: ISSUER_PROFILE_ID,
                displayName: 'Perf Bench Issuer',
                shortBio: 'Benchmark issuer',
                did: deriveDidKeyFromSeed(ISSUER_SEED),
            }
        );
        console.log(`  [seed] Issuer profile ready: ${ISSUER_PROFILE_ID}`);

        // 2. Check for existing listing by slug
        const existingResult = await run(
            `MATCH (listing:AppStoreListing {slug: $slug})
             RETURN listing.listing_id AS listing_id
             LIMIT 1`,
            { slug: SLUG }
        );
        const existingId = existingResult.records[0]?.get('listing_id') as string | undefined;

        if (existingId) {
            console.log(`  [seed] Listing already exists: ${existingId} — reusing`);
            await ensureBoostAndSA(run, existingId);
            await ensureMongoSA();
            return {
                listingId: existingId,
                templateAlias: TEMPLATE_ALIAS,
                issuerProfileId: ISSUER_PROFILE_ID,
            };
        }

        // 3. Create Integration
        const integrationId = uuid();
        await run(
            `CREATE (i:Integration {
                id: $id,
                name: $name,
                description: $description,
                publishableKey: $publishableKey,
                whitelistedDomains: $whitelistedDomains,
                status: 'setup',
                createdAt: $createdAt
             })
             WITH i
             MATCH (p:Profile {profileId: $profileId})
             CREATE (i)-[:CREATED_BY]->(p)
             RETURN i`,
            {
                id: integrationId,
                name: 'Perf Bench Integration',
                description: 'Integration for LC-1644 benchmark',
                publishableKey: `pk_${uuid()}`,
                whitelistedDomains: ['localhost'],
                createdAt: new Date().toISOString(),
                profileId: ISSUER_PROFILE_ID,
            }
        );
        console.log(`  [seed] Integration created: ${integrationId}`);

        // 4. Create AppStoreListing
        const listingId = uuid();
        await run(
            `CREATE (l:AppStoreListing {
                listing_id: $listingId,
                slug: $slug,
                display_name: $displayName,
                tagline: $tagline,
                full_description: $fullDescription,
                icon_url: $iconUrl,
                app_listing_status: $status,
                launch_type: $launchType,
                launch_config_json: $launchConfigJson,
                category: $category,
                promotion_level: $promotionLevel
             })
             WITH l
             MATCH (i:Integration {id: $integrationId})
             CREATE (i)-[:PUBLISHES_LISTING]->(l)
             RETURN l`,
            {
                listingId,
                slug: SLUG,
                displayName: 'Perf Bench App',
                tagline: 'LC-1644 benchmark app',
                fullDescription: 'Locally seeded app for benchmarking appEvent',
                iconUrl: 'https://placehold.co/250x250/orange/white?text=Perf',
                status: 'LISTED',
                launchType: 'EMBEDDED_IFRAME',
                launchConfigJson: JSON.stringify({
                    url: 'http://localhost:4321',
                    permissions: ['send_credential'],
                }),
                category: 'Learning',
                promotionLevel: 'CURATED_LIST',
                integrationId,
            }
        );
        console.log(`  [seed] Listing created: ${listingId} (slug: ${SLUG})`);

        // 5. Boost + SA
        await ensureBoostAndSA(run, listingId);
        await ensureMongoSA();

        return {
            listingId,
            templateAlias: TEMPLATE_ALIAS,
            issuerProfileId: ISSUER_PROFILE_ID,
        };
    } finally {
        await neogma.driver.close();
    }
}

// ---------------------------------------------------------------------------
// Boost + Signing Authority
// ---------------------------------------------------------------------------

async function ensureBoostAndSA(
    run: Neogma['queryRunner']['run'],
    listingId: string
): Promise<void> {
    // Boost
    const existingBoost = await run(
        `MATCH (l:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST {templateAlias: $templateAlias}]->(b:Boost)
         RETURN b.id AS boostId`,
        { listingId, templateAlias: TEMPLATE_ALIAS }
    );

    if (!existingBoost.records.length) {
        const boostId = uuid();
        const boostJson = buildCredentialTemplate();

        await run(
            `CREATE (b:Boost {
                id: $boostId,
                boost: $boostJson,
                name: $name,
                category: $category,
                status: 'LIVE'
             })
             WITH b
             MATCH (p:Profile {profileId: $profileId})
             CREATE (b)-[:CREATED_BY {date: $date}]->(p)
             WITH b
             MATCH (l:AppStoreListing {listing_id: $listingId})
             CREATE (l)-[:HAS_BOOST {templateAlias: $templateAlias, createdAt: $date}]->(b)
             RETURN b`,
            {
                boostId,
                boostJson,
                name: 'Perf Bench Badge',
                category: 'Achievement',
                profileId: ISSUER_PROFILE_ID,
                listingId,
                templateAlias: TEMPLATE_ALIAS,
                date: new Date().toISOString(),
            }
        );
        console.log(`  [seed] Boost created (alias: "${TEMPLATE_ALIAS}")`);
    } else {
        console.log(`  [seed] Boost exists (alias: "${TEMPLATE_ALIAS}")`);
    }

    // Signing Authority
    const existingSa = await run(
        `MATCH (l:AppStoreListing {listing_id: $listingId})-[r:USES_SIGNING_AUTHORITY]->(sa:SigningAuthority)
         RETURN sa.endpoint AS endpoint`,
        { listingId }
    );

    const saDidKey = deriveDidKeyFromSeed(SA_SEED);

    if (!existingSa.records.length) {
        await run(
            `MERGE (sa:SigningAuthority {endpoint: $endpoint})
             WITH sa
             MATCH (l:AppStoreListing {listing_id: $listingId})
             CREATE (l)-[:USES_SIGNING_AUTHORITY {
                 name: $name,
                 did: $did,
                 isPrimary: true
             }]->(sa)
             RETURN sa`,
            {
                endpoint: SA_ENDPOINT,
                listingId,
                name: SA_NAME_OVERRIDE ?? 'default',
                did: SA_DID_OVERRIDE ?? saDidKey,
            }
        );
        console.log(`  [seed] SA linked to listing: ${SA_ENDPOINT}`);

        // Also link SA to the issuer profile (fallback path)
        await run(
            `MATCH (sa:SigningAuthority {endpoint: $endpoint})
             MATCH (p:Profile {profileId: $profileId})
             MERGE (p)-[r:USES_SIGNING_AUTHORITY]->(sa)
             ON CREATE SET r.name = $name, r.did = $did, r.isPrimary = true
             RETURN r`,
            {
                endpoint: SA_ENDPOINT,
                profileId: ISSUER_PROFILE_ID,
                name: SA_NAME_OVERRIDE ?? 'default',
                did: SA_DID_OVERRIDE ?? saDidKey,
            }
        );
    } else {
        console.log(`  [seed] SA already configured`);
    }
}

async function ensureMongoSA(): Promise<void> {
    const appDid = getAppDidWeb(BRAIN_DOMAIN, SLUG);
    let client: MongoClient | undefined;

    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db(MONGO_DB_NAME);
        const collection = db.collection('signingauthorities');

        const existing = await collection.findOne({ ownerDid: appDid, name: 'default' });

        if (!existing) {
            const did = `did:key:z${crypto.createHash('sha256').update(SA_SEED).digest('hex').slice(0, 48)}`;

            await collection.insertOne({
                _id: uuid(),
                ownerDid: appDid,
                name: 'default',
                seed: SA_SEED,
                did,
            } as any);

            console.log(`  [seed] MongoDB SA created: ownerDid=${appDid}`);
        } else {
            console.log(`  [seed] MongoDB SA exists: ownerDid=${appDid}`);
        }
    } catch (err) {
        console.warn(
            `  [seed] Could not connect to MongoDB at ${MONGO_URI} — skipping SA setup.`
        );
        console.warn(
            '  [seed] Credential issuance will not work without the MongoDB signing authority.'
        );
    } finally {
        await client?.close();
    }
}
