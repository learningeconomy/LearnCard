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

import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { Neogma } from 'neogma';
import * as nacl from 'tweetnacl';
import { v4 as uuid, v5 as uuidv5 } from 'uuid';

import {
    getBundle,
    getFixture,
    prepareFixture,
    type CredentialBundleEntry,
} from '@learncard/credential-library';
import type { UnsignedVC } from '@learncard/types';
import { flattenObject } from '../src/helpers/objects.helpers';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const PERSONA_NAMESPACE = '5c4bb193-6e65-43d9-940d-d85b758a94f2';
const PROFILE_ID = 'demo-school';
const PROFILE_NAME = 'Demo School';
const SIGNING_AUTHORITY_NAME = 'sample-personas';

const NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME ?? 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? 'this-is-the-password';
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/?replicaSet=rs0';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? 'lca-api';
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

const personaId = process.argv[2];

if (!personaId) {
    throw new Error('Usage: bun scripts/seed-demo-persona.ts <personaId>');
}

if (!/^[0-9a-f]{64}$/i.test(SIGNING_AUTHORITY_SEED)) {
    throw new Error('DEMO_PERSONA_SA_SEED must contain exactly 64 hexadecimal characters.');
}

if (
    (!isLocalDatabase(NEO4J_URI) || !isLocalDatabase(MONGO_URI)) &&
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

const ensureSigningAuthority = async (ownerDid: string, did: string): Promise<void> => {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        await client
            .db(MONGO_DB_NAME)
            .collection('signingauthorities')
            .updateOne(
                { ownerDid, name: SIGNING_AUTHORITY_NAME },
                {
                    $set: { seed: SIGNING_AUTHORITY_SEED, did },
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
    const profileId = transformProfileId(PROFILE_ID);
    const issuerDid = getDidWeb(BRAIN_DOMAIN, profileId);
    const signingAuthorityDid = deriveDidKeyFromSeed(SIGNING_AUTHORITY_SEED);
    const contractId = uuidv5(`persona:${bundle.id}:contract`, PERSONA_NAMESPACE);
    const neogma = new Neogma({
        url: NEO4J_URI,
        username: NEO4J_USERNAME,
        password: NEO4J_PASSWORD,
    });
    const run = neogma.queryRunner.run.bind(neogma.queryRunner);

    try {
        await run(
            `MERGE (p:Profile {profileId: $profileId})
             SET p.displayName = $displayName,
                 p.shortBio = $shortBio,
                 p.did = $did
             RETURN p`,
            {
                profileId,
                displayName: PROFILE_NAME,
                shortBio: 'Issuer for LearnCard sample credentials',
                did: signingAuthorityDid,
            }
        );

        await run(
            `MERGE (sa:SigningAuthority {endpoint: $endpoint})
             WITH sa
             MATCH (p:Profile {profileId: $profileId})
             MERGE (p)-[r:USES_SIGNING_AUTHORITY {name: $name}]->(sa)
             SET r.did = $did, r.isPrimary = true
             RETURN r`,
            {
                endpoint: SIGNING_AUTHORITY_ENDPOINT,
                profileId,
                name: SIGNING_AUTHORITY_NAME,
                did: signingAuthorityDid,
            }
        );
        await ensureSigningAuthority(issuerDid, signingAuthorityDid);

        const boostIds: string[] = [];
        for (const entry of bundle.entries) {
            const fixture = getFixture(entry.fixtureId);
            const boostId = uuidv5(
                `persona:${bundle.id}:fixture:${entry.fixtureId}`,
                PERSONA_NAMESPACE
            );
            const credential = prepareBundleCredential(entry, issuerDid);
            const boost = toBoostTemplate(credential, issuerDid);
            boostIds.push(boostId);
            const boostProperties = flattenObject({
                id: boostId,
                boost,
                name: entry.name ?? fixture.name,
                type: fixture.profile,
                category: 'Achievement',
                status: 'LIVE',
                meta: { personaId: bundle.id, fixtureId: fixture.id },
            });

            await run(
                `MERGE (b:Boost {id: $boostId})
                 SET b = $properties
                 WITH b
                 MATCH (p:Profile {profileId: $profileId})
                 MERGE (b)-[created:CREATED_BY]->(p)
                 SET created.date = $date
                 MERGE (p)-[role:HAS_ROLE]->(b)
                 SET role.roleId = '__creator__'
                 RETURN b`,
                {
                    boostId,
                    properties: boostProperties,
                    profileId,
                    date: new Date().toISOString(),
                }
            );
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
             MATCH (p:Profile {profileId: $profileId})
             MERGE (c)-[:CREATED_BY]->(p)
             RETURN c`,
            {
                contractId,
                createdAt: now,
                profileId,
                properties: contractProperties,
            }
        );

        await run(
            `MATCH (c:ConsentFlowContract {id: $contractId})
             OPTIONAL MATCH (c)-[old:AUTO_RECEIVE]->(:Boost)
             DELETE old
             WITH DISTINCT c
             UNWIND $boostIds AS boostId
             MATCH (b:Boost {id: boostId})
             CREATE (c)-[:AUTO_RECEIVE {
                 signingAuthorityEndpoint: $endpoint,
                 signingAuthorityName: $name,
                 issuer: $profileId
             }]->(b)`,
            {
                contractId,
                boostIds,
                endpoint: SIGNING_AUTHORITY_ENDPOINT,
                name: SIGNING_AUTHORITY_NAME,
                profileId,
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
