import { chromium, FullConfig } from '@playwright/test';
import { locatorExists } from './tests/test.helpers';

export const globalSetup = async (config: FullConfig) => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    await page.goto(config.webServer?.url!);
    await page.getByRole('textbox').fill('demo@learningeconomy.io');

    await page.getByRole('button', { name: /sign in with email/i }).click();
    await page.waitForURL(/wallet/);

    try {
        await page.getByRole('button', { name: /boost/i }).click();
        await locatorExists(page.getByText('Set up your profile to get started!'));
        // await page.locator('#ion-input-1').fill('test');
        await page.getByRole('textbox', { name: 'User ID' }).fill('test');
        await page.getByRole('button', { name: /let's go/i }).click();
    } catch (error) {
        // This is expected and okay!
        /* console.error('Error making account. Already have one?');
            console.error(error); */
    }

    const state = await page.context().storageState();
    const localhostState = state.origins.find(origin => origin.origin === 'http://localhost:3000');
    const userState = JSON.parse(
        localhostState?.localStorage.find(storage => storage.name === 'currentUserStore')?.value ??
        ''
    );

    if (userState.state.currentUser) {
        // We have this check because sometimes it saves null as the current user and
        // it breaks tests until you revert the change

        // Save signed-in state to 'demoState.json'.
        await page.context().storageState({ path: 'tests/states/demoState.json' });
    }

    const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const page2 = await context2.newPage();
    await page2.goto(`${config.webServer?.url!}/hidden/seed`);
    await page2.getByRole('textbox').fill('2'.repeat(64));

    await page2.getByRole('button', { name: /sign in with seed/i }).click();
    await page2.waitForURL(/wallet/);

    try {
        await page2.getByRole('button', { name: /boost/i }).first().click();
        await locatorExists(page.getByText('Set up your profile to get started!'));
        // await page2.locator('#ion-input-1').fill('test2');
        await page2.getByRole('textbox', { name: 'User ID' }).fill('test2');
        await page2.getByRole('button', { name: /let's go/i }).click();
    } catch (error) {
        // This is expected and okay!
        /* console.error('Error making account. Already have one?');
        console.error(error); */
    }

    const state2 = await page2.context().storageState();
    const localhostState2 = state2.origins.find(
        origin => origin.origin === 'http://localhost:3000'
    );
    const userState2 = JSON.parse(
        localhostState2?.localStorage.find(storage => storage.name === 'currentUserStore')?.value ??
        ''
    );

    if (userState2.state.currentUser) {
        // We have this check because sometimes it saves null as the current user and
        // it breaks tests until you revert the change

        // Save signed-in state to 'demoState.json'.
        await page2.context().storageState({ path: 'tests/states/test2State.json' });
    }

    await browser.close();
};

export default globalSetup;
