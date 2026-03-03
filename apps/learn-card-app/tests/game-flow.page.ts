import { expect, Page } from '@playwright/test';
import { FAMILY } from './family.page';
import { gameFlowContract, initGameFlowContract } from './consent-flow.helpers';

// Sesame Street: A Job For Me url
export const gameRedirectUrl =
    'https://interactive.sesameonline.net/games/prod/284-aspirationalplay/46bc220217e06a5a81eba0436f27d30cb9061fbe/run/index.html';

export class GameFlowPage {
    readonly page: Page;
    selectedPlayerName: string;
    redirectUrl: string;
    fromLaunchPad: boolean;
    noRedirectUrl: boolean;

    constructor(page: Page, options?: { fromLaunchPad?: boolean }) {
        const { fromLaunchPad = false } = options ?? {};

        this.page = page;
        this.fromLaunchPad = fromLaunchPad;
        this.redirectUrl = gameFlowContract.redirectUrl ?? '';
        this.noRedirectUrl = false;
    }

    async goto(options?: {
        includeReturnToUrlParam?: boolean;
        includeReasonForAccessing?: boolean;
    }) {
        const { includeReturnToUrlParam = false, includeReasonForAccessing } = options ?? {};

        // create game flow contract and go to start of Game Flow
        const contractUri = await initGameFlowContract({ includeReasonForAccessing });
        let url = `/consent-flow?uri=${contractUri}`;

        if (includeReturnToUrlParam) {
            url = `${url}&returnTo=${gameRedirectUrl}`;
            this.redirectUrl = gameRedirectUrl;
        }

        try {
            await this.page.goto(url);
        } catch {
            // Protect against some flakiness here in relation to logoutTestAccount
            //   Sometimes tests fail because there's a double redirect to the login page
            //   This counters that
            await this.page.goto(url);
        }
    }

