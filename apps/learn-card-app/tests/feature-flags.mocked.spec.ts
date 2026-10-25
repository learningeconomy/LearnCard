import type { Page } from '@playwright/test';
import { resolve } from 'path';
import { test, expect } from './fixtures/mocked-test';
import { mockLaunchDarkly } from './route.helpers';

const sdkUrl = `/@fs${resolve(require.resolve('launchdarkly-js-client-sdk'), '../ldclient.es.js')}`;

const openSdkHarness = async (page: Page): Promise<void> => {
    await page.route('**/feature-flags-harness.html', route =>
        route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><title>Feature flags</title>',
        })
    );
    await page.goto('/feature-flags-harness.html');
};

const readFlagsWithSdk = async (
    page: Page
): Promise<{ anonymous: Record<string, unknown>; identified: Record<string, unknown> }> => {
    await openSdkHarness(page);
    const streamResponse = page.waitForResponse(response =>
        new URL(response.url()).hostname.startsWith('clientstream.launchdarkly.')
    );
    const eventsResponse = page.waitForResponse(
        response =>
            new URL(response.url()).hostname.startsWith('events.launchdarkly.') &&
            response.request().method() === 'POST'
    );
    const flags = await page.evaluate(async url => {
        const { initialize } = await import(url);
        const client = initialize(
            'mock-environment',
            { kind: 'user', key: 'anonymous' },
            {
                streaming: true,
                diagnosticOptOut: true,
            }
        );
        await client.waitForInitialization(5);
        const anonymous = client.allFlags();
        await client.identify({ kind: 'user', key: 'signed-in' });
        client.track('mock-feature-flags');
        await client.flush();
        return { anonymous, identified: client.allFlags() };
    }, sdkUrl);
    const stream = await streamResponse;
    expect(stream.headers()['content-type']).toContain('text/event-stream');
    expect(await stream.text()).toContain('event: put');
    expect((await eventsResponse).status()).toBe(202);
    return flags;
};

test.describe('Feature flags @mocked', () => {
    test('keeps announcements empty through initialization, identification and streaming', async ({
        page,
    }) => {
        const flags = await readFlagsWithSdk(page);
        expect(flags.anonymous).toEqual({
            inAppMessages: { messages: [] },
            inAppMessagesV2: { messages: [] },
        });
        expect(flags.identified).toEqual(flags.anonymous);
    });

    test('replaces stale evaluation data with the mocked streaming payload', async ({ page }) => {
        await page.route('https://app.launchdarkly.com/sdk/evalx/**', route =>
            route.fulfill({
                headers: { 'access-control-allow-origin': '*' },
                json: { inAppMessages: { value: { messages: [{ id: 'stale-announcement' }] } } },
            })
        );
        await openSdkHarness(page);
        const result = await page.evaluate(async url => {
            const { initialize } = await import(url);
            const client = initialize(
                'mock-environment',
                { kind: 'user', key: 'anonymous' },
                {
                    streaming: false,
                    diagnosticOptOut: true,
                }
            );
            await client.waitForInitialization(5);
            const initial = client.variation('inAppMessages', null);
            const changed = new Promise(onChange => client.on('change:inAppMessages', onChange));
            client.setStreaming(true);
            const streamed = await changed;
            client.close();
            return { initial, streamed };
        }, sdkUrl);
        expect(result.initial).toEqual({ messages: [{ id: 'stale-announcement' }] });
        expect(result.streamed).toEqual({ messages: [] });
    });

    test.describe('explicit flag values', () => {
        test.use({ featureFlags: { enableNewDemoFlow: { value: true } } });

        test('supports fixture options without live flag evaluation', async ({ page }) => {
            const flags = await readFlagsWithSdk(page);
            expect(flags.anonymous).toEqual({
                inAppMessages: { messages: [] },
                inAppMessagesV2: { messages: [] },
                enableNewDemoFlow: true,
            });
            expect(flags.identified).toEqual(flags.anonymous);
        });

        test('preserves page overrides used by existing specs', async ({ page }) => {
            await mockLaunchDarkly(page, { enableNewDemoFlow: { value: false } });
            const flags = await readFlagsWithSdk(page);
            expect(flags.anonymous.enableNewDemoFlow).toBe(false);
            expect(flags.identified).toEqual(flags.anonymous);
        });
    });
});
