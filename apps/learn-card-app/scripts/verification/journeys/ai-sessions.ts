import type { Page } from '@playwright/test';

import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import { UI_TIMEOUT } from './shared';

/** AI session apps that were sunset; none may appear in either picker. */
const RETIRED_AI_APPS = ['ChatGPT', 'Claude', 'Gemini'] as const;

type RetiredCounts = Record<(typeof RETIRED_AI_APPS)[number], number>;

/** LearnCard AI is visible and no retired app has a tile in the open picker. */
const assertOnlyLearnCardAi = async (page: Page): Promise<RetiredCounts> => {
    await expect(page.getByText('LearnCard AI', { exact: true }).first()).toBeVisible();
    const counts = {} as RetiredCounts;
    for (const name of RETIRED_AI_APPS) {
        counts[name] = await page.getByText(name, { exact: true }).count();
        expect(counts[name], `${name} must not be offered`).toBe(0);
    }
    return counts;
};

/** The selector lists every catalog app with a Get/Open action; exactly one must remain. */
const assertAppSelector = async (page: Page): Promise<RetiredCounts> => {
    await expect(
        page.getByText('Which AI Learning App do you want to use?', { exact: false }).first()
    ).toBeVisible({ timeout: UI_TIMEOUT });
    const actions = page.getByRole('button', { name: /^(Get|Open)$/ });
    await expect(actions.first()).toBeVisible({ timeout: UI_TIMEOUT });
    await expect(actions).toHaveCount(1);
    return assertOnlyLearnCardAi(page);
};

/**
 * The AI session app pickers. Each step stops at the picker: starting a session needs the
 * ai-agent service and model credentials, which this stack does not provision.
 */
export const aiSessionsFeature: FeatureDefinition = {
    id: 'ai-sessions',
    title: 'AI session app pickers offer LearnCard AI only (ChatGPT, Claude, Gemini retired)',
    surface: 'web',
    entries: ['ai-new-topic-app-picker', 'ai-app-selector', 'ai-app-selector-reload'],
    run: async context => {
        const page = await context.newPage('ai-sessions-learner', {
            signInAs: context.actors.learner,
        });

        const whichApp = await context.step(page, 'ai-new-topic-app-picker', async () => {
            await page.goto('/ai/topics');
            const sessions = page.getByRole('button', { name: /^\d+ Sessions?$/ });
            await expect(sessions).toBeVisible({ timeout: UI_TIMEOUT });
            // The new-session control is the icon-only button right after the Sessions count;
            // the product gives it no accessible name.
            await sessions.locator('xpath=following::button[1]').click();
            // Desktop renders the chat input twice (modal + page); drive the visible one.
            const topic = page.getByPlaceholder('Something else...').locator('visible=true').last();
            await expect(topic).toBeVisible({ timeout: UI_TIMEOUT });
            await topic.fill('Adding fractions');
            await topic.press('Enter');
            await expect(page.getByText('What app do you want to use?').first()).toBeVisible({
                timeout: UI_TIMEOUT,
            });
            const appButtons = page.getByRole('button', { name: /logo/ });
            await expect(appButtons.first()).toBeVisible({ timeout: UI_TIMEOUT });
            await expect(appButtons).toHaveCount(1);
            await expect(appButtons.first()).toHaveAccessibleName(/LearnCard AI/);
            return assertOnlyLearnCardAi(page);
        });

        // Users who have not consented to an AI app get the unfiltered selector instead. Off
        // production that is every user, so this is the picker that listed Gemini locally.
        const selector = await context.step(page, 'ai-app-selector', async () => {
            await page.goto('/ai/topics?shortCircuitStep=aiAppSelector');
            return assertAppSelector(page);
        });

        const selectorAfterReload = await context.step(page, 'ai-app-selector-reload', async () => {
            await page.reload();
            return assertAppSelector(page);
        });

        return {
            observations: {
                profileId: context.actors.learner.profileId,
                whichAppPickerRetiredCounts: whichApp,
                appSelectorRetiredCounts: selector,
                appSelectorAfterReloadRetiredCounts: selectorAfterReload,
            },
        };
    },
};
