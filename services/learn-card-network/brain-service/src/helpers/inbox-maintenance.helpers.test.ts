import { beforeEach, describe, expect, it, vi } from 'vitest';

const { run, expireInboxCredentials, deleteExpiredInboxCredentials, wipeExpiredInboxDeliveries } =
    vi.hoisted(() => ({
        run: vi.fn(),
        expireInboxCredentials: vi.fn(),
        deleteExpiredInboxCredentials: vi.fn(),
        wipeExpiredInboxDeliveries: vi.fn(),
    }));

vi.mock('neogma', () => ({
    BindParam: class BindParam {},
    QueryBuilder: class QueryBuilder {
        match = (): this => this;
        where = (): this => this;
        return = (): this => this;
        limit = (): this => this;
        run = run;
    },
    QueryRunner: { getResultProperties: () => [] },
}));
vi.mock('@models', () => ({ InboxCredential: {} }));
vi.mock('@accesslayer/inbox-credential/update', () => ({
    expireInboxCredentials,
    wipeExpiredInboxDeliveries,
}));
vi.mock('@accesslayer/inbox-credential/delete', () => ({ deleteExpiredInboxCredentials }));

import { runInboxMaintenance } from './inbox-maintenance.helpers';

describe('Universal Inbox maintenance', () => {
    beforeEach(() => {
        run.mockReset().mockResolvedValue({ records: [] });
        expireInboxCredentials.mockReset().mockResolvedValue(3);
        deleteExpiredInboxCredentials.mockReset().mockResolvedValue(2);
        wipeExpiredInboxDeliveries.mockReset().mockResolvedValue(0);
    });

    it('expires pending records and deletes records past retention', async () => {
        await expect(runInboxMaintenance()).resolves.toEqual({
            migrated: 0,
            wiped: 0,
            expired: 3,
            deleted: 2,
            deliveriesWiped: 0,
        });
        expect(expireInboxCredentials).toHaveBeenCalledOnce();
        expect(deleteExpiredInboxCredentials).toHaveBeenCalledOnce();
    });
});
