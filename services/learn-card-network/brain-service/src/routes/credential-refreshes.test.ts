import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

const PROFILE = {
    profileId: 'issuer-profile',
    did: 'did:key:issuer',
    displayName: 'Issuer',
};

const mocks = vi.hoisted(() => ({
    sendRefreshableCredential: vi.fn(),
    isRelationshipBlocked: vi.fn(),
    ensureCredentialRefreshConstraints: vi.fn(() => Promise.resolve()),
}));

vi.mock('@accesslayer/profile/read', () => ({
    getProfileByDid: vi.fn(async () => PROFILE),
    getProfileByProfileId: vi.fn(),
}));

vi.mock('@helpers/credential-refresh.helpers', () => ({
    allocateCredentialRefresh: vi.fn(() => {
        throw new Error('disabled route reached allocation');
    }),
    publishCredentialRefresh: vi.fn(() => {
        throw new Error('disabled route reached publication');
    }),
    sendRefreshableCredential: mocks.sendRefreshableCredential,
}));

vi.mock('@helpers/connection.helpers', () => ({
    isRelationshipBlocked: mocks.isRelationshipBlocked,
}));

vi.mock('../models/credential-refresh-constraints', () => ({
    ensureCredentialRefreshConstraints: mocks.ensureCredentialRefreshConstraints,
}));

import { credentialRefreshesRouter } from './credential-refreshes';

const SIGNED_CREDENTIAL = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:key:issuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:key:holder' },
    proof: {
        type: 'DataIntegrityProof',
        created: '2026-01-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:key:issuer#key-1',
    },
};

const previousEnabled = process.env.CREDENTIAL_REFRESH_ENABLED;

beforeEach(() => {
    mocks.ensureCredentialRefreshConstraints.mockReset();
    mocks.ensureCredentialRefreshConstraints.mockResolvedValue(undefined);
});

afterEach(() => {
    mocks.sendRefreshableCredential.mockReset();
    mocks.isRelationshipBlocked.mockReset();
    mocks.ensureCredentialRefreshConstraints.mockReset();

    if (previousEnabled === undefined) delete process.env.CREDENTIAL_REFRESH_ENABLED;
    else process.env.CREDENTIAL_REFRESH_ENABLED = previousEnabled;
});

describe('credential refresh issuer route gating', () => {
    it('rejects allocation, send, and publication while the feature is disabled', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'false';

        const caller = credentialRefreshesRouter.createCaller({
            domain: 'network.example.com',
            tenant: { id: 'default' },
            user: {
                did: PROFILE.did,
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
            },
        } as never);

        await expect(
            caller.allocateCredentialRefresh({
                holder: { did: 'did:key:holder' },
                credentialId: 'urn:uuid:credential',
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        await expect(
            caller.sendRefreshableCredential({
                refreshId: 'opaque-refresh-id',
                credential: SIGNED_CREDENTIAL,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        await expect(
            caller.publishCredentialRefresh({
                mode: 'issuer-signed',
                refreshId: 'opaque-refresh-id',
                signedCredential: SIGNED_CREDENTIAL,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        expect(mocks.ensureCredentialRefreshConstraints).not.toHaveBeenCalled();
    });

    it('waits for refresh constraints before handling an enabled route', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        let markConstraintsReady!: () => void;
        mocks.ensureCredentialRefreshConstraints.mockReturnValueOnce(
            new Promise<void>(resolve => {
                markConstraintsReady = resolve;
            })
        );
        mocks.sendRefreshableCredential.mockResolvedValue('lc:network:credential:root');

        const caller = credentialRefreshesRouter.createCaller({
            domain: 'network.example.com',
            tenant: { id: 'default' },
            user: {
                did: PROFILE.did,
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
            },
        } as never);

        const result = caller.sendRefreshableCredential({
            refreshId: 'opaque-refresh-id',
            credential: SIGNED_CREDENTIAL,
        });

        await vi.waitFor(() => {
            expect(mocks.ensureCredentialRefreshConstraints).toHaveBeenCalledOnce();
        });
        expect(mocks.sendRefreshableCredential).not.toHaveBeenCalled();

        markConstraintsReady();

        await expect(result).resolves.toBe('lc:network:credential:root');
        expect(mocks.sendRefreshableCredential).toHaveBeenCalledOnce();
    });

    it('fails closed when refresh constraints cannot be ensured', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        const setupFailure = new Error('constraint setup failed');
        mocks.ensureCredentialRefreshConstraints.mockRejectedValueOnce(setupFailure);

        const caller = credentialRefreshesRouter.createCaller({
            domain: 'network.example.com',
            tenant: { id: 'default' },
            user: {
                did: PROFILE.did,
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
            },
        } as never);

        await expect(
            caller.sendRefreshableCredential({
                refreshId: 'opaque-refresh-id',
                credential: SIGNED_CREDENTIAL,
            })
        ).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
            message: setupFailure.message,
        });

        expect(mocks.sendRefreshableCredential).not.toHaveBeenCalled();
    });

    it('forwards initial notification suppression to managed delivery', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        mocks.sendRefreshableCredential.mockResolvedValue('lc:network:credential:root');

        const caller = credentialRefreshesRouter.createCaller({
            domain: 'network.example.com',
            tenant: { id: 'default' },
            user: {
                did: PROFILE.did,
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
            },
        } as never);

        await expect(
            caller.sendRefreshableCredential({
                refreshId: 'opaque-refresh-id',
                credential: SIGNED_CREDENTIAL,
                skipNotification: true,
            })
        ).resolves.toBe('lc:network:credential:root');

        expect(mocks.sendRefreshableCredential).toHaveBeenCalledWith({
            issuerProfile: PROFILE,
            refreshId: 'opaque-refresh-id',
            credential: SIGNED_CREDENTIAL,
            boostUri: undefined,
            skipNotification: true,
            domain: 'network.example.com',
        });
    });

    it('hides a blocked holder during allocation', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        mocks.isRelationshipBlocked.mockResolvedValue(true);

        const caller = credentialRefreshesRouter.createCaller({
            domain: 'network.example.com',
            tenant: { id: 'default' },
            user: {
                did: PROFILE.did,
                isChallengeValid: true,
                scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
            },
        } as never);

        await expect(
            caller.allocateCredentialRefresh({
                holder: { did: 'did:key:holder' },
                credentialId: 'urn:uuid:credential',
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
});
