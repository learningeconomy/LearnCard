import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JWE } from '@learncard/types';
import type { IssuedCredential } from '../../types/credential';

const mocks = vi.hoisted(() => ({ createOne: vi.fn() }));
vi.mock('@models', () => ({ Credential: { createOne: mocks.createOne } }));

import { storeCredential } from './create';

const createJwe = (): JWE => ({
    protected: 'header',
    iv: 'iv',
    ciphertext: 'ciphertext',
    tag: 'tag',
    recipients: [],
});

describe('credential status storage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects internal issuance results that lost their status metadata before writing', async () => {
        const issued = { kind: 'issued-credential', credential: createJwe() } as IssuedCredential;
        await expect(storeCredential(issued)).rejects.toThrow();
        expect(mocks.createOne).not.toHaveBeenCalled();
    });
});
