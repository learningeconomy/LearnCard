import { ObjectId } from 'mongodb';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    find: vi.fn(),
    countDocuments: vi.fn().mockResolvedValue(0),
    findUsers: vi.fn(),
    findSubject: vi.fn(),
}));
vi.mock('../src/mongo', () => ({ client: { close: vi.fn() } }));
vi.mock('../src/models/UserKey', () => ({ getUserKeysCollection: () => mocks }));
vi.mock('../src/models/AuthSubject', () => ({
    getAuthSubjectsCollection: () => ({ findOne: mocks.findSubject }),
    getOrCreateAuthSubject: vi.fn(),
}));
vi.mock('../scripts/keycloak-admin', () => ({
    createKeycloakAdmin: async () => ({ findUsers: mocks.findUsers }),
}));
import { provisionKeycloakUsers } from '../scripts/provision-keycloak-users';

afterEach((): void => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe('provisioning resume', (): void => {
    it('uses an exclusive ObjectId cursor and cheaply skips mapped records', async (): Promise<void> => {
        const ids = [1, 2, 3].map(value => new ObjectId(value.toString().padStart(24, '0')));
        const output = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
        const sort = vi.fn();
        mocks.find.mockImplementation((filter: { _id: { $gt: ObjectId } }) => {
            const rows = ids.filter(id => id.toHexString() > filter._id.$gt.toHexString());
            sort.mockReturnValue({
                async *[Symbol.asyncIterator]() {
                    for (const _id of rows)
                        yield { _id, authProviders: [{ type: 'keycloak', id: 'mapped' }] };
                },
            });
            return { sort };
        });
        const summary = await provisionKeycloakUsers({ after: ids[1]!.toHexString() });
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
                    yield { _id: id, authProviders: [{ type: 'keycloak', id: 'mapped' }] };
                    throw new Error('connection lost');
                },
            }),
        });
        await expect(provisionKeycloakUsers()).rejects.toThrow('connection lost');
        expect(output).toHaveBeenCalledWith(expect.stringContaining(`--after ${id.toHexString()}`));
    });
});
