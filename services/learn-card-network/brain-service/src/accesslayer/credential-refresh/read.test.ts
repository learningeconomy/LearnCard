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
