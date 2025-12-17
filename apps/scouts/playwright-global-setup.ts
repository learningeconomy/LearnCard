import { chromium, FullConfig } from '@playwright/test';

export const globalSetup = async (config: FullConfig) => {
    try {
        const browser = await chromium.launch();
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();
        await page.goto(config.webServer?.url!);
        await page.getByRole('button', { name: /email icon/i }).click();
        await page.getByRole('textbox').fill('demo@learningeconomy.io');

        // Have to make the navigation promise here or else it will navigate before we make the
        // promise
        const navigationPromise = page.waitForNavigation();
        await page.getByRole('button', { name: /login/i }).click();
        await navigationPromise;

        const state = await page.context().storageState();
        const localhostState = state.origins.find(
            origin => origin.origin === 'https://localhost:3000'
        );
        const userState = JSON.parse(
            localhostState?.localStorage.find(storage => storage.name === 'currentUserStore')
                ?.value ?? ''
        );

        if (userState.state.currentUser) {
            // We have this check because sometimes it saves null as the current user and
            // it breaks tests until you revert the change

            // Save signed-in state to 'demoState.json'.
            await page.context().storageState({ path: 'demoState.json' });
        }
        await browser.close();
    } catch (error) {
        console.warn(error);
    }
};

export default globalSetup;
