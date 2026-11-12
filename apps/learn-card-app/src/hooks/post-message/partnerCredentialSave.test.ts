import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { savePartnerCredential } from './partnerCredentialSave';

const credential = { name: 'Partner credential' } as VC;

describe('savePartnerCredential', () => {
    it('returns the URI only after the LearnCloud index save succeeds', async () => {
        const store = vi.fn().mockResolvedValue({ result: true, credentialUri: 'lc:credential:1' });

        await expect(savePartnerCredential(credential, store)).resolves.toBe('lc:credential:1');
        expect(store).toHaveBeenCalledWith(
            credential,
            { title: 'Partner credential' },
            'LearnCloud',
            true
        );
    });

    it.each([
        { result: false, credentialUri: 'lc:credential:unindexed' },
        { result: true, credentialUri: '' },
    ])('rejects an unconfirmed save: %j', async result => {
        const store = vi.fn().mockResolvedValue(result);

        await expect(savePartnerCredential(credential, store)).rejects.toThrow(
            'Credential save was not confirmed'
        );
    });

    it('propagates storage failures without returning a shareable credential URI', async () => {
        const store = vi.fn().mockRejectedValue(new Error('index failed'));

        await expect(savePartnerCredential(credential, store)).rejects.toThrow('index failed');
    });
});
