import { test, expect } from '@playwright/test';

const MOCK_NOTIFICATIONS_DATA = {
    pageParams: [undefined],
    pages: [
        {
            cursor: '2023-10-21T16:17:36.976Z',
            hasMore: false,
            notifications: [
                {
                    actionStatus: 'COMPLETED',
                    archived: false,
                    data: {
                        vcUris: [
                            'lc:network:scoutnetwork.org/trpc:credential:561799e5-91c4-43d7-99da-660fdc52a039',
                        ],
                    },
                    from: {
                        did: 'did:web:scoutnetwork.org:users:jacksonsmith',
                        displayName: 'John Doe',
                        image: 'https://lh3.googleusercontent.com/a/AAcHTtebJgi3Gscw5lrAfrLL23noIykd6b2NGqyDnQOUD8zVT21L=s96-c',
                        notificationsWebhook: 'https://api.scoutnetwork.org/api/notifications/send',
                        profileId: 'jacksonsmith',
                    },
                    message: {
                        body: 'John Doe has boosted you!',
                        title: 'Boost Received',
                    },
                    read: true,
                    sent: '2024-08-19T00:25:52.738Z',
                    to: {
                        did: 'did:web:scoutnetwork.org:users:demo-account',
                        displayName: 'Mateusz Narkiewicz',
                        image: 'https://cdn.filestackcontent.com/9muqhJySBungfZWYI5O8',
                        notificationsWebhook: 'https://api.scoutnetwork.org/api/notifications/send',
                        profileId: 'demo-account',
                    },
                    type: 'BOOST_RECEIVED',
                    _id: 'c4de3ddf-7637-4a36-8303-356f711ff705',
                },
                {
                    archived: false,
                    from: {
                        did: 'did:web:scoutnetwork.org:users:jacksonsmith',
                        displayName: 'John Doe',
                        image: 'https://lh3.googleusercontent.com/a/AAcHTtebJgi3Gscw5lrAfrLL23noIykd6b2NGqyDnQOUD8zVT21L=s96-c',
                        notificationsWebhook: 'https://api.scoutnetwork.org/api/notifications/send',
                        profileId: 'jacksonsmith',
                    },
                    message: {
                        body: 'John Doe has accepted your connection request!',
                        title: 'Connection Accepted',
                    },
                    read: true,
                    sent: '2024-08-19T00:24:02.633Z',
                    to: {
                        did: 'did:web:scoutnetwork.org:users:demo-account',
                        displayName: 'Mateusz Narkiewicz',
                        image: 'https://cdn.filestackcontent.com/9muqhJySBungfZWYI5O8',
                        notificationsWebhook: 'https://api.scoutnetwork.org/api/notifications/send',
                        profileId: 'demo-account',
                    },
                    type: 'CONNECTION_ACCEPTED',
                    _id: '283a5c98-76ab-41a3-aa68-ffb0506d11c2',
                },
            ],
        },
    ],
};

const MOCK_ARCHIVED_NOTIFICATIONS_DATA = {
    pageParams: [undefined],
    pages: [
        {
            cursor: '2023-10-21T16:17:36.976Z',
            hasMore: false,
            notifications: [
                {
                    actionStatus: 'COMPLETED',
                    archived: true,
                    data: {
                        vcUris: [
                            'lc:network:scoutnetwork.org/trpc:credential:561799e5-91c4-43d7-99da-660fdc52a039',
                        ],
                    },
                    from: {
                        did: 'did:web:scoutnetwork.org:users:jacksonsmith',
                        displayName: 'John Doe',
                        image: 'https://lh3.googleusercontent.com/a/AAcHTtebJgi3Gscw5lrAfrLL23noIykd6b2NGqyDnQOUD8zVT21L=s96-c',
                        notificationsWebhook: 'https://api.scoutnetwork.org/api/notifications/send',
                        profileId: 'jacksonsmith',
                    },
                    message: {
                        body: 'John Doe has boosted you!',
                        title: 'Boost Received',
                    },
                    read: true,
                    sent: '2024-08-19T00:25:52.738Z',
                    to: {
                        did: 'did:web:scoutnetwork.org:users:demo-account',
                        displayName: 'Mateusz Narkiewicz',
                        image: 'https://cdn.filestackcontent.com/9muqhJySBungfZWYI5O8',
                        notificationsWebhook: 'https://api.scoutnetwork.org/api/notifications/send',
                        profileId: 'demo-account',
                    },
                    type: 'BOOST_RECEIVED',
                    _id: 'c4de3ddf-7637-4a36-8303-356f711ff705',
                },
            ],
        },
    ],
};

test.describe('Renders All Notifications', () => {
    test('Render Notification items', async ({ page }) => {
        await page.route('**/notifications*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_NOTIFICATIONS_DATA),
            });
        });

        await page.goto('https://localhost:3000/notifications');
        await page.waitForLoadState('networkidle');

        await expect(page.getByText('Boost Received')).toBeVisible();
        await expect(page.getByText('John Doe has boosted you!')).toBeVisible();

        await expect(page.getByText('Connection Accepted')).toBeVisible();
        await expect(
            page.getByText('John Doe has accepted your connection request!')
        ).toBeVisible();
    });

    test('Render Archived Notification items', async ({ page }) => {
        await page.route('**/notifications*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_ARCHIVED_NOTIFICATIONS_DATA),
            });
        });

        await page.goto('https://localhost:3000/notifications');
        await page.waitForLoadState('networkidle');

        await expect(page.getByText('Boost Received')).toBeVisible();
        await expect(page.getByText('John Doe has boosted you!')).toBeVisible();
    });
});
