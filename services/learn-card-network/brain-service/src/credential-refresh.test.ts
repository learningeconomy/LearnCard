import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getCredentialRefresh: vi.fn(),
    getCredentialRefreshCanonicalLifecycle: vi.fn(),
    getCredentialRefreshHead: vi.fn(),
    getCredentialRefreshHeadForHolder: vi.fn(),
    getCredentialRefreshVersionForHolder: vi.fn(),
    getCredentialRefreshVersionsForHolder: vi.fn(),
    setCredentialRefreshState: vi.fn(),
    issueCredentialRefreshChallenge: vi.fn(),
    verifyCredentialRefreshAuthorization: vi.fn(),
}));

vi.mock('@accesslayer/credential-refresh', () => ({
    getCredentialRefresh: mocks.getCredentialRefresh,
    getCredentialRefreshCanonicalLifecycle: mocks.getCredentialRefreshCanonicalLifecycle,
    getCredentialRefreshHead: mocks.getCredentialRefreshHead,
    getCredentialRefreshHeadForHolder: mocks.getCredentialRefreshHeadForHolder,
    getCredentialRefreshVersionForHolder: mocks.getCredentialRefreshVersionForHolder,
    getCredentialRefreshVersionsForHolder: mocks.getCredentialRefreshVersionsForHolder,
    getCredentialRefreshVersion: vi.fn(),
    getCredentialRefreshVersions: vi.fn(),
    setCredentialRefreshState: mocks.setCredentialRefreshState,
}));

vi.mock('@helpers/credential-refresh-auth.helpers', () => ({
    CREDENTIAL_REFRESH_AUTH_SCHEME: 'LearnCardDIDAuth',
    enforceCredentialRefreshHolderRateLimit: vi.fn(),
    enforceCredentialRefreshPreAuthRateLimit: vi.fn(),
    issueCredentialRefreshChallenge: mocks.issueCredentialRefreshChallenge,
    verifyCredentialRefreshAuthorization: mocks.verifyCredentialRefreshAuthorization,
}));

vi.mock('@helpers/credential-refresh-materiality.helpers', () => ({
    getCredentialRefreshDigestSecret: vi.fn(() => 'test-secret'),
}));

import { credentialRefreshFastifyPlugin } from './credential-refresh';

const previousEnabled = process.env.CREDENTIAL_REFRESH_ENABLED;
const previousDomain = process.env.DOMAIN_NAME;

afterEach(() => {
    mocks.getCredentialRefresh.mockReset();
    mocks.getCredentialRefreshCanonicalLifecycle.mockReset();
    mocks.getCredentialRefreshHead.mockReset();
    mocks.getCredentialRefreshHeadForHolder.mockReset();
    mocks.getCredentialRefreshVersionForHolder.mockReset();
    mocks.getCredentialRefreshVersionsForHolder.mockReset();
    mocks.setCredentialRefreshState.mockReset();
    mocks.issueCredentialRefreshChallenge.mockReset();
    mocks.verifyCredentialRefreshAuthorization.mockReset();
    mocks.verifyCredentialRefreshAuthorization.mockResolvedValue({
        authenticated: true,
        holderDid: 'did:key:holder',
    });

    if (previousEnabled === undefined) delete process.env.CREDENTIAL_REFRESH_ENABLED;
    else process.env.CREDENTIAL_REFRESH_ENABLED = previousEnabled;

    if (previousDomain === undefined) delete process.env.DOMAIN_NAME;
    else process.env.DOMAIN_NAME = previousDomain;
});

