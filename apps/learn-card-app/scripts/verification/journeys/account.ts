import { finishSetupSignIn } from '../../../tests/setup-auth';
import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import { LOGIN, UI_TIMEOUT, assertEnglishLogin, assertProfile } from './shared';

export const accountFeature: FeatureDefinition = {
    id: 'account',
    title: 'Public sign-in page, seed sign-in, real onboarding, session persistence, logout',
    surface: 'web',
    entries: ['auth-public-email-entry', 'auth-developer-seed', 'auth-onboarding', 'auth-sign-out'],
    run: async context => {
        const actor = context.actors.learner;
        const publicPage = await context.newPage('account-public');
        await context.step(publicPage, 'auth-public-email-entry', async () => {
            await publicPage.goto('/login');
            await assertEnglishLogin(publicPage);
            const email = publicPage.getByRole('textbox', { name: 'Email', exact: true });
            const submit = publicPage.getByRole('button', {
                name: 'Sign in with Email',
                exact: true,
            });
            await expect(submit).toBeDisabled();
            await email.fill('verification@example.com');
            await expect(email).toHaveValue('verification@example.com');
            await expect(submit).toBeEnabled();
            await context.capture(publicPage, 'account-email-unsent');
            // Submitting would request a real OTP email; that provider is not provisioned.
            await email.fill('');
            await expect(submit).toBeDisabled();
            await expect(publicPage).toHaveURL(LOGIN);
        });

        const page = await context.newPage('account-learner');
        await context.step(page, 'auth-developer-seed', async () => {
            // No ?profileId: the account exists but has no network profile yet.
            await context.signIn(page, actor, { createProfile: false });
            await page.reload();
            await expect(
                page.getByRole('button', { name: 'Open profile', exact: true })
            ).toBeVisible({
                timeout: UI_TIMEOUT,
            });
            await context.capture(page, 'account-seed-session-persisted');
        });
        await context.step(page, 'auth-onboarding', async () => {
            // The login route owns onboarding: a signed-in account without a profile is sent
            // through the real "Welcome — let's set you up" flow there.
            await page.goto('/login');
            await expect(
                page.getByRole('heading', { name: "Welcome — let's set you up", exact: true })
            ).toBeVisible({ timeout: UI_TIMEOUT });
            await context.capture(page, 'account-fresh-onboarding');
            await finishSetupSignIn(page, actor.profileId);
            await page.reload();
            await assertProfile(page, actor);
            await context.capture(page, 'account-created-profile');
        });
        const profile = await context.step(page, 'auth-profile-on-network', async () => {
            // Corroborate from a second, independent view: the network resolves the new handle.
            const issuer = await context.sdk(context.newActor('observer'));
            const found = await issuer.invoke.getProfile(actor.profileId);
            expect(found?.profileId).toBe(actor.profileId);
            return { profileId: found?.profileId, displayName: found?.displayName };
        });
        await context.step(page, 'auth-sign-out', async () => {
            await page.getByRole('button', { name: 'Logout', exact: true }).click();
            await expect(page).toHaveURL(LOGIN, { timeout: UI_TIMEOUT });
            await assertEnglishLogin(page);
            await page.goto('/wallet');
            await expect(page).toHaveURL(LOGIN, { timeout: UI_TIMEOUT });
            await assertEnglishLogin(page);
            await context.capture(page, 'account-private-route-rejected');
        });
        return {
            observations: {
                profileId: actor.profileId,
                networkProfile: profile,
                publicEmailSubmitted: false,
                privateRouteAfterLogout: '/login',
            },
        };
    },
};
