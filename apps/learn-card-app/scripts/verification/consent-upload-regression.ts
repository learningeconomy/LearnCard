import { randomUUID } from 'node:crypto';
import type { VerificationContext } from './types';
import { boostTemplate } from './journeys/sdk';
import { expect } from './expect';

/** Real upload/paste actions after live consent, corroborated by both audience members. */
export default async function verifyConsentUploads(v: VerificationContext) {
    const owner = await v.sdk(v.actors.issuer);
    const uploadLearner = v.newActor('upload-learner');
    const learner = await v.sdk(uploadLearner);
    const recipient = await v.sdk(v.actors.recipient);
    const learnerDid = learner.id.did();
    const contractUri = await owner.invoke.createContract({
        name: `Upload live consent ${randomUUID()}`,
        recipients: [v.actors.recipient.profileId],
        contract: {
            read: {
                personal: {},
                credentials: { categories: { Achievement: { required: false } } },
            },
            write: { personal: {}, credentials: { categories: {} } },
        },
    });
    await learner.invoke.consentToContract(contractUri, {
        audienceVersion: (await owner.invoke.getContract(contractUri)).audienceVersion,
        terms: {
            read: {
                personal: {},
                credentials: {
                    sharing: true,
                    shareAll: false,
                    categories: { Achievement: { sharing: true, shareAll: true, shared: [] } },
                },
            },
            write: { personal: {}, credentials: { categories: {} } },
        },
    });
    const inputs = await Promise.all(
        ['single', 'bulk-a', 'bulk-b', 'paste'].map(async label => {
            const template = boostTemplate(owner.id.did(), `Upload ${label} ${randomUUID()}`);
            return owner.invoke.issueCredential({
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
        })
    );
    const page = await v.newPage('consent-uploader', { signInAs: uploadLearner });
    await v.step(page, 'consent-upload-after-consent', async () => {
        await page.getByRole('button', { name: /^Build My LearnCard/ }).click();
        await page.getByRole('button', { name: 'Upload', exact: true }).click();
        const modal = page
            .getByRole('dialog')
            .filter({ has: page.getByRole('heading', { name: 'Add Credentials', exact: true }) });
        await expect(modal).toBeVisible();
        // JSON uploads use LearnCloud, not the separate file-storage upload service.
        const upload = async (name: string, value: unknown) => {
            await modal.locator('input[type="file"]').setInputFiles({
                name,
                mimeType: 'application/json',
                buffer: Buffer.from(JSON.stringify(value)),
            });
        };
        const stored = async () => learner.index.LearnCloud.get({ category: 'Achievement' });
        await upload('single.json', inputs[0]);
        await expect.poll(async () => (await stored()).length, { timeout: 60_000 }).toBe(1);
        await expect(modal.getByRole('button', { name: 'Upload', exact: true })).toBeEnabled();
        await upload('bulk.json', [inputs[1], { type: ['VerifiableCredential'] }, inputs[2]]);
        await expect.poll(async () => (await stored()).length, { timeout: 60_000 }).toBe(3);
        await expect(page.getByText('2 credentials added. Some credentials failed.')).toBeVisible();
        await modal.getByRole('textbox').fill(JSON.stringify(inputs[3]));
        await modal.getByRole('button', { name: /Add$/ }).click();
        await expect(modal.getByRole('textbox')).toHaveValue('');
        await expect.poll(async () => (await stored()).length, { timeout: 60_000 }).toBe(4);
        for (const reader of [owner, recipient]) {
            const read = async () =>
                (await reader.invoke.getConsentFlowDataForDid(learnerDid)).records.find(
                    record => record.contractUri === contractUri
                );
            await expect
                .poll(async () => (await read())?.credentials.length, { timeout: 60_000 })
                .toBe(4);
            const data = (await read())!;
            expect(data.status).toBe('live');
            const copies = await Promise.all(
                data.credentials.map(item => reader.read.get(item.uri))
            );
            expect(copies).toEqual(expect.arrayContaining(inputs));
            expect(copies).toHaveLength(inputs.length);
        }
        await page.reload();
        await expect(page.getByRole('button', { name: /^Build My LearnCard/ })).toBeVisible({
            timeout: 120_000,
        });
        expect(await stored()).toHaveLength(4);
        await v.record('uploaded-live-consent', {
            contractUri,
            inputNames: inputs.map(input => input.name),
            count: 4,
        });
    });
    return { contractUri, uploaded: inputs.length };
}
