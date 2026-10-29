import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';
import type {
    Campaign,
    CreateCampaignInput,
    UpdateCampaignInput,
    CampaignAudienceInput,
} from '@learncard/types';

test.describe('campaign composer @mocked', () => {
    test('admin draft, validation, preview, imports, test send and lifecycle', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 1000 });
        const mock = await installNetwork(page);
        let saved: Campaign | undefined;
        const members = new Set<string>();
        let testSends = 0;
        let dispatches = 0;
        let events = 0;
        const batches: number[] = [];
        mock.on('campaigns.isAdmin', () => true);
        mock.on('campaigns.list', () => ({ records: saved ? [saved] : [], hasMore: false }));
        mock.on('campaigns.get', () => saved);
        mock.on('campaigns.create', value => {
            const input = value as CreateCampaignInput;
            saved = {
                ...input,
                status: 'draft',
                message: {
                    priority: 0,
                    dismissible: true,
                    enabled: true,
                    bypassFatigue: false,
                    frequency: 'once',
                    actions: [],
                    ...input.message,
                    id: input.id,
                },
                excludeMinors: input.excludeMinors ?? true,
                selfEnroll: input.selfEnroll ?? false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return saved;
        });
        mock.on('campaigns.update', value => {
            const input = value as UpdateCampaignInput;
            saved = { ...saved!, ...input.updates } as Campaign;
            return saved;
        });
        mock.on('campaigns.setStatus', value => {
            saved = { ...saved!, status: (value as Campaign).status };
            return saved;
        });
        mock.on('campaigns.getStats', () => ({
            audience: members.size,
            shown: 0,
            clicked: 0,
            notified: 0,
            dismissed: 0,
            converted: 0,
            enrolled: 0,
        }));
        mock.on('campaigns.pageAudience', () => ({
            records: [...members]
                .slice(0, 50)
                .map((did, index) => ({ did, profileId: `synthetic-${index}` })),
            hasMore: false,
        }));
        mock.on('campaigns.previewAudience', () => ({ count: 12 }));
        mock.on('campaigns.addAudience', value => {
            const source = (value as CampaignAudienceInput).source;
            if (source.type === 'dids') {
                batches.push(source.dids.length);
                source.dids.forEach(did => members.add(did));
                return { count: source.dids.length };
            }
            return { count: 12 };
        });
        mock.on('campaigns.sendTestToMe', () => {
            testSends++;
            return true;
        });
        mock.on('campaigns.dispatch', () => {
            dispatches++;
            return { dispatchId: 'not-allowed' };
        });
        mock.on('campaigns.recordEvent', () => {
            events++;
            return true;
        });
        mock.on('campaigns.getMyCampaigns', () => []);
        await waitForAuthenticatedState(page, {
            path: '/admin/campaigns',
            nextPath: '/admin/campaigns',
            waitUntil: 'commit',
            profileId: TEST_USER_PROFILE_ID,
        });
        await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible({
            timeout: 90_000,
        });
        await page.getByRole('link', { name: 'Create campaign' }).click();
        await expect(page.getByRole('alert')).toHaveCount(0);
        const previewPanel = page.getByRole('button', { name: 'Preview message' });
        const nameInput = page.getByLabel('Name', { exact: true });
        const nameBounds = await nameInput.boundingBox();
        const previewBounds = await previewPanel.boundingBox();
        expect(previewBounds!.x).toBeGreaterThan(nameBounds!.x + nameBounds!.width);
        await expect(page.getByLabel('Message JSON')).toHaveCSS('font-family', /monospace/);
        await expect(previewPanel).toHaveCSS('border-style', 'solid');
        await page.screenshot({ path: 'test-results/campaign-create-desktop.png', fullPage: true });
        await page.getByText('Advanced settings · Campaign ID', { exact: true }).click();
        await page.getByLabel('Campaign ID').fill('composer-local-qa');
        await page.getByLabel('Name', { exact: true }).fill('Composer local QA');
        await page.getByLabel('Message JSON').fill('{');
        await expect(page.getByRole('button', { name: 'Save Draft' })).toBeDisabled();
        await page.getByLabel('Message JSON').fill(
            JSON.stringify({
                presentation: 'modal',
                title: 'Local preview only',
                body: 'Synthetic review fixture',
                actions: [{ label: 'Close local preview', action: { type: 'dismiss' } }],
            })
        );
        await page.getByLabel('Inbox / push notification').check();
        await page.getByLabel('Notification title').fill('Synthetic test');
        await page.getByLabel('Notification body').fill('Only a mocked test send');
        await page.getByRole('button', { name: 'Preview message' }).click();
        await expect(
            page.getByRole('heading', { name: 'Local preview only', exact: true })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Local preview only' }).locator('../../..')
        ).toHaveCSS('opacity', '1');
        await page.screenshot({ path: 'test-results/campaign-preview.png', fullPage: true });
        await page.getByRole('button', { name: 'Close local preview' }).click();
        await page.getByRole('button', { name: 'Save Draft' }).click();
        await expect(page.getByLabel('Campaign ID')).toBeDisabled();
        await expect(
            page.getByRole('button', { name: 'Send Notifications — unavailable' })
        ).toBeDisabled();
        await page
            .getByRole('heading', { name: 'Edit campaign', exact: true })
            .scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'test-results/campaign-editor-desktop.png', fullPage: true });
        await page.getByLabel('Audience CSV (did column or single column)').setInputFiles({
            name: 'synthetic.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(
                'did\n' +
                    Array.from({ length: 10_000 }, (_, index) => `did:key:synthetic${index}`).join(
                        '\n'
                    )
            ),
        });
        await page.getByRole('button', { name: 'Add CSV audience' }).click();
        await expect(page.getByText(/10,000 eligible matches processed/)).toBeVisible({
            timeout: 30_000,
        });
        expect(batches).toEqual(Array(10).fill(1000));
        await page.getByLabel('Boost URI').fill('lc:boost:synthetic');
        await page.getByLabel('Include pending boost recipients').check();
        await page.getByRole('button', { name: 'Preview boost audience' }).click();
        await expect(page.getByText(/12 eligible matches processed in preview/)).toBeVisible();
        await page.getByRole('button', { name: 'Send Test to Me' }).click();
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        expect(testSends).toBe(0);
        await page.getByRole('button', { name: 'Send Test to Me' }).click();
        await page.getByRole('button', { name: 'Confirm test send' }).click();
        await expect(page.getByText(/Test notification sent/)).toBeVisible();
        expect(testSends).toBe(1);
        await page.getByRole('button', { name: 'Go Live' }).click();
        await page.getByRole('button', { name: 'Confirm live' }).click();
        await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm paused' }).click();
        await expect(page.getByText('Campaign is paused.')).toBeVisible();
        await page.setViewportSize({ width: 390, height: 844 });
        await page
            .getByRole('heading', { name: 'Edit campaign', exact: true })
            .scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'test-results/campaign-mobile.png', fullPage: true });
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
        ).toBe(true);
        await page.getByRole('button', { name: 'Archive', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm archived' }).click();
        await expect(page.getByText('Campaign is archived.')).toBeVisible();
        expect(dispatches).toBe(0);
        expect(events).toBe(0);
        await page.getByRole('link', { name: 'Back to campaigns' }).click();
        await expect(page.getByRole('link', { name: 'Composer local QA' })).toBeVisible();
        await page.screenshot({ path: 'test-results/campaign-list-mobile.png', fullPage: true });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await expect(page.getByRole('columnheader', { name: 'Stored members' })).toBeVisible();
        await page.screenshot({ path: 'test-results/campaign-list-desktop.png', fullPage: true });
    });
    test('non-admin sees only not found', async ({ page }) => {
        const mock = await installNetwork(page);
        let reads = 0;
        mock.on('campaigns.isAdmin', () => false);
        mock.on('campaigns.get', () => {
            reads++;
            return null;
        });
        await waitForAuthenticatedState(page, {
            path: '/admin/campaigns/hidden',
            nextPath: '/admin/campaigns/hidden',
            waitUntil: 'commit',
            profileId: TEST_USER_PROFILE_ID,
        });
        await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible({
            timeout: 90_000,
        });
        expect(reads).toBe(0);
    });
});
