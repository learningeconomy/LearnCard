import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

import { TEST_USER_2_PROFILE_ID, TEST_USER_2_SEED, TEST_USER_PROFILE_ID } from './constants';
import { test } from './fixtures/test';
import { mockDidKitWasmForContext } from './route.helpers';
import { TEST_CREDENTIAL_TITLE, waitForAuthenticatedState } from './test.helpers';

// This is deliberately a journey-level accessibility suite. Static JSX rules
// catch authoring mistakes; axe verifies the composed UI after Ionic, portals,
// and client-side routing have rendered.
const HIGH_IMPACT_LEVELS = new Set(['serious', 'critical']);
const FOCUS_RESET_SENTINEL_ID = 'playwright-a11y-focus-reset';

/**
 * The Vite server can have a hosted tenant configuration baked in. Override it
 * per page so these journeys always exercise the local E2E services.
 */
const configureLocalE2EServices = async (page: Page): Promise<void> => {
    await page.route('**/tenant-config.json', async route => {
        const response = await route.fetch();
        const tenantConfig = (await response.json()) as {
            apis: Record<string, string>;
            [key: string]: unknown;
        };

        await route.fulfill({
            response,
            json: {
                ...tenantConfig,
                apis: {
                    ...tenantConfig.apis,
                    brainService: 'http://localhost:4000/trpc',
                    brainServiceApi: 'http://localhost:4000/api',
                    cloudService: 'http://localhost:4100/trpc',
                    xapi: 'http://localhost:4100/xapi',
                    lcaApi: 'http://localhost:5100/trpc',
                    notificationsEndpoint: 'http://localhost:5100/api/notifications/send',
                },
            },
        });
    });

    // A hosted tenant overlay must not replace the local baked configuration
    // during this isolated E2E journey.
    await page.route('**/__tenant-config', route => route.fulfill({ status: 404 }));
};

type FocusStyle = {
    boxShadow: string;
    outlineStyle: string;
    outlineWidth: string;
};

type ReducedMotionResult = {
    activeAnimationNames: string[];
    probeAnimationName: string;
    probeTransform: string;
    probeTransitionProperty: string;
    spinnerPaused: boolean;
    spinnerAnimationPlayStates: string[];
};

const axeAttachmentName = (checkpoint: string): string =>
    `axe-${checkpoint.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;

/**
 * Axe reports all impacts, but this rollout gates only serious and critical
 * violations. On failure, attach the actionable DOM targets to the test report
 * rather than making maintainers reproduce the page state to inspect them.
 */
const assertNoHighImpactViolations = async (
    page: Page,
    testInfo: TestInfo,
    checkpoint: string
): Promise<void> => {
    await expect(page.locator('body')).toBeVisible();

    // Preserve a visual record for each journey checkpoint. The report makes
    // review of default-state visual regressions possible without changing the
    // page or requiring screenshot assertions to update on product content.
    await testInfo.attach(`${axeAttachmentName(checkpoint).replace(/\.json$/, '')}.png`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
    });

    // Avoid sampling text mid-way through the app's short opacity entrance,
    // when composited colors can produce a false transient contrast failure.
    await page.evaluate(async () => {
        const transientAnimations = document.getAnimations().filter(animation => {
            const timing = animation.effect?.getTiming();

            return (
                animation.playState === 'running' &&
                timing?.iterations !== Infinity &&
                typeof timing?.duration === 'number' &&
                timing.duration <= 2_000
            );
        });

        await Promise.allSettled(transientAnimations.map(animation => animation.finished));
    });

    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter(
        violation => violation.impact && HIGH_IMPACT_LEVELS.has(violation.impact)
    );

    if (violations.length > 0) {
        await testInfo.attach(axeAttachmentName(checkpoint), {
            body: JSON.stringify(
                {
                    checkpoint,
                    url: page.url(),
                    violations: violations.map(violation => ({
                        id: violation.id,
                        impact: violation.impact,
                        help: violation.help,
                        description: violation.description,
                        helpUrl: violation.helpUrl,
                        nodes: violation.nodes.map(node => ({
                            target: node.target,
                            html: node.html,
                            failureSummary: node.failureSummary,
                        })),
                    })),
                },
                null,
                2
            ),
            contentType: 'application/json',
        });
    }

    const summary = violations
        .map(
            violation =>
                `${violation.impact}: ${violation.id} (${violation.nodes.length} node${
                    violation.nodes.length === 1 ? '' : 's'
                }) - ${violation.helpUrl}\n${violation.nodes
                    .map(
                        node =>
                            `  ${node.target.join(', ')}: ${node.failureSummary ?? ''}\n  HTML: ${
                                node.html
                            }`
                    )
                    .join('\n')}`
        )
        .join('\n');

    expect(
        violations.length,
        `Expected no serious or critical axe violations at "${checkpoint}" on ${page.url()}.${
            summary ? `\n${summary}` : ''
        }`
    ).toBe(0);
};

/**
 * Wait until the issuer's `lca-sa` signing-authority key is published in their
 * did:web document.
 *
 * The signing service issues claim-link credentials with the verification
 * method `<issuer did:web>#lca-sa`, and rejects the issuance outright when that
 * key is not yet in the resolved document. Because the issue flow registers the
 * signing authority on demand, the very first claim against a new issuer can
 * lose that race. This is a workaround for that backend timing, not a property
 * the accessibility journey means to assert.
 */
