import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ run: vi.fn(), session: vi.fn(), transaction: vi.fn() }));
vi.mock('@environment', () => ({ environment: {} }));
vi.mock('@instance', () => ({
    neogma: {
        driver: { session: mocks.session },
        getTransaction: mocks.transaction,
        queryRunner: { run: mocks.run },
    },
}));
vi.mock('@helpers/learnCard.helpers', () => ({
    getLearnCard: vi.fn(),
    getDidWebLearnCard: vi.fn(),
}));

import { setCredentialBitstringStatus } from './status-list.helpers';

type StoredRow = { direct?: string; body?: string; entries?: string };

/** Mock the stored-status lookup, then the issuer-owner lookup. */
const mockStored = (row: StoredRow | null, owner: string | null = 'issuer') => {
    const record = (values: Record<string, unknown>) => ({
        get: (key: string) => values[key] ?? null,
    });
    mocks.run.mockImplementation(async (query: string) => {
        if (query.includes('AS owner')) {
            return { records: owner ? [record({ owner })] : [] };
        }
        return { records: row ? [record({ ...row })] : [] };
    });
};

describe('stored credential status validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(['{truncated', 'null', '{}', '[null]', '[{}]', '"not an array"'])(
        'returns false for malformed status metadata (%s) without starting a status write',
        async statusEntries => {
            mockStored({ direct: statusEntries, body: '{}' });
            await expect(
                setCredentialBitstringStatus('credential', 'revocation', true)
            ).resolves.toBe(false);
            expect(mocks.session).not.toHaveBeenCalled();
        }
    );

    it('returns false when legacy credential JSON cannot be parsed', async () => {
        mockStored({ body: '{truncated' });
        await expect(setCredentialBitstringStatus('credential', 'suspension', true)).resolves.toBe(
            false
        );
        expect(mocks.session).not.toHaveBeenCalled();
    });

    it('returns false for valid empty metadata or a missing credential', async () => {
        mockStored({ direct: '[]', body: '{}' });
        expect(await setCredentialBitstringStatus('credential', 'revocation', true)).toBe(false);
        mockStored(null);
        expect(await setCredentialBitstringStatus('missing', 'revocation', true)).toBe(false);
    });

    it('returns false when a valid entry cannot be updated', async () => {
        mockStored({
            direct: JSON.stringify([
                {
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'revocation',
                    statusListIndex: '42',
                    statusListCredential: 'https://network.example/status/1',
                },
            ]),
        });
        mocks.transaction.mockResolvedValue(false);
        expect(await setCredentialBitstringStatus('credential', 'revocation', true)).toBe(false);
    });

    it('rejects malformed numeric coordinates before any status write', async () => {
        mockStored({
            direct: JSON.stringify([
                {
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'revocation',
                    statusListIndex: 'not-a-number',
                    statusListCredential: 'https://network.example/status/1',
                },
            ]),
        });
        expect(await setCredentialBitstringStatus('credential', 'revocation', true)).toBe(false);
        expect(mocks.transaction).not.toHaveBeenCalled();
    });
});
