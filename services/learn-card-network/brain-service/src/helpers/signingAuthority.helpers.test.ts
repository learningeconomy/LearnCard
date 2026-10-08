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

    it.each([
        { credentialSubject: {} },
        { credentialSubject: [] },
        { credentialSubject: [{ id: 'did:example:student' }, {}] },
    ])(
        'rejects missing subject IDs before allocating status or authenticating (%j)',
        async ({ credentialSubject }) => {
            await expect(
                issueCredentialWithSigningAuthority(
                    issuer,
                    { ...credential, credentialSubject },
                    sa,
                    'network.example'
                )
            ).rejects.toMatchObject({ kind: 'validation_error', retryable: false });
            expect(mocks.append).not.toHaveBeenCalled();
            expect(mocks.auth).not.toHaveBeenCalled();
            expect(mocks.fetch).not.toHaveBeenCalled();
        }
    );

    it('includes every subject and the delegated contract owner without changing SA ownership', async () => {
        mocks.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => jwe });
        await issueCredentialWithSigningAuthority(
            issuer,
            {
                ...credential,
                credentialSubject: [
                    { id: 'did:example:student' },
                    { id: 'did:example:second-student' },
                    { id: 'did:example:student' },
                ],
            },
            sa,
            'network.example',
            true,
            undefined,
            true,
            ['did:example:contract-owner', 'did:web:network.example:users:org']
        );
        const body = JSON.parse(mocks.fetch.mock.calls[0]![1].body);
        expect(body.signingAuthority.ownerDid).toBe('did:web:network.example:users:org');
        expect(body.encryption.recipients).toEqual([
            'did:example:student',
            'did:example:second-student',
            'did:web:network.example:users:org',
            'did:example:contract-owner',
        ]);
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

    it('keeps retry status metadata bound to the serialized request body', async () => {
        const status = {
            type: 'BitstringStatusListEntry' as const,
            statusPurpose: 'revocation' as const,
            statusListIndex: '42',
            statusListCredential: 'https://network.example/status/1',
        };
        const unsigned = { ...credential, credentialStatus: status };
        mocks.fetch
            .mockImplementationOnce(async () => {
                status.statusListIndex = '99';
                return {
                    ok: false,
                    status: 503,
                    statusText: 'Unavailable',
                    text: async () => 'retry',
                };
            })
            .mockResolvedValueOnce({ ok: true, status: 200, json: async () => jwe });
        const issued = await issueCredentialWithSigningAuthority(
            issuer,
            unsigned,
            sa,
            'network.example'
        );
        expect(mocks.append).toHaveBeenCalledTimes(1);
        expect(mocks.fetch).toHaveBeenCalledTimes(2);
        const bodies = mocks.fetch.mock.calls.map(call => JSON.parse(call[1].body));
        expect(bodies[0].credential).toEqual(bodies[1].credential);
        expect(issued.statusEntries).toEqual([bodies[1].credential.credentialStatus]);
        expect(issued.statusEntries[0]?.statusListIndex).toBe('42');
        expect(JSON.parse(JSON.stringify(issued)).credential).toEqual(jwe);
    });
});
