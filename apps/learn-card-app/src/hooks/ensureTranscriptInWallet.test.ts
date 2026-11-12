import { describe, expect, it, vi } from 'vitest';
import { ensureTranscriptInWallet } from './ensureTranscriptInWallet';

const walletWith = (records: unknown[]) =>
    ({ index: { LearnCloud: { get: vi.fn().mockResolvedValue(records) } } }) as never;

describe('ensureTranscriptInWallet', () => {
    it('does nothing when the wallet already has the entry', async () => {
        const add = vi.fn();
        await ensureTranscriptInWallet(walletWith([{ uri: 'u' }]), 'u', add);
        expect(add).not.toHaveBeenCalled();
    });

    it('re-adds a missing entry', async () => {
        const add = vi.fn().mockResolvedValue(true);
        await ensureTranscriptInWallet(walletWith([]), 'u', add);
        expect(add).toHaveBeenCalledWith({ uri: 'u' });
    });

    it('throws when the re-add resolves false', async () => {
        await expect(
            ensureTranscriptInWallet(walletWith([]), 'u', vi.fn().mockResolvedValue(false))
        ).rejects.toThrow();
    });
});
