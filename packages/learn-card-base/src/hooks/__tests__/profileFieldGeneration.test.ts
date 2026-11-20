import { describe, expect, it } from 'vitest';
import { getProfileFieldGeneration } from '../profileFieldGeneration';

describe('profile field generations', () => {
    it('orders answers by issuance time without revealing their private storage URI', async () => {
        const source = 'private:holder-secret';
        const older = await getProfileFieldGeneration(source, '2026-01-01T00:00:00Z');
        const newer = await getProfileFieldGeneration(source, '2026-02-01T00:00:00Z');
        expect(older).toMatch(/^2026-01-01T00:00:00\.000Z:[0-9a-f]{64}$/);
        expect(older).not.toContain(source);
        expect(older < newer).toBe(true);
        expect(await getProfileFieldGeneration(source, '2026-01-01T00:00:00Z')).toBe(older);
        expect(await getProfileFieldGeneration('another-source', '2026-01-01T00:00:00Z')).not.toBe(
            older
        );
    });

    it('rejects an invalid issuance timestamp', async () => {
        await expect(getProfileFieldGeneration('source', 'invalid')).rejects.toThrow();
    });
});
