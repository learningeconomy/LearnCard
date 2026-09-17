import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resolveSharedCredential: vi.fn() }));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    resolveSharedCredential: mocks.resolveSharedCredential,
    getCredentialName: (credential: { name?: string }) => credential.name ?? '',
}));

import { resolveEndorsementTitle } from './PassportCredentialCard';

describe('resolveEndorsementTitle', () => {
    it('uses the shared target credential name for legacy endorsement records', async () => {
        mocks.resolveSharedCredential.mockResolvedValue({ name: 'First Aid' });

        await expect(resolveEndorsementTitle('uri=lc%3Ashared&seed=seed&pin=1234')).resolves.toBe(
            'Endorsement of First Aid'
        );
    });
});
