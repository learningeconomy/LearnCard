import { randomBytes, randomUUID } from 'node:crypto';
import {
    ACT_AS_HEADER,
    ConsentFlowContractDataForDidValidator,
    ReadableDeliveryPageValidator,
    VCValidator,
} from '@learncard/types';

import { readUserData } from '../../../../../docs/snippets/consentflow/read-user-data.mjs';
import { issueThroughContract } from '../../../../../docs/snippets/consentflow/issue-through-contract.mjs';
import { expect } from '../expect';
import type { FeatureDefinition } from '../types';
import { boostTemplate } from './sdk';
import { UI_TIMEOUT } from './shared';

export const consentFlowFeature: FeatureDefinition = {
    id: 'consent-flow',
    title: 'Partner contract via SDK, learner consents in the app, partner reads and issues (docs code)',
    surface: 'cross-surface',
    entries: [
        'consent-partner-contract',
        'consent-app-door',
        'consent-app-accept',
        'consent-partner-reads',
        'consent-partner-issues',
        'consent-readable-delivery',
        'consent-readable-delivery-revoked',
    ],
    run: async context => {
        const { issuer, learner } = context.actors;
        const suffix = randomBytes(4).toString('hex');
        const name = `Verify Consent ${suffix}`;
        const sharedName = `Consent Learner ${suffix}`;
        const achievementName = `Consent Achievement ${suffix}`;
        const partner = await context.sdk(issuer);
        const learnerLc = await context.sdk(learner);
        const learnerDid = `${context.stack.brainDid}:users:${learner.profileId}`;
        const networkPrefix = `lc:network:${encodeURIComponent(new URL(context.stack.brain).host)}/trpc:`;

        // Seed only the input credential. Selecting and publishing it must happen in the UI.
        const template = boostTemplate(partner.id.did(), achievementName);
        const signedInput = await partner.invoke.issueCredential({
            ...template,
            credentialSubject: {
                ...template.credentialSubject,
                id: learnerDid,
                achievement: {
                    ...template.credentialSubject.achievement,
                    achievementType: 'Achievement',
                },
            },
        });
        const inputUri = await learnerLc.store.LearnCloud.uploadEncrypted!(signedInput);
        const inputId = `consent-input-${suffix}`;
        await learnerLc.index.LearnCloud.add({
            id: inputId,
            uri: inputUri,
            title: achievementName,
            category: 'Achievement',
        });

        const recipient = await partner.invoke.createReadableDeliveryRecipient({
            requestId: randomUUID(),
            displayName: `Readable Partner ${suffix}`,
            acceptDelegatedAuthority: true,
            disclosureVersion: '1',
        });

        const contractUri = await context.step(null, 'consent-partner-contract', async () => {
            // Same terms as the docs create-contract snippet, without its external redirect.
            const uri = await partner.invoke.createContract({
                name,
                recipients: [recipient.profileId],
                subtitle: 'Receive a verification badge',
                description:
                    'Allow us to read your name and selected achievement, and send an achievement.',
                contract: {
                    read: {
                        personal: { Name: { required: false } },
                        credentials: { categories: { Achievement: { required: false } } },
                    },
                    write: {
                        personal: {},
                        credentials: { categories: { Achievement: { required: true } } },
                    },
                },
            });
            expect(uri.startsWith(networkPrefix)).toBe(true);
            expect(await partner.invoke.verifyConsent(uri, learner.profileId)).toBe(false);
            return uri;
        });

        const page = await context.newPage('consent-learner', { signInAs: learner });
        await context.step(page, 'consent-personal-data', async () => {
            await page.getByRole('button', { name: 'Open profile', exact: true }).click();
            await page.getByRole('button', { name: 'Account Settings', exact: true }).click();
            const nameInput = page.getByRole('textbox', { name: 'Full Name', exact: true });
            await nameInput.fill(sharedName);
            // The real account form requires an adult DOB before saving personal details.
            await page.locator('#user-profile-dob').fill('January 1, 1990');
            await nameInput.click();
            await page.getByRole('button', { name: 'Save', exact: true }).click();
            await expect(nameInput).toBeHidden({ timeout: UI_TIMEOUT });
            await expect
                .poll(
                    async () => (await learnerLc.invoke.getProfile(learner.profileId))?.displayName,
                    {
                        timeout: UI_TIMEOUT,
                    }
                )
                .toBe(sharedName);
        });
        await context.step(page, 'consent-app-door', async () => {
            await page.goto(`/consent-flow?uri=${encodeURIComponent(contractUri)}`);
            await expect(page.getByRole('heading', { name, exact: true })).toBeVisible({
                timeout: UI_TIMEOUT,
            });
            await expect(page.getByText('Receive a verification badge')).toBeVisible();
            const continueButton = page.getByRole('button', { name: /^Continue as / });
            await expect(continueButton).toContainText(sharedName, { timeout: UI_TIMEOUT });
            await continueButton.click();
        });
        await context.step(page, 'consent-app-accept', async () => {
            const dialog = page.getByRole('dialog');
            await expect(
                dialog.getByText(`${name} is requesting access to view your name`)
            ).toBeVisible({
                timeout: UI_TIMEOUT,
            });
            await expect(dialog.getByTestId('readable-delivery-disclosure')).toContainText(
                recipient.displayName
            );
            await dialog.getByRole('button', { name: 'Privacy & Data', exact: true }).click();
            const privacy = page.getByTestId('consent-privacy-and-data');
            await expect(privacy).toBeVisible({ timeout: UI_TIMEOUT });
            // This IonToggle has no label association; scope it to its actual labelled row.
            const anonymizeToggle = privacy
                .getByText('Anonymize', { exact: true })
                .locator('../..')
                .locator('ion-toggle');
            await expect(anonymizeToggle).toHaveAttribute('aria-checked', 'true');
            await anonymizeToggle.click();
            await expect(anonymizeToggle).toHaveAttribute('aria-checked', 'false');
            await privacy.getByRole('button', { name: /Name Hidden$/ }).click();
            await expect(privacy.getByRole('button', { name: /Name Share$/ })).toBeVisible();

            await privacy.getByRole('button', { name: /^Achievements Deny$/ }).click();
            const selection = page.getByRole('dialog').filter({
                has: page.getByRole('heading', { name: 'Achievements', exact: true }),
            });
            await selection.getByText('Selective Sharing', { exact: true }).click();
            // Card body opens details; the unnamed sibling check button selects it.
            await selection
                .locator('.boost-generic-card-wrapper')
                .filter({ has: page.getByRole('button', { name: new RegExp(achievementName) }) })
                .getByRole('button', { name: '', exact: true })
                .click();
            await expect(selection.getByText('Sharing 1/1', { exact: true })).toBeVisible();
            // The category editor's real toolbar back button saves the selection (no aria label).
            await selection.locator('ion-header button').click();
            await expect(
                privacy.getByRole('button', { name: /^Achievements 1\/1$/ })
            ).toBeVisible();
            await privacy.getByRole('button', { name: 'Back', exact: true }).click();
            await expect(privacy).toBeHidden();
            await dialog.getByRole('button', { name: 'Accept', exact: true }).click();
            const audience = page.getByRole('dialog').filter({
                has: page.getByRole('heading', {
                    name: 'Review who receives your data',
                    exact: true,
                }),
            });
            await expect(audience).toBeVisible({ timeout: UI_TIMEOUT });
            await expect(audience.getByText(recipient.displayName, { exact: true })).toBeVisible();
            await audience.getByRole('button', { name: 'Confirm Sharing', exact: true }).click();
            await expect(dialog.getByRole('button', { name: 'Accept', exact: true })).toBeHidden({
                timeout: UI_TIMEOUT,
            });
        });

        const records = await context.step(page, 'consent-partner-reads', async () => {
            await expect
                .poll(() => partner.invoke.verifyConsent(contractUri, learner.profileId), {
                    timeout: UI_TIMEOUT,
                })
                .toBe(true);
            const data = (await readUserData(partner, learnerDid, contractUri)).map(record =>
                ConsentFlowContractDataForDidValidator.parse(record)
            );
            expect(data).toHaveLength(1);
            const record = data[0]!;
            expect(record.contractUri).toBe(contractUri);
            expect(record.status).toBe('live');
            expect(record.personal.Name).toBe(sharedName);
            expect(record.terms.read.personal.Name).toBe(sharedName);
            expect(record.terms.read.anonymize).toBe(false);
            expect(record.terms.read.credentials.categories.Achievement?.sharing).toBe(true);
            expect(record.terms.read.credentials.categories.Achievement?.shareAll).toBe(false);
            expect(record.credentials).toHaveLength(1);
            const shared = record.credentials[0]!;
            expect(shared.category).toBe('Achievement');
            expect(record.terms.read.credentials.categories.Achievement?.shared).toEqual([
                shared.uri,
            ]);
            // Consent encrypts a new audience-specific copy: tie that exact URI back to
            // the selected input's index record, then require byte-equivalent VC content.
            const indexed = (await learnerLc.index.LearnCloud.get()).find(
                item => item.id === inputId && item.uri === inputUri
            );
            expect(indexed).toBeDefined();
            const copies = indexed?.sharedUris as Record<string, string[]> | undefined;
            expect(Object.values(copies ?? {}).flat()).toContain(shared.uri);
            const sharedCredential = VCValidator.parse(await partner.read.get(shared.uri));
            expect(sharedCredential).toEqual(signedInput);
            const verification = await partner.invoke.verifyCredential(sharedCredential);
            expect(verification.errors).toEqual([]);
            expect(verification.checks).toContain('proof');
            await context.record('consent-records', data);
            return {
                count: data.length,
                name: record.personal.Name,
                inputUri,
                sharedUri: shared.uri,
                achievementName,
                proofChecks: verification.checks,
            };
        });
        const issued = await context.step(page, 'consent-partner-issues', async () => {
            const uri = await issueThroughContract(partner, learnerDid, contractUri);
            expect(uri.startsWith(networkPrefix)).toBe(true);
            // The learner's own wallet holds the credential the partner wrote through consent.
            await expect
                .poll(
                    async () =>
                        [
                            ...(await learnerLc.invoke.getIncomingCredentials()),
                            ...(await learnerLc.invoke.getReceivedCredentials()),
                        ].map(item => item.uri),
                    { timeout: UI_TIMEOUT }
                )
                .toContain(uri);
            const delivered = VCValidator.parse(await learnerLc.read.get(uri));
            expect(delivered).toMatchObject({
                issuer: partner.id.did(),
                name: 'ConsentFlow Tutorial Complete',
                credentialSubject: {
                    id: learnerDid,
                    achievement: {
                        name: 'ConsentFlow Tutorial Complete',
                        description: 'Completed the ConsentFlow tutorial.',
                    },
                },
            });
            expect(delivered.boostId).toContain(`${networkPrefix}boost:`);
            const verification = await learnerLc.invoke.verifyCredential(delivered);
            expect(verification.errors).toEqual([]);
            expect(verification.checks).toContain('proof');
            return { uri, boostUri: delivered.boostId, proofChecks: verification.checks };
        });

        // Real bearer-token HTTP requests exercise scoped delegation and the public API.
        // Tokens remain in this closure, never in observations or proof artifacts.
        const tokenFor = async (scope: string): Promise<string> =>
            partner.invoke.getAPITokenForAuthGrant(
                await partner.invoke.addAuthGrant({
                    name: 'Readable delivery verification',
                    scope,
                    actAs: recipient.profileId,
                })
            );
        const readDelivery = (token: string, actAs = recipient.profileId): Promise<Response> =>
            fetch(`${context.stack.brainApi}/readable-delivery/data`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    [ACT_AS_HEADER]: actAs,
                },
                body: JSON.stringify({ contractUri, did: learnerDid, limit: 1 }),
            });
        const token = await tokenFor('contracts-data:read contracts-data:decrypt');
        await context.step(page, 'consent-readable-delivery', async () => {
            const response = await readDelivery(token);
            expect(response.status).toBe(200);
            expect(response.headers.get('cache-control')).toContain('no-store');
            const data = ReadableDeliveryPageValidator.parse(await response.json());
            expect(data.records).toHaveLength(1);
            expect(data.records[0]).toMatchObject({
                uri: records.sharedUri,
                status: 'readable',
                credential: {
                    name: achievementName,
                    issuer: partner.id.did(),
                    verification: { proof: 'not_checked', status: 'not_checked' },
                },
            });
            expect(data.records[0]?.credential).not.toHaveProperty('credentialSubject');
            expect(data.hasMore).toBe(false);
            for (const scope of ['contracts-data:read', 'contracts-data:decrypt', '*:read']) {
                expect((await readDelivery(await tokenFor(scope))).status).toBe(403);
            }
            expect((await readDelivery(token, learner.profileId)).status).toBe(403);
            return {
                records: data.records.length,
                scopedAccess: 'enforced',
                proof: data.records[0]?.credential?.verification.proof,
            };
        });
        await context.step(page, 'consent-readable-delivery-revoked', async () => {
            const consent = await partner.invoke.getConsentFlowDataForDid(learnerDid, {
                query: { id: contractUri.split(':').at(-1) },
            });
            const termsUri = consent.records.find(
                record => record.contractUri === contractUri
            )?.termsUri;
            expect(termsUri).toBeDefined();
            const accepted = consent.records.find(record => record.termsUri === termsUri)!;
            await learnerLc.invoke.withdrawConsent(termsUri!);
            expect((await readDelivery(token)).status).toBe(403);
            // Restore the same explicit selection before testing disablement independently.
            const contract = await learnerLc.invoke.getContract(contractUri);
            await learnerLc.invoke.consentToContract(contractUri, {
                terms: accepted.terms,
                audienceVersion: contract.audienceVersion ?? 0,
            });
            expect((await readDelivery(token)).status).toBe(200);
            await partner.invoke.disableReadableDelivery(recipient.profileId);
            expect((await readDelivery(token)).status).toBe(403);
            return { withdrawal: 'denied', disabled: 'denied' };
        });

        return {
            observations: {
                contractUri,
                partnerProfileId: issuer.profileId,
                learnerProfileId: learner.profileId,
                consentRecords: records,
                issuedUri: issued.uri,
                issuedCredential: issued,
                docsSnippets: ['read-user-data.mjs', 'issue-through-contract.mjs'],
            },
        };
    },
};
