import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findOne: vi.fn(), session: vi.fn(), transaction: vi.fn() }));
vi.mock('@environment', () => ({ environment: {} }));
vi.mock('@models', () => ({ Credential: { findOne: mocks.findOne } }));
vi.mock('@instance', () => ({
    neogma: { driver: { session: mocks.session }, getTransaction: mocks.transaction },
}));
vi.mock('@helpers/learnCard.helpers', () => ({
    getLearnCard: vi.fn(),
    getDidWebLearnCard: vi.fn(),
}));

import { setCredentialBitstringStatus } from './status-list.helpers';

describe('stored credential status validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(['{truncated', 'null', '{}', '[null]', '[{}]', '"not an array"'])(
        'returns false for malformed status metadata (%s) without starting a status write',
        async statusEntries => {
            mocks.findOne.mockResolvedValue({ statusEntries, credential: '{}' });
            await expect(
                setCredentialBitstringStatus('credential', 'revocation', true)
            ).resolves.toBe(false);
            expect(mocks.session).not.toHaveBeenCalled();
        }
    );

    it('returns false when legacy credential JSON cannot be parsed', async () => {
        mocks.findOne.mockResolvedValue({ credential: '{truncated' });
        await expect(setCredentialBitstringStatus('credential', 'suspension', true)).resolves.toBe(
            false
        );
        expect(mocks.session).not.toHaveBeenCalled();
    });

    it('returns false for valid empty metadata or a missing credential', async () => {
        mocks.findOne
            .mockResolvedValueOnce({ statusEntries: '[]', credential: '{}' })
            .mockResolvedValueOnce(null);
        expect(await setCredentialBitstringStatus('credential', 'revocation', true)).toBe(false);
        expect(await setCredentialBitstringStatus('missing', 'revocation', true)).toBe(false);
    });

    it('returns false when a valid entry cannot be updated', async () => {
        mocks.findOne.mockResolvedValue({
            statusEntries: JSON.stringify([
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
        mocks.findOne.mockResolvedValue({
            statusEntries: JSON.stringify([
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
