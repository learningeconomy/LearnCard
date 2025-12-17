import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { loginTestAccount, logoutTestAccount } from './test.helpers';
import { gameFlowContract, testContract } from './consent-flow.helpers';
import { FAMILY, FamilyCMSPage, FamilyHandler } from './family.page';
import { LaunchPadPage } from './launchpad.page';
import { GameFlowPage, gameRedirectUrl } from './game-flow.page';
import { ConsentFlowPage } from './consent-flow.page';
import { BoostCategoryOptionsEnum } from '../src/components/boost/boost-options/boostOptions';

test.describe('ConsentFlow', () => {
    test('External Door - Logged In - Full Flow', async ({ page }) => {
        const consentFlowPage = new ConsentFlowPage(page);
        await consentFlowPage.goto();

        await consentFlowPage.validateExternalDoor();
        await consentFlowPage.clickContinue();

        await consentFlowPage.validateFullScreenConfirmation();
        await consentFlowPage.clickAccept();

        await consentFlowPage.validateConnecting();

        await expect(page.locator('#full-screen-modal')).not.toBeVisible({ timeout: 10000 });

        const launchPadPage = new LaunchPadPage(page);
        await launchPadPage.clickOpen(testContract.name);

        await consentFlowPage.validateFullScreenConfirmation({ isPostConsent: true });
    });

    test('External Door - Not Logged In - Full Flow', async ({ page }) => {
        await logoutTestAccount(page);
        // Sometimes it fails here with "Please make an account first!"
        //   No idea why...

        const consentFlowPage = new ConsentFlowPage(page);
        await consentFlowPage.goto();

        await consentFlowPage.validateExternalDoorLoggedOut();
        await consentFlowPage.clickLogin();

        await loginTestAccount(page);
        await page.waitForURL(/consent-flow/);

        await consentFlowPage.validateExternalDoor();
        await consentFlowPage.clickContinue();

        await consentFlowPage.validateFullScreenConfirmation();
        await consentFlowPage.clickAccept();

        await expect(page.locator('#full-screen-modal')).not.toBeVisible({ timeout: 10000 });

        const launchPadPage = new LaunchPadPage(page);
        await launchPadPage.clickOpen(testContract.name);

        await consentFlowPage.validateFullScreenConfirmation({ isPostConsent: true });
    });

    test('External Door - Child Account - Full Flow', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const childName = FAMILY.children[0].name;
        await familyHandler.switchToChildAccount(childName, true);

        const consentFlowPage = new ConsentFlowPage(page);
        await consentFlowPage.goto();

        await consentFlowPage.validateExternalDoor(childName);
        await consentFlowPage.clickContinue();

        await consentFlowPage.validateGetAnAdult();
        await consentFlowPage.clickThatsMe();

        await familyHandler.enterPin();

        await consentFlowPage.validateFullScreenConfirmation({
            childName,
        });
        await consentFlowPage.clickAccept();

        await consentFlowPage.validateConnecting();

        await expect(page.locator('#full-screen-modal')).not.toBeVisible({ timeout: 10000 });

        const launchPadPage = new LaunchPadPage(page);
        await launchPadPage.clickOpen(testContract.name);

        // requires adult consent / pin when opening a contract post consent
        await consentFlowPage.validateGetAnAdult();
        await consentFlowPage.clickThatsMe();

        await familyHandler.enterPin();

        await consentFlowPage.validateFullScreenConfirmation({ isPostConsent: true });
    });

    test('LaunchPad - Full Flow', async ({ page }) => {
        const launchPadPage = new LaunchPadPage(page);
        const consentFlowPage = new ConsentFlowPage(page);

        await launchPadPage.createContractAndGoto();

        // ConsentFlow should open automatically
        await consentFlowPage.validateFullScreenConfirmation();

        // Close and re-open from "Get"
        await consentFlowPage.clickCancel();
        await launchPadPage.clickGet(testContract.name);

        // Now accept the contract
        await consentFlowPage.validateFullScreenConfirmation();
        await consentFlowPage.clickAccept();

        await consentFlowPage.validateConnecting();

        await expect(page.locator('#full-screen-modal')).not.toBeVisible({ timeout: 10000 });

        // Re-open in post-consent state
        await launchPadPage.clickOpen(testContract.name);
        await consentFlowPage.validateFullScreenConfirmation({ isPostConsent: true });
    });

    test('LaunchPad - Child Account - Full Flow', async ({ page }) => {
        const consentFlowPage = new ConsentFlowPage(page);
        const launchPadPage = new LaunchPadPage(page);
        const familyHandler = new FamilyHandler(page);

        await familyHandler.createFamily();
        const childName = FAMILY.children[0].name;

        await familyHandler.switchToChildAccount(childName, true);

        await launchPadPage.createContractAndGoto();

        // ConsentFlow should open automatically
        await consentFlowPage.validateGetAnAdult();

        // Close and re-open from "Get"
        await consentFlowPage.clickCancel();
        await launchPadPage.clickGet(testContract.name);

        // Now accept the contract
        await consentFlowPage.validateGetAnAdult();
        await consentFlowPage.clickThatsMe();

        await familyHandler.enterPin();

        await consentFlowPage.validateFullScreenConfirmation({
            childName,
        });
        await consentFlowPage.clickAccept();

        await consentFlowPage.validateConnecting();

        await expect(page.locator('#full-screen-modal')).not.toBeVisible({ timeout: 10000 });

        // Re-open in post-consent state, requires pin since we're logged in as a child
        await launchPadPage.clickOpen(testContract.name);
        await consentFlowPage.validateGetAnAdult();
        await consentFlowPage.clickThatsMe();

        await familyHandler.enterPin();

        await consentFlowPage.validateFullScreenConfirmation({ isPostConsent: true });
    });

    test('LaunchPad - Privacy and Data', async ({ page }) => {
        const launchPadPage = new LaunchPadPage(page);
        const consentFlowPage = new ConsentFlowPage(page);

        const customContractOptions = {
            name: 'P&D Contract',
            anonymize: true,
            readCategories: [
                {
                    category: BoostCategoryOptionsEnum.socialBadge,
                    required: false,
                },
            ],
            readPersonal: [{ field: 'name', required: false }],
            writeCategories: [
                {
                    category: BoostCategoryOptionsEnum.id,
                    required: false,
                },
            ],
        };

        await launchPadPage.createContractAndGoto(customContractOptions);
        consentFlowPage.customContractOptions = customContractOptions;

        // ConsentFlow should open automatically
        await consentFlowPage.validateFullScreenConfirmation();

        // Edit Access (Privacy & Data)
        await consentFlowPage.clickPrivacyAndData();
        await consentFlowPage.validatePrivacyAndData();

        // await page.waitForTimeout(2000);

        // Now accept the contract
        /* await consentFlowPage.validateFullScreenConfirmation();
        await consentFlowPage.clickAccept();

        await consentFlowPage.validateConnecting();

        await expect(page.locator('#full-screen-modal')).not.toBeVisible({ timeout: 10000 });

        // Re-open in post-consent state
        await launchPadPage.clickOpen(testContract.name);
        await consentFlowPage.validateFullScreenConfirmation({ isPostConsent: true }); */
    });

    test('LaunchPad - Privacy and Data - No Permissions Requested', async ({ page }) => {
        const launchPadPage = new LaunchPadPage(page);
        const consentFlowPage = new ConsentFlowPage(page);

        const customContractOptions = {
            name: 'P&D Contract',
            anonymize: true,
            readCategories: [],
            readPersonal: [],
            writeCategories: [],
        };

        await launchPadPage.createContractAndGoto(customContractOptions);
        consentFlowPage.customContractOptions = customContractOptions;

        // ConsentFlow should open automatically
        await consentFlowPage.validateFullScreenConfirmation();

        // Edit Access (Privacy & Data)
        await consentFlowPage.clickPrivacyAndData();
        await consentFlowPage.validatePrivacyAndData();

        // await page.waitForTimeout(2000);

        // Now accept the contract
        /* await consentFlowPage.validateFullScreenConfirmation();
        await consentFlowPage.clickAccept();

        await consentFlowPage.validateConnecting();

        await expect(page.locator('#full-screen-modal')).not.toBeVisible({ timeout: 10000 });

        // Re-open in post-consent state
        await launchPadPage.clickOpen(testContract.name);
        await consentFlowPage.validateFullScreenConfirmation({ isPostConsent: true }); */
    });

    test('LaunchPad - Privacy and Data - All Permissions', async ({ page }) => {
        const launchPadPage = new LaunchPadPage(page);
        const consentFlowPage = new ConsentFlowPage(page);

        const customContractOptions = {
            name: 'P&D Contract',
            anonymize: true,
            readCategories: [
                {
                    category: BoostCategoryOptionsEnum.socialBadge,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.id,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.job,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.skill,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.course,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.family,
                    required: true,
                },
                /* {
                    category: BoostCategoryOptionsEnum.currency,
                    required: true,
                }, */
                /* {
                    category: BoostCategoryOptionsEnum.describe,
                    required: true,
                }, */
                {
                    category: BoostCategoryOptionsEnum.membership,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.achievement,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.accommodation,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.accomplishment,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.workHistory,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.learningHistory,
                    required: true,
                },
            ],
            readPersonal: [
                {
                    field: 'name',
                    required: true,
                },
                {
                    field: 'image',
                    required: true,
                },
                {
                    field: 'email',
                    required: true,
                },
            ],
            writeCategories: [
                {
                    category: BoostCategoryOptionsEnum.socialBadge,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.id,
                    required: false,
                },
                {
                    category: BoostCategoryOptionsEnum.job,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.skill,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.course,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.family,
                    required: true,
                },
                /* {
                    category: BoostCategoryOptionsEnum.currency,
                    required: true,
                }, */
                /* {
                    category: BoostCategoryOptionsEnum.describe,
                    required: true,
                }, */
                {
                    category: BoostCategoryOptionsEnum.membership,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.achievement,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.accommodation,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.accomplishment,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.workHistory,
                    required: true,
                },
                {
                    category: BoostCategoryOptionsEnum.learningHistory,
                    required: true,
                },
            ],
        };

        await launchPadPage.createContractAndGoto(customContractOptions);
        consentFlowPage.customContractOptions = customContractOptions;

        // ConsentFlow should open automatically
        await consentFlowPage.validateFullScreenConfirmation();

        // Edit Access (Privacy & Data)
        await consentFlowPage.clickPrivacyAndData();
        await consentFlowPage.validatePrivacyAndData();

        // await page.waitForTimeout(2000);

        // Now accept the contract
        /* await consentFlowPage.validateFullScreenConfirmation();
        await consentFlowPage.clickAccept();

        await consentFlowPage.validateConnecting();

        await expect(page.locator('#full-screen-modal')).not.toBeVisible({ timeout: 10000 });

        // Re-open in post-consent state
        await launchPadPage.clickOpen(testContract.name);
        await consentFlowPage.validateFullScreenConfirmation({ isPostConsent: true }); */
    });

    // More tests:
    //   Edit access
    //   Test being able to read / write to Demo's LC after they accept a contract

    // We don't actually want to test the hidden create contract page rn
    /* test.skip('Create contract', async ({ page }) => {
        await page.goto('/hidden/custom-wallet');
        await page.getByRole('textbox').fill('a');
        await page.getByRole('button', { name: 'Create Wallet' }).click();

        // Create a LCN account if one doesn't already exist
        await page.getByText('Manage LCN Account').click();

        const accountAlreadyExists = await locatorExists(page.getByText('Update')); // probably unnecessary

        if (!accountAlreadyExists) {
            await page.getByLabel('profileId').fill('playwrightTestBoi');
            await page.getByLabel('displayName').fill('Playwright Tester');
            await page.getByLabel('bio').fill("I'm just  playwright boy, in a testing wooOOoorld");
            await page.getByLabel('email').fill('playwright@tester.io');
            await page
                .getByLabel('image')
                .fill('https://cdn.filestackcontent.com/kcjGaW8SRuiL0AP2OJfe');
            await page.getByText('Create').click();

            // The Create button should change to Update after the account has been created
            await expect(page.getByText('Update')).toBeVisible();
        }

        await page.getByText('< Back').click();

        // Create contracts if they don't already exist
        const contractMeta = {
            name: 'Playwrite Test Contract',
            subtitle: 'Playwrite Test Contract Subtitle',
            description: 'Playwrite Test Contract Description',
            image: 'https://cdn.filestackcontent.com/kcjGaW8SRuiL0AP2OJfe',
        };

        // TODO check if contract already exists
        //   seems we don't need to actually do this bc it's cleared every time
        // await page.getByText('View Contracts').click();
        // await page.getByText('< Back').click();

        await page.getByText('Create a Contract').click();
        await page.getByLabel('Name').fill(contractMeta.name);
        await page.getByLabel('Subtitle').fill(contractMeta.subtitle);
        await page.getByLabel('Description').fill(contractMeta.description);
        await page.getByLabel('Image').fill(contractMeta.image);

        await page.getByText('New Category').first().click();
        await page
            .locator('li')
            .filter({ hasText: 'Required' })
            .locator('input[type="text"]')
            .fill('Achievement');

        await page.getByText('New Personal Info').first().click();
        await page
            .locator('section')
            .filter({ hasText: /^RequiredNew Personal Info$/ })
            .locator('input[type="text"]')
            .fill('Name');

        await page.getByText('Create', { exact: true }).click();

        // wait for name to be clear
        await expect(page.getByLabel('Name')).toHaveText('');

        // Go get the contract URI
        await page.getByText('< Back').click();
        await page.getByText('View Contracts').click();
        try {
            await expect(page.getByText(contractMeta.name)).toBeVisible();
        } catch {
            await page.getByText('< Back').click();
            await page.getByText('View Contracts').click();
        }

        const contractUri = await page.getByText('lc:network').innerText();

        await mockLaunchDarkly(page, {
            contracts: {
                value: [contractUri],
            },
        });

        await page.goto('/launchpad');

        // const appItems = page
        //  .getByRole('list')
        //  .filter({ hasText: contractMeta.name }) // filter so that the sidebar is excluded
        //  .getByRole('listitem');

        //await locatorExists(appItems, 5000); // wait for app items to appear
        //const connectButton = appItems
        //  .filter({ hasText: contractMeta.name })
        //  .getByRole('button', { name: 'Connect' });

    //await page
    //  .locator('ion-item')
    //  .filter({ hasText: contractMeta.name })
    //  .getByRole('button', { name: 'Connect' })
    //  .click();

    await expect(page.getByRole('heading').getByText(contractMeta.name)).toBeVisible();

    await page.getByText('Cancel', { exact: true }).click();

    }); */
});

