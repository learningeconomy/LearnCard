import { describe, expect, it, vi } from 'vitest';
import {
    deleteUsersInBatches,
    findRunUsers,
    runEmailMatcher,
    syntheticEmail,
    type AdminAuth,
} from './identity';

const address = { prefix: 'escrow-load', runId: 'a1b2c3d4', domain: 'inbox.example.org' };

describe('synthetic addresses', () => {
    it('builds <prefix>+<runId>-<n>@<domain>', () => {
        expect(syntheticEmail(address, 0)).toBe('escrow-load+a1b2c3d4-0@inbox.example.org');
        expect(syntheticEmail(address, 1234)).toBe('escrow-load+a1b2c3d4-1234@inbox.example.org');
        expect(() => syntheticEmail(address, -1)).toThrow();
        expect(() => syntheticEmail({ ...address, prefix: 'a+b' }, 1)).toThrow();
    });
    it('matches only this run', () => {
        const matches = runEmailMatcher(address);
        expect(matches('escrow-load+a1b2c3d4-7@inbox.example.org')).toBe(true);
        expect(matches('ESCROW-LOAD+A1B2C3D4-7@INBOX.EXAMPLE.ORG')).toBe(true);
        for (const other of [
            undefined,
            '',
            'escrow-load+a1b2c3d5-7@inbox.example.org',
            'escrow-load+a1b2c3d4-7@inbox.example.org.evil.test',
            'escrow-load+a1b2c3d4-7@inboxxexample.org',
            'xescrow-load+a1b2c3d4-7@inbox.example.org',
            'escrow-load+a1b2c3d4-@inbox.example.org',
            'escrow-load+a1b2c3d4-7x@inbox.example.org',
            'escrow-load+canary1@inbox.example.org',
            'person@inbox.example.org',
        ])
            expect(matches(other)).toBe(false);
    });
});

describe('Firebase cleanup helpers', () => {
    it('pages through all users and keeps only matches', async () => {
        const pages: Record<
            string,
            { users: { uid: string; email?: string }[]; pageToken?: string }
        > = {
            first: {
                users: [
                    { uid: 'u1', email: syntheticEmail(address, 1) },
                    { uid: 'u2', email: 'person@example.org' },
                    { uid: 'u3' },
                ],
                pageToken: 'p2',
            },
            p2: { users: [{ uid: 'u4', email: syntheticEmail(address, 2) }] },
        };
        const listUsers = vi.fn<AdminAuth['listUsers']>(
            async (_max, token) => pages[token ?? 'first']
        );
        expect(await findRunUsers({ listUsers }, runEmailMatcher(address))).toEqual(['u1', 'u4']);
        expect(listUsers.mock.calls).toEqual([
            [1000, undefined],
            [1000, 'p2'],
        ]);
    });
    it('stops on a runaway page loop', async () => {
        const listUsers = async () => ({ users: [], pageToken: 'again' });
        await expect(findRunUsers({ listUsers }, () => true, 3)).rejects.toThrow('Too many');
    });
    it('deletes in batches of at most 1000', async () => {
        const deleteUsers = vi.fn<AdminAuth['deleteUsers']>(async uids => ({
            successCount: uids.length - 1,
            failureCount: 1,
        }));
        const uids = Array.from({ length: 2500 }, (_, i) => `u${i}`);
        expect(await deleteUsersInBatches({ deleteUsers }, uids)).toEqual({
            deleted: 2497,
            failed: 3,
        });
        expect(deleteUsers.mock.calls.map(([batch]) => batch.length)).toEqual([1000, 1000, 500]);
    });
});
