import { expect, Page } from '@playwright/test';
import {
    CustomContractOptions,
    initConsentFlowContract,
    initCustomConsentFlowContract,
    initGameFlowContract,
} from './consent-flow.helpers';
import { gameRedirectUrl } from './game-flow.page';

export class LaunchPadPage {
    readonly page: Page;
    customContractOptions: CustomContractOptions | undefined;

    constructor(page: Page) {
        this.page = page;
    }

    async goto() {
        await this.page.goto('/launchpad');
    }

    async createContractAndGoto(customContractOptions?: CustomContractOptions) {
        this.customContractOptions = customContractOptions;

        const contractUri = customContractOptions
            ? await initCustomConsentFlowContract(customContractOptions)
            : await initConsentFlowContract();

        const url = `/launchpad?uri=${contractUri}`;
        await this.page.goto(url);
    }

    async gotoGameFlow(options?: {
        suppressContractModal?: boolean;
        includeRedirectUrl?: boolean;
        includeReturnToUrlParam?: boolean;
    }) {
        const {
            suppressContractModal = false,
            includeRedirectUrl = true,
            includeReturnToUrlParam = false,
        } = options ?? {};

        const uri = await initGameFlowContract({ includeRedirectUrl });

        let url = `/launchpad?uri=${uri}${suppressContractModal ? '&suppressContractModal=true' : ''
            }`;

        if (includeReturnToUrlParam) {
            url = `${url}&returnTo=${gameRedirectUrl}`;
        }

        await this.page.goto(url);
    }

    async clickConnect(name: string) {
        await this.page
            .locator('ion-item')
            .filter({ hasText: name })
            .getByRole('button', { name: 'Connect' })
            .click();
    }

    async clickView(name: string) {
        await this.page
            .locator('ion-item')
            .filter({ hasText: name })
            .getByRole('button', { name: 'View' })
            .click();
    }

    async clickOpen(name: string) {
        await this.page
            .locator('ion-item')
            .filter({ hasText: name })
            .getByRole('button', { name: 'Open' })
            .click();
    }

    async clickGet(name: string) {
        await this.page
            .locator('ion-item')
            .filter({ hasText: name })
            .getByRole('button', { name: 'Get' })
            .click();
    }
}