const waitForSigningAuthorityKey = async (page: Page, profileId: string): Promise<void> => {
    const didDocUrl = `http://localhost:4000/users/${encodeURIComponent(profileId)}/did.json`;

    await expect
        .poll(
            async () => {
                const response = await page.request.get(didDocUrl).catch(() => undefined);

                if (!response?.ok()) return false;

                return (await response.text()).includes('#lca-sa');
            },
            {
                timeout: 60_000,
                intervals: [500, 1_000, 2_000],
                message: `Expected ${didDocUrl} to publish the #lca-sa verification method`,
            }
        )
        .toBe(true);
};

const focusStyleFingerprint = async (locator: Locator): Promise<FocusStyle[]> =>
    locator.evaluate(element => {
        const elements: Element[] = [element];
        let parent = element.parentElement;

        for (let depth = 0; depth < 3 && parent; depth += 1) {
            elements.push(parent);
            parent = parent.parentElement;
        }

        return elements.map(currentElement => {
            const style = window.getComputedStyle(currentElement);

            return {
                boxShadow: style.boxShadow,
                outlineStyle: style.outlineStyle,
                outlineWidth: style.outlineWidth,
            };
        });
    });

const hasVisibleFocusIndicator = (styles: FocusStyle[]): boolean =>
    styles.some(style => {
        const hasOutline =
            style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth || '0') > 0;
        const hasBoxShadow = style.boxShadow !== 'none';

        return hasOutline || hasBoxShadow;
    });

const focusedElementDescription = async (page: Page): Promise<string> =>
    page.evaluate(() => {
        const activeElement = document.activeElement as HTMLElement | null;
        if (!activeElement) return '<none>';

        const name =
            activeElement.getAttribute('aria-label') ||
            activeElement.getAttribute('name') ||
            activeElement.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ||
            '';
        const role = activeElement.getAttribute('role') || activeElement.tagName.toLowerCase();

        return `${role}${name ? ` "${name}"` : ''}`;
    });

/**
 * Start each keyboard traversal from a controlled, off-screen focus target.
 * This avoids the browser preserving focus from a previous mouse-style action
 * and makes failures include the actual tab order that was observed.
 */
