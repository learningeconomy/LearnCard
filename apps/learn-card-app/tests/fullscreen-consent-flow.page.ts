import { expect, Page } from '@playwright/test';
import { initConsentFlowContract, testContract } from './consent-flow.helpers';

export class FullScreenConsentFlowPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto() {
        const contractUri = await initConsentFlowContract();
        const url = `/launchpad?uri=${contractUri}`;
        await this.page.goto(url);
    }

    async gotoLaunchPad() {
        await this.page.goto('/launchpad');
    }

    async clickGetOnAiApp(appName: string) {
        // Find the "Get" button for the app card with the given name
        const appCard = this.page.getByRole('heading', { name: new RegExp(appName, 'i') }).locator('..').locator('..');
        const getButton = appCard.getByRole('button', { name: /Get/i });
        await expect(getButton).toBeVisible();
        await getButton.click();
    }

    async validateConfirmationStep() {
        await expect(this.page.getByRole('heading', { name: /Review and Accept/i })).toBeVisible();
        await expect(this.page.getByText(testContract.name)).toBeVisible();
        await expect(this.page.getByText(testContract.subtitle)).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Accept/i })).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Cancel/i })).toBeVisible();
    }

    async validateAiAppConfirmationStep(appName: string) {
        await expect(this.page.getByRole('heading', { name: new RegExp(`Connect to ${appName}`, 'i') })).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Accept|Allow|Connect/i })).toBeVisible();
    }

    async clickAccept() {
        await this.page.getByRole('button', { name: /Accept/i }).click();
    }

    async clickAcceptAiApp() {
        await this.page.getByRole('button', { name: /Accept|Allow|Connect/i }).click();
    }

    async validateConnectingStep() {
        await expect(this.page.getByText(/Connecting/i)).toBeVisible();
    }

    async validateAiAppConnectingStep(appName: string) {
        await expect(this.page.getByText(new RegExp(`Connecting|Authorizing`, 'i'))).toBeVisible();
    }

    async validatePostConsent() {
        await expect(this.page.getByText(/You're all set|Success|Access granted/i)).toBeVisible();
    }

    async validateAiAppPostConsent() {
        await expect(this.page.getByText(/Success|Connected|You're all set/i)).toBeVisible();
    }

    async clickClose() {
        await this.page.getByRole('button', { name: /Close|Done/i }).click();
    }

    async clickAiAppClose() {
        await this.page.getByRole('button', { name: /Close|Done/i }).click();
    }

    async validateGetAnAdultPrompt() {
        await expect(this.page.getByRole('heading', { name: /Get an Adult/i })).toBeVisible();
        await expect(this.page.getByRole('button', { name: /That's Me!/i })).toBeVisible();
    }

    async clickThatsMe() {
        await this.page.getByRole('button', { name: /That's Me!/i }).click();
    }

    async enterPin() {
        for (const digit of ['1', '2', '3', '4', '5']) {
            await this.page.getByRole('button', { name: digit, exact: true }).click();
        }
        await this.page.getByRole('button', { name: /Verify PIN/i }).click();
    }
}