describe('credential refresh holder route security', () => {
    it('normalizes a did:web-encoded configured domain for the DID-auth challenge', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        process.env.DOMAIN_NAME = 'localhost%3a4000';
        mocks.verifyCredentialRefreshAuthorization.mockResolvedValue({ authenticated: false });
        mocks.issueCredentialRefreshChallenge.mockResolvedValue({
            challenge: 'challenge',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            domain: 'localhost:4000',
            scheme: 'LearnCardDIDAuth',
        });
        const app = Fastify();

        await app.register(credentialRefreshFastifyPlugin);

        const response = await app.inject({ method: 'GET', url: '/refresh/opaque-id' });

        expect(response.statusCode).toBe(401);
        expect(mocks.verifyCredentialRefreshAuthorization).toHaveBeenCalledWith(
            'opaque-id',
            undefined,
            'localhost:4000'
        );
        expect(mocks.issueCredentialRefreshChallenge).toHaveBeenCalledWith(
            'opaque-id',
            'localhost:4000'
        );

        await app.close();
    });

    it('does not register holder routes while credential refresh is disabled', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'false';
        const app = Fastify();

        await app.register(credentialRefreshFastifyPlugin);

        const response = await app.inject({ method: 'GET', url: '/refresh/opaque-id' });

        expect(response.statusCode).toBe(404);
        await app.close();
    });

    it('returns the same response for a missing refresh and a holder mismatch', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        const app = Fastify();

        await app.register(credentialRefreshFastifyPlugin);

        mocks.getCredentialRefresh.mockResolvedValueOnce(null).mockResolvedValueOnce({
            holderDid: 'did:key:different-holder',
        });

        const request = (refreshId: string) =>
            app.inject({
                method: 'GET',
                url: `/refresh/${refreshId}`,
                headers: { authorization: 'Bearer valid-did-auth' },
            });

        const missing = await request('missing');
        const wrongHolder = await request('existing');

        expect({ statusCode: missing.statusCode, body: missing.json() }).toEqual({
            statusCode: wrongHolder.statusCode,
            body: wrongHolder.json(),
        });
        expect(missing.statusCode).toBe(403);

        await app.close();
    });

    it('rechecks canonical revocation after a conditional awaiting-claim repair', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        const app = Fastify();

        await app.register(credentialRefreshFastifyPlugin);

        mocks.getCredentialRefresh.mockResolvedValue({
            refreshId: 'race',
            holderDid: 'did:key:holder',
            state: 'awaiting_claim',
        });
        mocks.getCredentialRefreshCanonicalLifecycle
            .mockResolvedValueOnce({ received: true, revoked: false })
            .mockResolvedValueOnce({ received: true, revoked: true });
        mocks.setCredentialRefreshState.mockResolvedValue(null);
        mocks.getCredentialRefreshHead.mockResolvedValue({
            credential: JSON.stringify({ protected: 'encrypted' }),
            version: 1,
        });

        const response = await app.inject({
            method: 'GET',
            url: '/refresh/race',
            headers: { authorization: 'Bearer valid-did-auth' },
        });

        expect(response.statusCode).toBe(410);
        expect(response.json()).toEqual({ code: 'CREDENTIAL_REVOKED' });
        expect(mocks.setCredentialRefreshState).toHaveBeenCalledWith(
            'race',
            'active',
            'awaiting_claim'
        );
        expect(mocks.getCredentialRefreshHead).not.toHaveBeenCalled();

        await app.close();
    });

    it('refuses current, history, and version payloads when revocation wins after auth', async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        const app = Fastify();

        await app.register(credentialRefreshFastifyPlugin);

        mocks.getCredentialRefresh.mockResolvedValue({
            refreshId: 'race',
            holderDid: 'did:key:holder',
            state: 'active',
        });
        mocks.getCredentialRefreshCanonicalLifecycle.mockResolvedValue({
            received: true,
            revoked: false,
        });
        mocks.getCredentialRefreshHeadForHolder.mockResolvedValue({ status: 'revoked' });
        mocks.getCredentialRefreshVersionsForHolder.mockResolvedValue({ status: 'revoked' });
        mocks.getCredentialRefreshVersionForHolder.mockResolvedValue({ status: 'revoked' });

        for (const url of ['/refresh/race', '/refresh/race/history', '/refresh/race/versions/1']) {
            const response = await app.inject({
                method: 'GET',
                url,
                headers: { authorization: 'Bearer valid-did-auth' },
            });

            expect(response.statusCode).toBe(410);
            expect(response.json()).toEqual({ code: 'CREDENTIAL_REVOKED' });
            expect(response.body).not.toContain('encrypted');
        }

        expect(mocks.getCredentialRefreshHeadForHolder).toHaveBeenCalledWith('race');
        expect(mocks.getCredentialRefreshVersionsForHolder).toHaveBeenCalledWith('race', {
            cursor: undefined,
            limit: undefined,
        });
        expect(mocks.getCredentialRefreshVersionForHolder).toHaveBeenCalledWith('race', 1);

        await app.close();
    });
});