    async validateLandingPage() {
        // await expect.soft(this.page.getByText('Loading...')).toBeVisible();

        if (!this.fromLaunchPad) {
            // no sidebar
            //   conditional because this will still be attached for LaunchPad flows
            await expect(this.page.locator('ion-menu')).not.toBeAttached();
        }

        // background
        await expect(
            this.page.locator(`div[style*='background-image: url(\"${gameFlowContract.image}\")']`)
        ).toBeVisible({ timeout: 15000 });

        await expect(
            this.page.locator(`img[src="${gameFlowContract.image}"][alt="Game Icon"]`)
        ).toBeVisible();
        await expect(this.page.getByLabel('Plus')).toBeVisible();
        await expect(
            this.page.locator(`img[src="/src/assets/images/lca-icon-v2.png"]`)
        ).toBeVisible(); // LC app icon

        await expect(this.page.getByText('Add')).toBeVisible();
        await expect(this.page.locator('span', { hasText: gameFlowContract.name })).toBeVisible();
        await expect(this.page.getByText('to LearnCard')).toBeVisible();

        if (gameFlowContract.reasonForAccessing) {
            await expect(this.page.getByText(gameFlowContract.reasonForAccessing)).toBeVisible();
            await expect(this.page.getByText('Get an adult to continue.')).toBeVisible();
        } else {
            await expect(
                this.page.getByText('Get an adult to save your progress and skills')
            ).toBeVisible();
        }

        if (this.fromLaunchPad) {
            await expect(this.page.getByRole('button', { name: 'Select Player' })).toBeVisible();
            await expect(this.page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        } else {
            await expect(this.page.getByRole('button', { name: "I'm an Adult" })).toBeVisible();
            await expect(this.page.getByRole('button', { name: 'Back to Game' })).toBeVisible();
        }
    }

    async clickImAnAdult() {
        await this.page.getByRole('button', { name: "I'm an Adult" }).click();
    }

    async clickSelectPlayer() {
        await this.page.getByRole('button', { name: 'Select Player' }).click();
    }

    async clickBackToGame() {
        await this.page.getByRole('button', { name: 'Back to Game' }).click();
    }

    async clickCancel() {
        await this.page.getByRole('button', { name: 'Cancel' }).click();
    }

    async clickReturnToGame() {
        await this.page.getByRole('button', { name: 'Return to Game' }).click();
    }

    async clickBack() {
        await this.page.getByRole('button', { name: 'Back' }).click();
    }

    async clickExitToLearnCard() {
        await this.page.getByRole('button', { name: 'Exit to LearnCard' }).click();
    }

    async validateBackToGamePage() {
        await expect(this.page.locator(`img[src="${gameFlowContract.image}"]`)).toBeVisible();
        await expect(this.page.getByLabel('X')).toBeVisible();
        await expect(
            this.page.locator(`img[src="/src/assets/images/lca-icon-v2.png"]`)
        ).toBeVisible(); // LC app icon

        await expect(this.page.getByText('If you return to')).toBeVisible();
        await expect(this.page.getByText(gameFlowContract.name)).toBeVisible();
        await expect(
            this.page.getByText(', your progress on LearnCard will be lost.')
        ).toBeVisible();

        await expect(this.page.getByRole('button', { name: 'Return to Game' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Exit to LearnCard' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Back' })).toBeVisible();
    }

    async validateWhosPlayingPage(names: string[]) {
        /* await expect(this.page.getByText('Loading Accounts...')).toBeVisible();
        await expect(this.page.getByText('Loading Accounts...')).not.toBeVisible(); */

        await expect(this.page.getByText("Who's Playing?")).toBeVisible();
        await expect(
            this.page.locator('footer').getByRole('button', { name: 'Add New Player' })
        ).toBeVisible();
        await expect(
            this.page
                .locator('footer')
                .getByRole('button', { name: this.fromLaunchPad ? 'Cancel' : 'Back to Game' })
        ).toBeVisible();

        // check all members of family are here
        await Promise.all(
            names.map(async name => {
                // assumes they don't have an image so it's using the first letter of their name
                await expect(
                    this.page.getByRole('button', { name: `${name[0]} ${name}`, exact: true })
                ).toBeVisible();
            })
        );
    }

    async selectPlayer(name: string) {
        this.selectedPlayerName = name;
        await this.page.getByRole('button', { name }).first().click();
    }

    async clickAddPlayer() {
        await this.page.getByRole('button', { name: 'Add New Player' }).click();
    }

    async validateConfirmationPage() {
        await expect(this.page.getByText('Add')).toBeVisible();
        await expect(this.page.locator('span', { hasText: gameFlowContract.name })).toBeVisible();
        await expect(this.page.getByText(`${this.selectedPlayerName}'s`)).toBeVisible();
        await expect(this.page.getByText('LearnCard').first()).toBeVisible();

        if (gameFlowContract.reasonForAccessing) {
            await expect(this.page.getByText(gameFlowContract.reasonForAccessing)).toBeVisible();
        }

        await expect(this.page.getByRole('button', { name: 'Allow Access' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Edit Access' })).toBeVisible();
        await expect(
            this.page.getByRole('button', { name: 'Select a Different Player' })
        ).toBeVisible();
        await expect(
            this.page.getByRole('button', { name: this.fromLaunchPad ? 'Cancel' : 'Back to Game' })
        ).toBeVisible();
    }

    async clickAllowAccess() {
        await this.page.getByRole('button', { name: 'Allow Access' }).click();
        // await expect.soft(this.page.getByText('Allowing...')).toBeVisible();
    }

    async clickSelectADifferentPlayer() {
        await this.page.getByRole('button', { name: 'Select a Different Player' }).click();
    }

    async validateSuccessPage() {
        await expect(this.page.getByText('Success!')).toBeVisible();
        await expect(this.page.getByText("You've added")).toBeVisible();
        await expect(this.page.locator('span', { hasText: gameFlowContract.name })).toBeVisible();
        await expect(this.page.getByText(`${this.selectedPlayerName}'s`)).toBeVisible();
        await expect(this.page.getByText('LearnCard').first()).toBeVisible();

        if (this.fromLaunchPad && this.noRedirectUrl) {
            await expect(
                this.page.getByRole('button', {
                    name: 'Return to LearnCard',
                })
            ).toBeVisible();
        } else {
            await expect(
                this.page.getByRole('button', {
                    name: this.fromLaunchPad ? 'Continue to Game' : 'Continue Playing',
                })
            ).toBeVisible();
        }
    }

    async clickContinuePlaying() {
        await this.page
            .getByRole('button', {
                name: this.fromLaunchPad ? 'Continue to Game' : 'Continue Playing',
            })
            .click();
    }

    async clickReturnToLearnCard() {
        await this.page.getByRole('button', { name: 'Return to LearnCard' }).click();
    }

    async validateCreateFamilyPage() {
        // Create a Family screen (CreateFamilyGamePrompt)
        await expect(
            this.page.locator(`img[src="${gameFlowContract.image}"][alt="Game Icon"]`)
        ).toBeVisible();
        await expect(
            this.page.locator(`img[src="/src/assets/images/lca-icon-v2.png"]`)
        ).toBeVisible(); // LC app icon
        // todo expect plus

        if (this.fromLaunchPad) {
            await expect(
                this.page.locator('#full-screen-modal').getByText(gameFlowContract.name)
            ).toBeVisible();
        } else {
            await expect(this.page.getByText(gameFlowContract.name)).toBeVisible();
        }

        await expect(this.page.getByText('Create a family to select a player.')).toBeVisible();

        if (this.fromLaunchPad) {
            await expect(this.page.getByRole('button', { name: 'New Family' })).toBeVisible();
            await expect(this.page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        } else {
            await expect(this.page.getByRole('button', { name: 'New Family' })).toBeVisible();
            await expect(this.page.getByRole('button', { name: 'Back to Game' })).toBeVisible();
        }
    }

    async clickNewFamily() {
        await this.page.getByRole('button', { name: 'New Family' }).click();
    }

    async validateLoginPage() {
        await expect(this.page.getByRole('img', { name: 'LearnCard App Icon' })).toBeVisible();
        await expect(this.page.getByRole('heading', { name: 'LEARNCARD' })).toBeVisible();
        await expect(this.page.getByText('Login')).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'phone icon' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'apple' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'google' })).toBeVisible();
        await expect(this.page.getByText('Email')).toBeVisible();
        await expect(this.page.getByRole('textbox', { name: 'Email' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Continue' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Continue' })).toBeDisabled();
    }

    async demoEmailLogin() {
        await this.page
            .locator('ion-input input[placeholder="Email address"]')
            .fill('demo@learningeconomy.io');
        await this.page.getByRole('button', { name: 'Continue' }).click();
    }

    async expectRedirectUrlWithoutDid() {
        await expect(this.page).toHaveURL(this.redirectUrl);
    }

    async expectRedirectUrlWithDid() {
        if (this.selectedPlayerName === FAMILY.parent.name) {
            // demo account
            //   We know the demo account's did, so we can be specific
            const urlRegex = new RegExp(
                `${this.redirectUrl}\\?did=did\%3Aweb\%3Alocalhost\%253A4000\%3Ausers\%3Atest&vp=.*`
            );
            await expect(this.page).toHaveURL(urlRegex);
        } else {
            // we don't know what the child's did is going to be, so we'll just use a regex
            const urlRegex = new RegExp(
                `${this.redirectUrl}\\?did=did\%3Aweb\%3Alocalhost\%253A4000\%3Ausers\%3A.*&vp=.*`
            );
            await expect(this.page).toHaveURL(urlRegex);
        }
    }
}
