import { chromium, firefox, FullConfig } from '@playwright/test';
import { locatorExists } from './tests/test.helpers';

export const globalSetup = async (config: FullConfig) => {
    // Run headed if DEBUG_SETUP=true OR if tests are run with --headed flag
    const projectHeadless = config.projects?.[0]?.use?.headless;
    const isHeaded = process.env.DEBUG_SETUP === 'true' || projectHeadless === false;

    // Use the same browser type as the test project (firefox by default)
    const projectName = config.projects?.[0]?.name;
    const browserType = projectName === 'firefox' ? firefox : chromium;
    console.log(`[GlobalSetup] Using browser: ${projectName || 'chromium'}`);

    const browser = await browserType.launch({ headless: !isHeaded, slowMo: isHeaded ? 500 : 0 });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    console.log('[GlobalSetup] Navigating to:', config.webServer?.url);
    await page.goto(config.webServer?.url!);
    console.log('[GlobalSetup] Page loaded, current URL:', page.url());

    // Wait for the email textbox to be visible (don't use networkidle - app polls constantly)
    const emailInput = page.getByRole('textbox');
    await emailInput.waitFor({ state: 'visible', timeout: 30000 });
    console.log('[GlobalSetup] Email input visible, filling email');

    await emailInput.fill('demo@learningeconomy.io');
    console.log('[GlobalSetup] Email filled, clicking sign in button');

    await page.getByRole('button', { name: /sign in with email/i }).click();
    console.log('[GlobalSetup] Sign in clicked, waiting for /wallet/ URL...');

    try {
        await page.waitForURL(/wallet/, { timeout: 60000 });
        console.log('[GlobalSetup] Successfully navigated to wallet');
    } catch (error) {
        console.error('[GlobalSetup] FAILED waiting for /wallet/ URL');
        console.error('[GlobalSetup] Current URL:', page.url());
        console.error('[GlobalSetup] Page title:', await page.title());
        await page.screenshot({ path: 'test-results/global-setup-failure.png', fullPage: true });
        console.error('[GlobalSetup] Screenshot saved to test-results/global-setup-failure.png');
        throw error;
    }

    try {
        // Handle role selection screen if it appears
        const learnerButton = page.getByText('Learner').first();
        if (await locatorExists(learnerButton, 3000)) {
            console.log('[GlobalSetup] Role selection screen detected, clicking Learner');
            await learnerButton.click();
            await page.getByRole('button', { name: /continue/i }).click();
            console.log('[GlobalSetup] Clicked Continue on role selection');
        }

        // Skip profile setup if it appears
        const skipButton = page.getByText('Skip For Now');
        if (await locatorExists(skipButton, 3000)) {
            console.log('[GlobalSetup] Profile setup screen detected, clicking Skip For Now');
            await skipButton.click();
        }
    } catch (error) {
        // This is expected and okay - user may already have an account
        console.log('[GlobalSetup] Onboarding skipped or already complete');
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
        console.log('[GlobalSetup] Saved demoState.json with currentUser:', {
            uid: userState.state.currentUser.uid,
            email: userState.state.currentUser.email,
            name: userState.state.currentUser.name,
        });
    } else {
        console.error('[GlobalSetup] WARNING: currentUser is null, storage state may be invalid!');
    }

    const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const page2 = await context2.newPage();
    await page2.goto(`${config.webServer?.url!}/hidden/seed`);
    await page2.getByRole('textbox').fill('2'.repeat(64));

    await page2.getByRole('button', { name: /sign in with seed/i }).click();
    await page2.waitForURL(/wallet/);

    try {
        // Handle role selection screen if it appears
        const learnerButton2 = page2.getByText('Learner').first();
        if (await locatorExists(learnerButton2, 3000)) {
            console.log('[GlobalSetup] Role selection screen detected for test2, clicking Learner');
            await learnerButton2.click();
            await page2.getByRole('button', { name: /continue/i }).click();
            console.log('[GlobalSetup] Clicked Continue on role selection for test2');
        }

        // Skip profile setup if it appears
        const skipButton2 = page2.getByText('Skip For Now');
        if (await locatorExists(skipButton2, 3000)) {
            console.log('[GlobalSetup] Profile setup screen detected for test2, clicking Skip For Now');
            await skipButton2.click();
        }
    } catch (error) {
        // This is expected and okay - user may already have an account
        console.log('[GlobalSetup] Onboarding skipped or already complete for test2');
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

        // Save signed-in state to 'test2State.json'.
        await page2.context().storageState({ path: 'tests/states/test2State.json' });
        console.log('[GlobalSetup] Saved test2State.json with currentUser:', {
            uid: userState2.state.currentUser.uid,
            email: userState2.state.currentUser.email,
            name: userState2.state.currentUser.name,
        });
    } else {
        console.error('[GlobalSetup] WARNING: currentUser2 is null, storage state may be invalid!');
    }

    console.log('[GlobalSetup] Setup complete, closing browser');

    await browser.close();
};

export default globalSetup;