const placeFocusResetSentinel = async (page: Page): Promise<void> => {
    await page.evaluate(sentinelId => {
        document.getElementById(sentinelId)?.remove();

        const sentinel = document.createElement('span');
        sentinel.id = sentinelId;
        sentinel.tabIndex = 0;
        sentinel.setAttribute('aria-label', 'Keyboard focus reset');
        Object.assign(sentinel.style, {
            position: 'fixed',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clipPath: 'inset(50%)',
        });
        document.body.prepend(sentinel);
        sentinel.focus();
    }, FOCUS_RESET_SENTINEL_ID);
};

const removeFocusResetSentinel = async (page: Page): Promise<void> => {
    await page.evaluate(
        sentinelId => document.getElementById(sentinelId)?.remove(),
        FOCUS_RESET_SENTINEL_ID
    );
};

const tabTo = async (
    page: Page,
    target: Locator,
    options: { maxTabs?: number; resetFocus?: boolean } = {}
): Promise<Locator> => {
    const resolvedTarget = target.first();
    const { maxTabs = 160, resetFocus = true } = options;
    const focusTrail: string[] = [];

    await expect(resolvedTarget).toBeVisible({ timeout: 30_000 });
    await resolvedTarget.scrollIntoViewIfNeeded();

    if (resetFocus) await placeFocusResetSentinel(page);

    try {
        for (let index = 0; index < maxTabs; index += 1) {
            await page.keyboard.press('Tab');

            const isFocused = await resolvedTarget.evaluate(element => {
                const activeElement = document.activeElement;
                return (
                    activeElement === element ||
                    Boolean(activeElement && element.contains(activeElement))
                );
            });

            focusTrail.push(await focusedElementDescription(page));
            if (isFocused) return resolvedTarget;
        }
    } finally {
        if (resetFocus) await removeFocusResetSentinel(page);
    }

    throw new Error(
        `Could not reach ${resolvedTarget.toString()} with Tab after ${maxTabs} presses. ` +
            `Focus trail: ${focusTrail.join(' -> ')}`
    );
};

/**
 * A control is only considered keyboard-accessible when it can be reached by
 * Tab and exposes a visible indicator. Inspect nearby ancestors because Ionic
 * and composite controls sometimes render the ring on a wrapper.
 */
const focusWithVisibleIndicator = async (
    page: Page,
    target: Locator,
    options: { maxTabs?: number; resetFocus?: boolean } = {}
): Promise<Locator> => {
    const resolvedTarget = target.first();
    const shouldResetFocus = options.resetFocus ?? true;

    if (shouldResetFocus) await placeFocusResetSentinel(page);

    const before = await focusStyleFingerprint(resolvedTarget);

    try {
        await tabTo(page, resolvedTarget, { ...options, resetFocus: false });
    } finally {
        if (shouldResetFocus) await removeFocusResetSentinel(page);
    }
    await expect(resolvedTarget).toBeFocused();

    await expect
        .poll(async () => JSON.stringify(await focusStyleFingerprint(resolvedTarget)))
        .not.toBe(JSON.stringify(before));

    const after = await focusStyleFingerprint(resolvedTarget);
    expect(
        hasVisibleFocusIndicator(after),
        `Expected a visible keyboard focus indicator on ${resolvedTarget.toString()}`
    ).toBe(true);

    return resolvedTarget;
};

const activateWithKeyboard = async (
    page: Page,
    target: Locator,
    key: 'Enter' | 'Space' = 'Enter',
    options: { maxTabs?: number; resetFocus?: boolean; assertFocusIndicator?: boolean } = {}
): Promise<void> => {
    const { assertFocusIndicator = true, ...focusOptions } = options;

    if (assertFocusIndicator) {
        await focusWithVisibleIndicator(page, target, focusOptions);
    } else {
        await tabTo(page, target, focusOptions);
    }

    await page.keyboard.press(key);
};

/**
 * Exercise the app's reduced-motion CSS and Ionic spinner handling directly.
 * The probe verifies that opacity may remain, while transform and rotation do
 * not continue under a user preference for reduced motion.
 */
