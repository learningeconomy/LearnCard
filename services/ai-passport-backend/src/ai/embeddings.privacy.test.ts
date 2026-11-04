import { beforeEach, expect, mock, test } from 'bun:test';
import type { VC } from '@learncard/types';
import type { ActiveAiConsentReceipt } from '../learncard/consent';
import type { DBCredentialRecord } from '../db';

const owner = 'did:example:learner';
const uri = 'lc:credential:private';
let revision = 'current-revision';
const receipt = (): ActiveAiConsentReceipt => ({
    contractUri: 'lc:network:contract:ai',
    receiptId: 'lc:terms:one',
    status: 'live',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contractUpdatedAt: '2026-01-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: [uri],
    personalFields: [],
    guardian: { required: false, approved: false },
    purpose: 'embedding',
    revision,
});
// Capture the real async context before replacing only its live consent lookup.
const privacy = await import('./privacy');
mock.module('./privacy', () => ({
    ...privacy,
    assertCurrentAiConsent: async () => {
        if (privacy.getCurrentAiSubject() !== owner) throw new Error('Owner required');
        return receipt();
    },
}));
const storeEmbeddings = mock(async (_collection: string, _points: unknown[]) => undefined);
const searchSimilar = mock(async () => [
    {
        id: 'message-1',
        score: 0.9,
        payload: {
            recordType: 'chat-message',
            messageId: 'message-1',
            threadId: 'thread-1',
            userId: owner,
            role: 'user',
            text: 'legacy private text',
            credentialContext: 'legacy raw context',
            content: 'stale chat content',
        },
    },
    {
        id: 'foreign-message',
        score: 0.8,
        payload: { userId: 'did:example:other', text: 'foreign private text' },
    },
]);
const messages = [
    {
        id: 'message-1',
        did: owner,
        threadId: 'thread-1',
        role: 'user' as const,
        content: 'authoritative chat text',
        created_at: '2026-08-27T00:00:00.000Z',
    },
];
const getMessagesByIds = mock(async (did: string, ids: string[], threadId?: string) =>
    messages.filter(
        message =>
            message.did === did &&
            ids.includes(message.id) &&
            (!threadId || message.threadId === threadId)
    )
);
mock.module('./client', () => ({
    embeddingAiCall: mock(async (texts: string[]) => texts.map(() => [0.1, 0.2])),
}));
mock.module('../db/qdrant', () => ({
    storeEmbeddings,
    searchSimilar,
    createCollectionIfNotExists: mock(async () => undefined),
}));
mock.module('../db', () => ({
    db: {
        getMessagesByIds,
        getVectorSource: async (_did: string, kind: string, key: string, expected: object) => ({
            kind,
            key,
            epoch: 'fixture-epoch',
            ...expected,
        }),
        getEmbeddingCredentialVersion: async () => record().verification,
    },
}));
mock.module('./embedding-lock', () => ({
    withEmbeddingLock: async (_did: string, _source: string, fn: () => Promise<unknown>) => fn(),
    assertEmbeddingLock: async () => {},
}));
mock.module('../constants/collections', () => ({
    EMBEDDINGS_COLLECTION: 'messages',
    EMBEDDINGS_DIMENSION: 2,
    CREDENTIAL_COLLECTION_PREFIXES: {
        FULL_TEXT: 'credential-full',
        DOMAIN_SUMMARY: 'credential-domain',
        KEY_CLAIMS: 'credential-claims',
        TECHNICAL_METADATA: 'credential-technical',
        COMPARISON_CONTEXT: 'credential-comparison',
    },
}));
// Load consumers after the infrastructure doubles have been installed.
const { fingerprintCredential } = await import('../credentials/verification');
const { projectCredential } = await import('../credentials/projection');
const { findSimilarMessages, generateAndStoreCredentialEmbeddings } = await import('./embeddings');
const credential: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: uri,
    type: ['VerifiableCredential', 'TestCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: {
        id: owner,
        name: 'Private Learner',
        skills: ['Calculus'],
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
        proofValue: 'synthetic-test-proof',
    },
};
function record(): DBCredentialRecord {
    const verification = {
        credentialUri: uri,
        contentHash: fingerprintCredential(credential),
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
        uri,
        category: 'Achievement',
        credential,
        rawCredentialJson: JSON.stringify(credential),
        aiContext: 'private credential context',
        createdAt: verification.checkedAt,
        verification,
        projection: projectCredential(credential, 'Achievement', verification),
    };
}
const texts = {
    fullText: 'private full text',
    domainSummary: 'private domain summary',
    keyClaims: 'private claims',
    technicalMetadata: 'private technical metadata',
    comparisonContext: 'private comparison context',
};

beforeEach(() => {
    revision = 'current-revision';
    storeEmbeddings.mockClear();
    searchSimilar.mockClear();
    getMessagesByIds.mockClear();
});

test('credential vector storage excludes projected text and raw credentials', async () => {
    await privacy.runWithAiPrivacyContext(owner, () =>
        generateAndStoreCredentialEmbeddings(record(), texts, owner)
    );
    const stored = JSON.stringify(storeEmbeddings.mock.calls);
    for (const forbidden of [
        'private credential context',
        ...Object.values(texts),
        'Private Learner',
        'credentialSubject',
        'Calculus',
    ])
        expect(stored).not.toContain(forbidden);
    expect(stored).toContain('"contentHash":');
    expect(stored).toContain('"consentRevision":"current-revision"');
});

test('changed credential content and superseded receipts cannot reach vector storage', async () => {
    const original = record();
    await expect(
        privacy.runWithAiPrivacyContext(owner, () =>
            generateAndStoreCredentialEmbeddings(
                {
                    ...original,
                    credential: {
                        ...credential,
                        credentialSubject: { skills: ['Forged'] },
                    },
                },
                texts,
                owner
            )
        )
    ).rejects.toThrow('Verified credential provenance');
    revision = 'replacement-revision';
    await expect(
        privacy.runWithAiPrivacyContext(owner, () =>
            generateAndStoreCredentialEmbeddings(original, texts, owner)
        )
    ).rejects.toThrow('no longer authorized');
    expect(storeEmbeddings).not.toHaveBeenCalled();
});

test('message search hydration never merges legacy context', async () => {
    await privacy.runWithAiPrivacyContext(owner, async () => {
        const results = await findSimilarMessages('private query', owner, 5, 'thread-1');
        expect(results).toEqual([{ id: 'message-1', score: 0.9, payload: messages[0] }]);
        const serialized = JSON.stringify(results);
        for (const forbidden of [
            'legacy private text',
            'legacy raw context',
            'stale chat content',
            'foreign private text',
        ])
            expect(serialized).not.toContain(forbidden);
        expect(await findSimilarMessages('private query', owner, 5, 'another-thread')).toEqual([]);
    });
});
