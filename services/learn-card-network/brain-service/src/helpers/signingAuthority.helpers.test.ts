import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JWE, UnsignedVC } from '@learncard/types';
import type { CredentialIssuer } from '../types/issuer';
import type { SigningAuthorityForUserType } from '../types/profile';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    append: vi.fn(async credential => credential),
    auth: vi.fn(async () => 'jwt'),
    environment: { NODE_ENV: 'production' },
}));
vi.mock('@environment', () => ({ environment: mocks.environment }));
vi.mock('@helpers/did.helpers', () => ({
    getDidWeb: (domain: string, profileId: string) => `did:web:${domain}:users:${profileId}`,
}));
vi.mock('undici', () => ({ Agent: class {}, fetch: mocks.fetch }));
vi.mock('@helpers/learnCard.helpers', () => ({
    getDidWebLearnCard: async () => ({
        id: { did: () => 'did:example:brain' },
        invoke: { getDidAuthVp: mocks.auth },
    }),
    getLearnCard: vi.fn(),
}));
vi.mock('./status-list.helpers', () => ({ appendBitstringStatusListEntries: mocks.append }));
vi.mock('@tracing', () => ({
    trace: async (_kind: string, _name: string, action: () => unknown) => action(),
    traceCrypto: async (_name: string, action: () => unknown) => action(),
    traceHttp: async (_name: string, action: () => unknown) => action(),
}));

import { issueCredentialWithSigningAuthority } from './signingAuthority.helpers';

const issuer = { type: 'profile', profile: { profileId: 'org' } } as unknown as CredentialIssuer;
const sa = {
    signingAuthority: { endpoint: 'https://sa.example' },
    relationship: { name: 'sa', did: 'did:example:sa' },
} as unknown as SigningAuthorityForUserType;
const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:sa',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:student' },
} as UnsignedVC;
const jwe: JWE = {
    protected: 'header',
    iv: 'iv',
    ciphertext: 'ciphertext',
    tag: 'tag',
    recipients: [],
};

describe('SA encryption boundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects missing subjects before allocating status or authenticating', async () => {
        await expect(
            issueCredentialWithSigningAuthority(
                issuer,
                { ...credential, credentialSubject: {} },
                sa,
                'network.example'
            )
        ).rejects.toMatchObject({ kind: 'validation_error', retryable: false });
        expect(mocks.append).not.toHaveBeenCalled();
        expect(mocks.auth).not.toHaveBeenCalled();
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it.each([undefined, 'did:example:app-owner'])(
        'encrypts only for the subject and owner (%s)',
        async override => {
            mocks.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => jwe });
            await issueCredentialWithSigningAuthority(
                issuer,
                credential,
                sa,
                'network.example',
                true,
                override
            );
            const body = JSON.parse(mocks.fetch.mock.calls[0]![1].body);
            expect(body.encryption.recipients).toEqual([
                'did:example:student',
                override ?? 'did:web:network.example:users:org',
            ]);
        }
    );

    it('allows subject-less plaintext inbox issuance without encryption recipients', async () => {
        mocks.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                ...credential,
                proof: {
                    type: 'Ed25519Signature2020',
                    created: '2026-01-01T00:00:00Z',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: 'did:example:sa#key',
                },
            }),
        });
        await issueCredentialWithSigningAuthority(
            issuer,
            { ...credential, credentialSubject: {} },
            sa,
            'network.example',
            false
        );
        expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body).encryption).toBeUndefined();
    });

    it('does not retry permanent recipient errors', async () => {
        mocks.fetch.mockResolvedValue({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: async () => 'Recipient has no usable key',
        });
        await expect(
            issueCredentialWithSigningAuthority(issuer, credential, sa, 'network.example')
        ).rejects.toMatchObject({ status: 400, retryable: false, kind: 'http_4xx' });
        expect(mocks.fetch).toHaveBeenCalledTimes(1);
    });
});
