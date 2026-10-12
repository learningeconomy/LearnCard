import { ObjectId } from 'mongodb';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    find: vi.fn(),
    countDocuments: vi.fn().mockResolvedValue(0),
    findUsers: vi.fn(),
    findSubject: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
    createSubject: vi.fn(),
    closeCursor: vi.fn(),
}));
vi.mock('../src/mongo', () => ({ client: { close: vi.fn() } }));
vi.mock('../src/models/UserKey', () => ({ getUserKeysCollection: () => mocks }));
vi.mock('../src/models/AuthSubject', () => ({
    getAuthSubjectsCollection: () => ({ findOne: mocks.findSubject }),
    getOrCreateAuthSubject: mocks.createSubject,
}));
vi.mock('../scripts/keycloak-admin', async importOriginal => ({
    ...(await importOriginal<typeof import('../scripts/keycloak-admin')>()),
    createKeycloakAdmin: async () => ({ findUsers: mocks.findUsers }),
}));
import { provisionKeycloakUsers } from '../scripts/provision-keycloak-users';
import { KeycloakAdminError, type createKeycloakAdmin } from '../scripts/keycloak-admin';
import type { FirebaseReader } from '../scripts/keycloak-provider-links';

afterEach((): void => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    mocks.countDocuments.mockResolvedValue(0);
});

const setupUser = (
    mapped: boolean
): {
    admin: Awaited<ReturnType<typeof createKeycloakAdmin>>;
    firebase: FirebaseReader;
} => {
    const row = {
        _id: new ObjectId(),
        contactMethod: { type: 'email', value: 'person@example.com' },
        authProviders: [
            { type: 'firebase', id: 'firebase-uid' },
            ...(mapped ? [{ type: 'keycloak', id: 'keycloak-id' }] : []),
        ],
    };
    mocks.find.mockReturnValue({
        sort: (): AsyncIterable<typeof row> => ({
            [Symbol.asyncIterator]: (): AsyncIterator<typeof row> => {
                let done = false;
                return {
                    return: mocks.closeCursor.mockResolvedValue({ done: true, value: undefined }),
                    next: async (): Promise<IteratorResult<typeof row>> => {
                        if (done) return { done: true, value: undefined };
                        done = true;
                        return { done: false, value: row };
                    },
                };
            },
        }),
    });
    mocks.countDocuments.mockResolvedValueOnce(1).mockResolvedValue(0);
    mocks.findOne.mockResolvedValue(null);
    mocks.findSubject.mockResolvedValue({ subject: 'subject-id' });
    mocks.updateOne.mockResolvedValue({ modifiedCount: 1 });
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    return {
        admin: {
            findUsers: vi.fn().mockResolvedValue([
                {
                    id: 'keycloak-id',
                    email: 'person@example.com',
                    emailVerified: true,
                    enabled: true,
                },
            ]),
            links: vi
                .fn()
                .mockResolvedValue([
                    { identityProvider: 'lca-api', userId: 'subject-id', userName: 'subject-id' },
                ]),
            request: vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
        },
        firebase: {
            getUsers: vi.fn().mockResolvedValue({
                users: [
                    {
                        uid: 'firebase-uid',
                        email: 'person@example.com',
                        disabled: false,
                        emailVerified: true,
                        providerData: [
                            { providerId: 'google.com', uid: 'google-sub' },
                            { providerId: 'apple.com', uid: 'apple-sub' },
                        ],
                    },
                ],
            }),
        },
    };
};