test.describe('GameFlow (needsGuardianConsent)', () => {
    test('GameFlow - Logged In - Has Family - Full Flow', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - Logged In - No Family - Full Flow', async ({ page }) => {
        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateCreateFamilyPage();
        await gameFlowPage.clickNewFamily();

        const familyCms = new FamilyCMSPage(page);
        await familyCms.validateContentPage();
        await familyCms.fillOutContentPage({
            motto: FAMILY.motto,
            children: FAMILY.children,
        });

        await familyCms.clickCreateFamily();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);

        await gameFlowPage.selectPlayer(FAMILY.children[0].name); // Select Thor

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - Not Logged In - Has Family - Full Flow', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        await logoutTestAccount(page);

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateLoginPage();
        await gameFlowPage.demoEmailLogin();

        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - Not Logged In - No Family - Full Flow', async ({ page }) => {
        await logoutTestAccount(page);

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateLoginPage();
        await gameFlowPage.demoEmailLogin();

        await gameFlowPage.validateCreateFamilyPage();
        await gameFlowPage.clickNewFamily();

        const familyCms = new FamilyCMSPage(page);
        await familyCms.validateContentPage();
        await familyCms.fillOutContentPage({
            motto: FAMILY.motto,
            children: FAMILY.children,
        });

        await familyCms.clickCreateFamily();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);

        await gameFlowPage.selectPlayer(FAMILY.children[0].name); // Select Thor

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - Add Player', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.clickAddPlayer();

        const familyCms = new FamilyCMSPage(page);
        await familyCms.validateAddChildAccountPage();
        await familyCms.createChildAccount(FAMILY.children[1].name);

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
        ]);
        await gameFlowPage.selectPlayer(FAMILY.children[1].name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - Select a Different Player', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily({ includeAllFamilyMembers: true });

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickSelectADifferentPlayer();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);
        await gameFlowPage.selectPlayer(FAMILY.children[0].name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickSelectADifferentPlayer();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);
        await gameFlowPage.selectPlayer(FAMILY.children[2].name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - Confirm Child did Consented', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.selectPlayer(FAMILY.children[0].name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();

        const launchPadPage = new LaunchPadPage(page);
        launchPadPage.goto();

        // Confirm that we're logged into child account
        await page.getByLabel('qr-code-scanner-button').click();
        await expect(page.getByText(FAMILY.children[0].name)).toBeVisible();
        await page.getByRole('button', { name: 'X', exact: true }).click(); // great, close LC modal

        await expect(page.getByText(gameFlowContract.name)).toBeVisible(); // confirm the game is listed as a consented contract

        // Just to be sure, we'll switch to the parent and make sure it doesn't appear for them
        await page.getByLabel('qr-code-scanner-button').click();
        await page.getByRole('button', { name: 'Switch Account' }).click();
        await page.getByRole('button', { name: FAMILY.parent.name }).click();

        await familyHandler.enterPin();

        // wait for the modal to close on switch
        await expect(page.getByText('Loading Accounts...')).toBeVisible();
        await expect(page.getByText('Loading Accounts...')).not.toBeVisible();

        try {
            await expect(page.getByText('Select Profile')).not.toBeVisible();
        } catch {
            // not sure why it fails to close the modal here...
            //   but that's not what we're trying to test here so we'll just manually close the modal if this happens
            await page.getByRole('button', { name: 'Close', exact: true }).first().click();
        }
        await page.getByRole('button', { name: 'X', exact: true }).click(); // close LC modal

        // the contract shouldn't be visible on the parent's account
        await expect(page.getByText(gameFlowContract.name)).not.toBeVisible();
    });

    test('GameFlow - Prefers returnTo url param', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto({ includeReturnToUrlParam: true });
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - Back to Game - Landing', async ({ page }) => {
        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();

        // Back to Game
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        // back to previous step
        await gameFlowPage.clickBack();
        await gameFlowPage.validateLandingPage();

        // Back to Game, for real this time
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        await gameFlowPage.clickReturnToGame();

        await gameFlowPage.expectRedirectUrlWithoutDid();
    });

    test('GameFlow - Back to Game - Create Family', async ({ page }) => {
        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();

        await gameFlowPage.clickImAnAdult();
        await gameFlowPage.validateCreateFamilyPage();

        // Back to Game
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        // back to previous step
        await gameFlowPage.clickBack();
        await gameFlowPage.validateCreateFamilyPage();

        // Back to Game, for real this time
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        await gameFlowPage.clickReturnToGame();

        await gameFlowPage.expectRedirectUrlWithoutDid();
    });

    test('GameFlow - Back to Game - Login', async ({ page }) => {
        await logoutTestAccount(page);

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();

        await gameFlowPage.clickImAnAdult();
        await gameFlowPage.validateLoginPage();

        // Back to Game
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        // back to previous step
        await gameFlowPage.clickBack();
        await gameFlowPage.validateLoginPage();

        // Back to Game, for real this time
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        await gameFlowPage.clickReturnToGame();

        await gameFlowPage.expectRedirectUrlWithoutDid();
    });

    test("GameFlow - Back to Game - Who's Playing", async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();

        await gameFlowPage.clickImAnAdult();
        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);

        // Back to Game
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        // back to previous step
        await gameFlowPage.clickBack();
        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);

        // Back to Game, for real this time
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        await gameFlowPage.clickReturnToGame();

        await gameFlowPage.expectRedirectUrlWithoutDid();
    });

    test('GameFlow - Back to Game - Confirmation', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();

        await gameFlowPage.clickImAnAdult();

        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();

        // Back to Game
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        // back to previous step
        await gameFlowPage.clickBack();
        await gameFlowPage.validateConfirmationPage();

        // Back to Game, for real this time
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        await gameFlowPage.clickReturnToGame();

        await gameFlowPage.expectRedirectUrlWithoutDid();
    });

    test('GameFlow - Back to Game - Exit to LearnCard', async ({ page }) => {
        const gameFlowPage = new GameFlowPage(page);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();

        // Back to Game
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        // back to previous step
        await gameFlowPage.clickBack();
        await gameFlowPage.validateLandingPage();

        // Back to Game, for real this time
        await gameFlowPage.clickBackToGame();
        await gameFlowPage.validateBackToGamePage();

        await gameFlowPage.clickExitToLearnCard();

        await expect(page).toHaveURL('/wallet');
    });

    test('GameFlow - Add Game Screen: Custom reason for accessing', async ({ page }) => {
        const gameFlowPage = new GameFlowPage(page);
        await gameFlowPage.goto();

        // with a custom reasonForAccessing we want to display the reason + the "Get an adult to continue." message
        await expect(page.getByText(gameFlowContract.reasonForAccessing as string)).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText('Get an adult to continue.')).toBeVisible();
    });

    test('GameFlow - Add Game Screen: No custom reason for accessing', async ({ page }) => {
        const gameFlowPage = new GameFlowPage(page);
        await gameFlowPage.goto({ includeReasonForAccessing: false });

        // with no custom reason for accessing, we should get a generic message
        await expect(page.getByText('Get an adult to save your progress and skills')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText('Get an adult to continue')).toHaveCount(0);
    });

    test('GameFlow - Logged In Child Switches to Parent at Landing', async ({ page }) => {
        const gameFlowPage = new GameFlowPage(page);
        const familyHandler = new FamilyHandler(page);

        // Create family with 3 children
        await familyHandler.createFamily({ includeAllFamilyMembers: true });

        // Switch to Child account
        await familyHandler.switchToChildAccount(FAMILY.children[0].name);

        await gameFlowPage.goto();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickImAnAdult(); // this is where the switch to adult account should happen

        // We should have to enter a PIN here
        await familyHandler.enterPin();

        // if we're still logged into the child account, we'll only see the parent listed here
        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);
    });

    test('GameFlow - LaunchPad - Opens automatically', async ({ page }) => {
        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow();
        await gameFlowPage.validateLandingPage();
    });

    test('GameFlow - LaunchPad - Opens on Connect click', async ({ page }) => {
        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow({ suppressContractModal: true });
        await launchPadPage.clickConnect(gameFlowContract.name);

        await gameFlowPage.validateLandingPage();
    });

    test('GameFlow - LaunchPad - Closes modal on cancel', async ({ page }) => {
        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow();

        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickCancel();

        await expect(page.locator('#full-screen-modal')).not.toBeAttached();

        // double check that the contract is still there and clicking it re-opens
        await launchPadPage.clickConnect(gameFlowContract.name);
        await gameFlowPage.validateLandingPage();
    });

    test('GameFlow - LaunchPad - Has Family - Full Flow', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow();

        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickSelectPlayer();
        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - LaunchPad - No Family - Full Flow', async ({ page }) => {
        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow();

        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickSelectPlayer();

        await gameFlowPage.validateCreateFamilyPage();
        await gameFlowPage.clickNewFamily();

        const familyCms = new FamilyCMSPage(page);
        await familyCms.validateContentPage();
        await familyCms.fillOutContentPage({
            motto: FAMILY.motto,
            children: FAMILY.children,
        });

        await familyCms.clickCreateFamily();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);

        await gameFlowPage.selectPlayer(FAMILY.children[0].name); // Select Thor

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - LaunchPad - No redirect URL', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow({ includeRedirectUrl: false }); // no redirect url in contract

        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickSelectPlayer();
        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        gameFlowPage.noRedirectUrl = true; // tell gameFlowPage that there's actally no redirect URL
        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickReturnToLearnCard(); // Button should say "Return to LearnCard"

        await expect(page.locator('#full-screen-modal')).not.toBeAttached(); // Expect modal to be closed
    });

    test('GameFlow - LaunchPad - Prefers returnTo url param', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow({ includeReturnToUrlParam: true });

        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickSelectPlayer();

        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        gameFlowPage.redirectUrl = gameRedirectUrl; // manually set this field, so we're expecting the url param
        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - LaunchPad - Add Player', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily();

        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickSelectPlayer();

        await gameFlowPage.validateWhosPlayingPage([FAMILY.parent.name, FAMILY.children[0].name]);
        await gameFlowPage.clickAddPlayer();

        const familyCms = new FamilyCMSPage(page);
        await familyCms.validateAddChildAccountPage();
        await familyCms.createChildAccount(FAMILY.children[1].name);

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
        ]);
        await gameFlowPage.selectPlayer(FAMILY.children[1].name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    test('GameFlow - LaunchPad - Select a Different Player', async ({ page }) => {
        const familyHandler = new FamilyHandler(page);
        await familyHandler.createFamily({ includeAllFamilyMembers: true });

        const launchPadPage = new LaunchPadPage(page);
        const gameFlowPage = new GameFlowPage(page, { fromLaunchPad: true });

        await launchPadPage.gotoGameFlow();
        await gameFlowPage.validateLandingPage();
        await gameFlowPage.clickSelectPlayer();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);
        await gameFlowPage.selectPlayer(FAMILY.parent.name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickSelectADifferentPlayer();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);
        await gameFlowPage.selectPlayer(FAMILY.children[0].name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickSelectADifferentPlayer();

        await gameFlowPage.validateWhosPlayingPage([
            FAMILY.parent.name,
            FAMILY.children[0].name,
            FAMILY.children[1].name,
            FAMILY.children[2].name,
        ]);
        await gameFlowPage.selectPlayer(FAMILY.children[2].name);

        await gameFlowPage.validateConfirmationPage();
        await gameFlowPage.clickAllowAccess();

        await gameFlowPage.validateSuccessPage();
        await gameFlowPage.clickContinuePlaying();

        await gameFlowPage.expectRedirectUrlWithDid();
    });

    // TODO test for already consented to contract
    //   should see "Return to Game" button on Confirmation screen
    //   add and test "Edit Access"
});
