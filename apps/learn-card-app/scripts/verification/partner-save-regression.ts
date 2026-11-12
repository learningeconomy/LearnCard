import type { FrameLocator, Page } from '@playwright/test';
import type { VC } from '@learncard/types';
import type { VerificationContext } from './types';
import { REPO_ROOT } from './constants';
import { expect } from './expect';

/** Seed consent before browser sign-in so the host starts with the current consent list. */
export const createPartnerSaveConsent = async (context: VerificationContext): Promise<string> => {
    const owner = await context.sdk(context.actors.recipient);
    const learner = await context.sdk(context.actors.learner);
    const contractUri = await owner.invoke.createContract({
        name: `Partner save ${context.runId}`,
        contract: {
            read: {
                personal: {},
                credentials: {
                    categories: {
                        Achievement: { required: false },
                        'Social Badge': { required: false },
                    },
                },
            },
            write: { personal: {}, credentials: { categories: {} } },
        },
    });
    await learner.invoke.consentToContract(contractUri, {
        terms: {
            read: {
                personal: {},
                credentials: {
                    sharing: true,
                    shareAll: false,
                    categories: {
                        Achievement: { sharing: true, shareAll: true, shared: [] },
                        'Social Badge': { sharing: true, shareAll: true, shared: [] },
                    },
                },
            },
            write: { personal: {}, credentials: { categories: {} } },
        },
    });
    return contractUri;
};

/** Send a signed VC through the real iframe SDK and the host's acceptance/save path. */
export const verifyPartnerCredentialSave = async (
    context: VerificationContext,
    page: Page,
    app: FrameLocator,
    credential: VC,
    contractUri: string
): Promise<void> => {
    await context.step(page, 'apps-partner-credential-save', async () => {
        const owner = await context.sdk(context.actors.recipient);
        const learner = await context.sdk(context.actors.learner);
        const learnerDid = learner.id.did();
        const sdkModule = `/@fs/${REPO_ROOT}/packages/learn-card-partner-connect-sdk/src/index.ts`;
        const response = app.locator('body').evaluate(
            async (_body, input) => {
                // This runs inside Astro's browser frame; a Bun-side static import cannot send from that origin.
                const { createPartnerConnect } = await import(/* @vite-ignore */ input.sdkModule);
                const sdk = createPartnerConnect({
                    hostOrigin: input.origin,
                    requestTimeout: 60_000,
                });
                try {
                    return await sdk.sendCredential(input.credential);
                } finally {
                    sdk.destroy();
                }
            },
            { sdkModule, origin: context.baseUrl, credential }
        );
        // Attach a rejection handler immediately while the host waits for the UI action.
        const outcome = response.then(
            value => ({ value }),
            error => ({ error: String(error) })
        );
        const dialog = page
            .getByRole('dialog')
            .filter({ has: page.getByRole('heading', { name: 'Accept Credential', exact: true }) });
        await expect(dialog).toBeVisible({ timeout: 60_000 });
        await dialog.getByRole('button', { name: 'Accept', exact: true }).click();
        const result = await outcome;
        if ('error' in result) throw new Error(`Partner credential save failed: ${result.error}`);
        expect(result.value.stored).toBe(true);
        const uri = result.value.credentialId;
        expect(typeof uri).toBe('string');
        expect(await learner.read.get(uri)).toEqual(credential);
        expect((await learner.index.LearnCloud.get()).some(record => record.uri === uri)).toBe(
            true
        );
        await expect
            .poll(
                async () =>
                    (await owner.invoke.getConsentFlowDataForDid(learnerDid)).records.find(
                        record => record.contractUri === contractUri
                    )?.credentials.length,
                { timeout: 60_000 }
            )
            .toBe(1);
        const data = (await owner.invoke.getConsentFlowDataForDid(learnerDid)).records.find(
            record => record.contractUri === contractUri
        )!;
        expect(await owner.read.get(data.credentials[0]!.uri)).toEqual(credential);
        await context.record('partner-save-live-consent', {
            contractUri,
            savedUri: uri,
            sharedUri: data.credentials[0]!.uri,
        });
    });
};
