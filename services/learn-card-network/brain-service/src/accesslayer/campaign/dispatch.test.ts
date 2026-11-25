import { beforeEach, expect, it, vi } from 'vitest';
import { CampaignValidator } from '@learncard/types';
import { int } from 'neo4j-driver';

const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('@instance', () => ({ neogma: { queryRunner: { run: mocks.run } } }));
vi.mock('@helpers/campaign-notifications.helpers', () => ({ canDispatchCampaign: () => true }));
import { getCampaignDispatchPreview, MAX_CONFIRMED_DISPATCH_RECIPIENTS } from './dispatch';

const definition = JSON.stringify(
    CampaignValidator.parse({
        id: 'campaign',
        name: 'Campaign',
        status: 'live',
        channels: ['notify'],
        notification: { title: 'Title', body: 'Body' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    })
);
const recipients = (ids: string[]) => {
    const row = {
        definition,
        recipients: ids,
        revision: int(0),
        audience: int(ids.length),
        notified: int(0),
    };
    mocks.run.mockResolvedValue({ records: [{ get: (key: keyof typeof row) => row[key] }] });
};
beforeEach(() => mocks.run.mockReset());

it('fingerprints identities independent of row ordering while detecting equal-count swaps', async () => {
    recipients(['b', 'a']);
    const first = await getCampaignDispatchPreview('campaign');
    recipients(['a', 'b']);
    expect(await getCampaignDispatchPreview('campaign')).toEqual(first);
    recipients(['a', 'c']);
    const swapped = await getCampaignDispatchPreview('campaign');
    expect(swapped.recipientCount).toBe(first.recipientCount);
    expect(swapped.previewToken).not.toBe(first.previewToken);
});
it('bounds collection before transfer and refuses to produce a token for an overflowing set', async () => {
    recipients(Array.from({ length: MAX_CONFIRMED_DISPATCH_RECIPIENTS }, (_, i) => `profile-${i}`));
    await expect(getCampaignDispatchPreview('campaign')).resolves.toMatchObject({
        recipientCount: 10_000,
    });
    const [query, params] = mocks.run.mock.calls[0]!;
    expect(params.recipientLimit.toNumber()).toBe(10_001);
    expect(query.indexOf('LIMIT $recipientLimit')).toBeLessThan(
        query.indexOf('collect(profileId)')
    );
    recipients(
        Array.from({ length: MAX_CONFIRMED_DISPATCH_RECIPIENTS + 1 }, (_, i) => `profile-${i}`)
    );
    await expect(getCampaignDispatchPreview('campaign')).rejects.toMatchObject({
        code: 'BAD_REQUEST',
    });
});
