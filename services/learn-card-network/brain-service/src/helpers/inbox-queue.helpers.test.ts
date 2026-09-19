import { describe, expect, it, vi } from 'vitest';
import type { Context } from '@routes';
import type { ProfileType } from 'types/profile';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@environment', () => ({
    getInboxBatchRuntimeEnvironment: () => ({ INBOX_QUEUE_URL: 'local' }),
}));
vi.mock('@accesslayer/inbox-batch/store', () => ({ createBatchJob: mocks.create }));
vi.mock('@accesslayer/profile/read', () => ({ getProfileByProfileId: vi.fn() }));
vi.mock('./inbox.helpers', () => ({}));
vi.mock('./inbox-encryption.helpers', () => ({
    encryptInboxCredential: async (value: string) => value,
}));
import { submitInboxBatch } from './inbox-queue.helpers';

describe('batch request identity', () => {
    it('ignores tenant resolution and branding changes, but keeps tenant ID and domain in the hash', async () => {
        const profile = { profileId: 'issuer' } as ProfileType;
        const batch = {
            requestId: 'request',
            items: [
                {
                    recipient: { type: 'email' as const, value: 'a@example.test' },
                    templateUri: 'template',
                },
            ],
        };
        const submit = async (
            id: string,
            resolvedVia: string,
            brandName: string,
            domain = 'example.test'
        ): Promise<string> => {
            await submitInboxBatch(profile, batch, {
                domain,
                tenant: { id, resolvedVia, emailBranding: { brandName } },
            } as Context);
            return mocks.create.mock.lastCall![0].requestHash;
        };
        const original = await submit('tenant', 'header', 'Before');
        expect(await submit('tenant', 'origin', 'After')).toBe(original);
        expect(await submit('other', 'header', 'Before')).not.toBe(original);
        expect(await submit('tenant', 'header', 'Before', 'other.test')).not.toBe(original);
    });
});
