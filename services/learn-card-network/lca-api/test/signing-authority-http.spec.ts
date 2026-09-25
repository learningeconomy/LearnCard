import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { APIGatewayProxyEventV2, Context as LambdaContext } from 'aws-lambda';
import { client, mongodb } from '@mongo';
import { SigningAuthorities } from '@accesslayer/signing-authority';
import {
    decryptSigningAuthoritySeed,
    seedEncryption,
    SeedEncryptionError,
} from '@helpers/seedEncryption.helpers';
import { createOpenApiAwsLambdaHandler } from '@helpers/shim';
import { appRouter } from '../src/app';
import { getUser } from './helpers/getClient';
import { runSeedMigrationBatch } from '../src/migrations/signingAuthoritySeeds';

let user: Awaited<ReturnType<typeof getUser>>;
const handler = createOpenApiAwsLambdaHandler({
    router: appRouter,
    createContext: async () => ({
        domain: 'localhost:3000',
        tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' as const },
        user: { did: user.learnCard.id.did(), isChallengeValid: true, authorizedDid: true },
    }),
});
const request = async (path: string, body: unknown) =>
    handler(
        {
            version: '2.0',
            routeKey: 'ANY /api/{trpc+}',
            rawPath: `/api${path}`,
            rawQueryString: '',
            headers: { 'content-type': 'application/json' },
            pathParameters: { trpc: path.slice(1) },
            requestContext: {
                accountId: 'test',
                apiId: 'test',
                domainName: 'localhost',
                domainPrefix: 'localhost',
                http: {
                    method: 'POST',
                    path,
                    protocol: 'HTTP/1.1',
                    sourceIp: '127.0.0.1',
                    userAgent: 'test',
                },
                requestId: 'test-request',
                routeKey: 'ANY /api/{trpc+}',
                stage: 'test',
                time: '',
                timeEpoch: 0,
            },
            body: JSON.stringify(body),
            isBase64Encoded: false,
        } satisfies APIGatewayProxyEventV2,
        {} as LambdaContext
    );

beforeAll(async () => {
    await client.connect();
    user = await getUser();
});
afterAll(async () => {
    await client.close();
});
beforeEach(async () => {
    await SigningAuthorities.deleteMany({});
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('encrypted signing-authority OpenAPI routes', () => {
    it('keeps the same signing identity after migrating and purging a legacy seed', async () => {
        const created = await request('/signing-authority/create', { name: 'migrated-http' });
        const authority = JSON.parse(created.body);
        const stored = await SigningAuthorities.findOne({ _id: authority._id });
        const seed = await decryptSigningAuthoritySeed(stored!);
        await SigningAuthorities.updateOne(
            { _id: authority._id },
            {
                $set: { seed },
                $unset: { encryptedSeed: '', encryptedDek: '', keyVersion: '' },
            }
        );
        for (const phase of ['prepare', 'verify', 'purge'] as const) {
            const result = await runSeedMigrationBatch(
                mongodb,
                { phase },
                { encryptedWritesEnabled: true }
            );
            expect(result.done).toBe(true);
        }
        expect(await SigningAuthorities.findOne({ _id: authority._id })).not.toHaveProperty('seed');
        const response = await request('/credentials/issue', {
            credential: user.learnCard.invoke.newCredential(),
            signingAuthority: authority,
        });
        expect(response.statusCode).toBe(200);
        const signed = JSON.parse(response.body);
        expect(signed.issuer).toBe(authority.did);
        expect((await user.learnCard.invoke.verifyCredential(signed)).errors).toHaveLength(0);
    });

    it('creates ciphertext-only records and issues a verifiable credential over HTTP', async () => {
        const created = await request('/signing-authority/create', { name: 'http' });
        expect(created.statusCode).toBe(200);
        const authority = JSON.parse(created.body);
        expect(authority).not.toHaveProperty('seed');
        expect(authority).not.toHaveProperty('encryptedSeed');
        expect(await SigningAuthorities.findOne({ name: 'http' })).not.toHaveProperty('seed');
        const response = await request('/credentials/issue', {
            credential: user.learnCard.invoke.newCredential(),
            signingAuthority: authority,
        });
        expect(response.statusCode).toBe(200);
        const verification = await user.learnCard.invoke.verifyCredential(
            JSON.parse(response.body)
        );
        expect(verification.errors).toHaveLength(0);
    });

    it.each(['kms_access_denied', 'kms_unavailable', 'authentication_failed'] as const)(
        'returns a generic 500 and structured logs on %s',
        async category => {
            const created = await request('/signing-authority/create', { name: category });
            const authority = JSON.parse(created.body);
            vi.spyOn(seedEncryption, 'decrypt').mockRejectedValueOnce(
                new SeedEncryptionError(category, 'request-1')
            );
            const response = await request('/credentials/issue', {
                credential: user.learnCard.invoke.newCredential(),
                signingAuthority: authority,
            });
            expect(response.statusCode).toBe(500);
            expect(response.body).toContain('Signing authority key is unavailable');
            expect(response.body).not.toContain(category);
            expect(response.body).not.toContain('request-1');
            expect(console.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'signing_authority_seed_failure',
                    operation: 'decrypt',
                    category,
                })
            );
        }
    );

    it('does not insert a record when encryption fails during creation', async () => {
        vi.spyOn(seedEncryption, 'encrypt').mockRejectedValueOnce(
            new SeedEncryptionError('kms_unavailable')
        );
        const response = await request('/signing-authority/create', { name: 'failed-create' });
        expect(response.statusCode).toBe(500);
        expect(await SigningAuthorities.countDocuments()).toBe(0);
    });
});
