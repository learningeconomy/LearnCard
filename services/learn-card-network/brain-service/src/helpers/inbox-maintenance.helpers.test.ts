import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    run,
    expireInboxCredentials,
    deleteExpiredInboxCredentials,
    wipeExpiredInboxDeliveries,
    encryptInboxCredential,
} = vi.hoisted(() => ({
    run: vi.fn(),
    expireInboxCredentials: vi.fn(),
    deleteExpiredInboxCredentials: vi.fn(),
    wipeExpiredInboxDeliveries: vi.fn(),
    encryptInboxCredential: vi.fn(),
}));

vi.mock('neogma', () => ({
    BindParam: class BindParam {},
    QueryBuilder: class QueryBuilder {
        match = (): this => this;
        where = (): this => this;
        return = (): this => this;
        limit = (): this => this;
        orderBy = (): this => this;
        set = (): this => this;
        remove = (): this => this;
        with = (): this => this;
        run = run;
    },
    QueryRunner: {
        getResultProperties: (result: { properties?: unknown[] }) => result.properties ?? [],
    },
}));
vi.mock('@environment', () => ({ environment: { INBOX_DELETE_EXPIRED_RECORDS: false } }));
vi.mock('@models', () => ({ InboxCredential: {} }));
vi.mock('@accesslayer/inbox-credential/update', () => ({
    expireInboxCredentials,
    wipeExpiredInboxDeliveries,
}));
vi.mock('@accesslayer/inbox-credential/delete', () => ({ deleteExpiredInboxCredentials }));
vi.mock('@helpers/inbox-encryption.helpers', () => ({
    encryptInboxCredential,
    INBOX_JWE_PREFIX: 'lc-inbox-jwe:v1:',
}));

import { migrateLegacyInboxCredentials, runInboxMaintenance } from './inbox-maintenance.helpers';

describe('Universal Inbox maintenance', () => {
    beforeEach(() => {
        run.mockReset().mockResolvedValue({ records: [] });
        expireInboxCredentials.mockReset().mockResolvedValue(3);
        deleteExpiredInboxCredentials.mockReset().mockResolvedValue(2);
        wipeExpiredInboxDeliveries.mockReset().mockResolvedValue(1);
        encryptInboxCredential.mockReset().mockResolvedValue('encrypted');
    });

    it('removes payloads but preserves audit history by default', async () => {
        await expect(runInboxMaintenance({ deleteExpiredRecords: false })).resolves.toEqual({
            migrated: 0,
            wiped: 0,
            failed: 0,
            expired: 3,
            deleted: 0,
            deliveriesWiped: 1,
        });
        expect(expireInboxCredentials).toHaveBeenCalledOnce();
        expect(deleteExpiredInboxCredentials).not.toHaveBeenCalled();
    });

    it('deletes records only when retention deletion is explicitly enabled', async () => {
        expect((await runInboxMaintenance({ deleteExpiredRecords: true })).deleted).toBe(2);
        expect(deleteExpiredInboxCredentials).toHaveBeenCalledOnce();
    });

    it('bounds work per invocation even when the backlog keeps growing', async () => {
        expireInboxCredentials.mockResolvedValue(100);
        deleteExpiredInboxCredentials.mockResolvedValue(100);
        wipeExpiredInboxDeliveries.mockResolvedValue(100);
        await expect(runInboxMaintenance({ deleteExpiredRecords: true })).resolves.toMatchObject({
            expired: 1000,
            deleted: 1000,
            deliveriesWiped: 1000,
        });
        expect(expireInboxCredentials).toHaveBeenCalledTimes(10);
        expect(deleteExpiredInboxCredentials).toHaveBeenCalledTimes(10);
        expect(wipeExpiredInboxDeliveries).toHaveBeenCalledTimes(10);
    });

    it('counts poison records and continues encrypting the rest of the batch', async () => {
        run.mockResolvedValueOnce({
            properties: [
                { id: 'poison', currentStatus: 'PENDING', credential: 'bad' },
                { id: 'valid', currentStatus: 'PENDING', credential: '{}' },
            ],
        }).mockResolvedValue({ records: [{}] });
        encryptInboxCredential.mockRejectedValueOnce(new Error('crypto unavailable'));
        await expect(migrateLegacyInboxCredentials()).resolves.toEqual({
            encrypted: 1,
            wiped: 0,
            failed: 1,
            scanned: 2,
        });
        expect(encryptInboxCredential).toHaveBeenCalledTimes(2);
    });
});
