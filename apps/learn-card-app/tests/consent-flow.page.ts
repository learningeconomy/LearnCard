import { expect, Locator, Page } from '@playwright/test';
import {
    BoostCategoryOptionsEnum,
    categoryToDisplayNameMap,
    CustomContractOptions,
    getPermutations,
    initConsentFlowContract,
    initCustomConsentFlowContract,
    joinWithAnd,
    testContract,
} from './consent-flow.helpers';

export class ConsentFlowPage {
    readonly page: Page;
    customContractOptions: CustomContractOptions | undefined;

    constructor(page: Page) {
        this.page = page;
    }

    async goto(customContractOptions?: CustomContractOptions) {
        this.customContractOptions = customContractOptions;

        const contractUri = customContractOptions
            ? await initCustomConsentFlowContract(customContractOptions)
            : await initConsentFlowContract();

        const url = `/consent-flow?uri=${contractUri}`;
        await this.page.goto(url);
    }

    async validateExternalDoor(username: string = 'Demo') {
        // no sidebar
        await expect(this.page.locator('ion-menu')).not.toBeAttached();

        await expect(this.page.locator(`img[src="${testContract.image}"]`)).toBeVisible({
            timeout: 20000,
        });
        await expect(this.page.getByText(testContract.name)).toBeVisible();
        await expect(this.page.getByText(testContract.subtitle)).toBeVisible();
        await expect(
            this.page.getByRole('button', { name: `Continue as ${username}` })
        ).toBeVisible();
        await expect(this.page.getByText('Not you? Logout')).toBeVisible();
        await expect(this.page.getByText('LEARNCARD')).toBeVisible();
        await expect(this.page.getByText('LEARNCARD')).toHaveClass(/.*uppercase.*/);

        await expect(this.page.getByText('Universal Learning & Work Portfolio')).toBeVisible();

        await expect(this.page.getByRole('button', { name: 'Privacy Policy' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Terms of Service' })).toBeVisible();
    }

    async validateExternalDoorLoggedOut() {
        // no sidebar
        await expect(this.page.locator('ion-menu')).not.toBeAttached();

        await expect(this.page.locator(`img[src="${testContract.image}"]`)).toBeVisible({
            timeout: 15000,
        });
        await expect(this.page.getByText(testContract.name)).toBeVisible();
        await expect(this.page.getByText(testContract.subtitle)).toBeVisible();
        await expect(
            this.page.getByRole('button', { name: 'Sign up for LearnCard' })
        ).toBeVisible();
        await expect(this.page.getByText('Have an account? Login')).toBeVisible();
        await expect(this.page.getByText('LearnCard', { exact: true })).toBeVisible();
        await expect(this.page.getByText('LearnCard', { exact: true })).toHaveClass(
            /.*uppercase.*/
        );

        await expect(this.page.getByText('Universal Learning & Work Portfolio')).toBeVisible();

        await expect(this.page.getByRole('button', { name: 'Privacy Policy' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Terms of Service' })).toBeVisible();
    }

    async clickContinue() {
        await this.page.getByRole('button', { name: 'Continue as' }).click();
    }

    async clickLogin() {
        await this.page.getByRole('button', { name: 'Login' }).click();
    }

    async validateGetAnAdult() {
        await expect(
            this.page
                .locator('#full-screen-modal')
                .locator(`img[src="${testContract.image}"]`)
                .first()
        ).toBeVisible({ timeout: 15000 });
        await expect(this.page.getByRole('img', { name: 'Plus' })).toBeVisible();
        await expect(this.page.getByRole('img', { name: 'LearnCard App Icon' })).toBeVisible();

        await expect(this.page.locator('header').getByText(testContract.name)).toBeVisible();

        await expect(this.page.getByText('Add to LearnCard.')).toBeVisible();
        await expect(this.page.getByText('Save your progress and skills.')).toBeVisible();

        await expect(this.page.getByText('Get Demo')).toBeVisible();
        await expect(this.page.getByText('to continue')).toBeVisible();

        await expect(this.page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: "That's me!" })).toBeVisible();
    }

    async validateFullScreenConfirmation(options?: {
        isPostConsent?: boolean;
        childName?: string;
    }) {
        const { isPostConsent = false, childName } = options ?? {};
        const isChild = !!childName;

        await expect(
            this.page.locator('#full-screen-modal').locator(`img[src="${testContract.image}"]`)
        ).toBeVisible({ timeout: 15000 });
        if (!isPostConsent) {
            await expect(this.page.getByRole('img', { name: 'Plus' })).toBeVisible();

            if (!isChild) {
                await expect(
                    this.page.getByRole('img', { name: 'LearnCard App Icon' })
                ).toBeVisible();
            } else {
                // TODO
            }
        }

        await expect(this.page.locator('header').getByText(this.contractName())).toBeVisible();

        if (!isPostConsent) {
            if (isChild) {
                await expect(this.page.getByText(`Add to ${childName}'s`)).toBeVisible();
                await expect(this.page.getByText('LearnCard', { exact: true })).toBeVisible();
            } else {
                await expect(this.page.getByText('Add to LearnCard.')).toBeVisible();
                await expect(this.page.getByText('Save your progress and skills.')).toBeVisible();
            }
        }

        await this.validateHumanReadableContractTerms({ isPostConsent });

        await expect(this.page.getByRole('button', { name: 'Privacy & Data' })).toBeVisible();

        if (isPostConsent) {
            await expect(this.page.getByRole('button', { name: 'Close' })).toBeVisible();
        } else {
            await expect(this.page.getByRole('button', { name: 'Cancel' })).toBeVisible();
            await expect(this.page.getByRole('button', { name: 'Accept' })).toBeVisible();
        }
    }

    async validatePrivacyAndData(options?: { isPostConsent?: boolean }) {
        const { isPostConsent = false } = options ?? {};

        const rightModal = this.page.locator('#right-modal');

        // header
        await expect(
            rightModal.locator('header').locator(`img[src="${testContract.image}"]`)
        ).toBeVisible();
        await expect(rightModal.locator('header').getByText(this.contractName())).toBeVisible();
        await expect(rightModal.locator('header').getByText('Privacy & Data')).toBeVisible();

        // "requesting access" text (could refactor to be shared w/ Confirmation screen)
        await this.validateHumanReadableContractTerms({
            startingLocator: rightModal,
            isPostConsent,
        });

        // Read Credentials
        if (!this.customContractOptions) {
            // we're not gonna worry about testing the default contract here
            //   if a test is meant to test something sepecific, it should use customContractOptions
        } else if ((this.customContractOptions.readCategories?.length ?? 0) > 0) {
            await expect(
                this.page.getByRole('heading', { name: 'Share Your LearnCard Data' })
            ).toBeVisible();

            const readDataBox = this.page.locator(
                'div:has(h4:text-is("Share Your LearnCard Data"))'
            );

            await expect(readDataBox.getByRole('status', { name: 'Live Sync All' })).toHaveText(
                'Off'
            );
            await expect(
                readDataBox.getByText(
                    "Turning on Live Sync will automatically share all credentials as you get them. If it's turned off, you can selectively share specific wallet categories and credentials at any time"
                )
            ).toBeVisible();

            await Promise.all(
                this.customContractOptions.readCategories?.map(async ({ category, required }) => {
                    const categoryTitle = categoryToDisplayNameMap[category];
                    const categoryButton = readDataBox
                        .getByRole('button', { name: categoryTitle })
                        .first();

                    await expect(categoryButton).toBeVisible();
                })
            );
        } else {
            await expect(
                this.page.getByRole('heading', { name: 'Share Your LearnCard Data' })
            ).not.toBeVisible();
            await expect(
                this.page.getByRole('heading', {
                    name: 'This app is not able to read any credentials from your LearnCard.',
                })
            ).toBeVisible();
        }

        // Write Credentials
        const writeBoxTitle = `Allow ${this.contractName()} to Add Data to Your LearnCard`;
        if (!this.customContractOptions) {
            // we're not gonna worry about testing the default contract here
            //   if a test is meant to test something sepecific, it should use customContractOptions
        } else if ((this.customContractOptions.writeCategories?.length ?? 0) > 0) {
            await expect(this.page.getByRole('heading', { name: writeBoxTitle })).toBeVisible();

            const writeDataBox = this.page.locator(`div:has(h4:text-is("${writeBoxTitle}"))`);

            await expect(writeDataBox.getByRole('status', { name: 'Allow All' })).toHaveText(
                'Off' // this will be "Active" if all writeCategories are marked as required
            );
            await expect(
                writeDataBox.getByText(
                    'Turning on Allow All will let the app issue credentials and add them to your LearnCard. If turned off, you can selectively choose which wallet categories that the app can add to.'
                )
            ).toBeVisible();

            await Promise.all(
                this.customContractOptions.writeCategories?.map(async ({ category, required }) => {
                    const categoryTitle = categoryToDisplayNameMap[category];
                    const categoryButton = writeDataBox
                        .getByRole('button', { name: categoryTitle })
                        .first();

                    await expect(categoryButton).toBeVisible();
                })
            );
        } else {
            await expect(this.page.getByRole('heading', { name: writeBoxTitle })).not.toBeVisible();
            await expect(
                this.page.getByRole('heading', {
                    name: 'This app is not able to write any data to your LearnCard.',
                })
            ).toBeVisible();
        }

        // Read Personal
        if (!this.customContractOptions) {
            // we're not gonna worry about testing the default contract here
            //   if a test is meant to test something sepecific, it should use customContractOptions
        } else if ((this.customContractOptions.readPersonal?.length ?? 0) > 0) {
            await expect(
                this.page.getByRole('heading', { name: 'Share Your Personal Data' })
            ).toBeVisible();

            const readPersonalBox = this.page.locator(
                'div:has(h4:text-is("Share Your Personal Data"))'
            );

            await expect(readPersonalBox.getByRole('status', { name: 'Anonymize' })).toHaveText(
                this.customContractOptions.anonymize ? 'On' : 'Off'
            );
            await expect(
                readPersonalBox.getByText(
                    'Turning on Anonymize will hide your name, profile picture, and email when sharing to this app.'
                )
            ).toBeVisible();

            await Promise.all(
                this.customContractOptions.readPersonal?.map(async ({ field, required }) => {
                    const personalFieldTitle =
                        field.toLowerCase() === 'image' ? 'profile picture' : field;
                    const personalButton = readPersonalBox
                        .getByRole('button', { name: personalFieldTitle })
                        .first();

                    await expect(personalButton).toBeVisible();
                })
            );
        } else {
            await expect(
                this.page.getByRole('heading', { name: 'Share Your Personal Data' })
            ).not.toBeVisible();
        }
    }

    async validateHumanReadableContractTerms(options: {
        startingLocator?: Locator;
        isPostConsent: boolean;
    }) {
        const { startingLocator = this.page, isPostConsent } = options;
        await expect(startingLocator.getByText(this.contractName()).nth(1)).toBeVisible();

        const { readCategories, writeCategories, readPersonal } = this.customContractOptions ?? {};
        const isNotRequestingAccess =
            readCategories?.length === 0 &&
            writeCategories?.length === 0 &&
            readPersonal?.length === 0;

        if (isNotRequestingAccess) {
            await expect(
                startingLocator.getByText(
                    'is not requesting to read or write anything to your LearnCard'
                )
            ).toBeVisible();
        } else {
            if (isPostConsent) {
                await expect(startingLocator.getByText('has requested access to')).toBeVisible();
            } else {
                await expect(startingLocator.getByText('is requesting access to')).toBeVisible();
            }

            if ((this.customContractOptions?.readPersonal.length ?? 0) > 0) {
                const readPersonalFields =
                    this.customContractOptions?.readPersonal
                        .filter(({ field }) => ['name', 'image', 'email'].includes(field))
                        .map(({ field }) => {
                            if (field.toLowerCase() === 'image') return 'profile picture';
                            return field.toLowerCase();
                        }) ?? [];

                // We don't know what order they're gonna be in so try each permutation one by one
                const permutations = getPermutations(readPersonalFields);
                let foundMatch = false;
                let errors: any[] = [];

                for (const permutation of permutations) {
                    const expectedText = `view your ${joinWithAnd(permutation)}`;
                    try {
                        await expect(startingLocator.getByText(expectedText)).toBeVisible({
                            timeout: 100,
                        });
                        foundMatch = true;
                        break; // Exit the loop once a match is found
                    } catch (e) {
                        errors.push(e);
                        // Continue to the next permutation
                    }
                }

                // If no permutation matched, throw an error
                if (!foundMatch) {
                    throw new Error(
                        `Failed to find any permutation of "view your ${joinWithAnd(
                            readPersonalFields
                        )}" in the UI. Tried ${permutations.length} permutations.`
                    );
                }
            }

            // TODO more refinement here as any of these could not exist
            await expect(startingLocator.getByText('view and access credentials')).toBeVisible();
            await expect(startingLocator.getByText('you select to share, and')).toBeVisible();
            await expect(startingLocator.getByText('send credentials to you')).toBeVisible();
        }
    }

    async validateConnecting() {
        await expect(
            this.page.locator('#full-screen-modal').locator(`img[src="${testContract.image}"]`)
        ).toBeVisible();

        // use aria snapshot to check everything at once.
        //   awaiting individual asserts is too slow and causes test failure
        await expect(this.page.locator('#full-screen-modal')).toMatchAriaSnapshot(`
            - img
            - img "Sparkles"
            - progressbar:
              - img
            - text: Connecting Test Contract...
        `);
    }

    async clickAllow() {
        await this.page.getByRole('button', { name: 'Allow' }).click();
    }

    async clickAccept() {
        await this.page.getByRole('button', { name: 'Accept' }).click();
    }

    async clickThatsMe() {
        await this.page.getByRole('button', { name: "That's me!" }).click();
    }

    async clickCancel() {
        await this.page.getByRole('button', { name: 'Cancel' }).click();
    }

    async clickPrivacyAndData() {
        await this.page.getByRole('button', { name: 'Privacy & Data' }).click();
    }

    contractName() {
        return this.customContractOptions?.name ?? testContract.name;
    }

    // Old ConsentFlow components (ConsentFlowSyncCard + PostConsentFlowSyncCard)
    /* async validateSyncCard() {
        await expect(this.page.getByRole('heading', { name: 'LEARNCARD' })).toBeVisible();
        await expect(
            this.page.locator('#center-modal').locator(`img[src="${testContract.image}"]`)
        ).toBeVisible();
        await expect(this.page.locator('#center-modal').getByText(testContract.name)).toBeVisible();
        await expect(
            this.page.locator('#center-modal').getByText(testContract.subtitle)
        ).toBeVisible();
        await expect(this.page.getByText(testContract.description)).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Edit Access' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Allow' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await expect(
            this.page.locator('#center-modal').getByText('All connections are encrypted')
        ).toBeVisible();
    } */

    /* async validatePostSyncCard() {
        await expect(this.page.getByRole('heading', { name: 'LEARNCARD' })).toBeVisible();
        await expect(
            this.page.locator('#cancel-modal').locator(`img[src="${testContract.image}"]`)
        ).toBeVisible();
        await expect(this.page.locator('#cancel-modal').getByText(testContract.name)).toBeVisible();
        await expect(
            this.page.locator('#cancel-modal').getByText(testContract.description)
        ).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Edit Access' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Activity Feed' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Update' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Close' })).toBeVisible();
        await expect(
            this.page.locator('#cancel-modal').getByText('All connections are encrypted')
        ).toBeVisible();
    } */
}