describe('provisioning social providers', (): void => {
    it.each(['google', 'apple'])(
        'refuses a conflicting %s link before any Mongo or Keycloak write',
        async alias => {
            const dependencies = setupUser(false);
            mocks.findSubject.mockResolvedValue(null);
            vi.mocked(dependencies.admin.links).mockResolvedValue([
                { identityProvider: alias, userId: 'other-subject', userName: 'other' },
            ]);
            expect(await provisionKeycloakUsers({ apply: true }, dependencies)).toMatchObject({
                refused: 1,
                conflicts: 1,
                linked: 0,
                mapped: 0,
            });
            expect(dependencies.admin.request).not.toHaveBeenCalled();
            expect(mocks.createSubject).not.toHaveBeenCalled();
            expect(mocks.updateOne).not.toHaveBeenCalled();
        }
    );
    it.each([
        { disabled: true, emailVerified: true, email: 'person@example.com' },
        { disabled: false, emailVerified: false, email: 'person@example.com' },
        { disabled: false, emailVerified: true, email: 'other@example.com' },
    ])('refuses unsafe Firebase ownership: %j', async (attributes): Promise<void> => {
        const dependencies = setupUser(false);
        vi.mocked(dependencies.firebase.getUsers).mockResolvedValueOnce({
            users: [{ uid: 'firebase-uid', providerData: [], ...attributes }],
        });
        expect(await provisionKeycloakUsers({ apply: true }, dependencies)).toMatchObject({
            refused: 1,
            linked: 0,
        });
        expect(dependencies.admin.request).not.toHaveBeenCalled();
        expect(mocks.createSubject).not.toHaveBeenCalled();
        expect(mocks.updateOne).not.toHaveBeenCalled();
    });

    it('closes the cursor when Firebase discovery fails without advancing the checkpoint', async (): Promise<void> => {
        const dependencies = setupUser(true);
        vi.mocked(dependencies.firebase.getUsers).mockRejectedValueOnce(
            new Error('discovery failed')
        );
        await expect(provisionKeycloakUsers({ apply: true }, dependencies)).rejects.toThrow(
            'discovery failed'
        );
        expect(mocks.closeCursor).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
            expect.stringContaining('Last processed id: (none)')
        );
    });

    it('reports a successful Google link when Apple fails and closes the cursor', async (): Promise<void> => {
        const dependencies = setupUser(true);
        vi.mocked(dependencies.admin.request)
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockRejectedValueOnce(new KeycloakAdminError(503));
        await expect(provisionKeycloakUsers({ apply: true }, dependencies)).rejects.toThrow('503');
        expect(mocks.closeCursor).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining('"linked":1'));
        expect(process.stdout.write).toHaveBeenCalledWith(
            expect.stringContaining('Last processed id: (none)')
        );
    });

    it('reports conflicts in the provisioning summary and continues to the other provider', async (): Promise<void> => {
        const dependencies = setupUser(true);
        vi.mocked(dependencies.admin.request).mockRejectedValueOnce(new KeycloakAdminError(409));
        expect(await provisionKeycloakUsers({ apply: true }, dependencies)).toMatchObject({
            conflicts: 1,
            linked: 1,
        });
        expect(mocks.updateOne).not.toHaveBeenCalled();
    });

    it('dry-runs mapped users without writes', async (): Promise<void> => {
        const dependencies = setupUser(true);
        expect(await provisionKeycloakUsers({}, dependencies)).toMatchObject({
            wouldLink: 2,
            linked: 0,
        });
        expect(dependencies.admin.request).not.toHaveBeenCalled();
        expect(mocks.updateOne).not.toHaveBeenCalled();
        expect(mocks.createSubject).not.toHaveBeenCalled();
    });
    it('pre-links already mapped users without rewriting mappings or subjects', async (): Promise<void> => {
        const dependencies = setupUser(true);
        const result = await provisionKeycloakUsers({ apply: true }, dependencies);
        expect(result).toMatchObject({ processed: 1, linked: 2, mapped: 0, skipped: 0 });
        expect(dependencies.firebase.getUsers).toHaveBeenCalledExactlyOnceWith([
            { uid: 'firebase-uid' },
        ]);
        expect(mocks.updateOne).not.toHaveBeenCalled();
        expect(mocks.createSubject).not.toHaveBeenCalled();
    });

    it('creates a new user, subject and mapping then links both providers', async (): Promise<void> => {
        const dependencies = setupUser(false);
        vi.mocked(dependencies.admin.findUsers).mockResolvedValueOnce([]);
        mocks.findSubject.mockResolvedValueOnce(null);
        mocks.createSubject.mockResolvedValueOnce({ subject: 'subject-id' });
        const result = await provisionKeycloakUsers({ apply: true }, dependencies);
        expect(result).toMatchObject({ mapped: 1, linked: 2 });
        expect(dependencies.admin.request).toHaveBeenCalledWith(
            '/users',
            expect.objectContaining({ method: 'POST' })
        );
        expect(dependencies.admin.request).toHaveBeenCalledWith(
            '/users/keycloak-id/federated-identity/lca-api',
            expect.objectContaining({ method: 'POST' })
        );
        expect(mocks.updateOne).toHaveBeenCalledTimes(1);
    });

    it('dry-run discovers providers but never writes Keycloak or Mongo resources', async (): Promise<void> => {
        const dependencies = setupUser(false);
        vi.mocked(dependencies.admin.findUsers).mockResolvedValueOnce([]);
        mocks.findSubject.mockResolvedValueOnce(null);
        const result = await provisionKeycloakUsers({}, dependencies);
        expect(result).toMatchObject({ linked: 0, wouldLink: 2, mapped: 0 });
        expect(dependencies.admin.request).not.toHaveBeenCalled();
        expect(mocks.createSubject).not.toHaveBeenCalled();
        expect(mocks.updateOne).not.toHaveBeenCalled();
    });

    it('refuses a missing Firebase UID rather than reporting no social provider', async (): Promise<void> => {
        const dependencies = setupUser(true);
        vi.mocked(dependencies.firebase.getUsers).mockResolvedValueOnce({ users: [] });
        const result = await provisionKeycloakUsers({ apply: true }, dependencies);
        expect(result).toMatchObject({ refused: 1, noSocialProvider: 0, linked: 0 });
        expect(dependencies.admin.request).not.toHaveBeenCalled();
    });

    it('refuses a mapped Keycloak ID different from the email match', async (): Promise<void> => {
        const dependencies = setupUser(true);
        vi.mocked(dependencies.admin.findUsers).mockResolvedValueOnce([
            { id: 'other-id', email: 'person@example.com', emailVerified: true, enabled: true },
        ]);
        expect(await provisionKeycloakUsers({ apply: true }, dependencies)).toMatchObject({
            refused: 1,
            linked: 0,
        });
        expect(dependencies.admin.request).not.toHaveBeenCalled();
    });
});

