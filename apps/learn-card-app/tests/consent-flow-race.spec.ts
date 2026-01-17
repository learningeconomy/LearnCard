import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { getBespokeLearnCard } from './wallet.helpers';
import { testContract } from './consent-flow.helpers';
import { waitForAuthenticatedState } from './test.helpers';

test.describe('ConsentFlow', () => {
    // Disable retries - we want to see the race condition failure
    test.describe.configure({ retries: 0 });

    test('auto-redirects already-consented user', async ({ page }) => {
        const userSeed = 'a'.repeat(64); // Same seed used by waitForAuthenticatedState

        // Set up contract owner and create contract
        const ownerSeed = 'b'.repeat(64);
        const owner = await getBespokeLearnCard(ownerSeed);
        const existingOwnerProfile = await owner.invoke.getProfile().catch(() => null);
        if (!existingOwnerProfile) {
            await owner.invoke.createProfile({ profileId: 'contract-owner', displayName: 'Owner' });
        }
        const contractUri = await owner.invoke.createContract(testContract);

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

        // Login via seed (persists across page navigation)
        await waitForAuthenticatedState(page);

        // Navigate to consent flow (user already consented via SDK)
        const returnTo = 'https://example.com/callback';
        const consentUrl = `/consent-flow-login?uri=${encodeURIComponent(
            contractUri
        )}&returnTo=${encodeURIComponent(returnTo)}`;
        await page.goto(consentUrl);

        // Wait for page to load
        const continueButton = page.getByRole('button', { name: /Continue as/i });
        await continueButton.waitFor({ state: 'visible', timeout: 30000 });

        // Click Continue - user already consented, should redirect to returnTo
        await continueButton.click();

        // Verify redirect to returnTo URL (not to consent-flow-sync-data error page)
        await page.waitForURL(/example\.com\/callback/, { timeout: 15000 });
    });
});
