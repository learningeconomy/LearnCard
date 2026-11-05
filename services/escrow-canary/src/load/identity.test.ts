import { describe, expect, it, vi } from 'vitest';
import { cleanupRunUsers, runEmailMatcher, syntheticEmail, type AdminAuth } from './identity';

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

describe('cleanupRunUsers (manifest-driven, no scanning)', () => {
    const fake = (live: Map<string, string | undefined>, failDelete = new Set<string>()) => {
        const getUsers = vi.fn<AdminAuth['getUsers']>(async identifiers => ({
            users: identifiers
                .filter(({ uid }) => live.has(uid))
                .map(({ uid }) => ({ uid, email: live.get(uid) })),
        }));
        const deleteUsers = vi.fn<AdminAuth['deleteUsers']>(async uids => {
            const errors = uids.flatMap((uid, index) => (failDelete.has(uid) ? [{ index }] : []));
            for (const uid of uids) if (!failDelete.has(uid)) live.delete(uid);
            return {
                successCount: uids.length - errors.length,
                failureCount: errors.length,
                errors,
            };
        });
        return { getUsers, deleteUsers };
    };
    const manifestUsers = (count: number) =>
        Array.from({ length: count }, (_, n) => ({
            uid: `u${n}`,
            email: syntheticEmail(address, n),
        }));

    it('deletes only users whose current email is still the recorded run address', async () => {
        const users = manifestUsers(5);
        const live = new Map<string, string | undefined>([
            ['u0', users[0].email],
            ['u1', 'person@example.org'], // changed since the run
            ['u2', undefined], // email removed
            ['u3', syntheticEmail(address, 9)], // another address of this run
            // u4 already gone
        ]);
        const auth = fake(live);
        const records: [string, string[]][] = [];
        const counts = await cleanupRunUsers(auth, {
            address,
            users,
            done: new Set(),
            dryRun: false,
            record: (outcome, uids) => records.push([outcome, uids]),
        });
        expect(counts).toEqual({
            listed: 5,
            previouslyDone: 0,
            deleted: 1,
            alreadyGone: 1,
            skippedMismatch: 3,
            failed: 0,
            wouldDelete: 0,
        });
        expect(auth.deleteUsers.mock.calls).toEqual([[['u0']]]);
        expect(records).toEqual([
            ['gone', ['u4']],
            ['deleted', ['u0']],
        ]);
    });
    it('looks users up in batches of at most 100 and is idempotent', async () => {
        const users = manifestUsers(250);
        const live = new Map(users.map(user => [user.uid, user.email as string | undefined]));
        const auth = fake(live, new Set(['u7']));
        const done = new Set<string>();
        const input = {
            address,
            users,
            done,
            dryRun: false,
            record: (_outcome: string, uids: string[]) => uids.forEach(uid => done.add(uid)),
        };
        const first = await cleanupRunUsers(auth, input);
        expect(first).toMatchObject({ deleted: 249, failed: 1, alreadyGone: 0 });
        expect(auth.getUsers.mock.calls.map(([batch]) => batch.length)).toEqual([100, 100, 50]);
        expect(auth.deleteUsers.mock.calls.map(([batch]) => batch.length)).toEqual([100, 100, 50]);
        // Re-run (e.g. after a crash): finished uids are skipped, the failure is retried.
        auth.getUsers.mockClear();
        const second = await cleanupRunUsers(
            { ...auth, deleteUsers: fake(live).deleteUsers },
            input
        );
        expect(second).toMatchObject({ previouslyDone: 249, deleted: 1, failed: 0 });
        expect(auth.getUsers.mock.calls).toEqual([[[{ uid: 'u7' }]]]);
        // Without progress records, everything reads as already gone.
        const third = await cleanupRunUsers(auth, { ...input, done: new Set() });
        expect(third).toMatchObject({ alreadyGone: 250, deleted: 0 });
    });
    it('a dry run looks up but neither deletes nor records', async () => {
        const users = manifestUsers(3);
        const live = new Map(users.map(user => [user.uid, user.email as string | undefined]));
        const auth = fake(live);
        const record = vi.fn();
        const counts = await cleanupRunUsers(auth, {
            address,
            users,
            done: new Set(),
            dryRun: true,
            record,
        });
        expect(counts).toMatchObject({ wouldDelete: 3, deleted: 0 });
        expect(auth.deleteUsers).not.toHaveBeenCalled();
        expect(record).not.toHaveBeenCalled();
    });
});