const assertTransformMotionIsDisabled = async (page: Page): Promise<void> => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const result: ReducedMotionResult = await page.evaluate(async () => {
        const root = document.getElementById('app-router');
        if (!root) throw new Error('Could not find the app router motion boundary.');

        const activeAnimationNames = Array.from(
            document.querySelectorAll<HTMLElement>('#app-router *, #modal-mid-root *')
        )
            .flatMap(element => getComputedStyle(element).animationName.split(','))
            .map(name => name.trim())
            .filter(name => name !== 'none' && name !== 'accessible-opacity-in');

        const probe = document.createElement('div');
        probe.className = 'animate-fade-in-up animate-spin transition-transform';
        probe.setAttribute('aria-hidden', 'true');
        root.append(probe);

        const probeStyle = getComputedStyle(probe);

        const spinner = document.createElement('ion-spinner') as HTMLElement & {
            paused: boolean;
        };
        root.append(spinner);
        await customElements.whenDefined('ion-spinner');
        await new Promise(resolve => window.setTimeout(resolve, 50));

        const spinnerAnimationPlayStates = Array.from(
            spinner.shadowRoot?.querySelectorAll<SVGElement>('svg, circle') ?? []
        ).map(element => getComputedStyle(element).animationPlayState);
        const probeResult = {
            activeAnimationNames,
            probeAnimationName: probeStyle.animationName,
            probeTransform: probeStyle.transform,
            probeTransitionProperty: probeStyle.transitionProperty,
            spinnerPaused: spinner.paused,
            spinnerAnimationPlayStates,
        };

        probe.remove();
        spinner.remove();
        return probeResult;
    });

    expect(
        result.activeAnimationNames,
        'Reduced motion left an active non-opacity animation'
    ).toEqual([]);
    expect(result.probeAnimationName).toBe('accessible-opacity-in');
    expect(result.probeTransform).toBe('none');
    expect(result.probeTransitionProperty).not.toMatch(
        /(^|,\s*)(all|transform|rotate|scale|translate)(,|$)/
    );
    expect(result.spinnerPaused).toBe(true);
    expect(result.spinnerAnimationPlayStates.length).toBeGreaterThan(0);
    expect(result.spinnerAnimationPlayStates.every(state => state === 'paused')).toBe(true);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
};

