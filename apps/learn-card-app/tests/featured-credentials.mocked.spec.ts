import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import type { BrainOutputs, CloudOutputs } from './mocks/trpc';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';
import type { Page } from '@playwright/test';

const boostUri = (id: string) => `lc:network:localhost%3A4000/trpc:boost:${id}`;

const testUser = {
    profileId: TEST_USER_PROFILE_ID,
    displayName: 'User From Seed',
    shortBio: '',
    bio: '',
    did: `did:web:localhost%3A4000:users:${TEST_USER_PROFILE_ID}`,
    profileVisibility: 'public' as const,
    showEmail: false,
    allowConnectionRequests: 'anyone' as const,
    isServiceProfile: false,
    notificationsWebhook: 'http://localhost:5100/api/notifications/send',
    role: '',
    dob: '',
    highlightedCredentials: [boostUri('team-player'), boostUri('mentor')],
};

const contact = {
    profileId: 'ada',
    displayName: 'Ada Learner',
    shortBio: 'Lifelong learner',
    bio: '',
    did: 'did:web:localhost%3A4000:users:ada',
    image: '',
    isServiceProfile: false,
    connectedAt: '2026-09-30T00:00:00.000Z',
    // Stored order, one unresolvable entry, and one repeat: the card must keep the
    // order, skip what cannot resolve, and never show a bubble twice.
    highlightedCredentials: [
        boostUri('team-player'),
        boostUri('missing'),
        boostUri('mentor'),
        boostUri('team-player'),
    ],
};

const boostTemplate = (name: string) => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer: testUser.did,
    name,
    credentialSubject: {
        id: 'did:example:123',
        type: ['AchievementSubject'],
        achievement: {
            achievementType: 'Badge',
            criteria: { narrative: 'Awarded for outstanding collaboration.' },
            description: `${name} badge awarded by User From Seed.`,
            name,
            type: ['Achievement'],
        },
    },
    display: { backgroundColor: '#18224E', displayType: 'badge' },
    validFrom: '2026-07-03T16:43:26.426Z',
});

const templates: Record<string, ReturnType<typeof boostTemplate>> = {
    [boostUri('team-player')]: boostTemplate('Team Player'),
    [boostUri('mentor')]: boostTemplate('Mentor'),
};

const emptyPage = { hasMore: false, records: [] };

const setup = async (page: Page) => {
    const mock = await installNetwork(page);

    mock.on('profile.getProfile', () => testUser satisfies BrainOutputs['profile']['getProfile']);
    mock.on('profile.getOtherProfile', input => {
        const { profileId } = input as { profileId: string };
        return (
            profileId === contact.profileId ? contact : testUser
        ) satisfies BrainOutputs['profile']['getOtherProfile'];
    });
    mock.on(
        'profile.paginatedConnections',
        () =>
            ({
                hasMore: false,
                records: [contact],
            }) satisfies BrainOutputs['profile']['paginatedConnections']
    );
    mock.on(
        'profile.paginatedConnectionRequests',
        () => emptyPage satisfies BrainOutputs['profile']['paginatedConnectionRequests']
    );
    mock.on(
        'profile.paginatedPendingConnections',
        () => emptyPage satisfies BrainOutputs['profile']['paginatedPendingConnections']
    );
    mock.on('profile.searchProfiles', () => [] satisfies BrainOutputs['profile']['searchProfiles']);
    mock.on('profile.blocked', () => [] satisfies BrainOutputs['profile']['blocked']);
    mock.on('profile.pendingConnectionPrompts', () => []);
    mock.on('profile.updateProfile', () => true satisfies BrainOutputs['profile']['updateProfile']);
    // A missing boost resolves to nothing, which the client rejects as unresolvable.
    mock.on('storage.resolve', input => templates[(input as { uri: string }).uri] ?? null);
    mock.on('credential.sentCredentials', () => []);
    mock.on('credential.receivedCredentials', () => []);
    mock.on('activity.getMyCredentialLifecycleStatuses', () => ({}));
    mock.on('notifications.notifications', () => emptyPage);
    mock.on('inbox.getMyInboxDeliveries', () => emptyPage);
    mock.on('contracts.getConsentedContracts', () => emptyPage);
    mock.on('contracts.getAllCredentialsForTerms', () => emptyPage);
    mock.on('boost.getPaginatedBoosts', () => emptyPage);
    mock.on('skillFrameworks.getAllAvailableFrameworks', () => emptyPage);
    mock.on('preferences.getPreferencesForDid', () => ({}));
    mock.on('user.getDids', () => [testUser.did] satisfies CloudOutputs['user']['getDids']);
    mock.on('user.addDid', () => true satisfies CloudOutputs['user']['addDid']);
    mock.on('index.get', () => emptyPage satisfies CloudOutputs['index']['get']);
    mock.on('index.count', () => 0 satisfies CloudOutputs['index']['count']);
    mock.on('utilities.getEncryptionKey', () => 'a'.repeat(64));
    mock.on('inbox.finalize', () => ({
        processed: 0,
        claimed: 0,
        errors: 0,
        guardianPending: 0,
        results: [],
    }));

    await waitForAuthenticatedState(page, {
        path: '/contacts',
        nextPath: '/contacts',
        profileId: TEST_USER_PROFILE_ID,
        waitUntil: 'commit',
    });
};

const featuredBubbles = (page: Page) => page.getByRole('list', { name: 'Featured credentials' });

test.describe('Featured credentials on profile surfaces @mocked', () => {
    test.beforeEach(async ({ page }) => {
        await setup(page);
    });

    test('shows a contact featured credentials in stored order and opens one', async ({ page }) => {
        await page.getByText('Ada Learner').first().click();

        const bubbles = featuredBubbles(page);
        await expect(bubbles).toBeVisible({ timeout: 30_000 });
        await expect(bubbles.getByRole('button')).toHaveCount(2);
        await expect(bubbles.getByRole('button').nth(0)).toHaveAccessibleName(
            'View featured credential: Team Player'
        );
        await expect(bubbles.getByRole('button').nth(1)).toHaveAccessibleName(
            'View featured credential: Mentor'
        );

        await bubbles.getByRole('button').nth(1).click();

        await expect(page.locator('.vc-card-header-main-title').first()).toHaveText('Mentor', {
            timeout: 30_000,
        });
        await expect(page.getByText('Ada Learner').last()).toBeVisible();
    });

    test('shows the signed-in user featured credentials on their own identity card', async ({
        page,
    }) => {
        await page.getByRole('button', { name: 'Open profile' }).first().click();

        const bubbles = featuredBubbles(page);
        await expect(bubbles).toBeVisible({ timeout: 30_000 });
        await expect(bubbles.getByRole('button')).toHaveCount(2);

        await bubbles.getByRole('button').nth(0).click();

        await expect(page.locator('.vc-card-header-main-title').first()).toHaveText('Team Player', {
            timeout: 30_000,
        });
    });
});
