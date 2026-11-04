import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    run: vi.fn(),
    campaign: { id: 'news', channels: ['email'], email: { title: 'News' } },
}));
vi.mock('./shared', () => ({
    adultProfilePredicate: 'true',
    liveCampaignPredicate: 'true',
    campaignTimeParams: () => ({ now: '2026-01-01T00:00:00Z' }),
    parseCampaign: () => mocks.campaign,
    withCampaignTransaction: async (_name: string, work: (tx: unknown) => Promise<unknown>) =>
        work({ run: mocks.run }),
}));
vi.mock('../../models/campaign-constraints', () => ({
    ensureCampaignConstraints: vi.fn().mockResolvedValue(undefined),
}));
import { claimCampaignEmail } from './email';

beforeEach(() => {
    vi.resetAllMocks();
    mocks.run.mockImplementation(async (query: string) => ({
        records: query.includes('RETURN c.definition')
            ? [
                  {
                      get: (key: string) =>
                          (
                              ({
                                  definition: '{}',
                                  email: 'adult@example.com',
                                  locale: 'es',
                                  unsubscribeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                              }) as Record<string, string>
                          )[key],
                  },
              ]
            : [],
    }));
});

it('does not write a reservation when preparation fails', async () => {
    const prepare = vi.fn().mockRejectedValue(new Error('Cannot render'));
    await expect(claimCampaignEmail('news', 'created', 'adult', false, prepare)).rejects.toThrow(
        'Cannot render'
    );
    expect(prepare).toHaveBeenCalledWith({
        campaign: mocks.campaign,
        email: 'adult@example.com',
        locale: 'es',
        unsubscribeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    expect(mocks.run.mock.calls.some(([query]) => query.includes('SET state.emailClaimedAt'))).toBe(
        false
    );
});

it('prepares the selected recipient before writing its reservation', async () => {
    const prepare = vi.fn(async () => {
        expect(
            mocks.run.mock.calls.some(([query]) => query.includes('SET state.emailClaimedAt'))
        ).toBe(false);
    });
    await claimCampaignEmail('news', 'created', 'adult', false, prepare);
    expect(prepare).toHaveBeenCalledOnce();
    expect(mocks.run.mock.calls.at(-1)?.[0]).toContain('SET state.emailClaimedAt');
});

it('does not prepare an ineligible recipient', async () => {
    mocks.run.mockResolvedValue({ records: [] });
    const prepare = vi.fn();
    expect(await claimCampaignEmail('news', 'created', 'adult', false, prepare)).toBeUndefined();
    expect(prepare).not.toHaveBeenCalled();
});