test.describe('Sign-in and onboarding accessibility', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('a new user can complete sign-in and onboarding with the keyboard', async ({
        page,
        request,
    }, testInfo) => {
        test.setTimeout(300_000);

        const cleanup = await request.post('http://localhost:3100/delete-all');
        expect(cleanup.ok(), 'Expected the Docker cleanup service to reset onboarding data').toBe(
            true
        );
        await configureLocalE2EServices(page);
        await page.goto('/login');

        const emailInput = page.getByRole('textbox', { name: /email/i });
        const signInButton = page.getByRole('button', { name: /sign in with email/i });
        await expect(emailInput).toBeVisible({ timeout: 30_000 });
        await assertNoHighImpactViolations(page, testInfo, 'sign-in');

        await focusWithVisibleIndicator(page, emailInput);
        // The demo shortcut lower-cases its comparison but derives the account
        // key from the original casing. This casing gives the test a clean,
        // deterministic account after delete-all.
        await page.keyboard.type('Demo@learningeconomy.io');
        await activateWithKeyboard(page, signInButton, 'Enter', { resetFocus: false });

        const welcomeHeading = page.getByRole('heading', {
            name: "Welcome — let's set you up",
        });

        await expect(welcomeHeading).toBeVisible({ timeout: 30_000 });

        await assertNoHighImpactViolations(page, testInfo, 'onboarding-age-and-country');

        const monthPicker = page.getByRole('listbox', { name: 'Month' });
        await focusWithVisibleIndicator(page, monthPicker);
        await page.keyboard.press('ArrowDown');

        const countryButton = page.getByRole('button', {
            name: /select country|united states/i,
        });
        await activateWithKeyboard(page, countryButton, 'Enter');

        const countryDialog = page.getByRole('dialog', { name: 'Select Country' }).last();
        const countrySearch = page.getByPlaceholder('Search countries');
        await expect(countryDialog).toBeVisible({ timeout: 30_000 });
        await expect(countrySearch).toBeVisible({ timeout: 30_000 });
        await assertNoHighImpactViolations(page, testInfo, 'onboarding-country-dialog');
        await focusWithVisibleIndicator(page, countrySearch);
        await page.keyboard.type('United States');

        const unitedStatesButton = page.getByRole('button', { name: /United States/ });
        await activateWithKeyboard(page, unitedStatesButton, 'Space', {
            resetFocus: false,
        });
        await expect(countryButton).toBeFocused();

        const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
        await expect(continueButton).toBeEnabled({ timeout: 30_000 });
        await activateWithKeyboard(page, continueButton, 'Enter');

        await expect(page.getByRole('heading', { name: 'Make it yours' })).toBeVisible({
            timeout: 60_000,
        });

        const fullNameInput = page.getByRole('textbox', { name: /full name/i });
        const publicHandleInput = page.getByRole('textbox', { name: /public handle/i });

        await focusWithVisibleIndicator(page, fullNameInput);
        await page.keyboard.type('Accessibility Test User');
        await focusWithVisibleIndicator(page, publicHandleInput, { resetFocus: false });
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.type('a11y-test-user');

        const createAccountButton = page.getByRole('button', {
            name: 'Create my LearnCard',
        });
        await expect(createAccountButton).toBeEnabled({ timeout: 30_000 });
        await assertNoHighImpactViolations(page, testInfo, 'onboarding-profile');
        await activateWithKeyboard(page, createAccountButton, 'Enter');

        await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible({
            timeout: 90_000,
        });
        await assertNoHighImpactViolations(page, testInfo, 'onboarding-complete');

        const exploreButton = page.getByRole('button', { name: 'Explore LearnCard' });
        await activateWithKeyboard(page, exploreButton, 'Enter');
        await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        await assertNoHighImpactViolations(page, testInfo, 'post-onboarding-dashboard');
    });
});

