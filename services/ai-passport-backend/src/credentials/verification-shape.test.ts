import { expect, test } from 'bun:test';
import type { VC } from '@learncard/types';
import type { CredentialConsentReceipt } from './verification';
import { verifyCredentialForIngestion } from './verification';
import { projectCredential } from './projection';

const uri = 'urn:uuid:00000000-0000-4000-8000-0000000000aa';
const subjectDid = 'did:example:learner';
const proof = {
    type: 'Ed25519Signature2020',
    created: '2026-01-01T00:00:00Z',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:example:issuer#key-1',
    proofValue: 'z1',
};
const consent: CredentialConsentReceipt = {
    contractUri: 'test:contract',
    receiptId: 'test:receipt',
    status: 'live',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contractUpdatedAt: '2026-01-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: [uri],
    personalFields: [],
    purpose: 'credential-ingestion',
    revision: 'test-revision',
    guardian: { required: false, approved: false },
};
const inner = (): Record<string, unknown> => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: {
        id: subjectDid,
        achievement: { name: 'Fractions Mastery' },
    },
    proof,
});
const wrap = (boost: unknown): VC =>
    ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: uri,
        type: ['VerifiableCredential', 'CertifiedBoostCredential'],
        issuer: 'did:example:network',
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: { id: subjectDid },
        proof,
        boostCredential: boost,
    }) as VC;

const verified = (credential: VC) => {
    const calls: unknown[] = [];
    return verifyCredentialForIngestion({
        credential,
        credentialUri: uri,
        subjectDid,
        consent,
        verify: async original => {
            calls.push(original);
            return { checks: ['proof'], errors: [], warnings: [] };
        },
    }).then(result => ({ result, calls }));
};

// Each is VC-legal on the inner boost; the old local VCValidator gate marked
// them invalid (and deleted them) before the verifier ever ran.
const legalShapes: Record<string, (boost: Record<string, unknown>) => void> = {
    'string type': boost => {
        boost.type = 'OpenBadgeCredential';
    },
    'missing type': boost => {
        delete boost.type;
    },
    'string @context': boost => {
        boost['@context'] = 'https://www.w3.org/2018/credentials/v1';
    },
    'Data Integrity proof without created': boost => {
        boost.proof = {
            type: 'DataIntegrityProof',
            cryptosuite: 'eddsa-rdfc-2022',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:issuer#key-1',
            proofValue: 'z1',
        };
    },
};

for (const [name, mutate] of Object.entries(legalShapes)) {
    test(`a boost with ${name} reaches the verifier and projects`, async () => {
        const boost = inner();
        mutate(boost);
        const credential = wrap(boost);
        const { result, calls } = await verified(credential);

        expect(result.status).toBe('valid');
        expect(result.errors).toEqual([]);
        expect(calls).toEqual([credential]);
        const projection = projectCredential(credential, 'Achievement', result);
        expect(JSON.stringify(projection)).toContain('Fractions Mastery');
        for (const type of projection.credentialTypes) expect(type.length).toBeGreaterThan(1);
    });
}

test('a string boost type projects as one type, not its characters', async () => {
    const boost = inner();
    boost.type = 'OpenBadgeCredential';
    const credential = wrap(boost);
    const { result } = await verified(credential);
    expect(projectCredential(credential, 'Achievement', result).credentialTypes).toEqual([
        'OpenBadgeCredential',
    ]);
});

test('a boost without a credential subject is still malformed', async () => {
    const boost = inner();
    delete boost.credentialSubject;
    const { result, calls } = await verified(wrap(boost));
    expect(result.status).toBe('invalid');
    expect(result.errors).toEqual(['verification_payload_invalid']);
    expect(calls).toEqual([]);
});

test('an outer credential the SDK contract rejects is still malformed', async () => {
    const credential = wrap(inner()) as unknown as Record<string, unknown>;
    delete credential.issuer;
    const { result, calls } = await verified(credential as unknown as VC);
    expect(result.status).toBe('invalid');
    expect(calls).toEqual([]);
});
