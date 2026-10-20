import { test, expect } from './fixtures/mocked-test';
import type { Page } from '@playwright/test';
import type { IssueInboxCredentialBatch, InboxBatchStatus } from '@learncard/types';
import type { TrpcMock, BrainOutputs } from './mocks/trpc';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

const NAME_PLACEHOLDER = 'e.g. Web Development Fundamentals';

// See the sibling @e2e spec for the rationale behind these viewport-tolerant selectors.
const issueButton = (page: Page) => page.getByTestId('issue-submit');

const selectBadgeType = async (page: Page) => {
    await page.getByRole('button', { name: 'Badge', exact: true }).click({ timeout: 30_000 });
    await expect(page.getByPlaceholder(NAME_PLACEHOLDER)).toBeVisible({ timeout: 30_000 });
};

const fillName = (page: Page, name: string) => page.getByPlaceholder(NAME_PLACEHOLDER).fill(name);

const waitForIssueReady = async (page: Page): Promise<void> => {
    // A route change can finish while the account's key is still being restored.
    await expect(page.getByRole('heading', { name: 'What are you issuing?' })).toBeVisible({
        timeout: 60_000,
    });
};

// @mocked — this suite runs on the vite-only tier (no docker). The HAR baseline
// serves the recorded auth/boot + issuance traffic; see tests/mocks/network.ts.
test.describe('Issue Credential Page (/issue) @mocked', () => {
    let network: TrpcMock;
    test.beforeEach(async ({ page }) => {
        // Install the mocked backend BEFORE any navigation so boot calls are served.
        network = await installNetwork(page);
        // Recovery requires the issuer profile. Repeated or multiplexed reads do not
        // match the HAR's single recorded request, so serve them deterministically.
        const issuerProfile = {
            profileId: TEST_USER_PROFILE_ID,
            displayName: 'User From Seed',
            shortBio: '',
            bio: '',
            did: `did:web:localhost%3A4000:users:${TEST_USER_PROFILE_ID}`,
            profileVisibility: 'public' as const,
            showEmail: false,
            allowConnectionRequests: 'anyone' as const,
            isServiceProfile: false,
        };
        network.on('profile.getProfile', () => issuerProfile);
        network.on('profile.getOtherProfile', () => issuerProfile);
        network.on(
            'appStore.getPublicListingBySlug',
            () => undefined satisfies BrainOutputs['appStore']['getPublicListingBySlug']
        );
        // tRPC batches are answered as a whole. Own the background lookups too,
        // so a batch containing the issuer check never falls through to a mismatched HAR.
        const emptyPage = { records: [], hasMore: false };
        network.on(
            'profile.searchProfiles',
            () => [] satisfies BrainOutputs['profile']['searchProfiles']
        );
        network.on(
            'profile.paginatedConnections',
            () => emptyPage satisfies BrainOutputs['profile']['paginatedConnections']
        );
        network.on(
            'profile.pendingConnectionPrompts',
            () => [] satisfies BrainOutputs['profile']['pendingConnectionPrompts']
        );
        network.on(
            'skillFrameworks.getAllAvailableFrameworks',
            () => emptyPage satisfies BrainOutputs['skillFrameworks']['getAllAvailableFrameworks']
        );
        network.on(
            'skills.searchFrameworkSkills',
            () =>
                ({
                    ...emptyPage,
                    cursor: null,
                }) satisfies BrainOutputs['skills']['searchFrameworkSkills']
        );
        network.on(
            'contracts.getConsentedContracts',
            () => emptyPage satisfies BrainOutputs['contracts']['getConsentedContracts']
        );
        network.on(
            'contracts.getAllCredentialsForTerms',
            () => emptyPage satisfies BrainOutputs['contracts']['getAllCredentialsForTerms']
        );
        network.on(
            'boost.getPaginatedBoosts',
            () => emptyPage satisfies BrainOutputs['boost']['getPaginatedBoosts']
        );
        network.on(
            'activity.getMyActivities',
            () => emptyPage satisfies BrainOutputs['activity']['getMyActivities']
        );
        network.on(
            'inbox.getMyInboxDeliveries',
            () => emptyPage satisfies BrainOutputs['inbox']['getMyInboxDeliveries']
        );
        network.on(
            'profile.updateProfile',
            () => true satisfies BrainOutputs['profile']['updateProfile']
        );
        network.on(
            'inbox.finalize',
            () =>
                ({
                    processed: 0,
                    claimed: 0,
                    errors: 0,
                    guardianPending: 0,
                    verifiableCredentials: [],
                }) satisfies BrainOutputs['inbox']['finalize']
        );
        await waitForAuthenticatedState(page, {
            path: '/issue',
            profileId: TEST_USER_PROFILE_ID,
            waitUntil: 'domcontentloaded',
        });
        await page.waitForURL(/\/issue/, { timeout: 30_000, waitUntil: 'domcontentloaded' });
        await waitForIssueReady(page);
    });

    test('renders the type picker and gates the Issue button', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'What are you issuing?' })).toBeVisible({
            timeout: 30_000,
        });
        await expect(issueButton(page)).toBeDisabled();
        // The hint renders twice (desktop + mobile variants toggled by CSS).
        await expect(page.getByText('Pick a type to begin').first()).toBeVisible();
    });

    test('unfolds the form and enables issuing only after a name', async ({ page }) => {
        await selectBadgeType(page);
        await expect(issueButton(page)).toBeDisabled();
        await expect(page.getByText('Add a name to continue').first()).toBeVisible();
        await fillName(page, 'Mocked Badge');
        await expect(issueButton(page)).toBeEnabled();
    });

    test('recipient mode tabs switch the recipient controls', async ({ page }) => {
        await selectBadgeType(page);
        await page.getByRole('button', { name: /anyone with a link/i }).click({ timeout: 30_000 });
        await expect(page.getByText(/create a shareable link when you issue/i)).toBeVisible();
        await page.getByRole('button', { name: /specific people/i }).click({ timeout: 30_000 });
        await expect(page.getByPlaceholder('Search people...')).toBeVisible();
    });

    test('JSON toggle reveals the raw credential editor', async ({ page }) => {
        await selectBadgeType(page);
        await page.getByRole('button', { name: 'JSON', exact: true }).click({ timeout: 30_000 });
        await expect(page.locator('textarea.font-mono')).toBeVisible({ timeout: 30_000 });
    });

    test('imports ten people, summarizes recipients, edits errors and restores the draft', async ({
        page,
    }) => {
        // This scenario includes two complete app/account bootstraps.
        test.setTimeout(180000);
        await selectBadgeType(page);
        await fillName(page, 'Roster Badge');
        await page.getByRole('button', { name: /specific people/i }).click();
        const csv =
            'Email,Name,Evidence\n' +
            Array.from(
                { length: 10 },
                (_, index) =>
                    `${index === 0 ? 'invalid' : `person${index}@test.com`},Person ${index},https://proof.test/${index}`
            ).join('\n');
        await page
            .getByTestId('issue-spreadsheet-file')
            .setInputFiles({ name: 'people.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
        await expect(page.getByRole('heading', { name: 'Review spreadsheet' })).toBeVisible();
        await page.getByRole('button', { name: 'Add People', exact: true }).click();
        await expect(page.getByText('10 people · people.csv', { exact: true })).toBeVisible();
        await expect(page.getByRole('table')).toHaveCount(0);
        await expect(issueButton(page)).toBeDisabled();
        await page.getByRole('button', { name: 'Review people', exact: true }).click();
        await expect(page.getByRole('table')).toBeVisible();
        await page
            .getByRole('textbox', { name: 'Email for Person 0', exact: true })
            .fill('person0@test.com');
        await page.getByRole('button', { name: 'Done', exact: true }).click();
        await expect(issueButton(page)).toBeEnabled();
        await page.getByRole('button', { name: 'Next person', exact: true }).click();
        await expect(page.getByText('2 of 10 · Person 1', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Review people', exact: true }).click();
        await page.getByRole('searchbox', { name: 'Search people', exact: true }).fill('Person 9');
        await expect(
            page.getByRole('textbox', { name: 'Email for Person 9', exact: true })
        ).toBeVisible();
        await page.getByRole('button', { name: 'Done', exact: true }).click();
        await expect(page.getByText('Draft saved on this device', { exact: true })).toBeVisible();
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForIssueReady(page);
        await expect(
            page.getByRole('button', { name: 'Restore Saved Run', exact: true })
        ).toBeVisible();
        await page.getByRole('button', { name: 'Skip for Now', exact: true }).click();
        await expect(
            page.getByRole('button', { name: 'Restore Saved Run', exact: true })
        ).toHaveCount(0);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForIssueReady(page);
        await page.getByRole('button', { name: 'View saved run', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveCount(0);
        await page.getByRole('button', { name: 'Review people', exact: true }).click();
        await expect(
            page.getByRole('textbox', { name: 'Email for Person 0', exact: true })
        ).toHaveValue('person0@test.com');
    });

    test('reviews a large roster in a fullscreen mobile workspace without horizontal overflow', async ({
        page,
    }, testInfo) => {
        test.setTimeout(180000);
        await page.setViewportSize({ width: 390, height: 844 });
        await selectBadgeType(page);
        await page.getByRole('button', { name: 'People', exact: true }).click();
        await page.getByTestId('issue-spreadsheet-file').setInputFiles({
            name: 'mobile.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(
                'Email,Name\n' +
                    Array.from(
                        { length: 60 },
                        (_, i) => `${i === 0 ? 'invalid' : `person${i}@test.com`},Person ${i}`
                    ).join('\n')
            ),
        });
        await expect(page.getByRole('heading', { name: 'Review spreadsheet' })).toBeVisible();
        const review = page.locator('#full-screen-modal.issue-spreadsheet-dialog.open').last();
        await expect(review).toBeVisible();
        await page.screenshot({
            animations: 'disabled',
            path: testInfo.outputPath('mobile-import-review.png'),
        });
        expect(await review.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(
            true
        );
        await page.getByRole('button', { name: 'Add People', exact: true }).click();
        await expect(page.getByRole('table')).toHaveCount(0);
        await page.getByRole('button', { name: 'Review people', exact: true }).click();
        await expect(page.getByRole('article')).toHaveCount(25);
        const dialog = page.locator('#full-screen-modal.issue-spreadsheet-dialog.open').last();
        expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(
            true
        );
        await page.screenshot({
            animations: 'disabled',
            path: testInfo.outputPath('mobile-recipient-editor.png'),
        });
        await page.getByRole('button', { name: 'Needs attention · 1', exact: true }).click();
        await expect(page.getByRole('article')).toHaveCount(1);
        await page
            .getByRole('textbox', { name: 'Email for Person 0', exact: true })
            .fill('person0@test.com');
        await expect(page.getByRole('article')).toHaveCount(1);
        await page.getByRole('searchbox', { name: 'Search people' }).click();
        await expect(page.getByRole('article')).toHaveCount(0);
        await page.getByRole('button', { name: '60 people', exact: true }).click();
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        await expect(page.getByText('Rows 26–50 of 60', { exact: true })).toBeVisible();
        const done = page.getByRole('button', { name: 'Done', exact: true });
        const rect = await done.boundingBox();
        expect(rect && rect.y + rect.height <= 844).toBeTruthy();
        await done.click();
        await expect(page.getByRole('heading', { name: 'Review people', exact: true })).toHaveCount(
            0
        );
    });

    test('pastes a headerless spreadsheet into the people search', async ({ page }) => {
        await selectBadgeType(page);
        await page.getByRole('button', { name: /specific people/i }).click();
        await page.getByPlaceholder('Search people...').evaluate(element => {
            const event = new Event('paste', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'clipboardData', {
                value: { getData: () => 'ada@test.com\tAda\ngrace@test.com\tGrace' },
            });
            element.dispatchEvent(event);
        });
        await expect(page.getByRole('heading', { name: 'Review spreadsheet' })).toBeVisible();
        await page.getByRole('button', { name: 'Add People', exact: true }).click();
        await page.getByRole('button', { name: 'Review people', exact: true }).click();
        await expect(page.getByRole('textbox', { name: /Email for Ada/i })).toBeVisible();
    });

    test('issues 250 people through queued chunks and retries only the failed row after reload', async ({
        page,
    }, testInfo) => {
        // Includes cold app startup, 250-row validation, reload and a second seed sign-in.
        test.setTimeout(300000);
        network.on('profile.signingAuthorities', () => [
            {
                relationship: { name: 'lca-sa' },
                signingAuthority: {
                    name: 'lca-sa',
                    endpoint: 'http://localhost:5000/api',
                    did: 'did:web:signer.test',
                },
            },
        ]);
        network.on('utilities.getChallenges', () =>
            Array.from({ length: 100 }, (_, i) => `test-challenge-${i}`)
        );
        let releaseBatch!: () => void;
        const batchGate = new Promise<void>(resolve => {
            releaseBatch = resolve;
        });
        await page.route(/\/trpc\/.*inbox\.getBatch/, async route => {
            await batchGate;
            await route.fallback();
        });
        const submissions: IssueInboxCredentialBatch[] = [];
        let templateCount = 0;
        network.on('boost.createBoost', () => {
            templateCount++;
            return 'lc:network:localhost%3A4000/trpc:boost:mock-template';
        });
        network.on('inbox.issueBatch', input => {
            const body = input as IssueInboxCredentialBatch;
            submissions.push(body);
            return {
                batchId: body.requestId,
                status: 'QUEUED',
                createdAt: new Date().toISOString(),
            };
        });
        network.on('inbox.getBatch', () => {
            const body = submissions.at(-1)!;
            const failed = submissions.length === 1 ? 1 : 0;
            return {
                batchId: body.requestId!,
                createdAt: new Date().toISOString(),
                done: true,
                status: 'COMPLETED',
                items: body.items.map((item, index) => ({
                    index,
                    state: 'COMPLETED',
                    result:
                        failed && index === 7
                            ? {
                                  success: false,
                                  index,
                                  error: { code: 'BAD_REQUEST', message: 'Invalid row' },
                              }
                            : {
                                  success: true,
                                  index,
                                  status: 'PENDING',
                                  issuanceId: `sent-${submissions.length}-${index}`,
                                  recipient: item.recipient,
                              },
                })),
                summary: {
                    total: body.items.length,
                    succeeded: body.items.length - failed,
                    failed,
                    deduplicated: 0,
                    completed: body.items.length,
                    pending: 0,
                    unconfirmed: 0,
                },
            } satisfies InboxBatchStatus;
        });
        try {
            await selectBadgeType(page);
            await fillName(page, 'Batch Badge');
            await page.getByRole('button', { name: /specific people/i }).click();
            await page.getByTestId('issue-spreadsheet-file').setInputFiles({
                name: '250.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(
                    'Email,Name\n' +
                        Array.from(
                            { length: 250 },
                            (_, i) => `person${i}@test.com,Person ${i}`
                        ).join('\n')
                ),
            });
            await page.getByRole('button', { name: 'Add People', exact: true }).click();
            await page
                .getByRole('button', { name: 'Review people', exact: true })
                .scrollIntoViewIfNeeded();
            await page.emulateMedia({ reducedMotion: 'no-preference' });
            await issueButton(page).click();
            await expect.poll(() => submissions.length).toBe(1);
            const flyer = page.locator('.batch-delivery-credential').first();
            await expect(flyer).toBeInViewport();
            await expect(
                page.getByRole('button', { name: 'View delivery status', exact: true })
            ).toBeInViewport();
            await expect
                .poll(() => flyer.evaluate(element => getComputedStyle(element).animationName))
                .not.toBe('none');
            const scene = page.locator('.batch-delivery-illustration');
            const card = page.getByTestId('issuance-progress');
            const sceneBounds = await scene.boundingBox();
            const cardBounds = await card.boundingBox();
            expect(sceneBounds!.width).toBeGreaterThan(cardBounds!.width * 0.85);
            const start = await flyer.boundingBox();
            await expect
                .poll(async () => Math.abs((await flyer.boundingBox())!.x - start!.x))
                .toBeGreaterThan(30);
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.screenshot({
                path: testInfo.outputPath('batch-delivery-scene.png'),
                animations: 'disabled',
            });
            await expect
                .poll(() => flyer.evaluate(element => getComputedStyle(element).animationName))
                .toBe('none');
            await page.setViewportSize({ width: 390, height: 844 });
            const phoneScene = await scene.boundingBox();
            expect(phoneScene!.height).toBeLessThanOrEqual(96);
            expect(phoneScene!.x).toBeGreaterThanOrEqual(0);
            expect(phoneScene!.x + phoneScene!.width).toBeLessThanOrEqual(390);
            expect(await scene.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(
                'rgb(229, 244, 252)'
            );
            await page.screenshot({ path: testInfo.outputPath('batch-credentials-phone.png') });
            await page.setViewportSize({ width: 1440, height: 1000 });
            await page.emulateMedia({ reducedMotion: 'no-preference' });
            await page.getByRole('button', { name: 'View delivery status', exact: true }).click();
            await expect(
                page.getByRole('heading', { name: 'Delivery status', exact: true })
            ).toBeVisible();
            const status = page.getByRole('combobox', { name: 'Status', exact: true });
            await status.selectOption('queued');
            await expect(page.getByText('Rows 1–25 of 250', { exact: true })).toBeVisible();
            await status.selectOption('ready');
            await expect(page.getByText('Rows 0–0 of 0', { exact: true })).toBeVisible();
            await status.selectOption('sent');
            await expect(page.getByText('Rows 0–0 of 0', { exact: true })).toBeVisible();
            releaseBatch();
            await expect(page.getByText('Rows 1–25 of 249', { exact: true })).toBeVisible({
                timeout: 30000,
            });
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await expect(
                page.getByRole('heading', { name: '249 sent · 1 failed', exact: true })
            ).toBeVisible({ timeout: 30000 });
            expect(submissions.map(body => body.items.length)).toEqual([100, 100, 50]);
            expect(templateCount).toBe(1);
            await page
                .getByRole('button', { name: 'Review delivery issues · 1', exact: true })
                .click();
            await expect(
                page.getByRole('heading', { name: 'Delivery status', exact: true })
            ).toBeVisible();
            await expect(page.getByText('person7@test.com', { exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await page.getByRole('button', { name: 'Review people', exact: true }).click();
            const failedEmail = page.getByRole('textbox', {
                name: 'Email for Person 7',
                exact: true,
            });
            await expect(failedEmail).toBeEnabled();
            await expect(
                page
                    .getByRole('row')
                    .filter({ has: failedEmail })
                    .getByRole('button', { name: 'Skip', exact: true })
            ).toBeDisabled();
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await page.reload({ waitUntil: 'domcontentloaded' });
            // The HAR seed login keeps its private key in memory; reauthenticate after reload.
            await waitForAuthenticatedState(page, {
                path: '/issue',
                profileId: TEST_USER_PROFILE_ID,
                waitUntil: 'domcontentloaded',
            });
            await waitForIssueReady(page);
            await page
                .getByRole('button', { name: 'Restore Saved Run', exact: true })
                .click({ timeout: 30000 });
            await page.getByRole('button', { name: 'Retry Failed', exact: true }).click();
            await expect(
                page.getByRole('heading', { name: '250 sent · 0 failed', exact: true })
            ).toBeVisible({ timeout: 30000 });
            expect(submissions[3].items).toHaveLength(1);
            expect(submissions[3].items[0].idempotencyKey).toBe(
                submissions[0].items[7].idempotencyKey
            );
            expect(submissions[3].requestId).not.toBe(submissions[0].requestId);
            expect(templateCount).toBe(1);
        } finally {
            releaseBatch();
        }
    });

    for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
    ]) {
        test(`maps imported columns through the workspace at ${viewport.width}px`, async ({
            page,
        }, testInfo) => {
            await page.setViewportSize(viewport);
            test.setTimeout(180000);
            await page
                .getByRole('button', {
                    name: 'Start from a link, file, or spreadsheet',
                    exact: true,
                })
                .click();
            const csv =
                'Email,Name,Quiz Score,Final Grade,Hours,Completed Date,Evidence,Portfolio,Student Code\nada@test.com,Ada,95%,A-,12,03/04/2024,https://proof.test/ada,https://portfolio.test/ada,0012\nbob@test.com,Bob,85%,B+,8,04/04/2024,https://proof.test/bob,https://portfolio.test/bob,0009\ncarol@test.com,Carol,75%,C,10,05/04/2024,https://proof.test/carol,https://portfolio.test/carol,0007\ndan@test.com,Dan,100%,A,5,06/04/2024,https://proof.test/dan,https://portfolio.test/dan,0005';
            await page.getByTestId('issue-import-file').setInputFiles({
                name: 'grades.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(csv),
            });
            await page.screenshot({
                animations: 'disabled',
                path: testInfo.outputPath('import-review.png'),
            });
            await page.getByRole('button', { name: 'Add People', exact: true }).click();
            await page.getByRole('button', { name: 'Map columns', exact: true }).click();
            await expect(
                page.getByRole('button', { name: 'Include Quiz Score', exact: true })
            ).toBeDisabled();
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await selectBadgeType(page);
            await fillName(page, 'Spreadsheet Badge');
            await page.getByRole('button', { name: 'Map columns', exact: true }).click();
            await page.getByRole('button', { name: 'Include Quiz Score', exact: true }).click();
            await page.getByRole('button', { name: 'Include Final Grade', exact: true }).click();
            await page
                .getByRole('combobox', { name: 'Use Hours as', exact: true })
                .selectOption('credits');
            await expect(
                page.getByRole('button', { name: 'Include Hours', exact: true })
            ).toBeDisabled();
            await page.getByPlaceholder('For example, semester credit hours').fill('hours');
            await page.getByRole('button', { name: 'Include Hours', exact: true }).click();
            await page
                .getByRole('region', { name: 'Completed Date', exact: true })
                .getByText('Format options', { exact: true })
                .click();
            await page
                .getByRole('combobox', { name: /Spreadsheet date format/ })
                .selectOption('dmy');
            await page.getByRole('button', { name: 'Include Completed Date', exact: true }).click();
            await page.getByRole('button', { name: 'Include Evidence', exact: true }).click();
            await page.getByRole('button', { name: 'Include Portfolio', exact: true }).click();
            await page.getByRole('button', { name: 'Include Student Code', exact: true }).click();
            await page
                .getByRole('region', { name: 'Quiz Score', exact: true })
                .scrollIntoViewIfNeeded();
            await page.screenshot({
                animations: 'disabled',
                path: testInfo.outputPath('column-mapping.png'),
            });
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await expect(issueButton(page)).toBeEnabled();
            await page.getByRole('button', { name: 'Review people', exact: true }).click();
            await expect(
                page.getByRole('textbox', { name: 'Ada Quiz Score', exact: true })
            ).toHaveValue('95');
            await expect(
                page.getByRole('textbox', { name: 'Ada Final Grade', exact: true })
            ).toHaveValue('A-');
            await expect(
                page.getByRole('textbox', { name: 'Ada Student Code', exact: true })
            ).toHaveValue('0012');
            await expect(page.getByLabel('Ada Completed Date', { exact: true })).toHaveValue(
                '2024-04-03'
            );
            await expect(page.getByText('Apr 3, 2024', { exact: true })).toBeVisible();
            if (viewport.width > 991) {
                const tableView = page.getByRole('region', { name: 'Review people', exact: true });
                const email = page.getByRole('textbox', { name: 'Email for Ada', exact: true });
                // The modal entrance moves the whole table. Wait for aligned positions
                // rather than comparing two different animation frames.
                await expect
                    .poll(async () => {
                        const emailBounds = await email.boundingBox();
                        const dateBounds = await page
                            .getByLabel('Ada Completed Date', { exact: true })
                            .boundingBox();
                        return Math.abs(emailBounds!.y - dateBounds!.y);
                    })
                    .toBeLessThan(2);
                const before = await email.boundingBox();
                await tableView.evaluate(element => {
                    element.scrollLeft = element.scrollWidth;
                });
                await expect
                    .poll(() => tableView.evaluate(element => element.scrollLeft))
                    .toBeGreaterThan(0);
                const after = await email.boundingBox();
                expect(Math.abs(after!.x - before!.x)).toBeLessThan(2);
                await tableView.evaluate(element => {
                    element.scrollLeft = 0;
                });
                await tableView.press('ArrowRight');
                await expect
                    .poll(() => tableView.evaluate(element => element.scrollLeft))
                    .toBeGreaterThan(0);
                await tableView.evaluate(element => {
                    element.scrollLeft = 0;
                });
            }
            await page.screenshot({
                animations: 'disabled',
                path: testInfo.outputPath('recipient-fields.png'),
            });
            const datePicker = page.getByLabel('Ada Completed Date', { exact: true });
            await datePicker.fill('2024-04-04');
            await expect(page.getByText('Apr 4, 2024', { exact: true }).first()).toBeVisible();
            await datePicker.fill('2024-04-03');
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await page.getByRole('button', { name: 'Map columns', exact: true }).click();
            await page.getByRole('button', { name: 'Remove Quiz Score', exact: true }).click();
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await page.getByRole('button', { name: 'Review people', exact: true }).click();
            await expect(
                page.getByRole('textbox', { name: 'Ada Quiz Score', exact: true })
            ).toHaveCount(0);
            await expect(
                page.getByRole('textbox', { name: 'Ada Final Grade', exact: true })
            ).toHaveValue('A-');
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await page.getByRole('button', { name: 'Map columns', exact: true }).click();
            await page.getByRole('button', { name: 'Include Quiz Score', exact: true }).click();
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            // Type changes rebuild mapping fields while preserving corrected cells.
            await page.getByRole('button', { name: 'Review people', exact: true }).click();
            await page.getByLabel('Ada Quiz Score', { exact: true }).fill('96');
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await page.getByRole('button', { name: 'Certificate', exact: true }).click();
            await page.getByRole('button', { name: 'Review people', exact: true }).click();
            await expect(page.getByLabel('Ada Quiz Score', { exact: true })).toHaveValue('96');
            await expect(page.getByLabel('Ada Final Grade', { exact: true })).toHaveValue('A-');
            await page.getByRole('button', { name: 'Done', exact: true }).click();
            await page.getByRole('button', { name: 'Next person', exact: true }).click();
            await expect(page.getByText('2 of 4 · Bob', { exact: true })).toBeVisible();
            await page.getByRole('button', { name: 'JSON', exact: true }).click();
            const json = JSON.parse(await page.locator('textarea.font-mono').inputValue());
            expect(json.credentialSubject.result).toHaveLength(2);
            expect(json.evidence).toHaveLength(2);
            expect(
                json.evidence.every((item: { type: string[] }) => item.type[0] === 'Evidence')
            ).toBe(true);
            expect(json.awardedDate).toMatch(/sheet_completed_date/);
            expect(JSON.stringify(json['@context'])).not.toContain('ctx.learncard');
            await page.screenshot({
                animations: 'disabled',
                path: testInfo.outputPath('mapped-roster.png'),
                fullPage: true,
            });
        });
    }

    test('imports URL-first pasted rows through the import modal without treating them as a link', async ({
        page,
    }) => {
        await page
            .getByRole('button', { name: 'Start from a link, file, or spreadsheet', exact: true })
            .click();
        await page
            .locator('textarea')
            .fill(
                'https://proof.test/ada\tada@test.com\tAda\nhttps://proof.test/bob\tbob@test.com\tBob'
            );
        await page.getByRole('button', { name: /Bring it in/i }).click();
        await expect(page.getByRole('heading', { name: 'Review spreadsheet' })).toBeVisible();
        await page.getByRole('button', { name: 'Add People', exact: true }).click();
        await page.getByRole('button', { name: 'Review people', exact: true }).click();
        await expect(page.getByRole('textbox', { name: 'Email for Ada', exact: true })).toHaveValue(
            'ada@test.com'
        );
    });

    // Completing an issuance (self / person / link) is a real signing +
    // multi-service backend flow — it lives in the real-backend @e2e spec, not
    // here. This tier covers the offline UI logic up to the issue action.

    test('shows a retry-able error when issuance fails', async ({ page }) => {
        await selectBadgeType(page);
        await fillName(page, 'Mocked Error Badge');
        // Abort the boost/network call so the friendly retry-able error path renders.
        await page.route(/\/\/localhost:4000\/trpc/, route => route.abort('failed'));
        await issueButton(page).click();
        await expect(page.getByRole('button', { name: /try again/i })).toBeVisible({
            timeout: 30_000,
        });
    });
});
