import { expect } from '@playwright/test';
import { Page } from '@playwright/test';

export const FAMILY = {
    name: 'Demo Family',
    motto: 'Best testers around 😎',
    parent: {
        name: 'Demo',
    },
    children: [
        {
            name: 'Thor',
            tagline: 'God of Thunder',
        },
        {
            name: 'Loki',
            tagline: 'God of Mischief',
        },
        {
            name: 'Hela',
            tagline: 'Goddess of Death',
        },
    ],
};

export class FamilyCMSPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async validateContentPage() {
        await expect(this.page.getByRole('heading', { name: 'New Family' })).toBeVisible();
        await expect(this.page.getByText(FAMILY.name)).toBeVisible();
    }

    async fillOutContentPage({
        motto = FAMILY.motto,
        children = [],
    }: // guardians = [],
        {
            motto?: string;
            children?: { name: string; tagline: string }[];
            // guardians?: {name: string; tagline: string}[];
        }) {
        await this.page.getByRole('textbox', { name: 'motto' }).fill(motto);

        for (const child of children) {
            await this.page.getByLabel('Add Family Member').click();
            await this.page.getByRole('button', { name: 'Add a Child' }).click();
            await this.page.getByLabel('Name').fill(child.name);
            await this.page.getByLabel('Tagline').fill(child.tagline);
            await this.page.getByRole('button', { name: 'Create' }).nth(1).click();
        }

        // Guardians are trickier since they're chosen from the Address Book

        // Set PIN
        await this.page.getByRole('button', { name: 'Set Pin' }).click();
        await this.page.getByRole('button', { name: '1', exact: true }).click();
        await this.page.getByRole('button', { name: '2', exact: true }).click();
        await this.page.getByRole('button', { name: '3', exact: true }).click();
        await this.page.getByRole('button', { name: '4', exact: true }).click();
        await this.page.getByRole('button', { name: '5', exact: true }).click();
        await this.page.getByRole('button', { name: 'Set PIN', exact: true }).click();
        await this.page.getByRole('button', { name: '1', exact: true }).click();
        await this.page.getByRole('button', { name: '2', exact: true }).click();
        await this.page.getByRole('button', { name: '3', exact: true }).click();
        await this.page.getByRole('button', { name: '4', exact: true }).click();
        await this.page.getByRole('button', { name: '5', exact: true }).click();
        await this.page.getByRole('button', { name: 'Verify PIN' }).click();
    }

    async clickCreateFamily() {
        await this.page.getByRole('button', { name: 'Create' }).first().click();
        await expect.soft(this.page.getByText('Loading...')).toBeVisible();
        await expect.soft(this.page.getByText('Loading...')).not.toBeVisible({ timeout: 30000 }); // wait for family creation to finish
    }

    async validateAddChildAccountPage() {
        await expect(this.page.getByText('Child Account')).toBeVisible();
        await expect(this.page.getByText('Child in Demo Family')).toBeVisible(); // Update to use dynamic name when needed

        await expect(this.page.locator('ion-input').filter({ hasText: 'Name' })).toBeVisible();
        await expect(this.page.locator('ion-input').filter({ hasText: 'Tagline' })).toBeVisible();

        await expect(this.page.getByRole('button', { name: 'Edit LearnCard' })).toBeVisible();
        await expect(
            this.page.getByRole('contentinfo').getByRole('button', { name: 'Cancel' })
        ).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Create' })).toBeVisible();
    }

    async createChildAccount(name: string, tagline?: string) {
        await this.page.getByLabel('Name').fill(name);

        if (tagline) {
            await this.page.getByLabel('Tagline').fill(name);
        }

        await this.page.getByRole('button', { name: 'Create' }).click();
    }
}

export class FamilyHandler {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async createFamily(options?: { includeAllFamilyMembers: boolean }) {
        const { includeAllFamilyMembers = false } = options ?? {};

        await this.page.goto('http://localhost:3000/families');
        await this.page.getByLabel('plus-button').click();
        await this.page.getByRole('textbox', { name: 'motto' }).fill(FAMILY.motto);

        await this.page.getByLabel('Add Family Member').click();
        await this.page.getByRole('button', { name: 'Add a Child' }).click();
        await this.page.getByLabel('Name').fill(FAMILY.children[0].name);
        await this.page.getByRole('button', { name: 'Create' }).nth(1).click(); // create child

        if (includeAllFamilyMembers) {
            await this.page.getByLabel('Add Family Member').click();
            await this.page.getByRole('button', { name: 'Add a Child' }).click();
            await this.page.getByLabel('Name').fill(FAMILY.children[1].name);
            await this.page.getByRole('button', { name: 'Create' }).nth(1).click(); // create child

            await this.page.getByLabel('Add Family Member').click();
            await this.page.getByRole('button', { name: 'Add a Child' }).click();
            await this.page.getByLabel('Name').fill(FAMILY.children[2].name);
            await this.page.getByRole('button', { name: 'Create' }).nth(1).click(); // create child
        }

        // Set PIN
        await this.page.getByRole('button', { name: 'Set Pin' }).click();
        await this.page.getByRole('button', { name: '1', exact: true }).click();
        await this.page.getByRole('button', { name: '2', exact: true }).click();
        await this.page.getByRole('button', { name: '3', exact: true }).click();
        await this.page.getByRole('button', { name: '4', exact: true }).click();
        await this.page.getByRole('button', { name: '5', exact: true }).click();
        await this.page.getByRole('button', { name: 'Set PIN', exact: true }).click();
        await this.page.getByRole('button', { name: '1', exact: true }).click();
        await this.page.getByRole('button', { name: '2', exact: true }).click();
        await this.page.getByRole('button', { name: '3', exact: true }).click();
        await this.page.getByRole('button', { name: '4', exact: true }).click();
        await this.page.getByRole('button', { name: '5', exact: true }).click();
        await this.page.getByRole('button', { name: 'Verify PIN' }).click();

        await this.page.getByRole('button', { name: 'Create' }).first().click(); // create family

        await expect(this.page.getByText('Loading...')).toBeVisible();
        await expect(this.page.getByText('Loading...')).not.toBeVisible({ timeout: 30000 }); // wait for loading (aka issuing boost) to finish

        await expect(this.page.getByText('family').first()).toBeVisible(); // wait till the boost is issued and we land back on the family page
        await expect(this.page.getByText('Demo Family').first()).toBeVisible({ timeout: 10000 });
    }

    async switchToChildAccount(name: string, includeWalletRedirect = false) {
        if (includeWalletRedirect) {
            await this.page.goto('/wallet');
        }

        await this.page.getByLabel('qr-code-scanner-button').click();
        await this.page.getByRole('button', { name: 'Switch Account' }).click();
        await this.page.getByRole('button', { name }).click();

        await expect(this.page.locator('#cancel-modal')).not.toBeVisible({ timeout: 10000 });
    }

    async enterPin() {
        await this.page.getByRole('button', { name: '1', exact: true }).click();
        await this.page.getByRole('button', { name: '2', exact: true }).click();
        await this.page.getByRole('button', { name: '3', exact: true }).click();
        await this.page.getByRole('button', { name: '4', exact: true }).click();
        await this.page.getByRole('button', { name: '5', exact: true }).click();
        await this.page.getByRole('button', { name: 'Verify PIN', exact: true }).click();
    }
}
