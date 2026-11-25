import { beforeEach, expect, it, vi } from 'vitest';
import { inAppMessageValidator } from '@learncard/types';

const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('@instance', () => ({ neogma: { queryRunner: { run: mocks.run } } }));
import { getCampaignTests } from './test';

beforeEach(() => mocks.run.mockReset());

it('isolates malformed JSON and obsolete message schemas from valid private tests', async () => {
    const id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
    const valid = {
        id,
        campaignId: 'campaign',
        message: JSON.stringify({ id: 'test', title: 'Valid' }),
    };
    mocks.run.mockResolvedValue({
        records: [
            { ...valid, message: '{' },
            { ...valid, message: JSON.stringify({ id: 'obsolete', presentation: 'removed-type' }) },
            valid,
        ].map(row => ({ get: (key: keyof typeof row) => row[key] })),
    });
    await expect(getCampaignTests('admin')).resolves.toEqual([
        {
            id,
            campaignId: 'campaign',
            message: inAppMessageValidator.parse({ id: 'test', title: 'Valid' }),
        },
    ]);
});
