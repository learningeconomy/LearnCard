import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';
import { CampaignValidator } from '@learncard/types';
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
        const adminProfile = {
            profileId: TEST_USER_PROFILE_ID,
            displayName: 'Synthetic campaign admin',
            did: `did:web:localhost%3A4000:users:${TEST_USER_PROFILE_ID}`,
            dob: '1990-01-01',
            country: 'US',
            shortBio: '',
            bio: '',
        };
        mock.on('profile.getProfile', () => adminProfile);
        mock.on('profile.getOtherProfile', () => adminProfile);
        mock.on('profile.createProfile', () => adminProfile.did);
        mock.on('user.getDids', () => [adminProfile.did]);
        mock.on('user.addDid', () => true);

        let saved: Campaign | undefined;
        const members = new Set<string>();
        let testSends = 0;
        let dispatches = 0;
        let notified = 0;
        let dispatchPreviewReads = 0;
        const dispatchToken = 'd'.repeat(64);
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
            notified,
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
        const audiencePreviews: CampaignAudienceInput[] = [];
        const audienceAdds: CampaignAudienceInput[] = [];
        const searchRequests: unknown[] = [];
        mock.on('profile.searchProfiles', input => {
            searchRequests.push(input);
            return [
                {
                    did: 'did:key:search-member',
                    profileId: 'search-member',
                    displayName: 'Synthetic member',
                },
            ];
        });
        mock.on('campaigns.previewAudience', value => {
            audiencePreviews.push(value as CampaignAudienceInput);
            return { count: 12 };
        });
        mock.on('campaigns.addAudience', value => {
            audienceAdds.push(value as CampaignAudienceInput);
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
        mock.on('campaigns.previewDispatch', () => {
            dispatchPreviewReads++;
            return {
                campaignId: saved!.id,
                audienceCount: members.size,
                alreadyNotifiedCount: notified,
                recipientCount: notified ? 0 : 1,
                previewToken: dispatchToken,
                ...(notified ? { blockedReason: 'no_recipients' } : {}),
            };
        });
        mock.on('campaigns.dispatch', value => {
            expect(value).toEqual({ campaignId: saved!.id, expectedPreviewToken: dispatchToken });
            dispatches++;
            notified = 1;
            return { dispatchId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' };
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
        await expect(
            page
                .getByRole('tablist', { name: 'Message editing mode' })
                .getByRole('tab', { name: 'Fields', exact: true })
        ).toHaveAttribute('aria-selected', 'true');
        await page.getByLabel('Title', { exact: true }).fill('Created with fields');
        await page.getByLabel('Frequency', { exact: true }).selectOption('3');
        await page.getByLabel('Days between messages').fill('7');
        await page
            .getByRole('heading', { name: 'Message', exact: true })
            .evaluate(node => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({
            path: 'test-results/campaign-message-fields-desktop.png',
            fullPage: true,
        });
        await page
            .getByRole('tablist', { name: 'Message editing mode' })
            .getByRole('tab', { name: 'Fields', exact: true })
            .press('ArrowRight');
        await expect(
            page
                .getByRole('tablist', { name: 'Message editing mode' })
                .getByRole('tab', { name: 'JSON', exact: true })
        ).toHaveAttribute('aria-selected', 'true');
        expect(JSON.parse(await page.getByLabel('Message JSON').inputValue())).toMatchObject({
            title: 'Created with fields',
            frequency: { everyDays: 7 },
        });
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
        await page
            .getByRole('tablist', { name: 'Message editing mode' })
            .getByRole('tab', { name: 'JSON', exact: true })
            .press('ArrowLeft');
        await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Local preview only');
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
        await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
        await page
            .getByRole('tablist', { name: 'Message editing mode' })
            .getByRole('tab', { name: 'JSON', exact: true })
            .click();
        await page
            .getByRole('tablist', { name: 'Message editing mode' })
            .getByRole('tab', { name: 'Fields', exact: true })
            .click();
        await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Send Notifications' })).toBeDisabled();
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
        await page
            .getByLabel('Email addresses', { exact: true })
            .fill(' ADMIN@example.com;admin@example.com,member@example.com');
        await page.getByRole('button', { name: 'Preview source audience' }).click();
        await expect(page.getByText(/12 eligible matches processed in preview/)).toBeVisible();
        expect(audiencePreviews.at(-1)?.source).toEqual({
            type: 'emails',
            emails: ['admin@example.com', 'member@example.com'],
        });
        expect(audienceAdds).toHaveLength(10);
        await page.getByRole('button', { name: 'Add source audience' }).click();
        await expect(
            page.getByText(/12 eligible matches processed; existing members may be included/)
        ).toBeVisible();
        expect(audienceAdds.at(-1)?.source).toEqual(audiencePreviews.at(-1)?.source);
        const audienceTabs = page.getByRole('tablist', { name: 'Audience source editing mode' });
        await audienceTabs.getByRole('tab', { name: 'JSON', exact: true }).click();
        expect(JSON.parse(await page.getByLabel('Audience source JSON').inputValue())).toEqual(
            audienceAdds.at(-1)?.source
        );
        await audienceTabs.getByRole('tab', { name: 'Fields', exact: true }).click();
        await page.getByLabel('Audience source', { exact: true }).selectOption('dids');
        await page.getByLabel('Account identifiers', { exact: true }).fill('did:key:field-member');
        await page.getByRole('button', { name: 'Preview source audience' }).click();
        await expect(page.getByText(/12 eligible matches processed in preview/)).toBeVisible();
        expect(audiencePreviews.at(-1)?.source).toEqual({
            type: 'dids',
            dids: ['did:key:field-member'],
        });
        await page.getByLabel('Search network members').fill('Synthetic');
        await page
            .getByRole('checkbox', { name: 'Select Synthetic member (@search-member)' })
            .check();
        // The network mock unwraps the request's `input` property; option coverage lives in the unit test.
        expect(searchRequests.at(-1)).toBe('Synthetic');
        await expect(
            page.getByRole('checkbox', {
                name: `Select Synthetic campaign admin (@${TEST_USER_PROFILE_ID})`,
            })
        ).toBeVisible();

        expect(members.has('did:key:search-member')).toBe(false);
        await page.getByRole('button', { name: 'Preview selected members' }).click();
        await expect(page.getByRole('button', { name: 'Add selected members' })).toBeEnabled();
        expect(audiencePreviews.at(-1)?.source).toEqual({
            type: 'dids',
            dids: ['did:key:search-member'],
        });
        expect(members.has('did:key:search-member')).toBe(false);
        await page.getByRole('button', { name: 'Add selected members' }).click();
        await expect(
            page.getByText(/1 eligible matches processed; existing members may be included/)
        ).toBeVisible();
        expect(members.has('did:key:search-member')).toBe(true);
        await expect(
            page.getByRole('checkbox', { name: 'Select Synthetic member (@search-member)' })
        ).toBeVisible();
        await page
            .getByRole('heading', { name: 'Audience', exact: true })
            .evaluate(node => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({ path: 'test-results/campaign-audience-desktop.png' });
        await page
            .getByRole('heading', { name: 'Choose an audience source' })
            .evaluate(node => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({ path: 'test-results/campaign-audience-fields-desktop.png' });

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
        await page.getByRole('button', { name: 'Send Notifications', exact: true }).click();
        await expect(page.getByText('1 eligible recipient', { exact: true })).toBeVisible();
        expect(dispatches).toBe(0);
        await page
            .getByRole('group', { name: 'Confirm notification send' })
            .getByRole('button', { name: 'Cancel', exact: true })
            .click();
        expect(dispatches).toBe(0);
        await page.getByRole('button', { name: 'Send Notifications', exact: true }).click();
        await expect(
            page.getByRole('button', { name: 'Confirm notification send', exact: true })
        ).toBeEnabled();
        await page
            .getByRole('heading', { name: 'Manage campaign', exact: true })
            .evaluate(node => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({ path: 'test-results/campaign-dispatch-desktop.png' });
        await page.setViewportSize({ width: 390, height: 844 });
        await page
            .getByRole('group', { name: 'Confirm notification send' })
            .evaluate(node => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({ path: 'test-results/campaign-dispatch-mobile.png' });
        await page.getByRole('button', { name: 'Confirm notification send', exact: true }).click();
        await expect(page.getByText(/Notification delivery started/)).toBeVisible();
        expect(dispatches).toBe(1);
        await page.getByRole('button', { name: 'Send Notifications', exact: true }).click();
        await expect(page.getByText(/No eligible members remain to notify/)).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Confirm notification send', exact: true })
        ).toBeDisabled();
        await page
            .getByRole('group', { name: 'Confirm notification send' })
            .getByRole('button', { name: 'Cancel', exact: true })
            .click();
        expect(dispatchPreviewReads).toBe(3);
        await page.setViewportSize({ width: 1440, height: 1000 });

        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm paused' }).click();
        await expect(page.getByText('Campaign is paused.')).toBeVisible();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByLabel('Audience source', { exact: true }).selectOption('emails');
        await page.getByLabel('Search network members').fill('Synthetic');
        await page
            .getByRole('checkbox', { name: 'Select Synthetic member (@search-member)' })
            .waitFor();
        await expect(
            page.getByRole('checkbox', { name: 'Select Synthetic member (@search-member)' })
        ).toBeVisible();
        await page
            .getByRole('heading', { name: 'Audience', exact: true })
            .evaluate(node => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({ path: 'test-results/campaign-audience-mobile.png' });
        await page
            .getByRole('heading', { name: 'Choose an audience source' })
            .evaluate(node => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({ path: 'test-results/campaign-audience-fields-mobile.png' });
        for (const label of ['Search network members', 'Email addresses']) {
            const bounds = await page.getByLabel(label, { exact: true }).boundingBox();
            expect(bounds!.x).toBeGreaterThanOrEqual(0);
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
        }

        await page
            .getByRole('heading', { name: 'Edit campaign', exact: true })
            .scrollIntoViewIfNeeded();
        await page.screenshot({ path: 'test-results/campaign-mobile.png', fullPage: true });
        await page
            .getByRole('heading', { name: 'Message', exact: true })
            .evaluate(node => node.scrollIntoView({ block: 'start' }));
        await page.screenshot({
            path: 'test-results/campaign-message-fields-mobile.png',
            fullPage: true,
        });
        for (const label of ['Title', 'Format', 'Frequency', 'Button label']) {
            const bounds = await page.getByLabel(label, { exact: true }).boundingBox();
            expect(bounds!.x).toBeGreaterThanOrEqual(0);
            expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
        }
        await page
            .getByRole('tablist', { name: 'Message editing mode' })
            .getByRole('tab', { name: 'JSON', exact: true })
            .click();
        await expect(page.getByLabel('Message JSON')).toBeVisible();
        await expect(
            page
                .getByRole('tablist', { name: 'Message editing mode' })
                .getByRole('tab', { name: 'JSON', exact: true })
        ).toHaveCSS('background-color', 'rgb(24, 34, 78)');
        await page.screenshot({
            path: 'test-results/campaign-message-json-mobile.png',
            fullPage: true,
        });
        await page
            .getByRole('tablist', { name: 'Message editing mode' })
            .getByRole('tab', { name: 'Fields', exact: true })
            .click();

        expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
        ).toBe(true);
        await page.getByRole('button', { name: 'Archive', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm archived' }).click();
        await expect(page.getByText('Campaign is archived.')).toBeVisible();
        expect(dispatches).toBe(1);
        expect(events).toBe(0);
        await page.getByRole('link', { name: 'Back to campaigns' }).click();
        await expect(page.getByRole('link', { name: 'Composer local QA' })).toBeVisible();
        await page.screenshot({ path: 'test-results/campaign-list-mobile.png', fullPage: true });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await expect(page.getByRole('columnheader', { name: 'Stored members' })).toBeVisible();
        await page.screenshot({ path: 'test-results/campaign-list-desktop.png', fullPage: true });
    });
    test('in-app-only self-test arrives on the next app visit through existing endpoints', async ({
        page,
    }) => {
        const mock = await installNetwork(page);
        const profile = {
            profileId: TEST_USER_PROFILE_ID,
            displayName: 'Synthetic campaign admin',
            did: `did:web:localhost%3A4000:users:${TEST_USER_PROFILE_ID}`,
            dob: '1990-01-01',
            country: 'US',
            shortBio: '',
            bio: '',
        };
        mock.on('profile.getProfile', () => profile);
        mock.on('profile.getOtherProfile', () => profile);
        mock.on('profile.createProfile', () => profile.did);
        mock.on('user.getDids', () => [profile.did]);
        mock.on('user.addDid', () => true);
        // Own background reads that may share a tRPC batch with campaign retrieval.
        const emptyPage = { records: [], hasMore: false };
        for (const procedure of [
            'contracts.getConsentedContracts',
            'contracts.getAllCredentialsForTerms',
            'boost.getPaginatedBoosts',
            'skillFrameworks.getAllAvailableFrameworks',
            'activity.getMyActivities',
            'inbox.getMyInboxDeliveries',
        ]) {
            mock.on(procedure, () => emptyPage);
        }
        mock.on('activity.getMyCredentialLifecycleStatuses', () => ({}));
        mock.on('profile.pendingConnectionPrompts', () => []);
        mock.on('profile.updateProfile', () => true);
        const testId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
        const campaign = CampaignValidator.parse({
            id: 'next-visit-test',
            name: 'Private delivery QA',
            channels: ['inApp'],
            message: {
                id: 'next-visit-test',
                title: 'Private next-visit test',
                body: 'Only the requesting administrator sees this.',
                actions: [{ label: 'Close private test', action: { type: 'dismiss' } }],
            },
            createdAt: '2026-10-29T00:00:00Z',
            updatedAt: '2026-10-29T00:00:00Z',
        });
        let pending = false;
        let sends = 0;
        let acknowledgements = 0;
        let deliveriesRead = 0;
        mock.on('campaigns.isAdmin', () => true);
        mock.on('campaigns.get', () => campaign);
        mock.on('campaigns.list', () => ({ records: [campaign], hasMore: false }));
        mock.on('campaigns.getStats', () => ({
            audience: 0,
            notified: 0,
            shown: 0,
            clicked: 0,
            dismissed: 0,
            converted: 0,
            enrolled: 0,
        }));
        mock.on('campaigns.sendTestToMe', () => {
            pending = true;
            sends++;
            return true;
        });
        mock.on('campaigns.getMyCampaigns', () => {
            deliveriesRead++;
            return pending
                ? [
                      {
                          testId,
                          campaign: {
                              id: campaign.id,
                              message: { ...campaign.message, id: `campaign-test-${testId}` },
                              selfEnroll: false,
                          },
                          state: { shownCount: 0 },
                      },
                  ]
                : [];
        });
        mock.on('campaigns.recordEvent', value => {
            expect(value).toEqual({ campaignId: campaign.id, event: 'shown', testId });
            pending = false;
            acknowledgements++;
            return true;
        });
        await waitForAuthenticatedState(page, {
            path: '/admin/campaigns/next-visit-test',
            nextPath: '/admin/campaigns/next-visit-test',
            waitUntil: 'commit',
            profileId: TEST_USER_PROFILE_ID,
        });
        await page.getByRole('button', { name: 'Send Test to Me' }).click();
        await page.getByRole('button', { name: 'Confirm test send' }).click();
        await expect(page.getByText(/Your in-app test is waiting/)).toBeVisible();
        expect(sends).toBe(1);
        expect(acknowledgements).toBe(0);
        await expect(
            page.getByRole('heading', { name: 'Private next-visit test', exact: true })
        ).toHaveCount(0);
        await page.reload();
        await expect(page.getByRole('button', { name: 'Send Test to Me' })).toBeVisible({
            timeout: 30_000,
        });
        expect(acknowledgements).toBe(0);
        await page.goto('/wallet');
        await expect.poll(() => deliveriesRead, { timeout: 20_000 }).toBeGreaterThan(0);
        await expect(
            page.getByRole('heading', { name: 'Private next-visit test', exact: true })
        ).toBeVisible({ timeout: 60_000 });
        await expect.poll(() => acknowledgements).toBe(1);
        await expect(
            page
                .getByRole('heading', { name: 'Private next-visit test', exact: true })
                .locator('../../..')
        ).toHaveCSS('opacity', '1');
        await page.screenshot({
            path: 'test-results/campaign-next-visit-test.png',
            fullPage: true,
        });
        await page.getByRole('button', { name: 'Close private test' }).click();
        const readsBeforeReload = deliveriesRead;
        await page.reload();
        await expect.poll(() => deliveriesRead).toBeGreaterThan(readsBeforeReload);
        await expect(
            page.getByRole('heading', { name: 'Private next-visit test', exact: true })
        ).toHaveCount(0);
        expect(acknowledgements).toBe(1);
    });
    test('non-admin sees only not found', async ({ page }) => {
        const mock = await installNetwork(page);
        const profile = {
            profileId: TEST_USER_PROFILE_ID,
            displayName: 'Synthetic non-admin',
            did: `did:web:localhost%3A4000:users:${TEST_USER_PROFILE_ID}`,
            dob: '1990-01-01',
            country: 'US',
            shortBio: '',
            bio: '',
        };
        mock.on('profile.getProfile', () => profile);
        mock.on('profile.getOtherProfile', () => profile);
        mock.on('profile.createProfile', () => profile.did);
        mock.on('user.getDids', () => [profile.did]);
        mock.on('user.addDid', () => true);
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

test('campaign announcement inbox @mocked', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const mock = await installNetwork(page);
    const profile = {
        profileId: TEST_USER_PROFILE_ID,
        displayName: 'Synthetic campaign recipient',
        did: `did:web:localhost%3A4000:users:${TEST_USER_PROFILE_ID}`,
        dob: '1990-01-01',
        country: 'US',
        shortBio: '',
        bio: '',
    };
    mock.on('profile.getProfile', () => profile);
    mock.on('profile.getOtherProfile', () => profile);
    mock.on('profile.createProfile', () => profile.did);
    mock.on('user.getDids', () => [profile.did]);
    mock.on('user.addDid', () => true);
    mock.on('campaigns.getMyCampaigns', () => []);
    const notification = {
        _id: 'synthetic-announcement',
        type: 'ANNOUNCEMENT',
        from: 'did:web:network.example.com',
        to: { did: profile.did },
        message: {
            title: 'Your next chapter starts here',
            body: 'A new learning opportunity is waiting for you.\nExplore what’s possible and take your next step.',
        },
        data: { metadata: { campaignId: 'synthetic-campaign' } },
        sent: '2026-10-30T18:00:00Z',
        read: false,
        archived: false,
    };
    const updates: unknown[] = [];
    mock.on('notifications.notifications', input => {
        const filters = (input as { filters?: { archived?: boolean; read?: boolean } })?.filters;
        return {
            notifications:
                (filters?.archived === undefined || filters.archived === notification.archived) &&
                (filters?.read === undefined || filters.read === notification.read)
                    ? [notification]
                    : [],
            hasMore: false,
        };
    });
    mock.on('notifications.updateNotificationMeta', input => {
        const { _id, meta } = input as {
            _id: string;
            meta: { archived?: boolean; read?: boolean };
        };
        expect(_id).toBe(notification._id);
        updates.push(meta);
        Object.assign(notification, meta);
        return true;
    });
    mock.on('notifications.markAllNotificationsRead', () => true);
    await waitForAuthenticatedState(page, { profileId: TEST_USER_PROFILE_ID });
    await page.goto('/notifications');
    const card = page.getByRole('article', { name: notification.message.title });
    await expect(card).toBeVisible({ timeout: 120_000 });
    await expect(card.getByText('New', { exact: true })).toBeVisible();
    await expect(card.getByText(/A new learning opportunity/)).toBeVisible();
    await page.screenshot({ path: 'test-results/campaign-announcement-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/campaign-announcement-mobile.png' });
    const bounds = await card.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    await card.getByRole('button', { name: 'Mark as read' }).click();
    await expect(card.getByText('Read', { exact: true })).toBeVisible();
    await expect.poll(() => updates).toEqual([{ read: true }]);
    await card.getByRole('button', { name: 'Archive', exact: true }).click();
    await expect(card).not.toBeVisible();
    await page.getByRole('button', { name: /Archived/ }).click();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Restore', exact: true }).click();
    await expect(card).not.toBeVisible();
    await page.getByRole('button', { name: 'Active', exact: true }).click();
    await expect(card).toBeVisible();
    await page.reload();
    await expect(card.getByText('Read', { exact: true })).toBeVisible();
    expect(updates).toEqual([
        { read: true },
        { read: true, archived: true },
        { read: true, archived: false },
    ]);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Alerts', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Close alerts' })).toBeVisible();
    await expect(card).toBeVisible();
    await page.screenshot({ path: 'test-results/campaign-announcement-modal.png' });
    await page.getByRole('button', { name: 'Close alerts' }).click();
});
