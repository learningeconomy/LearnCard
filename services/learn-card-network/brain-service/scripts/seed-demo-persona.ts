#!/usr/bin/env bun
/**
 * Publish a credential-library persona as a ConsentFlow contract with auto-boosts.
 *
 * Usage (from services/learn-card-network/brain-service):
 *   bun run seed:demo-persona student
 *
 * The script is idempotent: profile, signing authority, Boost, contract, and
 * AUTO_RECEIVE identifiers are stable. Re-running updates fixture content and
 * replaces the contract's auto-boost set without changing its URI.
 *
 * Local defaults target the LearnCard Docker stack. For staging/production,
 * provide the normal Neo4j/Mongo connection variables plus:
 *   DEMO_PERSONA_SA_SEED=<64 hex chars>
 *   DEMO_PERSONA_SIGNING_AUTHORITY_ENDPOINT=https://<lca-api>/api
 */

import { fileURLToPath } from 'url';
import { createHmac } from 'node:crypto';

import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { Neogma } from 'neogma';
import Redis from 'ioredis';
import * as nacl from 'tweetnacl';
import { v4 as uuid, v5 as uuidv5 } from 'uuid';

import {
    getBundle,
    getFixture,
    prepareFixture,
    type CredentialBundleEntry,
    type CredentialBundleIssuer,
} from '@learncard/credential-library';
import type { UnsignedVC } from '@learncard/types';
import { flattenObject } from '../src/helpers/objects.helpers';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const PERSONA_NAMESPACE = '5c4bb193-6e65-43d9-940d-d85b758a94f2';
const SIGNING_AUTHORITY_NAME = 'sample-personas';

const NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME ?? 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? 'this-is-the-password';
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/?replicaSet=rs0';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? 'lca-api';
const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
const REDIS_PORT = Number.parseInt(process.env.REDIS_PORT ?? '6379', 10);
const BRAIN_DOMAIN = process.env.DOMAIN_NAME || 'localhost%3A4000';
const SIGNING_AUTHORITY_ENDPOINT =
    process.env.DEMO_PERSONA_SIGNING_AUTHORITY_ENDPOINT ?? 'http://localhost:5100/api';
const SIGNING_AUTHORITY_SEED = process.env.DEMO_PERSONA_SA_SEED ?? 'd'.repeat(64);

const LOCAL_DATABASE_HOSTS: Record<string, true> = {
    localhost: true,
    '127.0.0.1': true,
    neo4j: true,
    'lcn-neo4j': true,
    mongodb: true,
    'lcn-mongodb': true,
};

const isLocalDatabase = (uri: string): boolean => {
    try {
        return LOCAL_DATABASE_HOSTS[new URL(uri).hostname] === true;
    } catch {
        return false;
    }
};
const IS_LOCAL_TARGET = isLocalDatabase(NEO4J_URI) && isLocalDatabase(MONGO_URI);

const personaId = process.argv[2];

if (!personaId) {
    throw new Error('Usage: bun scripts/seed-demo-persona.ts <personaId>');
}

if (!/^[0-9a-f]{64}$/i.test(SIGNING_AUTHORITY_SEED)) {
    throw new Error('DEMO_PERSONA_SA_SEED must contain exactly 64 hexadecimal characters.');
}

if (
    !IS_LOCAL_TARGET &&
    (!process.env.DEMO_PERSONA_SA_SEED || !process.env.DEMO_PERSONA_SIGNING_AUTHORITY_ENDPOINT)
) {
    throw new Error(
        'DEMO_PERSONA_SA_SEED and DEMO_PERSONA_SIGNING_AUTHORITY_ENDPOINT are required outside local development.'
    );
}

const transformProfileId = (raw: string): string => raw.toLowerCase().replace(/:/g, '%3A');

const getDidWeb = (domain: string, profileId: string): string =>
    `did:web:${domain}:users:${profileId}`;

