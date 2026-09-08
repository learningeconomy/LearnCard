import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ run: vi.fn() }));

vi.mock('@instance', () => ({
    neogma: { queryRunner: { run: mocks.run } },
}));

import {
    getCredentialRefreshHeadForHolder,
    getCredentialRefreshVersionForHolder,
    getCredentialRefreshVersionsForHolder,
} from './read';

beforeEach(() => {
    mocks.run.mockReset();
    mocks.run.mockResolvedValue({ records: [] });
});

describe('atomic holder credential refresh reads', () => {
    it('limits history rows before collecting metadata', async () => {
        await getCredentialRefreshVersionsForHolder('refresh-id', { limit: 2 });
        const [query, params] = mocks.run.mock.calls[0];
        expect(query.indexOf('LIMIT $limitPlusOne')).toBeGreaterThan(
            query.indexOf('ORDER BY version.version DESC')
        );
        expect(query.indexOf('LIMIT $limitPlusOne')).toBeLessThan(query.indexOf('collect('));
        expect(params.limitPlusOne.toNumber()).toBe(3);
    });

    it('binds current, history, and version selection to canonical non-revocation', async () => {
        await getCredentialRefreshHeadForHolder('refresh-id');
        await getCredentialRefreshVersionsForHolder('refresh-id');
        await getCredentialRefreshVersionForHolder('refresh-id', 1);

        expect(mocks.run).toHaveBeenCalledTimes(3);

        for (const [query] of mocks.run.mock.calls) {
            expect(query).toContain("refresh.state = 'revoked'");
            expect(query).toContain("sent.status = 'revoked'");
            expect(query).toContain("received.status = 'revoked'");
            expect(query).toContain('WHERE NOT revoked');
            expect(query).toContain('RETURN revoked');
        }
    });
});
