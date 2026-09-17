import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRefreshDemoUiConfig } from './demo-refresh-ui';

const apis = {
    brainService: 'http://localhost:4000/trpc',
    cloudService: 'http://localhost:4100/trpc',
    lcaApi: 'http://localhost:5200/trpc',
    notificationsEndpoint: 'http://localhost:5200/api/notifications/send',
};
afterEach(() => vi.unstubAllGlobals());
const serve = (overrides = {}) => {
    const fetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ apis: { ...apis, ...overrides } })));
    vi.stubGlobal('fetch', fetch);
    return fetch;
};
describe('UI demo preflight', () => {
    it('explains how to recover when the app is not running', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
        await expect(
            getRefreshDemoUiConfig('http://localhost:3000', apis.brainService)
        ).rejects.toThrow('Start the LearnCard app in local development mode');
    });
    it('uses the running app’s actual cloud and notification ports', async () => {
        const fetch = serve();
        expect(
            await getRefreshDemoUiConfig('http://localhost:3001', 'http://localhost:4000/trpc')
        ).toEqual({
            appOrigin: 'http://localhost:3001',
            cloud: apis.cloudService,
            lcaApi: apis.lcaApi,
            notificationsWebhook: apis.notificationsEndpoint,
        });
        expect(fetch.mock.calls[0][0].href).toBe('http://localhost:3001/tenant-config.json');
        expect(fetch.mock.calls[0][1].redirect).toBe('error');
    });
    it.each([
        'https://learncard.app',
        'http://localhost.evil.example',
        'http://user:pass@localhost:3000',
        'file:///tmp/app',
    ])('rejects nonlocal or credential-bearing app URL %s before fetching', async app => {
        const fetch = serve();
        await expect(getRefreshDemoUiConfig(app, apis.brainService)).rejects.toThrow('loopback');
        expect(fetch).not.toHaveBeenCalled();
    });
    it.each([
        { brainService: 'http://localhost:9999/trpc' },
        { cloudService: 'https://cloud.learncard.com/trpc' },
        { notificationsEndpoint: 'https://api.learncard.app/api/notifications/send' },
        { notificationsEndpoint: 'http://localhost:5100/api/notifications/send' },
    ])('rejects mismatched or nonlocal services: %j', async overrides => {
        serve(overrides);
        await expect(
            getRefreshDemoUiConfig('http://localhost:3000', apis.brainService)
        ).rejects.toThrow();
    });
    it('derives the webhook from the app API when no override is present', async () => {
        serve({ notificationsEndpoint: undefined });
        expect(
            (await getRefreshDemoUiConfig('http://localhost:3000', apis.brainService))
                .notificationsWebhook
        ).toBe(apis.notificationsEndpoint);
    });
});
