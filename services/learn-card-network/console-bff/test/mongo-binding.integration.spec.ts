import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import type { ExternalIdentityBinding } from '@learncard/types';

import { createMongoBindingRepository, type MongoBindingRepository } from '@provisioning';

let mongod: MongoMemoryServer;
let client: MongoClient;
let db: Db;
let repo: MongoBindingRepository;

const binding = (subject: string): ExternalIdentityBinding => ({
    tenantId: 'lef',
    ecosystemId: 'eco_root',
    providerId: 'lef-oidc',
    issuer: 'https://idp.example',
    subject,
    profileId: `p-${subject}`,
    managedDid: `did:web:console.lef.org:p:${subject}`,
    provisioningSource: 'JIT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
});

describe('MongoBindingRepository (live mongodb-memory-server)', () => {
    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        client = new MongoClient(mongod.getUri());
        await client.connect();
        db = client.db('console-bff-test');
        repo = await createMongoBindingRepository(db);
    }, 120000);

    afterAll(async () => {
        await client?.close();
        await mongod?.stop();
    });

    it('upserts and reads a binding through the real driver', async () => {
        await repo.save(binding('sub-1'));

        const found = await repo.findBySubject('lef', 'https://idp.example', 'sub-1');
        expect(found?.profileId).toBe('p-sub-1');
    });

    it('is idempotent on (tenant, issuer, subject) — no duplicate rows', async () => {
        await repo.save(binding('sub-2'));
        await repo.save({ ...binding('sub-2'), status: 'REVOKED' });

        const count = await db
            .collection('external_identity_bindings')
            .countDocuments({ subject: 'sub-2' });
        const found = await repo.findBySubject('lef', 'https://idp.example', 'sub-2');

        expect(count).toBe(1);
        expect(found?.status).toBe('REVOKED');
    });

    it('touchLastLogin updates in place without dropping fields', async () => {
        await repo.save(binding('sub-3'));
        await repo.touchLastLogin(
            'lef',
            'https://idp.example',
            'sub-3',
            '2030-01-01T00:00:00.000Z'
        );

        const found = await repo.findBySubject('lef', 'https://idp.example', 'sub-3');
        expect(found?.lastLoginAt).toBe('2030-01-01T00:00:00.000Z');
        expect(found?.managedDid).toBe('did:web:console.lef.org:p:sub-3');
    });
});
