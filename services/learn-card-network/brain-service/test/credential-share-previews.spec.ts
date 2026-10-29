import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';

const owner = { profileId: 'owner-1', did: 'did:key:owner', displayName: 'Owner' };
const storage = vi.hoisted(() => ({
    create: vi.fn(
        async (ownerId: string, preview: { id?: string }): Promise<string | null> =>
            preview.id ?? '5b58ff0c-bb55-4f25-a2a5-b4de3778c649'
    ),
    get: vi.fn(async (_id: string, _shareUri: string) => null as unknown),
    delete: vi.fn(async (_ownerId: string, _id: string) => false),
}));
const sentry = vi.hoisted(() => ({
    trpcMiddleware: vi.fn(() => async (options: { next: () => unknown }) => options.next()),
    setUser: vi.fn(),
    configureScope: vi.fn(),
}));
vi.mock('@accesslayer/credential-share-previews', () => ({
    createCredentialSharePreview: storage.create,
    getCredentialSharePreview: storage.get,
    deleteCredentialSharePreview: storage.delete,
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
const id = '5b58ff0c-bb55-4f25-a2a5-b4de3778c649';
const shareUri = 'urn:encrypted:opaque';

describe('credential share previews route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        storage.get.mockResolvedValue(null);
        storage.delete.mockResolvedValue(false);
        storage.create.mockImplementation(async (_owner, preview) => preview.id ?? id);
    });

    it('requires authentication and rejects private fields in published metadata', async () => {
        const preview = {
            name: 'Badge',
            issuer: 'Issuer',
            image: 'https://cdn.example/badge.png',
            shareUri,
        };
        await expect(caller().publish(preview)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            caller(authenticated).publish({ ...preview, credential: { id: 'private' } } as never)
        ).rejects.toBeInstanceOf(TRPCError);
    });

    it('rejects unauthenticated deletion', async () => {
        await expect(caller().delete({ id })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('reports missing refreshes with the machine-readable recovery code', async () => {
        storage.create.mockResolvedValueOnce(null);
        await expect(
            caller(authenticated).publish({ id, name: 'Badge', issuer: 'Issuer', shareUri })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('fails closed if storage returns non-public fields', async () => {
        storage.get.mockResolvedValueOnce({
            name: 'Badge',
            issuer: 'Issuer',
            seed: 'must-never-be-returned',
            shareUri,
            ownerProfileId: owner.profileId,
            createdAt: new Date(0).toISOString(),
            updatedAt: new Date(0).toISOString(),
        });
        await expect(caller().get({ id, shareUri })).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
        });
    });

    it('requires both public lookup keys and reports missing previews', async () => {
        await expect(caller().get({ id } as never)).rejects.toBeInstanceOf(TRPCError);
        await expect(caller().get({ id: 'not-a-uuid', shareUri })).rejects.toBeInstanceOf(
            TRPCError
        );
        await expect(caller().get({ id, shareUri })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });
});