describe('provisioning resume', (): void => {
    const skippedRow = {
        contactMethod: { type: 'phone', value: '+15555550100' },
        authProviders: [{ type: 'firebase', id: 'firebase-id' }],
    };

    it('uses an exclusive ObjectId cursor', async (): Promise<void> => {
        const ids = [1, 2, 3].map(value => new ObjectId(value.toString().padStart(24, '0')));
        const output = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
        const sort = vi.fn();
        mocks.find.mockImplementation((filter: { _id: { $gt: ObjectId } }) => {
            const rows = ids.filter(id => id.toHexString() > filter._id.$gt.toHexString());
            sort.mockReturnValue({
                async *[Symbol.asyncIterator]() {
                    for (const _id of rows) yield { _id, ...skippedRow };
                },
            });
            return { sort };
        });
        const summary = await provisionKeycloakUsers({
            after: ids[1]!.toHexString(),
            linkProviders: false,
        });
        expect(sort).toHaveBeenCalledWith({ _id: 1 });
        expect(summary.processed).toBe(1);
        expect(summary.skipped).toBe(1);
        expect(mocks.findUsers).not.toHaveBeenCalled();
        expect(mocks.findSubject).not.toHaveBeenCalled();
        expect(output).toHaveBeenCalledWith(
            expect.stringContaining(`--after ${ids[2]!.toHexString()}`)
        );
    });

    it('reports only the completed cursor on failure', async (): Promise<void> => {
        const id = new ObjectId();
        const output = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
        mocks.find.mockReturnValue({
            sort: () => ({
                async *[Symbol.asyncIterator]() {
                    yield { _id: id, ...skippedRow };
                    throw new Error('connection lost');
                },
            }),
        });
        await expect(provisionKeycloakUsers({ linkProviders: false })).rejects.toThrow(
            'connection lost'
        );
        expect(output).toHaveBeenCalledWith(expect.stringContaining(`--after ${id.toHexString()}`));
    });
});
