import ar from '../public/locales/ar/translation.json';
import { test, expect } from './fixtures/mocked-test';
import { installNetwork, ABORT } from './mocks/network';
import type { BrainOutputs, CloudOutputs } from './mocks/trpc';
import { mockLaunchDarkly } from './route.helpers';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';
import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';

const uri = 'lc:network:localhost%3A4000/trpc:contract:referral-mock';
const profile = (profileId: string, displayName: string) => ({
    profileId,
    displayName,
    did: `did:web:localhost%3A4000:users:${profileId}`,
    shortBio: '',
    bio: '',
});
const owner = profile('partner-org', 'Partner Org');
const referrer = profile('referrer-org', 'Referrer Org');
const contract = {
    uri,
    owner,
    recipients: [referrer],
    audienceVersion: 1,
    name: 'Partner services',
    image: '',
    description: 'Career support and resources.',
    reasonForAccessing: 'To provide career services',
    createdAt: '2026-09-30T00:00:00.000Z',
    updatedAt: '2026-09-30T00:00:00.000Z',
    contract: {
        read: { personal: {}, credentials: { categories: {} } },
        write: { personal: {}, credentials: { categories: {} } },
    },
} satisfies BrainOutputs['contracts']['getConsentFlowContract'];

const setup = async (
    page: Page,
    options: {
        tenant?: boolean;
        flag?: boolean;
        connected?: boolean;
        recipients?: boolean;
        readError?: boolean;
    } = {}
) => {
    await mockLaunchDarkly(page, { enableContractRequests: { value: options.flag ?? true } });
    await page.route('**/tenant-config.json', async route => {
        const response = await route.fetch();
        const config = await response.json();
        config.features.contractRequests = options.tenant ?? true;
        await route.fulfill({ json: config });
    });
    await page.route('**/__tenant-config', route =>
        route.fulfill({ json: { features: { contractRequests: options.tenant ?? true } } })
    );
    const mock = await installNetwork(page);
    mock.on(
        'user.getDids',
        () =>
            [
                profile(TEST_USER_PROFILE_ID, 'Learner').did,
                'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzjiN7Uh4AHoqH',
            ] satisfies CloudOutputs['user']['getDids']
    );
    mock.on('user.addDid', () => true satisfies CloudOutputs['user']['addDid']);
    mock.on(
        'index.get',
        () => ({ records: [], hasMore: false }) satisfies CloudOutputs['index']['get']
    );
    mock.on('index.count', () => 0 satisfies CloudOutputs['index']['count']);
    mock.on('utilities.getChallenges', () => Array.from({ length: 100 }, () => randomUUID()));
    mock.on('utilities.getEncryptionKey', () => 'a'.repeat(64));
    mock.on(
        'inbox.finalize',
        () =>
            ({
                processed: 0,
                claimed: 0,
                errors: 0,
                guardianPending: 0,
                verifiableCredentials: [],
                deliveries: [],
            }) satisfies BrainOutputs['inbox']['finalize']
    );
    mock.on(
        'inbox.getMyInboxDeliveries',
        () =>
            ({
                records: [],
                hasMore: false,
            }) satisfies BrainOutputs['inbox']['getMyInboxDeliveries']
    );
    mock.on('utilities.getDid', () => 'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzjiN7Uh4AHoqH');
    mock.on('profile.getProfile', () => profile(TEST_USER_PROFILE_ID, 'Learner'));
    mock.on('profile.createProfile', () => profile(TEST_USER_PROFILE_ID, 'Learner').did);
    let status: 'pending' | 'denied' | 'cancelled' | 'accepted' = options.connected
        ? 'accepted'
        : 'pending';
    let archived = false;
    let seen = false;
    let denied = false;
    let readError = options.readError ?? false;
    const current = {
        ...contract,
        recipients: options.recipients === false ? [] : [referrer],
        audienceVersion: options.recipients === false ? 0 : 1,
    };
    mock.on('contracts.getConsentFlowContract', () => current);
    mock.on('profile.getOtherProfile', () => referrer);
    mock.on('profile.updateProfile', () => true);
    mock.on(
        'profile.pendingConnectionPrompts',
        () => [] satisfies BrainOutputs['profile']['pendingConnectionPrompts']
    );
    mock.on(
        'activity.getMyActivities',
        () =>
            ({ records: [], hasMore: false }) satisfies BrainOutputs['activity']['getMyActivities']
    );
    mock.on('contracts.getAllCredentialsForTerms', () => ({ records: [], hasMore: false }));
    mock.on('boost.getPaginatedBoosts', () => ({ records: [], hasMore: false }));
    mock.on('skillFrameworks.getAllAvailableFrameworks', () => ({ records: [], hasMore: false }));
    mock.on('contracts.getRequestStatusForProfile', () =>
        readError
            ? ABORT
            : ({
                  profile: profile(TEST_USER_PROFILE_ID, 'Learner'),
                  requestId: 'referral-1',
                  requestedBy: 'referrer-org',
                  status,
                  readStatus: seen ? 'seen' : 'unseen',
                  message: 'Personal career support',
              } satisfies BrainOutputs['contracts']['getRequestStatusForProfile'])
    );
    mock.on(
        'contracts.getAllContractRequestsForProfile',
        () =>
            [
                {
                    contract: { ...current.contract, uri, name: current.name },
                    profile: owner,
                    requestId: 'referral-1',
                    requestedBy: 'referrer-org',
                    status,
                },
            ] satisfies BrainOutputs['contracts']['getAllContractRequestsForProfile']
    );
    mock.on('contracts.markContractRequestAsSeen', () => {
        seen = true;
        return true;
    });
    mock.on('contracts.denyContractRequest', () => {
        denied = true;
        status = 'denied';
        return true;
    });
    mock.on('notifications.updateNotificationMeta', () => {
        archived = true;
        return true;
    });
    const notifications = () => ({
        hasMore: false,
        notifications: archived
            ? []
            : [
                  {
                      _id: 'referral-alert',
                      type: 'CONSENT_FLOW_TRANSACTION',
                      from: referrer,
                      to: { profileId: TEST_USER_PROFILE_ID },
                      sent: '2026-09-30T00:00:00.000Z',
                      message: {
                          title: 'Referral received',
                          body: 'Referrer Org has referred you to Partner Org.',
                      },
                      data: {
                          metadata: {
                              type: 'contract-request',
                              contractUri: uri,
                              requestId: 'referral-1',
                              requestedBy: 'referrer-org',
                          },
                      },
                  },
              ],
    });
    mock.on('notifications.notifications', notifications);
    mock.on('notifications.queryNotifications', notifications);
    mock.on('notifications.markAllNotificationsRead', () => true);
    mock.on('contracts.getConsentedContracts', () => ({
        hasMore: false,
        records: options.connected
            ? [
                  {
                      uri: 'lc:network:localhost%3A4000/trpc:terms:mock',
                      contract: current,
                      consenter: profile(TEST_USER_PROFILE_ID, 'Learner'),
                      status: 'live',
                      terms: {
                          read: {
                              personal: {},
                              credentials: { categories: {}, sharing: false, shareAll: false },
                          },
                          write: { personal: {}, credentials: { categories: {} } },
                      },
                  },
              ]
            : [],
    }));
    mock.on('contracts.getConsentFlowCredentials', () => ({ hasMore: false, records: [] }));
    await waitForAuthenticatedState(
        page,
        {
            path: '/wallet',
            profileId: TEST_USER_PROFILE_ID,
        },
        15_000
    );
    await expect(page.getByRole('heading', { name: 'Passport', exact: true })).toBeVisible({
        timeout: 30_000,
    });
    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
    // A full navigation initializes the account again before notifications load.
    // Wait for that observable UI state, including on a cold CI server.
    const notification = page.getByTestId(
        (options.tenant ?? true) && (options.flag ?? true)
            ? 'contract-request-card'
            : 'notification-title'
    );
    await expect(notification).toBeVisible({ timeout: 30_000 });
    return {
        seen: () => seen,
        denied: () => denied,
        archived: () => archived,
        setReadError: (value: boolean) => {
            readError = value;
        },
        cancel: () => {
            status = 'cancelled';
        },
    };
};