const constructContractUri = (contractId: string): string => {
    const encodedDomain = BRAIN_DOMAIN.includes('localhost')
        ? BRAIN_DOMAIN.replace(/:/g, '%3A')
        : BRAIN_DOMAIN.replace(/:/g, '/');

    return `lc:network:${encodedDomain.replace(/\/trpc$/, '')}/trpc:contract:${contractId}`;
};

const deriveDidKeyFromSeed = (hexSeed: string): string => {
    const seedBytes = Buffer.from(hexSeed, 'hex');
    const keyPair = nacl.sign.keyPair.fromSeed(seedBytes);
    const multicodec = Buffer.concat([Buffer.from('ed01', 'hex'), Buffer.from(keyPair.publicKey)]);

    return `did:key:z${bs58.encode(multicodec)}`;
};
const deriveSigningAuthoritySeed = (profileId: string): string =>
    createHmac('sha256', Buffer.from(SIGNING_AUTHORITY_SEED, 'hex'))
        .update(`learncard:sample-persona:${profileId}`)
        .digest('hex');

const clearProfileDidDocumentCache = async (profileId: string): Promise<void> => {
    const redis = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        lazyConnect: true,
        connectTimeout: 2_000,
        retryStrategy: () => null,
    });

    try {
        await redis.connect();
        await redis.del(`did-doc:${profileId}`);
    } catch {
        console.warn(
            `Could not clear did-doc:${profileId} at ${REDIS_HOST}:${REDIS_PORT}; delete that Redis key manually, or restart the brain service if it uses an in-memory cache.`
        );
    } finally {
        redis.disconnect();
    }
};

const shiftDate = (offsetDays: number): string => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return date.toISOString();
};

const prepareBundleCredential = (entry: CredentialBundleEntry, issuerDid: string): UnsignedVC => {
    const fixture = getFixture(entry.fixtureId);
    const prepared = prepareFixture(fixture, {
        issuerDid,
        subjectDid: 'did:example:123',
        validFrom: shiftDate(entry.validFromOffsetDays),
        freshIds: false,
    });

    if (entry.name) prepared.name = entry.name;

    return prepared;
};

const toBoostTemplate = (credential: UnsignedVC, issuerDid: string): string => {
    const template = structuredClone(credential) as Record<string, unknown>;
    delete template.id;
    delete template.proof;
    template.issuer = issuerDid;

    const subjects = Array.isArray(template.credentialSubject)
        ? template.credentialSubject
        : [template.credentialSubject];
    for (const subject of subjects) {
        if (subject && typeof subject === 'object') {
            Object.assign(subject, { id: 'did:example:123' });
        }
    }

    return JSON.stringify(template);
};

const ensureSigningAuthority = async (
    ownerDid: string,
    did: string,
    seed: string
): Promise<void> => {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        await client
            .db(MONGO_DB_NAME)
            .collection('signingauthorities')
            .updateOne(
                { ownerDid, name: SIGNING_AUTHORITY_NAME },
                {
                    $set: { seed, did },
                    $setOnInsert: { _id: uuid(), ownerDid, name: SIGNING_AUTHORITY_NAME },
                },
                { upsert: true }
            );
    } finally {
        await client.close();
    }
};

