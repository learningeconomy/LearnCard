import { randomUUID } from 'node:crypto';
import { ACT_AS_HEADER, ReadableDeliveryPageValidator } from '@learncard/types';
import type { VerificationContext } from './types';
import { boostTemplate } from './journeys/sdk';
import { expect } from './expect';

/** Real file uploads with selective-only consent, read independently by both audience members. */
export default async function verifyReferralOutcomes(v: VerificationContext) {
    const owner = await v.sdk(v.actors.issuer);
    const learnerActor = v.newActor('outcome-learner');
    const learner = await v.sdk(learnerActor);
    const unrelated = await v.sdk(v.actors.recipient);
    const recipient = await owner.invoke.createReadableDeliveryRecipient({
        requestId: randomUUID(),
        displayName: `Outcome reader ${randomUUID().slice(0, 8)}`,
        acceptDelegatedAuthority: true,
        disclosureVersion: '2',
    });
    const name = `Outcome referral ${randomUUID().slice(0, 8)}`;
    const contractUri = await owner.invoke.createContract({
        name,
        recipients: [recipient.profileId],
        contract: {
            read: {
                personal: {},
                credentials: { categories: { Achievement: { required: false } } },
            },
            write: { personal: {}, credentials: { categories: {} } },
        },
    });
    const otherUri = await unrelated.invoke.createContract({
        name: `Unrelated referral ${randomUUID()}`,
        contract: {
            read: {
                personal: {},
                credentials: { categories: { Achievement: { required: false } } },
            },
            write: { personal: {}, credentials: { categories: {} } },
        },
    });
    const terms = {
        read: {
            personal: {},
            credentials: {
                sharing: false,
                shareAll: false,
                categories: { Achievement: { sharing: false, shareAll: false, shared: [] } },
            },
        },
        write: { personal: {}, credentials: { categories: {} } },
    };
    const audienceVersion = (await learner.invoke.getContract(contractUri)).audienceVersion;
    await learner.invoke.consentToContract(contractUri, { terms, audienceVersion });
    await learner.invoke.consentToContract(otherUri, {
        audienceVersion: (await learner.invoke.getContract(otherUri)).audienceVersion,
        terms: {
            ...terms,
            read: {
                personal: {},
                credentials: {
                    sharing: true,
                    shareAll: true,
                    categories: { Achievement: { sharing: true, shareAll: true, shared: [] } },
                },
            },
        },
    });
    const title = `Partner outcome ${randomUUID().slice(0, 8)}`;
    const template = boostTemplate(owner.id.did(), title);
    const signed = await owner.invoke.issueCredential({
        ...template,
        credentialSubject: {
            ...template.credentialSubject,
            id: learner.id.did(),
            achievement: {
                ...template.credentialSubject.achievement,
                achievementType: 'Achievement',
            },
        },
    });
    const page = await v.newPage('referral-outcome-uploader', { signInAs: learnerActor });
    await page.setViewportSize({ width: 390, height: 844 });
    const token = await owner.invoke.getAPITokenForAuthGrant(
        await owner.invoke.addAuthGrant({
            name: 'Outcome selected read',
            scope: 'contracts-data:read contracts-data:decrypt',
            actAs: recipient.profileId,
        })
    );
    const readDelivery = async (did = learner.id.did()) => {
        const response = await fetch(`${v.stack.brainApi}/readable-delivery/data`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                [ACT_AS_HEADER]: recipient.profileId,
            },
            body: JSON.stringify({ contractUri, did, limit: 25 }),
        });
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toContain('no-store');
        return ReadableDeliveryPageValidator.parse(await response.json());
    };
    await v.step(page, 'consent-referral-outcome', async () => {
        await page.goto('/privacy-and-data?insets=47,34');
        await page.getByRole('button', { name: new RegExp(name) }).click();
        await page.getByRole('button', { name: 'Add an outcome', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Referral outcomes' })).toBeVisible();
        await expect(page.getByTestId('outcome-audience')).toContainText(recipient.displayName);
        await expect(
            page.getByText(
                'This does not turn on live sync or share the file with other referrals.'
            )
        ).toBeVisible();
        await page.getByLabel('Outcome file').setInputFiles({
            name: 'partner-outcome.json',
            mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(signed)),
        });
        await page.getByRole('button', { name: 'Add an outcome', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm Sharing', exact: true }).click();
        await expect(page.getByText('Outcome shared with this referral.')).toBeVisible({
            timeout: 60_000,
        });
        const consent = (await learner.invoke.getConsentedContracts()).records.find(
            record => record.contract.uri === contractUri
        )!;
        expect(consent.terms.read).toEqual(terms.read);
        expect(consent.terms.outcomes).toHaveLength(1);
        const uri = consent.terms.outcomes![0]!;
        expect(await owner.read.get(uri)).toEqual(signed);
        expect((await learner.index.LearnCloud.get()).some(record => record.uri === uri)).toBe(
            false
        );
        const other = await unrelated.invoke.getConsentFlowDataForDid(learner.id.did(), {
            query: { id: otherUri.split(':').at(-1) },
        });
        await v.capture(page, 'referral-outcome-attached');
        expect(other.records[0]?.credentials).toEqual([]);
        const readable = await readDelivery();
        expect(readable.records).toHaveLength(1);
        expect(readable.records[0]).toMatchObject({
            category: 'Outcome',
            uri,
            status: 'readable',
            credential: {
                name: title,
                issuer: owner.id.did(),
                verification: { proof: 'valid', label: 'verified' },
            },
        });
        expect(readable.records[0]?.fullCredential).toEqual(signed);

        // An attacker can reuse a known ciphertext URI, but cannot inherit its learner's trust.
        const otherLearner = await v.sdk(v.newActor('outcome-other-learner'));
        await otherLearner.invoke.consentToContract(contractUri, { terms, audienceVersion });
        const otherConsent = (await otherLearner.invoke.getConsentedContracts()).records.find(
            record => record.contract.uri === contractUri
        )!;
        await otherLearner.invoke.attachReferralOutcome(otherConsent.uri, uri, audienceVersion);
        const copied = await readDelivery(otherLearner.id.did());
        expect(copied.records[0]).toMatchObject({
            uri,
            status: 'readable',
            credential: { verification: { proof: 'valid', label: 'unverified' } },
        });
        await otherLearner.invoke.detachReferralOutcome(otherConsent.uri, uri, audienceVersion);
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        await expect(
            page
                .getByRole('dialog', { name: 'App details', exact: true })
                .getByText('Selected outcomes: 1', { exact: true })
        ).toBeVisible();
        await v.capture(page, 'referral-outcome-permissions');
        await page.reload();
        await expect(page.getByRole('button', { name: new RegExp(name) })).toContainText(
            'Selected outcomes: 1'
        );
        await page.getByRole('button', { name: new RegExp(name) }).click();
        await page.getByRole('button', { name: 'Add an outcome', exact: true }).click();
        await expect(
            page.getByRole('button', { name: 'Remove outcome 1', exact: true })
        ).toBeVisible();
        await page.getByRole('button', { name: 'Remove outcome 1', exact: true }).click();
        await expect(page.getByText('Outcome removed from this referral.')).toBeVisible();
        expect((await readDelivery()).records).toEqual([]);
        expect(
            (await learner.invoke.getConsentedContracts()).records.find(
                record => record.uri === consent.uri
            )?.terms.read
        ).toEqual(terms.read);
        await v.record('referral-outcome', {
            contractUri,
            unrelatedContractUri: otherUri,
            uri,
            categoryGrantsUnchanged: true,
            recipientLabel: readable.records[0]?.credential?.verification.label,
            removal: 'no-longer-delivered',
        });
    });
    return { contractUri, unrelatedContractUri: otherUri, targeted: true };
}