test.use({ screenshot: 'only-on-failure' });

test.describe('Generic referrals @mocked', () => {
    test('S1 referral card and target seen state', async ({ page }) => {
        const state = await setup(page);
        const card = page.getByTestId('contract-request-card');
        await expect(card).toContainText('Referrer Org has referred you to Partner Org.');
        await expect(card.getByRole('button', { name: 'Accept & Connect' })).toBeVisible();
        await expect(card.getByRole('button', { name: 'View Details' })).toBeVisible();
        await expect.poll(state.seen).toBe(true);
    });
    for (const gate of ['tenant', 'flag'] as const)
        test(`S2 disabled ${gate} preserves default notification`, async ({ page }) => {
            await setup(page, { [gate]: false });
            await expect(page.getByTestId('notification-title')).toContainText(
                'Referral received',
                { timeout: 30_000 }
            );
            await expect(page.getByTestId('contract-request-card')).toHaveCount(0);
            await page.goto('/privacy-and-data', { waitUntil: 'domcontentloaded' });
            await expect(page.getByRole('heading', { name: /Privacy/ }).first()).toBeAttached({
                timeout: 30_000,
            });
            await expect(page.getByTestId('pending-contract-requests')).toHaveCount(0);
        });
    test('S3 details disclose purpose, message and all recipients', async ({ page }) => {
        await setup(page);
        await page.getByRole('button', { name: 'View Details' }).click();
        const details = page.getByTestId('contract-request-details');
        await expect(details).toContainText('To provide career services');
        await expect(details).toContainText('Personal career support');
        await expect(details.getByTestId('contract-request-shared-with')).toContainText(
            'Partner Org'
        );
        await expect(details.getByTestId('contract-request-shared-with')).toContainText(
            'Referrer Org'
        );
        await page.screenshot({ path: '/tmp/lc2226-pr3-referral-details.png', fullPage: true });
    });
    test('S4 explicit confirmed decline', async ({ page }) => {
        const state = await setup(page);
        await page.getByRole('button', { name: 'View Details' }).click();
        await page
            .getByTestId('contract-request-details')
            .getByRole('button', { name: 'Decline', exact: true })
            .click();
        await page
            .getByRole('dialog')
            .last()
            .getByRole('button', { name: 'Decline', exact: true })
            .click();
        await expect.poll(state.denied).toBe(true);
        await expect(page.getByTestId('contract-request-card')).toContainText('Declined');
    });
    for (const recipients of [true, false])
        test(`S5 opens data review before consent (recipients=${recipients})`, async ({ page }) => {
            await setup(page, { recipients });
            await page.getByRole('button', { name: 'Accept & Connect' }).click();
            if (recipients) {
                await expect(page.getByTestId('consent-shared-with')).toContainText('Partner Org');
                await expect(page.getByTestId('consent-shared-with')).toContainText('Referrer Org');
            } else {
                await expect(page.getByText('To provide career services').last()).toBeVisible();
                await expect(page.getByTestId('consent-shared-with')).toHaveCount(0);
            }
        });
    test('S6 connected sharing details disclose the audience', async ({ page }) => {
        await setup(page, { connected: true });
        await page.goto('/privacy-and-data', { waitUntil: 'domcontentloaded' });
        await page.getByText('Partner services', { exact: true }).click();
        await expect(page.getByTestId('contract-shared-with')).toContainText('Partner Org');
        await expect(page.getByTestId('contract-shared-with')).toContainText('Referrer Org');
    });
    test('S8 request read failure offers retry without consent', async ({ page }) => {
        const state = await setup(page, { readError: true });
        const card = page.getByTestId('contract-request-card');
        await expect(card.getByRole('alert')).toBeVisible({ timeout: 30_000 });
        await expect(card.getByRole('button', { name: 'Accept & Connect' })).toHaveCount(0);
        state.setReadError(false);
        await card.getByRole('button', { name: 'Try Again' }).click();
        await expect(card.getByRole('button', { name: 'Accept & Connect' })).toBeVisible();
    });
    test('S9 Arabic referral details fit a mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await setup(page);
        await page
            .context()
            .addCookies([
                { name: 'PARAGLIDE_LOCALE', value: 'ar', url: new URL(page.url()).origin },
            ]);
        await page.evaluate(() => localStorage.setItem('i18n.language', 'ar'));
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page
            .getByTestId('contract-request-card')
            .getByRole('button', { name: ar.contractRequests.details })
            .click();
        const details = page.getByTestId('contract-request-details');
        await expect(
            details.getByRole('button', { name: ar.contractRequests.accept })
        ).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        await expect
            .poll(async () => {
                const box = await details.boundingBox();
                return Boolean(box && box.x >= 0 && box.x + box.width <= 391);
            })
            .toBe(true);
        await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
            .toBeLessThanOrEqual(390);
        await expect
            .poll(() =>
                details.evaluate(element => {
                    let node: HTMLElement | null = element;
                    while (node) {
                        if (Number(getComputedStyle(node).opacity) < 0.99) return false;
                        node = node.parentElement;
                    }
                    return true;
                })
            )
            .toBe(true);
        await page.screenshot({ path: '/tmp/lc2226-pr3-referral-mobile-ar.png', fullPage: true });
    });
    test('S7 dismissed alert remains recoverable from pending invitations', async ({ page }) => {
        const state = await setup(page);
        await page.getByRole('button', { name: 'Dismiss invitation' }).click();
        await expect.poll(state.archived).toBe(true);
        await expect(page.getByTestId('contract-request-card')).toHaveCount(0);
        expect(state.denied()).toBe(false);
        await page.goto('/privacy-and-data', { waitUntil: 'domcontentloaded' });
        await page.getByTestId('pending-contract-requests').getByText('Partner services').click();
        await expect(
            page
                .getByTestId('contract-request-details')
                .getByRole('button', { name: 'Accept & Connect' })
        ).toBeVisible();
    });
});
