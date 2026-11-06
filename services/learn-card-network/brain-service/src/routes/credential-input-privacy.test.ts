import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveTenantFromRequest } from '@learncard/email-templates';
import type {
    PrepareRefreshableSendInput,
    SendBoostInput,
    PublishCredentialRefreshInput,
} from '@learncard/types';

const transport = vi.hoisted(() => ({ send: vi.fn(), lookup: vi.fn() }));
vi.mock('@sentry/serverless', () => ({
    Handlers: {
        trpcMiddleware:
            ({ attachRpcInput }: { attachRpcInput: boolean }) =>
            async (opts: { next: () => Promise<unknown>; getRawInput: () => Promise<unknown> }) => {
                const input = attachRpcInput ? await opts.getRawInput() : undefined;
                try {
                    return await opts.next();
                } finally {
                    transport.send({ input });
                }
            },
    },
    configureScope: vi.fn(),
    setUser: vi.fn(),
}));
vi.mock('@accesslayer/profile/read', () => ({
    getProfileByDid: transport.lookup,
    getProfileByProfileId: transport.lookup,
}));
vi.mock('../models/credential-refresh-constraints', () => ({
    ensureCredentialRefreshConstraints: vi.fn(),
}));

import { boostsRouter } from './boosts';
import { credentialRefreshesRouter } from './credential-refreshes';
import type { Context } from './index';

describe('credential route input telemetry', () => {
    beforeEach(() => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        transport.send.mockClear();
        transport.lookup.mockResolvedValue({ profileId: 'issuer', did: 'did:key:issuer' });
    });

    it.each(['prepare', 'send', 'publish'] as const)(
        '%s never captures malformed, unauthenticated or failing request input',
        async route => {
            const privateInput = {
                recipient: 42,
                signedCredential: 'PRIVATE CLAIM',
                templateData: { private: 'PRIVATE CLAIM' },
            };
            const invoke = (ctx: Context): Promise<unknown> => {
                if (route === 'prepare')
                    return boostsRouter
                        .createCaller(ctx)
                        .prepareRefreshableSend(
                            privateInput as unknown as PrepareRefreshableSendInput
                        );
                if (route === 'send')
                    return boostsRouter
                        .createCaller(ctx)
                        .send(privateInput as unknown as SendBoostInput);
                return credentialRefreshesRouter
                    .createCaller(ctx)
                    .publishCredentialRefresh(
                        privateInput as unknown as PublishCredentialRefreshInput
                    );
            };
            const authenticated: Context = {
                domain: 'example.com',
                tenant: resolveTenantFromRequest({}),
                user: { did: 'did:key:issuer', isChallengeValid: true, scope: '*:*' },
            };
            await expect(invoke(authenticated)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            await expect(
                invoke({ domain: 'example.com', tenant: resolveTenantFromRequest({}) })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            transport.lookup.mockRejectedValueOnce(new Error('LOOKUP_FAILED'));
            await expect(invoke(authenticated)).rejects.toThrow('LOOKUP_FAILED');
            expect(transport.send).toHaveBeenCalledTimes(3);
            expect(transport.send.mock.calls).toEqual([
                [{ input: undefined }],
                [{ input: undefined }],
                [{ input: undefined }],
            ]);
            expect(JSON.stringify(transport.send.mock.calls)).not.toContain('PRIVATE CLAIM');
        }
    );
});
