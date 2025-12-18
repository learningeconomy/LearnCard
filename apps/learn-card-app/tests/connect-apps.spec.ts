import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import {
    getCredentialsSharedWithSmartResume,
    getSmartResumeProfileIdAndChallenge,
    getUnknownAppProfileIdAndChallenge,
    mockRoutes,
    testAchievementCredential,
    MOCK_APP_REGISTRY,
    UNKNOWN_APP,
} from './connect-apps.helpers';
import { locatorExists } from './test.helpers';

/* test.use({
  ignoreHTTPSErrors: true,
  storageState: 'demoState.json',
  numberOfWorkers: 1
}); */

// test with all mocked network calls to test UI
//   more granular
// Full e2e
//   still mock credential list
//   limit number of workers

test.beforeEach(async ({ page }) => {
    mockRoutes(page);
});

// might need to run these tests in serial cause disconnecting from the SmartResume profile in one test
//   can cause another test to fail
// test.describe.configure({ mode: 'serial' });

test.describe('Connect Apps', () => {
    test.skip('Connect SmartResume e2e', async ({ page, browserName }) => {
        test.skip(browserName === 'webkit', 'Webkit is broken for me right now');

        await page.goto('/launchpad');

        const appItems = page
            .getByRole('list')
            .filter({ hasText: MOCK_APP_REGISTRY.SMART_RESUME.app.name }) // filter so that the sidebar is excluded
            .getByRole('listitem');
        await locatorExists(appItems, 5000); // wait for app items to appear

        if (browserName === 'webkit') {
            // intercepting the route (specifically the redirect) doesn't work for webkit
            //   so we'll just manually redirect instead of clicking connect

            const { profileId, inviteChallenge } = await getSmartResumeProfileIdAndChallenge();
            const redirectUrl = `http://localhost:3000/launchpad?connectTo=${encodeURI(
                profileId
            )}&challenge=${inviteChallenge.challenge}`;

            await page.goto(redirectUrl);
        } else {
            // Click Smart Resume Connect button
            const connectButton = appItems
                .filter({ hasText: MOCK_APP_REGISTRY.SMART_RESUME.app.name })
                .getByRole('button', { name: 'Connect' });

            if (await locatorExists(connectButton)) {
                await connectButton.click({ timeout: 10000 });
            } else {
                // We're (probably) already connected to the SR profile, so we'll disconnect and try again

                // click top-right button
                await page.getByRole('button', { name: 'qr-code-scanner-button' }).click();
                await page.getByRole('button', { name: 'Contact' }).click();

                // Remove Smart Resume contact
                const smartResumeContact = page
                    .getByRole('listitem')
                    .filter({ hasText: 'SmartResume Test' })
                    .first();

                await smartResumeContact.click();
                await page.getByRole('button', { name: 'Remove Contact' }).click();
                await page.getByRole('button', { name: 'Confirm' }).click();
                // wait for the contact to actually be removed
                await expect(smartResumeContact).toBeHidden({ timeout: 10000 });

                // Exit contacts page
                await page.getByRole('button', { name: 'Back button' }).click();

                // Try to click connect again
                await connectButton.click({ timeout: 10000 });
            }
        }

        // We should've been redirected to /launchpad?connectTo=SmartResumeProfileId&challenge=aaaa-bbbb-cccc-dddd
        await expect(page).toHaveURL(/\/launchpad\?connectTo=.+&challenge=(?!.*(undefined))/, {
            timeout: 15000,
        });

        // Make sure the SmartResume modal opens up
        await expect(
            page.getByRole('img', { name: MOCK_APP_REGISTRY.SMART_RESUME.app.name })
        ).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByRole('heading', { name: 'SmartResume' })).toBeVisible();
        await expect(
            page.getByText(
                'An application is requesting access to credentials stored in your LearnCard.'
            )
        ).toBeVisible();

        // Accept the connection
        await page.getByRole('button', { name: 'Accept', exact: true }).click();

        // Confirm that we're taken to the select-credentials page
        await expect(page).toHaveURL(
            `select-credentials/${encodeURI(
                MOCK_APP_REGISTRY.SMART_RESUME.profileId.toLowerCase()
            )}`
        );
        await expect(page.getByText(MOCK_APP_REGISTRY.SMART_RESUME.app.name).first()).toBeVisible();
        await expect(
            page.getByText(MOCK_APP_REGISTRY.SMART_RESUME.organization.name)
        ).toBeVisible();
        await expect(
            page.getByRole('img', { name: `${MOCK_APP_REGISTRY.SMART_RESUME.app.name} icon` })
        ).toBeVisible();

        // Select Credentials to Share

        // wait until credentials are loaded
        await expect(page.getByText('Fetching your credentials')).toBeHidden({ timeout: 10000 });

        // Not sure why these don't seem to work...
        // const achievementSection = page.getByTestId('achievement-section');
        // const achievementCard = achievementSection.locator('div').filter({ hasText: 'test' }).first();
        // const achievementCard = achievementSection.locator('div').filter({ hasText: 'test' }).nth(3);
        // const checkButton = achievementSection.getByRole('button');
        // const checkButton = achievementCard.getByRole('button');

        const checkButton = page.getByTestId('achievements-section').getByRole('button');
        await expect(checkButton).toHaveCount(1);
        await expect(checkButton).toHaveClass(/.* checked/);

        // test Select All toggle
        const selectAllToggle = page
            .locator('div')
            .filter({ hasText: 'Share all credentials' })
            .locator('ion-toggle')
            .first();
        await selectAllToggle.click();
        await expect(checkButton).toHaveClass(/.* unchecked/);
        await selectAllToggle.click();
        await expect(checkButton).toHaveClass(/.* checked/);

        // test section All toggle
        const sectionToggle = page.getByRole('switch', { name: 'achievements toggle' });
        await sectionToggle.click();
        await expect(checkButton).toHaveClass(/.* unchecked/);
        await sectionToggle.click();
        await expect(checkButton).toHaveClass(/.* checked/);

        // test clicking card
        await checkButton.click();
        await expect(checkButton).toHaveClass(/.* unchecked/);
        await checkButton.click();
        await expect(checkButton).toHaveClass(/.* checked/);

        // Share credentials
        await page.getByRole('button', { name: 'Share Credentials' }).click();
        await expect(page.getByRole('button', { name: 'Sharing...' })).toBeVisible();

        // Should be redirected to the redirect url specified in the app registry
        await expect(page).toHaveURL(MOCK_APP_REGISTRY.SMART_RESUME.app.redirectUrl, {
            timeout: 10000,
        });

        // check that SmartResume received the test credential
        const sharedCreds = await getCredentialsSharedWithSmartResume();
        expect(sharedCreds).toHaveLength(1);
        expect(sharedCreds[0]).toEqual(testAchievementCredential);

        // Now that we're connected with SmartResume, the Launchpad button should say "View"
        await page.goto('/launchpad');
        await appItems
            .filter({ hasText: MOCK_APP_REGISTRY.SMART_RESUME.app.name })
            .getByRole('button', { name: 'View' })
            .click();
        await expect(page).toHaveURL(
            `view-shared-credentials/${encodeURI(MOCK_APP_REGISTRY.SMART_RESUME.profileId)}`
        );

        // should say how many credentials you're sharing
        await expect(
            page.getByText(
                `You are sharing ${sharedCreds.length} credential${sharedCreds.length !== 1 ? 's' : ''
                } with this application`
            )
        ).toBeVisible();

        // should display app info
        await expect(page.getByText(MOCK_APP_REGISTRY.SMART_RESUME.app.name).first()).toBeVisible();
        await expect(
            page.getByText(MOCK_APP_REGISTRY.SMART_RESUME.organization.name)
        ).toBeVisible();
        await expect(
            page.getByRole('img', { name: `${MOCK_APP_REGISTRY.SMART_RESUME.app.name} icon` })
        ).toBeVisible();

        // should display the shared credential
        await expect(
            page.getByTestId('achievements-section').getByText(sharedCreds[0].name)
        ).toBeVisible();

        const updateSharedCredsButton = page.getByRole('button', {
            name: 'Update Shared Credentials',
        });
        if (MOCK_APP_REGISTRY.SMART_RESUME.app.allowSendingAdditionalVPs) {
            // Update credentials should be there
            await expect(updateSharedCredsButton).toBeVisible();

            // The button should take you to the select credentials page
            await updateSharedCredsButton.click();
            await expect(page).toHaveURL(
                `select-credentials/${encodeURI(
                    MOCK_APP_REGISTRY.SMART_RESUME.profileId
                )}?skipReload=true`
            );
        } else {
            // Update credentials button shouldn't be there
            await expect(updateSharedCredsButton).toBeHidden();
        }
    });

    test.describe('Allow sending additional VPs logic', () => {
        test('true', async ({ page }) => {
            const testApp = MOCK_APP_REGISTRY.APP2;
            expect(testApp.app.allowSendingAdditionalVPs).toBe(true);

            await page.goto(`view-shared-credentials/${encodeURI(testApp.profileId)}`);

            // wait for the page to load
            expect(await locatorExists(page.getByText(testApp.app.name), 10000)).toBe(true);

            // Update Credentials button should be there
            const updateSharedCredsButton = page.getByRole('button', {
                name: 'Update Shared Credentials',
            });
            expect(await locatorExists(updateSharedCredsButton)).toBe(true);

            // The button should take you to the select credentials page (with skipReload = true)
            await updateSharedCredsButton.click();
            await expect(page).toHaveURL(
                `select-credentials/${encodeURI(testApp.profileId)}?skipReload=true`
            );
        });

        test('false', async ({ page }) => {
            const testApp = MOCK_APP_REGISTRY.APP3;
            expect(testApp.app.allowSendingAdditionalVPs).toBe(false);

            await page.goto(`view-shared-credentials/${encodeURI(testApp.profileId)}`);

            // wait for the page to load
            expect(await locatorExists(page.getByText(testApp.app.name), 10000)).toBe(true);

            const updateSharedCredsButton = page.getByRole('button', {
                name: 'Update Shared Credentials',
            });

            // Update Credentials button shouldn't be there
            await expect(updateSharedCredsButton).toBeHidden();
        });

        // TODO: Connect to unknown app to get its info to show up
        test.skip('true for unknown apps', async ({ page }) => {
            await page.goto(`view-shared-credentials/${encodeURI(UNKNOWN_APP.profileId)}`);

            // wait for the page to load
            expect(await locatorExists(page.getByText(UNKNOWN_APP.displayName), 10000)).toBe(true);

            // Update Credentials button should be there
            const updateSharedCredsButton = page.getByRole('button', {
                name: 'Update Shared Credentials',
            });
            expect(await locatorExists(updateSharedCredsButton)).toBe(true);

            // The button should take you to the select credentials page (with skipReload = true)
            await updateSharedCredsButton.click();
            await expect(page).toHaveURL(
                `select-credentials/${encodeURI(UNKNOWN_APP.profileId)}?skipReload=true`
            );
        });
    });

    test.describe('Unknown App Request', () => {
        test.skip('Accept', async ({ page }) => {
            const { profileId, inviteChallenge } = await getUnknownAppProfileIdAndChallenge();

            await page.goto(
                `http://localhost:3000/launchpad?connectTo=${profileId}&challenge=${inviteChallenge.challenge}`
            );

            expect(await locatorExists(page.getByText('Unknown App Request'), 15000)).toBe(true);
            await expect(page.getByAltText('Candle T-Rex')).toBeVisible();
            await expect(
                page.getByText('An unknown application wants to connect with you')
            ).toBeVisible();

            const continueButton = page.getByRole('button', { name: 'Continue Anyway' });
            await expect(continueButton).toBeVisible();
            await continueButton.click();

            await expect(page.getByText('Connecting...')).toBeVisible();

            // Should be redirected to select credentials page
            await expect(page).toHaveURL(`select-credentials/${encodeURI(profileId)}`);

            // go back to launchpad. The formerly unknown app sould be dispalyed in the list.
            await page.goto('http://localhost:3000/launchpad');

            const appItem = page
                .getByRole('list')
                .filter({ hasText: UNKNOWN_APP.displayName }) // filter so that the sidebar is excluded
                .getByRole('listitem')
                .filter({ hasText: UNKNOWN_APP.displayName });

            await locatorExists(appItem, 5000); // wait for app items to load

            expect(appItem).toContainText(UNKNOWN_APP.displayName);
        });

        test('Deny', async ({ page }) => {
            await page.goto(`http://localhost:3000/launchpad?connectTo=unknownApp&challenge=1234`);

            expect(await locatorExists(page.getByText('Unknown App Request'), 15000)).toBe(true);
            await expect(page.getByAltText('Candle T-Rex')).toBeVisible();
            await expect(
                page.getByText('An unknown application wants to connect with you')
            ).toBeVisible();

            const denyButton = page.getByRole('button', { name: "Don't Accept" });
            await expect(denyButton).toBeVisible();
            await denyButton.click();

            // modal should be closed
            await expect(page.getByAltText('Candle T-Rex')).toBeHidden();

            // Should be back to launchpad page with no GET parameters
            await expect(page).toHaveURL('http://localhost:3000/launchpad');
        });
    });

    test.describe('PublicizeOnLaunchPad', () => {
        test('publicize == true', async ({ page }) => {
            const app = MOCK_APP_REGISTRY.APP2;
            expect(app.app.publicizeOnLaunchPad).toBe(true);

            await page.goto('/launchpad');

            await expect(
                page.getByRole('list').filter({ hasText: MOCK_APP_REGISTRY.SMART_RESUME.app.name }) // filter so that sidebar is excluded
            ).toContainText(app.app.name);
        });

        test('publicize == false', async ({ page }) => {
            const app = MOCK_APP_REGISTRY.APP3;
            expect(app.app.publicizeOnLaunchPad).toBe(false);

            await page.goto('/launchpad');

            await expect(
                page.getByRole('list').filter({ hasText: MOCK_APP_REGISTRY.SMART_RESUME.app.name }) // filter so that sidebar is excluded
            ).not.toContainText(app.app.name);

            // Check that we still get the trusted app modal
            await page.goto(`/launchpad?connectTo=${app.profileId}&challenge=aaaa-bbbb-cccc-dddd`);
            await expect(page.getByText(app.app.name)).toBeVisible();
            await expect(
                page.getByText(
                    'An application is requesting access to credentials stored in your LearnCard.'
                )
            ).toBeVisible();
        });
    });
});

// Tests to write:
//   - Click Accept, but no profile => expect toast that says "please make an account first"
//   - Invalid challenge