test.describe('Authenticated core-page accessibility', () => {
    test('dashboard, wallet categories, settings, and privacy are keyboard accessible', async ({
        page,
    }, testInfo) => {
        test.setTimeout(240_000);

        await configureLocalE2EServices(page);
        await waitForAuthenticatedState(page, {
            path: '/dashboard',
            profileId: TEST_USER_PROFILE_ID,
        });
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
            timeout: 30_000,
        });

        // The first keyboard Tab must expose the skip link; it should not be
        // visible during normal pointer use.
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        await page.keyboard.press('Tab');
        const skipLink = page.getByRole('link', { name: /skip to main content/i });
        await expect(skipLink).toBeFocused();
        await expect(skipLink).toBeVisible();
        await page.keyboard.press('Enter');
        await expect(page.locator('#main')).toBeFocused();
        await assertNoHighImpactViolations(page, testInfo, 'dashboard-home');
        await assertTransformMotionIsDisabled(page);

        await page.goto('/wallet');
        await expect(page.getByRole('heading', { name: 'Passport', level: 1 })).toBeVisible({
            timeout: 30_000,
        });
        const badgesCategory = page.getByRole('button', { name: /Badges/i });
        await expect(badgesCategory).toBeVisible({ timeout: 30_000 });
        await assertNoHighImpactViolations(page, testInfo, 'wallet-home');

        await activateWithKeyboard(page, badgesCategory, 'Space');
        await page.waitForURL(/\/socialBadges/, { timeout: 30_000 });
        await expect(page.getByText('Earned', { exact: true })).toBeVisible({ timeout: 30_000 });
        await assertNoHighImpactViolations(page, testInfo, 'wallet-badges-category');

        const earnedTab = page.getByRole('tab', { name: 'Earned', exact: true });
        await tabTo(page, earnedTab);
        await expect(earnedTab).toBeFocused();

        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
            timeout: 30_000,
        });

        const openProfileButton = page
            .getByRole('button', { name: /open (?:profile|your learncard)/i })
            .first();
        await activateWithKeyboard(page, openProfileButton, 'Enter');

        const profileDialog = page.getByRole('dialog').last();
        const accountSettingsButton = page.getByRole('button', {
            name: 'Account Settings',
        });
        await expect(profileDialog).toBeVisible({ timeout: 30_000 });
        await expect(accountSettingsButton).toBeVisible();
        await assertNoHighImpactViolations(page, testInfo, 'settings-menu');

        await page.keyboard.press('Escape');
        await expect(profileDialog).toBeHidden();
        await expect(openProfileButton).toBeFocused();

        await page.keyboard.press('Enter');
        await expect(accountSettingsButton).toBeVisible({ timeout: 30_000 });
        await activateWithKeyboard(page, accountSettingsButton, 'Enter');
        await expect(page.locator('form').last()).toBeVisible({ timeout: 30_000 });
        await expect(page.getByRole('textbox', { name: /full name/i })).toBeVisible();
        await assertNoHighImpactViolations(page, testInfo, 'account-settings');

        await page.goto('/privacy-and-data');
        await expect(page.getByText('Your data is yours', { exact: true })).toBeVisible({
            timeout: 30_000,
        });
        await assertNoHighImpactViolations(page, testInfo, 'privacy-settings');

        const showEmailSwitch = page.getByRole('switch', { name: /show email/i });
        await tabTo(page, showEmailSwitch);
        await expect(showEmailSwitch).toBeFocused();
    });
});

