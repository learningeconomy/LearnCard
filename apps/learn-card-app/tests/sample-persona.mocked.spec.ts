import { initLearnCard } from '@learncard/init';
import { getBundle, getFixture, prepareFixture } from '@learncard/credential-library';
import type { VC } from '@learncard/types';

import { expect, test } from './fixtures/mocked-test';

import { TEST_USER_PROFILE_ID, TEST_USER_SEED } from './constants';
import { installNetwork } from './mocks/network';
import { waitForAuthenticatedState } from './test.helpers';

const contractUri =
    'lc:network:localhost%3A4000/trpc:contract:79672d1a-fe7c-5715-95db-27586e529934';
const termsUri = 'lc:network:localhost%3A4000/trpc:terms:sample-persona';
const studentBundle = getBundle('student');
const autoBoostUris = studentBundle.entries.map(
    (_, index) => `lc:network:localhost%3A4000/trpc:boost:sample-persona-${index}`
);
const owner = {
    did: 'did:web:localhost%3A4000:users:hillvalleyhigh',
    profileId: 'hillvalleyhigh',
    displayName: 'Hill Valley High',
};
const contractTerms = {
    read: {
        personal: { name: { required: false } },
        credentials: { categories: { Achievement: { required: false } } },
    },
    write: {
        personal: {},
        credentials: {
            categories: { Achievement: { required: false, defaultEnabled: true } },
        },
    },
};
const contract = {
    owner,
    contract: contractTerms,
    name: 'Student Sample Credentials',
    subtitle: studentBundle.blurb,
    description: studentBundle.blurb,
    reasonForAccessing: '',
    needsGuardianConsent: false,
    redirectUrl: '',
    frontDoorBoostUri: '',
    image: '',
    createdAt: '2026-09-17T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z',
    uri: contractUri,
    autoBoosts: autoBoostUris,
};

let populatedIndexResponse: unknown;
let emptyIndexResponse: unknown;
let sampleCredentialResponse: unknown;
let sampleRecordCount = 0;

test.beforeAll(async () => {
    const wallet = await initLearnCard({
        seed: TEST_USER_SEED,
        allowRemoteContexts: false,
    });
    const records = [];
    let firstCredential: VC | undefined;
    for (const [index, entry] of studentBundle.entries.entries()) {
        const credential = await wallet.invoke.issueCredential(
            prepareFixture(getFixture(entry.fixtureId), {
                issuerDid: wallet.id.did(),
                subjectDid: wallet.id.did(),
            })
        );
        firstCredential ??= credential;

        const record = {
            id: `sample-persona-${index}`,
            uri: `lc:cloud:localhost%3A4100/trpc:credential:sample-persona-${index}`,
            category: 'Achievement',
            contractUri,
            metadata: { category: 'Achievement', contractUri },
        };
        records.push({
            encryptedRecord: await wallet.invoke.createDagJwe(record),
            fields: [],
        });
    }

    if (!firstCredential) throw new Error('Student bundle is empty');

    populatedIndexResponse = await wallet.invoke.createDagJwe({
        records,
        hasMore: false,
    });
    emptyIndexResponse = await wallet.invoke.createDagJwe({ records: [], hasMore: false });
    sampleCredentialResponse = await wallet.invoke.createDagJwe(firstCredential);
    sampleRecordCount = records.length;
});

test.describe('Sample persona @mocked', () => {
    test('adds sample credentials, shows the persistent sample state, and removes it', async ({
        page,
    }) => {
        const trpc = await installNetwork(page);
        let hasSample = false;

        trpc.on('profile.updateProfile', () => true);
        trpc.on('contracts.getConsentFlowContract', () => contract);
        trpc.on('contracts.getConsentedContracts', () => ({
            hasMore: false,
            records: hasSample
                ? [
                      {
                          contract,
                          uri: termsUri,
                          terms: contractTerms,
                          consenter: {
                              did: 'did:web:localhost%3A4000:users:mocked-user',
                              profileId: TEST_USER_PROFILE_ID,
                              displayName: 'Mocked User',
                          },
                          status: 'live',
                      },
                  ]
                : [],
        }));
        trpc.on('contracts.consentToContract', () => {
            hasSample = true;
            return { termsUri };
        });
        trpc.on('contracts.getAllCredentialsForTerms', () => ({
            hasMore: false,
            records: [],
        }));
        trpc.on('contracts.getCredentialsForContract', () => ({
            hasMore: false,
            records: autoBoostUris.map((boostUri, index) => ({
                credentialUri: `lc:cloud:localhost%3A4100/trpc:credential:sample-persona-${index}`,
                termsUri,
                contractUri,
                boostUri,
                category: 'Achievement',
                date: '2026-09-17T00:00:00.000Z',
            })),
        }));
        trpc.on('contracts.withdrawConsent', () => {
            hasSample = false;
            return true;
        });
        trpc.on('index.get', () => (hasSample ? populatedIndexResponse : emptyIndexResponse));
        trpc.on('index.count', () => (hasSample ? sampleRecordCount : 0));
        trpc.on('index.remove', () => true);
        trpc.on('storage.resolve', () => sampleCredentialResponse);
        trpc.on('contracts.deleteCredentialFromAllContracts', () => ({
            contractsUpdated: 0,
            removedSharedUris: 0,
        }));

        await waitForAuthenticatedState(page, {
            path: '/wallet',
            profileId: TEST_USER_PROFILE_ID,
        });

        const onboardingDialog = page.getByRole('dialog', {
            name: "Welcome — let's set you up",
        });
        await onboardingDialog.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
        if (await onboardingDialog.isVisible()) {
            await onboardingDialog.getByRole('button', { name: 'Close dialog' }).click();
            await expect(onboardingDialog).toBeHidden();
        }

        await page.getByRole('button', { name: /Build My LearnCard/ }).click();
        const sampleCard = page.getByRole('region', { name: 'See an example LearnCard' });
        const addButton = sampleCard.getByRole('button', { name: 'See an example LearnCard' });
        await expect(addButton).toBeVisible({ timeout: 30_000 });
        await addButton.click();

        await expect(page.getByText('Sample credentials added.')).toBeVisible({
            timeout: 30_000,
        });
        await expect(sampleCard).toBeHidden({ timeout: 30_000 });
        await expect(page.getByText('Sample', { exact: true })).toBeVisible();

        await page.getByRole('button', { name: /Build My LearnCard/ }).click();
        await expect(page.getByRole('heading', { name: 'Sample LearnCard' })).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByText('Afterschool Program Mentor').first()).toBeVisible({
            timeout: 30_000,
        });
        await page
            .getByRole('region', { name: 'See an example LearnCard' })
            .getByRole('button', { name: 'Remove sample credentials' })
            .click();
        await page
            .getByRole('dialog')
            .last()
            .getByRole('button', { name: 'Remove sample credentials' })
            .click();

        await expect(page.getByRole('button', { name: 'See an example LearnCard' })).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByText('Sample', { exact: true })).toHaveCount(0);
    });
});
