import { z } from 'zod';
import { VCValidator } from '@learncard/types';
import { expect } from '../expect';
import type { FeatureDefinition, FeatureResult, VerificationContext } from '../types';
import { startVerificationListing } from './app-store-seed';

const IdentityRequestValidator = z.object({
    requestId: z.string(),
    payload: z.object({ challenge: z.string().optional() }).optional(),
});
type IdentityRequest = z.infer<typeof IdentityRequestValidator>;

const IdentityResponseValidator = z.object({
    requestId: z.string(),
    type: z.enum(['SUCCESS', 'ERROR']),
    data: z
        .object({
            token: z.unknown().optional(),
            user: z.object({ did: z.string() }).optional(),
        })
        .optional(),
});
type IdentityResponse = z.infer<typeof IdentityResponseValidator>;

const IdentityClaimsValidator = z.object({
    iss: z.string(),
    nonce: z.string(),
    aud: z.string(),
    vp: z.object({ holder: z.string() }),
});

const runAppStore = async (context: VerificationContext): Promise<FeatureResult> => {
    const listing = await startVerificationListing(context);
    try {
        const learner = await context.sdk(context.actors.learner);
        const expectedDid = learner.id.did();
        expect(await learner.invoke.isAppInstalled(listing.listingId)).toBe(false);
        let identityChecks: string[] = [];
        const publicContext = await context.newContext('app-store-public');
        const publicPage = await publicContext.newPage();
        await context.step(publicPage, 'apps-public-sign-in-intent', async () => {
            await publicPage.goto(`${context.baseUrl}/app/${listing.listingId}`);
            await expect(
                publicPage.getByText(listing.displayName, { exact: true }).first()
            ).toBeVisible({ timeout: 120_000 });
            await publicPage.getByRole('button', { name: /^(get app|install)$/i }).click();
            await expect(
                publicPage.getByText('Sign in to continue', { exact: true })
            ).toBeVisible();
            await publicPage.getByRole('button', { name: /^continue$/i }).click();
            await expect(publicPage).toHaveURL(/\/login(?:[/?#]|$)/);
            await expect(
                publicPage
                    .getByText('taken back to', { exact: false })
                    .filter({ hasText: listing.displayName })
            ).toBeVisible();
            await context.capture(publicPage, 'apps-public-sign-in-intent');
        });

        // A separate authenticated context keeps the public redirect intent from auto-opening
        // consent before the independent Browse More entry path has actually been exercised.
        const signedInContext = await context.newContext('app-store-signed-in');
        const page = await signedInContext.newPage();
        await context.step(page, 'apps-sign-in', () =>
            context.signIn(page, context.actors.learner)
        );
        const detail = page.locator('#right-modal');
        await context.step(page, 'apps-browse-detail', async () => {
            await page.goto(`${context.baseUrl}/launchpad`);
            await page.getByRole('button', { name: /browse more/i }).click();
            await expect(page).toHaveURL(/\/launchpad\/browse\?tab=All/);
            const row = page.locator('ion-item').filter({ hasText: listing.displayName });
            await expect(row).toBeVisible({ timeout: 30_000 });
            await row.getByRole('button', { name: 'Get', exact: true }).click();
            await expect(
                detail.getByText(listing.displayName, { exact: true }).first()
            ).toBeVisible();
            await expect(detail.getByText('About', { exact: true })).toBeVisible();
            await expect(
                detail.getByRole('button', { name: 'Install', exact: true })
            ).toBeVisible();
            await context.capture(page, 'apps-browse-detail');
        });

        await context.step(page, 'apps-install-persist-launch', async () => {
            await context.step(page, 'apps-install-consent', async () => {
                await detail.getByRole('button', { name: 'Install', exact: true }).click();
                await expect(
                    page.getByRole('heading', { name: 'Install App', exact: true })
                ).toBeVisible();
                await expect(page.getByText('Request Identity', { exact: true })).toBeVisible();
                await expect(
                    page.getByText('View your profile information and verify your identity', {
                        exact: true,
                    })
                ).toBeVisible();
                await context.capture(page, 'apps-install-permissions');
                await page.getByRole('button', { name: 'Install', exact: true }).last().click();
                await expect(
                    page.getByRole('heading', { name: 'Install App', exact: true })
                ).not.toBeVisible({ timeout: 30_000 });
                await expect(detail.getByRole('button', { name: 'Open', exact: true })).toBeVisible(
                    {
                        timeout: 60_000,
                    }
                );
                // Reload at the first successful installed UI state: do not wait for the list
                // or cache persister, since that would conceal a real reload persistence race.
                await page.reload();
            });

            await context.step(page, 'apps-install-reload-persistence', async () => {
                const installed = await learner.invoke.isAppInstalled(listing.listingId);
                await context.record('apps-installed-sdk', {
                    listingId: listing.listingId,
                    learnerDid: expectedDid,
                    installed,
                });
                expect(installed).toBe(true);
                const row = page.locator('ion-item').filter({ hasText: listing.displayName });
                await expect(row.getByRole('button', { name: 'Open', exact: true })).toBeVisible({
                    timeout: 30_000,
                });
                await row.getByRole('button', { name: 'More options', exact: true }).click();
                await expect(
                    detail.getByRole('button', { name: 'Open', exact: true })
                ).toBeVisible();
                await expect(
                    detail.getByRole('button', { name: 'Install', exact: true })
                ).toHaveCount(0);
                await context.capture(page, 'apps-install-reload-persistence');
            });

            await context.step(page, 'apps-real-embedded-launch', async () => {
                await detail.getByRole('button', { name: 'Open', exact: true }).click();
                // Select the actual app by its seeded title, not a fake route or substitute HTML.
                const appFrameElement = page.locator(`iframe[title^="${listing.displayName} - "]`);
                await expect(appFrameElement).toBeVisible({ timeout: 30_000 });
                const src = await appFrameElement.getAttribute('src');
                if (!src || new URL(src).origin !== listing.appUrl) {
                    throw new Error(`Embedded launch did not target the run-owned app: ${src}`);
                }
                const app = appFrameElement.contentFrame();
                await expect(
                    app.getByRole('heading', { name: 'LearnCard Partner App Demo', exact: true })
                ).toBeVisible({ timeout: 60_000 });
                // Bootstrap must finish before arming observers for the explicit button click.
                // The banner alone does not validate the token (the example prints it unconditionally).
                await expect(app.locator('#auth-status')).toHaveText(
                    'Connected to LearnCard host. Identity is ready.',
                    { timeout: 60_000 }
                );
                let request: IdentityRequest | undefined;
                const responses = new Map<string, IdentityResponse>();
                let observationError: string | undefined;
                await page.exposeBinding('__lcvIdentityRequest', (_source, message: unknown) => {
                    const parsed = IdentityRequestValidator.safeParse(message);
                    if (!parsed.success) observationError = 'Malformed identity request';
                    else request ??= parsed.data;
                });
                await page.exposeBinding('__lcvIdentityResponse', (_source, message: unknown) => {
                    const parsed = IdentityResponseValidator.safeParse(message);
                    if (!parsed.success) observationError = 'Malformed host response';
                    else responses.set(parsed.data.requestId, parsed.data);
                });
                // Passive listeners only: neither dispatch messages nor invoke the SDK ourselves.
                await page.evaluate(
                    ({ appOrigin, title }) => {
                        const iframe = [...document.querySelectorAll('iframe')].find(element =>
                            element.title.startsWith(title)
                        );
                        const observe = (event: MessageEvent) => {
                            if (
                                event.origin !== appOrigin ||
                                event.source !== iframe?.contentWindow ||
                                event.data?.protocol !== 'LEARNCARD_V1' ||
                                event.data?.action !== 'REQUEST_IDENTITY' ||
                                typeof event.data?.requestId !== 'string'
                            )
                                return;
                            window.removeEventListener('message', observe);
                            const notify = Reflect.get(window, '__lcvIdentityRequest');
                            if (typeof notify === 'function') void notify(event.data);
                        };
                        window.addEventListener('message', observe);
                    },
                    { appOrigin: listing.appUrl, title: `${listing.displayName} - ` }
                );
                await app.locator('body').evaluate((_body, hostOrigin) => {
                    window.addEventListener('message', (event: MessageEvent) => {
                        if (
                            event.origin !== hostOrigin ||
                            event.source !== window.parent ||
                            event.data?.protocol !== 'LEARNCARD_V1' ||
                            typeof event.data?.requestId !== 'string' ||
                            !['SUCCESS', 'ERROR'].includes(event.data?.type)
                        )
                            return;
                        const notify = Reflect.get(window, '__lcvIdentityResponse');
                        if (typeof notify === 'function') void notify(event.data);
                    });
                }, new URL(context.baseUrl).origin);
                await app.getByRole('button', { name: 'Request Identity', exact: true }).click();
                await expect
                    .poll(
                        () =>
                            observationError ??
                            (request && responses.has(request.requestId) ? 'observed' : 'waiting'),
                        {
                            timeout: 60_000,
                            message:
                                'The clicked Request Identity must receive its own real host response',
                        }
                    )
                    .toBe('observed');
                const observedRequest = request!;
                const response = responses.get(observedRequest.requestId)!;
                expect(response.type).toBe('SUCCESS');
                expect(response.data?.user?.did).toBe(expectedDid);
                const token = response.data?.token;
                if (typeof token !== 'string' || !token.trim()) {
                    throw new Error('REQUEST_IDENTITY returned no nonempty identity token');
                }
                const challenge = observedRequest.payload?.challenge;
                if (typeof challenge !== 'string' || !challenge) {
                    throw new Error('The real Request Identity click did not supply a challenge');
                }
                let claims: z.infer<typeof IdentityClaimsValidator>;
                try {
                    const parts = token.split('.');
                    if (parts.length !== 3) throw new Error('Invalid JWT');
                    claims = IdentityClaimsValidator.parse(
                        JSON.parse(Buffer.from(parts[1]!, 'base64url').toString())
                    );
                } catch {
                    throw new Error('REQUEST_IDENTITY did not return a JWT with DID Auth claims');
                }
                // Decode only to bind the verified signer to the displayed learner; decoding alone
                // is never proof. DIDKit below resolves and verifies against the owned local stack.
                expect(claims.iss).toBe(expectedDid);
                expect(claims.vp?.holder).toBe(expectedDid);
                expect(claims.nonce).toBe(challenge);
                expect(claims.aud).toBe(listing.appUrl);
                const verifier = await context.sdk(context.actors.recipient);
                let verification;
                try {
                    verification = await verifier.invoke.verifyPresentation(token, {
                        proofFormat: 'jwt',
                        challenge,
                        domain: listing.appUrl,
                        proofPurpose: 'authentication',
                    });
                } catch {
                    // A verifier exception may contain the input token. Never put it in the report.
                    throw new Error('REQUEST_IDENTITY JWT cryptographic verification threw');
                }
                if (
                    verification.errors.length ||
                    verification.warnings.length ||
                    !verification.checks.includes('JWS')
                ) {
                    throw new Error('REQUEST_IDENTITY JWT failed cryptographic verification');
                }
                identityChecks = verification.checks;
                await context.record('apps-identity-verification', {
                    learnerDid: expectedDid,
                    requestId: observedRequest.requestId,
                    requestResponseMatched: true,
                    tokenPresent: true,
                    challengeMatched: true,
                    audience: listing.appUrl,
                    checks: identityChecks,
                });
                await expect(app.locator('#identity-result')).toContainText(
                    `Signed in as ${expectedDid}`
                );
                await context.capture(page, 'apps-real-embedded-launch');
                await context.step(page, 'apps-partner-server-issuance', async () => {
                    // Use Astro's actual browser action client, not an SDK substitute for its backend.
                    const raw = await app.locator('body').evaluate(async (_body, recipientDid) => {
                        // Astro supplies this virtual module only inside its browser dev runtime;
                        // a static import in the Bun verification runner cannot resolve it.
                        const clientModule = '/@id/__x00__astro:actions';
                        const { actions } = await import(/* @vite-ignore */ clientModule);
                        const result = await actions.issueCredential({ recipientDid });
                        if (result.error) throw new Error('Partner server issuance action failed');
                        return result.data;
                    }, expectedDid);
                    const credential = VCValidator.parse(raw);
                    expect(credential.issuer).toBe(listing.issuerDid);
                    expect(credential.credentialSubject).toMatchObject({ id: expectedDid });
                    const proof = await verifier.invoke.verifyCredential(credential);
                    expect(proof.errors).toEqual([]);
                    expect(proof.checks).toContain('proof');
                    await context.record('apps-partner-server-issuance', {
                        issuerDid: listing.issuerDid,
                        recipientDid: expectedDid,
                        proofChecks: proof.checks,
                    });
                });
            });
        });

        return {
            observations: {
                listingId: listing.listingId,
                displayName: listing.displayName,
                appUrl: listing.appUrl,
                example: 'examples/app-store-apps/1-basic-launchpad-app',
                permissions: ['request_identity'],
                installedThroughUi: true,
                persistedAfterReload: true,
                installedConfirmedByLearnerSdk: true,
                learnerDid: expectedDid,
                identityRequestResponseMatched: true,
                identityTokenCryptographicallyVerified: true,
                identityVerificationChecks: identityChecks,
                realHostIdentityConfirmed: true,
                partnerServerIssuerDid: listing.issuerDid,
                partnerServerCredentialVerified: true,
            },
        };
    } finally {
        await listing.stop();
    }
};

export const appStoreFeature: FeatureDefinition = {
    id: 'app-store',
    title: 'Public listing, browse, consent, install, persist, and launch a real Partner Connect app',
    surface: 'web',
    entries: ['apps-public-sign-in-intent', 'apps-browse-detail', 'apps-install-persist-launch'],
    requires: ['owned stack partner port free (real basic-launchpad example server)'],
    run: runAppStore,
};
