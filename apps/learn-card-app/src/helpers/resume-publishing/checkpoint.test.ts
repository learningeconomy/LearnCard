import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
    createResumeCheckpoint,
    readResumeCheckpoint,
    deleteResumeCheckpoint,
    ResumeCheckpointExistsError,
} from './checkpoint';
beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()));
describe('encrypted resume checkpoint storage', () => {
    it('atomically refuses a competing fresh attempt instead of overwriting its ciphertext', async () => {
        await createResumeCheckpoint('owner-slot', 'FIRST CIPHERTEXT');
        await expect(
            createResumeCheckpoint('owner-slot', 'COMPETING CIPHERTEXT')
        ).rejects.toBeInstanceOf(ResumeCheckpointExistsError);
        expect(await readResumeCheckpoint('owner-slot')).toBe('FIRST CIPHERTEXT');
    });
    it('keeps large encrypted attempts and deletes the exact slot after finalization', async () => {
        const ciphertext = 'A'.repeat(8 * 1024 * 1024);
        await createResumeCheckpoint('owner-slot', ciphertext);
        expect((await readResumeCheckpoint('owner-slot'))?.length).toBe(ciphertext.length);
        await createResumeCheckpoint('another-owner-slot', 'OTHER CIPHERTEXT');
        await deleteResumeCheckpoint('owner-slot');
        expect(await readResumeCheckpoint('owner-slot')).toBeUndefined();
        expect(await readResumeCheckpoint('another-owner-slot')).toBe('OTHER CIPHERTEXT');
    });
});