test.describe('Credential lifecycle accessibility', () => {
    test('claim, credential detail, and share flows pass axe and keyboard checks', async ({
        page,
        browser,
        baseURL,
    }, testInfo) => {
        test.setTimeout(360_000);

        await configureLocalE2EServices(page);
        await waitForAuthenticatedState(page, { profileId: TEST_USER_PROFILE_ID });

        // Use separate issuer and recipient contexts so the claim journey uses
        // the same account boundary as a real credential recipient.
        const recipientContext = await browser.newContext({
            ignoreHTTPSErrors: true,
            baseURL: baseURL ?? 'http://localhost:3000',
        });
        await mockDidKitWasmForContext(recipientContext);
        const recipientPage = await recipientContext.newPage();
        await configureLocalE2EServices(recipientPage);

        // The app collapses every claim failure into one generic "expired or
        // max claims" alert, so keep the underlying diagnostics for the failure
        // message below. console.text() renders a logged Error as just "Error",
        // so unwrap the arguments, and record failed backend calls too.
        const recipientDiagnostics: string[] = [];
        recipientPage.on('console', message => {
            if (message.type() !== 'error' && message.type() !== 'warning') return;

            void Promise.all(
                message
                    .args()
                    .map(arg =>
                        arg
                            .evaluate(value =>
                                value instanceof Error
                                    ? `${value.name}: ${value.message}\n${value.stack ?? ''}`
                                    : typeof value === 'object' && value !== null
                                    ? JSON.stringify(value)
                                    : String(value)
                            )
                            .catch(() => '<unserializable>')
                    )
            ).then(parts => {
                recipientDiagnostics.push(`${message.type()}: ${parts.join(' ')}`);
            });
        });
        recipientPage.on('pageerror', error => {
            recipientDiagnostics.push(`pageerror: ${error.message}`);
        });
        recipientPage.on('response', response => {
            if (response.status() < 400) return;

            recipientDiagnostics.push(`http ${response.status()}: ${response.url()}`);
        });

        try {
            await waitForAuthenticatedState(recipientPage, {
                seed: TEST_USER_2_SEED,
                profileId: TEST_USER_2_PROFILE_ID,
            });

            // Issuance is setup for the recipient-facing claim, detail, and share
            // accessibility checkpoints below. Use the dedicated issue flow so
            // link generation follows the same path as its focused E2E coverage.
            await page.goto('/issue');
            await expect(page.getByRole('heading', { name: 'What are you issuing?' })).toBeVisible({
                timeout: 30_000,
            });

            const badgeTypeButton = page.getByRole('button', { name: 'Badge', exact: true });
            await activateWithKeyboard(page, badgeTypeButton, 'Enter');

            const credentialName = page.getByPlaceholder('e.g. Web Development Fundamentals');
            await expect(credentialName).toBeVisible({ timeout: 30_000 });
            await credentialName.fill(TEST_CREDENTIAL_TITLE);

            const linkModeButton = page.getByRole('button', { name: /anyone with a link/i });
            await activateWithKeyboard(page, linkModeButton, 'Enter');

            const issueButton = page.getByTestId('issue-submit');
            await expect(issueButton).toBeEnabled();
            await activateWithKeyboard(page, issueButton, 'Space');

            const linkReadyHeading = page.getByRole('heading', { name: /your link is ready/i });
            const issuanceError = page.getByText(
                /connection issue|couldn't issue|something went wrong/i
            );
            await expect(linkReadyHeading.or(issuanceError).first()).toBeVisible({
                timeout: 90_000,
            });
            if (await issuanceError.isVisible()) {
                throw new Error(`Credential setup failed: ${await issuanceError.textContent()}`);
            }

            // The public interaction URL normally passes through an edge
            // content-negotiation endpoint. Docker exposes the same claim data
            // directly through the in-app claim route, so decode only the
            // opaque link envelope and keep the issued boost/challenge intact.
            const rawClaimLink = await page.locator('p[title]').getAttribute('title');
            expect(
                rawClaimLink,
                'Expected the issued credential to expose a claim link'
            ).toBeTruthy();
            const encodedClaim = new URL(rawClaimLink!).pathname.split('/').at(-1);
            expect(encodedClaim, 'Expected an interaction claim payload').toBeTruthy();
            const claimPayload = JSON.parse(
                Buffer.from(encodedClaim!, 'base64url').toString('utf8')
            ) as { boostUri: string; challenge: string };

            // The issue flow registers the issuer's `lca-sa` signing authority on
            // demand, and claiming immediately asks the signing service to issue
            // with `<issuer did:web>#lca-sa`. That verification method is not
            // guaranteed to be resolvable the instant registration returns, so a
            // brand-new signing authority can fail its first issuance. Wait for
            // the key to be published before claiming, which is what a
            // second-time issuer already has.
            await waitForSigningAuthorityKey(page, TEST_USER_PROFILE_ID);

            const claimUrl = `/claim/boost?boostUri=${encodeURIComponent(
                claimPayload.boostUri
            )}&challenge=${encodeURIComponent(claimPayload.challenge)}`;

            await recipientPage.goto(claimUrl);
            await expect(
                recipientPage.getByRole('heading', { name: TEST_CREDENTIAL_TITLE, exact: true })
            ).toBeVisible({ timeout: 30_000 });
            await assertNoHighImpactViolations(recipientPage, testInfo, 'claim-link');

            const acceptButton = recipientPage.getByRole('button', {
                name: 'Accept',
                exact: true,
            });
            await expect(acceptButton).toBeVisible({ timeout: 30_000 });
            await assertNoHighImpactViolations(recipientPage, testInfo, 'claim-credential-preview');

            // The success toast is intentionally brief and can disappear while
            // Playwright waits for the post-claim render. The route transition is
            // the stable completion signal; the wallet assertion below confirms
            // the credential was persisted for the recipient.
            //
            // Claiming issues its own network round trip before the app routes
            // home, so give it the same headroom as issuance. Race the app's
            // claim-failure alert so a genuine failure reports its own message
            // instead of an opaque navigation timeout.
            const claimFailureAlert = recipientPage.getByText(
                /claim link has expired|couldn't claim|credential could not be claimed/i
            );
            const attemptClaim = async (): Promise<'claimed' | 'failed'> => {
                await activateWithKeyboard(recipientPage, acceptButton, 'Space', {
                    resetFocus: false,
                });

                return Promise.race([
                    recipientPage
                        .waitForURL(
                            url => url.pathname === '/' || url.pathname.startsWith('/dashboard'),
                            { timeout: 90_000 }
                        )
                        .then(() => 'claimed' as const),
                    claimFailureAlert
                        .waitFor({ state: 'visible', timeout: 90_000 })
                        .then(() => 'failed' as const)
                        // Only the navigation branch should decide the race when
                        // the claim never fails; let its timeout be the error.
                        .catch(() => new Promise<never>(() => {})),
                ]);
            };

            let claimOutcome = await attemptClaim();

            if (claimOutcome === 'failed') {
                // The failing issuance happens before the challenge is consumed,
                // so the link is still claimable. Give the freshly registered
                // signing authority one more chance rather than failing the
                // accessibility run on a first-issuance race.
                await recipientPage
                    .getByRole('button', { name: /okay/i })
                    .first()
                    .click()
                    .catch(() => undefined);
                await recipientPage.goto(claimUrl);
                await expect(acceptButton).toBeVisible({ timeout: 30_000 });

                claimOutcome = await attemptClaim();
            }

            if (claimOutcome === 'failed') {
                const alertText = await claimFailureAlert.first().textContent();

                // Console argument unwrapping is asynchronous, so let the
                // in-flight handlers land before reading the diagnostics.
                await recipientPage.waitForTimeout(500);

                throw new Error(
                    `Credential claim failed: ${alertText}\n${recipientDiagnostics
                        .slice(-15)
                        .join('\n')}`
                );
            }
            await assertNoHighImpactViolations(recipientPage, testInfo, 'claim-success');

            await recipientPage.goto('/wallet');
            const badgesCategory = recipientPage.getByRole('button', { name: /Badges/i });
            await expect(badgesCategory).toBeVisible({ timeout: 30_000 });
            await activateWithKeyboard(recipientPage, badgesCategory, 'Space');
            await recipientPage.waitForURL(/\/socialBadges/, { timeout: 30_000 });

            const earnedCredentialCard = recipientPage.getByRole('button', {
                name: new RegExp(TEST_CREDENTIAL_TITLE),
            });
            await expect(earnedCredentialCard).toBeVisible({ timeout: 30_000 });
            await activateWithKeyboard(recipientPage, earnedCredentialCard, 'Enter');

            await expect(recipientPage.locator('.vc-card-header-main-title').first()).toContainText(
                TEST_CREDENTIAL_TITLE,
                { timeout: 30_000 }
            );
            await expect(recipientPage.locator('.issued-by').first()).toBeVisible({
                timeout: 30_000,
            });
            await assertNoHighImpactViolations(recipientPage, testInfo, 'credential-detail');

            const shareButton = recipientPage.getByRole('button', {
                name: 'Share',
                exact: true,
            });
            await activateWithKeyboard(recipientPage, shareButton, 'Space');

            const copyLinkButton = recipientPage.getByRole('button', { name: 'Copy Link' });
            await expect(copyLinkButton).toBeVisible({ timeout: 60_000 });
            await assertNoHighImpactViolations(recipientPage, testInfo, 'share-credential');
            await activateWithKeyboard(recipientPage, copyLinkButton, 'Enter');
            await expect(recipientPage.getByText(/share link copied/i)).toBeVisible({
                timeout: 30_000,
            });
        } finally {
            await recipientContext.close();
        }
    });
});
