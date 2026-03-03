import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { FullScreenConsentFlowPage } from './fullscreen-consent-flow.page';

// Assumes user is already logged in and contract creation is handled by helper

test.describe('FullScreenConsentFlow', () => {
    test('Full Flow - Accept Consent', async ({ page }) => {
        const fullscreenConsentFlowPage = new FullScreenConsentFlowPage(page);
        await fullscreenConsentFlowPage.goto();

        // Step 1: Confirmation step
        await fullscreenConsentFlowPage.validateConfirmationStep();
        await fullscreenConsentFlowPage.clickAccept();

        // Step 2: Connecting step
        await fullscreenConsentFlowPage.validateConnectingStep();

        // Step 3: Post-consent (success)
        await fullscreenConsentFlowPage.validatePostConsent();
        await fullscreenConsentFlowPage.clickClose();
    });

    test('AI App Connection Flow', async ({ page }) => {
        const fullscreenConsentFlowPage = new FullScreenConsentFlowPage(page);
        await fullscreenConsentFlowPage.gotoLaunchPad();
        const aiAppName = 'Claude';
        await fullscreenConsentFlowPage.clickGetOnAiApp(aiAppName);
        await fullscreenConsentFlowPage.validateAiAppConfirmationStep(aiAppName);
        await fullscreenConsentFlowPage.clickAcceptAiApp();
        await fullscreenConsentFlowPage.validateAiAppConnectingStep(aiAppName);
        await fullscreenConsentFlowPage.validateAiAppPostConsent();
        await fullscreenConsentFlowPage.clickAiAppClose();
    });

    test('Child Account - Contract and AI App Flow', async ({ page }) => {
        const { FamilyHandler, FAMILY } = await import('./family.page');
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily({ includeAllFamilyMembers: true });
        await familyHandler.switchToChildAccount(FAMILY.children[0].name);
        await familyHandler.enterPin();

        // --- Contract flow as child ---
        const fullscreenConsentFlowPage = new FullScreenConsentFlowPage(page);
        await fullscreenConsentFlowPage.goto();
        await fullscreenConsentFlowPage.validateGetAnAdultPrompt();
        await fullscreenConsentFlowPage.clickThatsMe();
        await fullscreenConsentFlowPage.enterPin();
        await fullscreenConsentFlowPage.validateConfirmationStep();
        await fullscreenConsentFlowPage.clickAccept();
        await fullscreenConsentFlowPage.validateConnectingStep();
        await fullscreenConsentFlowPage.validatePostConsent();
        await fullscreenConsentFlowPage.clickClose();

        // --- AI App flow as child ---
        await fullscreenConsentFlowPage.gotoLaunchPad();
        const aiAppName = 'Claude';
        await fullscreenConsentFlowPage.clickGetOnAiApp(aiAppName);
        await fullscreenConsentFlowPage.validateGetAnAdultPrompt();
        await fullscreenConsentFlowPage.clickThatsMe();
        await fullscreenConsentFlowPage.enterPin();
        await fullscreenConsentFlowPage.validateAiAppConfirmationStep(aiAppName);
        await fullscreenConsentFlowPage.clickAcceptAiApp();
        await fullscreenConsentFlowPage.validateAiAppConnectingStep(aiAppName);
        await fullscreenConsentFlowPage.validateAiAppPostConsent();
        await fullscreenConsentFlowPage.clickAiAppClose();
    });
});
