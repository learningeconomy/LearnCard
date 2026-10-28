import { beforeEach, describe, expect, it, mock } from 'bun:test';
import MemoryRedis from 'ioredis-mock';
import type { DBCredentialRecord } from '../db';
import type { ActiveAiConsentReceipt } from '../learncard/consent';

const redis = new MemoryRedis();
let cacheUnavailable = false;
let owner = 'did:example:learner';
let revision = 'revision-one';
let denied = false;
const receipt = (): ActiveAiConsentReceipt => ({
    contractUri: 'lc:network:contract:ai',
    receiptId: 'lc:terms:one',
    status: 'live',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contractUpdatedAt: '2026-01-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: ['lc:credential:one'],
    personalFields: [],
    guardian: { required: false, approved: false },
    purpose: 'model-inference',
    revision,
});
const aiCall = mock(async () => ({ topics: [`Generated ${revision}`] }));
mock.module('./client', () => ({ aiCall }));
mock.module('../constants/env', () => ({
    REDIS_HOST: '',
    REDIS_PORT: 6384,
    REDIS_PASSWORD: '',
    REDIS_PREFIX: 'topic-fixture',
    FORMATTING_MODEL: 'test-formatting-model',
    AI_PRIVACY_KEY: Buffer.alloc(32, 7).toString('base64'),
    LEARNCARD_CONTRACT_URI: 'lc:network:contract:ai',
}));
mock.module('./privacy', () => ({
    getCurrentAiSubject: () => owner,
    bindAiConsentRevision: () => true,
    assertCurrentAiConsent: async () => {
        if (denied) throw new Error('consent denied');
        return receipt();
    },
}));
const { default: cache } = await import('../utils/cache');
cache.redis = redis;
const readCache = cache.get;
cache.get = async (...args) => {
    if (cacheUnavailable) throw new Error('cache unavailable');
    return readCache(...args);
};
const { withOwnerOperation } = await import('../services/dataErasure');
const { getSuggestedTopics: suggestTopics, warmUpTopicsCache: warmTopics } =
    await import('./topics');
const getSuggestedTopics = (did: string, credentials: DBCredentialRecord[]) =>
    withOwnerOperation(did, () => suggestTopics(did, credentials));
const warmUpTopicsCache = (did: string, credentials: DBCredentialRecord[]) =>
    withOwnerOperation(did, () => warmTopics(did, credentials));
const { runWithLocale } = await import('./locale');
const { projectCredential } = await import('../credentials/projection');
const { fingerprintCredential } = await import('../credentials/verification');

function credential(skill = 'Builds APIs'): DBCredentialRecord {
    const original = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2026-01-01T00:00:00.000Z',
        credentialSubject: { id: owner, skills: [skill] },
        proof: {
            type: 'Ed25519Signature2020',
            created: '2026-01-01T00:00:00.000Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#key-1',
        },
    };
    const verification = {
        credentialUri: 'lc:credential:one',
        contentHash: fingerprintCredential(original),
        status: 'valid' as const,
        checkedAt: '2026-01-01T00:00:00.000Z',
        verifiedPayload: 'credential' as const,
        checks: ['proof'],
        errors: [],
        warnings: [],
        verifier: { name: 'fixture', version: '1' },
        provenance: {
            source: 'wallet' as const,
            retrievedAt: '2026-01-01T00:00:00.000Z',
        },
        consent: receipt(),
    };
    return {
        id: 'one',
        uri: verification.credentialUri,
        category: 'Achievement',
        credential: original,
        rawCredentialJson: JSON.stringify(original),
        aiContext: 'not trusted as model input',
        createdAt: verification.checkedAt,
        verification,
        projection: projectCredential(original, 'Achievement', verification),
    };
}

describe('authorized topic cache', () => {
    beforeEach(async () => {
        await redis.flushall();
        cacheUnavailable = false;
        denied = false;
        owner = 'did:example:learner';
        revision = 'revision-one';
        aiCall.mockClear();
    });
    it('coalesces simultaneous generation and reuses warmup results for the same authorized source', async () => {
        const credentials = [credential()];
        const results = await Promise.all(
            Array.from({ length: 20 }, () => warmUpTopicsCache(owner, credentials))
        );
        expect(results).toEqual(Array.from({ length: 20 }, () => ['Generated revision-one']));
        expect(await getSuggestedTopics(owner, credentials)).toEqual(['Generated revision-one']);
        expect(aiCall).toHaveBeenCalledTimes(1);
    });
    it('does not reuse a different content, locale, owner, or consent revision', async () => {
        await getSuggestedTopics(owner, [credential()]);
        await getSuggestedTopics(owner, [credential('Operates Kubernetes')]);
        await runWithLocale('es', () => getSuggestedTopics(owner, [credential()]));
        owner = 'did:example:second';
        await getSuggestedTopics(owner, [credential()]);
        revision = 'revision-two';
        expect(await getSuggestedTopics(owner, [credential()])).toEqual(['Generated revision-two']);
        expect(aiCall).toHaveBeenCalledTimes(5);
    });
    it('refuses a populated cache after withdrawal and stale source provenance after a grant update', async () => {
        const credentials = [credential()];
        await getSuggestedTopics(owner, credentials);
        denied = true;
        await expect(getSuggestedTopics(owner, credentials)).rejects.toThrow();
        denied = false;
        revision = 'revision-two';
        await expect(getSuggestedTopics(owner, credentials)).rejects.toThrow();
        expect(aiCall).toHaveBeenCalledTimes(1);
    });
    it('fails closed on cache outage without contacting a provider', async () => {
        cacheUnavailable = true;
        const credentials = [credential()];
        await expect(getSuggestedTopics(owner, credentials)).rejects.toThrow('cache unavailable');
        denied = true;
        await expect(getSuggestedTopics(owner, credentials)).rejects.toThrow();
        expect(aiCall).not.toHaveBeenCalled();
    });
});