const main = async (): Promise<void> => {
    const bundle = getBundle(personaId);
    const [firstEntry] = bundle.entries;
    if (!firstEntry) {
        throw new Error(`Credential bundle ${bundle.id} has no entries.`);
    }

    const issuerProfiles = new Map<
        string,
        CredentialBundleIssuer & {
            profileId: `sample-${string}`;
            did: string;
            signingAuthorityDid: string;
            signingAuthoritySeed: string;
        }
    >();
    for (const entry of bundle.entries) {
        const profileId = transformProfileId(entry.issuer.profileId);
        if (!profileId.startsWith('sample-')) {
            throw new Error(`Refusing to seed non-sample issuer profile: ${profileId}`);
        }
        const existingIssuer = issuerProfiles.get(profileId);

        if (
            existingIssuer &&
            (existingIssuer.displayName !== entry.issuer.displayName ||
                existingIssuer.image !== entry.issuer.image)
        ) {
            throw new Error(`Conflicting metadata configured for sample issuer ${profileId}.`);
        }

        const signingAuthoritySeed = deriveSigningAuthoritySeed(profileId);
        const signingAuthorityDid = deriveDidKeyFromSeed(signingAuthoritySeed);
        issuerProfiles.set(profileId, {
            ...entry.issuer,
            profileId: profileId as `sample-${string}`,
            did: getDidWeb(BRAIN_DOMAIN, profileId),
            signingAuthorityDid,
            signingAuthoritySeed,
        });
    }

    const contractOwnerProfileId = transformProfileId(firstEntry.issuer.profileId);
    const contractId = uuidv5(`persona:${bundle.id}:contract`, PERSONA_NAMESPACE);
    const neogma = new Neogma({
        url: NEO4J_URI,
        username: NEO4J_USERNAME,
        password: NEO4J_PASSWORD,
    });
    const run = neogma.queryRunner.run.bind(neogma.queryRunner);

    try {
        for (const issuer of issuerProfiles.values()) {
            const profileResult = await run(
                `MERGE (p:Profile {profileId: $profileId})
                 SET p.displayName = $displayName,
                     p.shortBio = $shortBio,
                     p.image = $image,
                     p.did = $did
                 RETURN p.did AS did`,
                {
                    profileId: issuer.profileId,
                    displayName: issuer.displayName,
                    shortBio: 'Issuer for LearnCard sample credentials',
                    image: issuer.image ?? '',
                    did: issuer.signingAuthorityDid,
                }
            );
            const storedSigningAuthorityDid = profileResult.records[0]?.get('did');
            if (storedSigningAuthorityDid !== issuer.signingAuthorityDid) {
                throw new Error(
                    `Profile ${issuer.profileId} did not retain its signing authority DID.`
                );
            }

            await run(
                `MERGE (sa:SigningAuthority {endpoint: $endpoint})
                 WITH sa
                 MATCH (p:Profile {profileId: $profileId})
                 MERGE (p)-[r:USES_SIGNING_AUTHORITY {name: $name}]->(sa)
                 SET r.did = $did, r.isPrimary = true
                 RETURN r`,
                {
                    endpoint: SIGNING_AUTHORITY_ENDPOINT,
                    profileId: issuer.profileId,
                    name: SIGNING_AUTHORITY_NAME,
                    did: issuer.signingAuthorityDid,
                }
            );
            await clearProfileDidDocumentCache(issuer.profileId);
            await ensureSigningAuthority(
                issuer.did,
                issuer.signingAuthorityDid,
                issuer.signingAuthoritySeed
            );
        }

        const autoBoosts: Array<{ boostId: string; issuerProfileId: string }> = [];
        for (const entry of bundle.entries) {
            const fixture = getFixture(entry.fixtureId);
            const profileId = transformProfileId(entry.issuer.profileId);
            const issuer = issuerProfiles.get(profileId);
            if (!issuer) {
                throw new Error(`Missing seeded issuer profile ${profileId}.`);
            }

            const boostId = uuidv5(
                `persona:${bundle.id}:fixture:${entry.fixtureId}`,
                PERSONA_NAMESPACE
            );
            const credential = prepareBundleCredential(entry, issuer.did);
            const boost = toBoostTemplate(credential, issuer.did);
            autoBoosts.push({ boostId, issuerProfileId: profileId });
            const boostProperties = flattenObject({
                id: boostId,
                boost,
                name: entry.name ?? fixture.name,
                type: fixture.profile,
                category: 'Achievement',
                status: 'LIVE',
                meta: { personaId: bundle.id, fixtureId: fixture.id },
            });

            const boostResult = await run(
                `MERGE (b:Boost {id: $boostId})
                 SET b = $properties
                 WITH b
                 OPTIONAL MATCH (b)-[oldCreated:CREATED_BY]->(:Profile)
                 DELETE oldCreated
                 WITH DISTINCT b
                 OPTIONAL MATCH (:Profile)-[oldRole:HAS_ROLE {roleId: '__creator__'}]->(b)
                 DELETE oldRole
                 WITH DISTINCT b
                 MATCH (p:Profile {profileId: $profileId})
                 MERGE (b)-[created:CREATED_BY]->(p)
                 SET created.date = $date
                 MERGE (p)-[:HAS_ROLE {roleId: '__creator__'}]->(b)
                 WITH b
                 MATCH (b)-[:CREATED_BY]->(creator:Profile)
                 MATCH (roleOwner:Profile)-[:HAS_ROLE {roleId: '__creator__'}]->(b)
                 RETURN collect(creator.profileId) AS creatorProfileIds,
                        collect(roleOwner.profileId) AS roleOwnerProfileIds`,
                {
                    boostId,
                    properties: boostProperties,
                    profileId,
                    date: new Date().toISOString(),
                }
            );
            const creatorProfileIds = boostResult.records[0]?.get('creatorProfileIds');
            const roleOwnerProfileIds = boostResult.records[0]?.get('roleOwnerProfileIds');
            if (
                creatorProfileIds?.length !== 1 ||
                creatorProfileIds[0] !== profileId ||
                roleOwnerProfileIds?.length !== 1 ||
                roleOwnerProfileIds[0] !== profileId
            ) {
                throw new Error(`Boost ${boostId} has ambiguous profile ownership.`);
            }
        }

        const contract = {
            read: {
                personal: { name: { required: false } },
                credentials: { categories: { Achievement: { required: false } } },
            },
            write: {
                personal: {},
                credentials: {
                    categories: { Achievement: { required: false, defaultEnabled: true } },
                },
            },
        };
        const now = new Date().toISOString();
        const contractProperties = flattenObject({
            id: contractId,
            name: `${bundle.displayName} Sample Credentials`,
            subtitle: bundle.blurb,
            description: bundle.blurb,
            reasonForAccessing: '',
            needsGuardianConsent: false,
            redirectUrl: '',
            frontDoorBoostUri: '',
            image: '',
            contract,
            updatedAt: now,
        });

        await run(
            `MERGE (c:ConsentFlowContract {id: $contractId})
             ON CREATE SET c.createdAt = $createdAt
             WITH c, c.createdAt AS createdAt
             SET c = $properties,
                 c.createdAt = createdAt
             WITH c
             OPTIONAL MATCH (c)-[oldOwner:CREATED_BY]->(:Profile)
             DELETE oldOwner
             WITH DISTINCT c
             MATCH (p:Profile {profileId: $profileId})
             MERGE (c)-[:CREATED_BY]->(p)
             RETURN c`,
            {
                contractId,
                createdAt: now,
                profileId: contractOwnerProfileId,
                properties: contractProperties,
            }
        );

        await run(
            `MATCH (c:ConsentFlowContract {id: $contractId})
             OPTIONAL MATCH (c)-[old:AUTO_RECEIVE]->(:Boost)
             DELETE old
             WITH DISTINCT c
             UNWIND $autoBoosts AS autoBoost
             MATCH (b:Boost {id: autoBoost.boostId})
             CREATE (c)-[:AUTO_RECEIVE {
                 signingAuthorityEndpoint: $endpoint,
                 signingAuthorityName: $name,
                 issuer: autoBoost.issuerProfileId
             }]->(b)`,
            {
                contractId,
                autoBoosts,
                endpoint: SIGNING_AUTHORITY_ENDPOINT,
                name: SIGNING_AUTHORITY_NAME,
            }
        );

        console.log(constructContractUri(contractId));
    } finally {
        await neogma.driver.close();
    }
};

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
