import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { getBespokeLearnCard } from './wallet.helpers';
import { testContract } from './consent-flow.helpers';
import { waitForAuthenticatedState } from './test.helpers';

test.describe('ConsentFlow', () => {
    // Disable retries - we want to see the race condition failure
    test.describe.configure({ retries: 0 });

    test('auto-redirects already-consented user', async ({ page }) => {
        console.log('[Test] Starting consent flow race test...');
        const userSeed = 'a'.repeat(64); // Same seed used by waitForAuthenticatedState

        // Set up contract owner and create contract
        const ownerSeed = 'b'.repeat(64);
        const owner = await getBespokeLearnCard(ownerSeed);
        const existingOwnerProfile = await owner.invoke.getProfile().catch(() => null);
        if (!existingOwnerProfile) {
            await owner.invoke.createProfile({ profileId: 'contract-owner', displayName: 'Owner' });
        }
        const contractUri = await owner.invoke.createContract(testContract);
        console.log('[Test] Contract created:', contractUri);

        // Pre-consent user via SDK (same seed as browser login)
        const user = await getBespokeLearnCard(userSeed);
        const existingUserProfile = await user.invoke.getProfile().catch(() => null);
        if (!existingUserProfile) {
            await user.invoke.createProfile({ profileId: 'test-user', displayName: 'Test' });
        }
        await user.invoke.consentToContract(contractUri, {
            terms: {
                read: {
                    personal: { Name: 'Test User' },
                    credentials: {
                        shareAll: false,
                        sharing: true,
                        categories: {
                            'Social Badge': { shareAll: false, sharing: true },
                            Achievement: { shareAll: true, sharing: true },
                        },
                    },
                },
                write: {
                    personal: { SomeCustomID: true },
                    credentials: {
                        categories: {
                            ID: true,
                            'Learning History': false,
                        },
                    },
                },
            },
        });
        console.log('[Test] User pre-consented to contract via SDK');

        // Block consent query until we explicitly release it
        let releaseConsentQuery: () => void;
        const consentQueryBlocked = new Promise<void>(resolve => {
            releaseConsentQuery = resolve;
        });

        await page.route('**/*', async route => {
            const url = route.request().url();

            // Block getConsentedContracts indefinitely until we release it
            if (url.includes('getConsentedContracts')) {
                console.log('[Test] >>> BLOCKING getConsentedContracts until after click');
                await consentQueryBlocked;
                console.log('[Test] >>> RELEASED getConsentedContracts');
            }

            await route.continue();
        });

        // Login via seed (persists across page navigation)
        await waitForAuthenticatedState(page);
        console.log('[Test] Authenticated, navigating to consent flow...');

        // Navigate to consent flow (user already consented via SDK)
        const returnTo = 'https://example.com/callback';
        const consentUrl = `/consent-flow-login?uri=${encodeURIComponent(
            contractUri
        )}&returnTo=${encodeURIComponent(returnTo)}`;
        await page.goto(consentUrl);
        console.log('[Test] On consent flow page, looking for Continue button...');

        // Click "Continue as" IMMEDIATELY when visible - before blocked query resolves
        const continueButton = page.getByRole('button', { name: /Continue as/i });
        await continueButton.waitFor({ state: 'visible', timeout: 20000 });
        // Click immediately - query is still blocked!
        await continueButton.click({ force: true });
        console.log('[Test] Clicked Continue button (query still blocked!)');

        // Now release the blocked query
        releaseConsentQuery!();
        console.log('[Test] Released blocked query');

        // BUG: Without fix, navigates to consent-flow-sync-data (error state)
        // EXPECTED: Should redirect to returnTo URL OR show success state

        // Wait for navigation to complete
        await page.waitForTimeout(3000);

        // FAIL CONDITIONS (bug exists):
        // 1. Navigated to consent-flow-sync-data page
        const onSyncDataPage = page.url().includes('consent-flow-sync-data');
        // 2. Shows "already consented" error
        const errorVisible = await page.getByText(/already consented/i).isVisible().catch(() => false);

        if (onSyncDataPage || errorVisible) {
            console.log('[Test] BUG DETECTED:');
            console.log('  - On sync-data page:', onSyncDataPage);
            console.log('  - Error visible:', errorVisible);
            console.log('  - Current URL:', page.url());
        }

        // These assertions will pass when the bug is fixed
        await expect(page).not.toHaveURL(/consent-flow-sync-data/);
        const errorText = page.getByText(/already consented/i);
        await expect(errorText).not.toBeVisible();

        console.log('[Test] SUCCESS - User redirected correctly without duplicate consent error!');
    });
});
