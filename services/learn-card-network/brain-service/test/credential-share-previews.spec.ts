import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';

const owner = { profileId: 'owner-1', did: 'did:key:owner', displayName: 'Owner' };
const storage = vi.hoisted(() => ({
    create: vi.fn(async (_id: string, _preview: unknown) => undefined),
    get: vi.fn(async (_id: string) => null as unknown),
}));
const sentry = vi.hoisted(() => ({
    trpcMiddleware: vi.fn(() => async (options: { next: () => unknown }) => options.next()),
    setUser: vi.fn(),
    configureScope: vi.fn(),
}));
vi.mock('@accesslayer/credential-share-previews', () => ({
    createCredentialSharePreview: storage.create,
    getCredentialSharePreview: storage.get,
}));
vi.mock('@accesslayer/profile/read', () => ({ getProfileByDid: vi.fn(async () => owner) }));
vi.mock('@sentry/serverless', () => ({
    Handlers: { trpcMiddleware: sentry.trpcMiddleware },
    setUser: sentry.setUser,
    configureScope: sentry.configureScope,
}));
import { credentialSharePreviewsRouter } from '../src/routes/credential-share-previews';

const caller = (user?: { did: string; isChallengeValid: boolean }) =>
    credentialSharePreviewsRouter.createCaller({
        domain: 'network.example.com',
        tenant: { id: 'default' },
        ...(user ? { user } : {}),
    } as never);
const authenticated = { did: owner.did, isChallengeValid: true };

describe('credential share previews route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        storage.get.mockResolvedValue(null);
    });

    it('requires authenticated profile for publishing and stores only allowed metadata', async () => {
        await expect(caller().publish({ name: 'Badge', issuer: 'Issuer' })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        const id = await caller(authenticated).publish({
            name: 'Badge',
            issuer: 'Issuer',
            image: 'https://cdn.example/badge.png',
        });
        expect(id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(storage.create).toHaveBeenCalledWith(id, {
            name: 'Badge',
            issuer: 'Issuer',
            image: 'https://cdn.example/badge.png',
        });
        await expect(
            caller(authenticated).publish({
                name: 'Badge',
                issuer: 'Issuer',
                credential: { id: 'private' },
            } as never)
        ).rejects.toBeInstanceOf(TRPCError);
    });

    it('returns only public fields and reports missing identifiers as not found', async () => {
        storage.get.mockResolvedValueOnce({
            name: 'Badge',
            issuer: 'Issuer',
            image: 'https://cdn.example/badge.png',
        });
        await expect(caller().get({ id: '5b58ff0c-bb55-4f25-a2a5-b4de3778c649' })).resolves.toEqual(
            { name: 'Badge', issuer: 'Issuer', image: 'https://cdn.example/badge.png' }
        );
        expect(storage.get).toHaveBeenCalledWith('5b58ff0c-bb55-4f25-a2a5-b4de3778c649');
        storage.get.mockResolvedValueOnce({
            name: 'Badge',
            issuer: 'Issuer',
            seed: 'must never be public',
        });
        await expect(
            caller().get({ id: '5b58ff0c-bb55-4f25-a2a5-b4de3778c649' })
        ).rejects.toBeInstanceOf(TRPCError);
        await expect(
            caller().get({ id: '5b58ff0c-bb55-4f25-a2a5-b4de3778c649' })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(caller().get({ id: 'not-a-uuid' })).rejects.toBeInstanceOf(TRPCError);
    });
});
