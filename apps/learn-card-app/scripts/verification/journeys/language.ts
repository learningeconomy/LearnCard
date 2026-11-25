import type { Page } from '@playwright/test';

import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import { LOGIN, UI_TIMEOUT, WALLET, assertEnglishLogin, assertProfile } from './shared';

type Language = 'English' | 'Español';

const assertLocale = async (page: Page, locale: 'en' | 'es'): Promise<void> => {
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect
        .poll(() => page.evaluate(() => localStorage.getItem('i18n.language')))
        .toBe(locale);
};

const selectLanguage = async (page: Page, from: Language, to: Language): Promise<void> => {
    await page.getByRole('button', { name: from, exact: true }).click();
    await expect(
        page.getByRole('button', { name: new RegExp(`^${from}`), pressed: true })
    ).toBeVisible();
    await page.getByRole('button', { name: to, exact: true, pressed: false }).click();
    await expect(page.getByRole('button', { name: to, exact: true })).toBeVisible();
    await assertLocale(page, to === 'English' ? 'en' : 'es');
};

const assertSpanishLogin = async (page: Page): Promise<void> => {
    await expect(page).toHaveURL(LOGIN);
    await expect(
        page.getByRole('textbox', { name: 'Correo electrónico', exact: true })
    ).toBeVisible({
        timeout: UI_TIMEOUT,
    });
    await expect(
        page.getByRole('button', { name: 'Iniciar sesión con correo', exact: true })
    ).toBeVisible();
    await assertLocale(page, 'es');
};

export const languageFeature: FeatureDefinition = {
    id: 'language',
    title: 'Public and signed-in language selection, persisted across reloads',
    surface: 'web',
    entries: ['locale-login-switch', 'locale-login-persistence', 'locale-sidebar-switch'],
    run: async context => {
        const page = await context.newPage('language-public');
        await context.step(page, 'locale-login-switch', async () => {
            await page.goto('/login');
            await assertEnglishLogin(page);
            await selectLanguage(page, 'English', 'Español');
            await assertSpanishLogin(page);
            await context.capture(page, 'language-public-spanish');
        });
        await context.step(page, 'locale-login-persistence', async () => {
            await page.reload();
            await assertSpanishLogin(page);
            await context.capture(page, 'language-public-spanish-reloaded');
            await selectLanguage(page, 'Español', 'English');
            await page.reload();
            await assertEnglishLogin(page);
            await assertLocale(page, 'en');
        });

        const learner = await context.newPage('language-learner', {
            signInAs: context.actors.learner,
        });
        await context.step(learner, 'locale-sidebar-switch', async () => {
            await selectLanguage(learner, 'English', 'Español');
            await learner.reload();
            await expect(learner).toHaveURL(WALLET);
            await assertLocale(learner, 'es');
            await learner.getByRole('button', { name: 'Español', exact: true }).click();
            await expect(
                learner.getByRole('heading', { name: 'Seleccionar idioma', exact: true })
            ).toBeVisible();
            await expect(
                learner.getByRole('button', { name: /^Español/, pressed: true })
            ).toBeVisible();
            await context.capture(learner, 'language-sidebar-spanish-reloaded');
            await learner
                .getByRole('button', { name: 'English', exact: true, pressed: false })
                .click();
            await learner.reload();
            await assertLocale(learner, 'en');
            await expect(
                learner.getByRole('button', { name: 'English', exact: true })
            ).toBeVisible();
            await assertProfile(learner, context.actors.learner);
        });
        return {
            observations: {
                profileId: context.actors.learner.profileId,
                switchedLocale: 'es',
                restoredLocale: 'en',
            },
        };
    },
};
