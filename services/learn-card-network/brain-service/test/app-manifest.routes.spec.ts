import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
    AppManifestVersion,
    AppStoreListing,
    Boost,
    ConsentFlowContract,
    Integration,
    Profile,
    SigningAuthority,
} from '@models';

import {
    getBoostForListingByTemplateAlias,
    getConsentContractForListingByScopeHash,
} from '@accesslayer/app-store-listing/relationships/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { createSigningAuthority } from '@accesslayer/signing-authority/create';
import { createUseSigningAuthorityRelationship } from '@accesslayer/signing-authority/relationships/create';
import { getPrimarySigningAuthorityForListing } from '@accesslayer/signing-authority/relationships/read';

import { computeConsentScopeHash } from '../src/helpers/consent-scopes.helpers';
import { getUser } from './helpers/getClient';
import { seedListedApp } from './helpers/app-store.helpers';

import type { AppManifest } from '@learncard/types';

let ownerUser: Awaited<ReturnType<typeof getUser>>;
let otherUser: Awaited<ReturnType<typeof getUser>>;

const seedProfile = async (user: Awaited<ReturnType<typeof getUser>>, profileId: string) => {
    await user.clients.fullAuth.profile.createProfile({ profileId });
};

const makeManifest = (overrides: Partial<AppManifest> = {}): AppManifest => ({
    manifestVersion: 1,
    appUrl: 'https://partner.example.com',
    suggestedName: 'Partner Example',
    suggestedIconUrl: 'https://partner.example.com/icon.png',
    permissions: ['send_credential'],
    templates: [
        {
            alias: 'completion',
            version: 1,
            lastUsedAt: '2026-01-01T00:00:00.000Z',
            template: {
                name: 'Course Completion: {{courseName}}',
                description: 'Awarded to {{learnerName}}',
                category: 'Achievement',
            },
        },
    ],
    consentRequests: [
        {
            scopes: {
                read: {
                    credentialCategories: ['Achievement'],
                    personalFields: ['email'],
                },
                write: {
                    credentialCategories: ['Achievement'],
                },
            },
            reason: 'Show progress',
            lastUsedAt: '2026-01-01T00:00:00.000Z',
        },
    ],
    featuresLaunched: ['/wallet'],
    counterKeys: ['coins'],
    usedLearnerContext: false,
    usedNotifications: false,
    firstCapturedAt: '2026-01-01T00:00:00.000Z',
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
});

describe('app manifest routes', () => {
    beforeAll(async () => {
        ownerUser = await getUser('a'.repeat(64));
        otherUser = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await AppManifestVersion.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ConsentFlowContract.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });

        await seedProfile(ownerUser, 'owner-user');
        await seedProfile(otherUser, 'other-user');
    });

    afterAll(async () => {
        await AppManifestVersion.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ConsentFlowContract.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await Integration.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    it('submits manifests idempotently and increments version on change', async () => {
        const { integration } = await seedListedApp('owner-user');
        const manifest = makeManifest();

        const first = await ownerUser.clients.fullAuth.appStore.submitAppManifest({
            integrationId: integration.id,
            manifest,
        });

        expect(first).toMatchObject({ version: 1, noop: false, diff: null });

        const second = await ownerUser.clients.fullAuth.appStore.submitAppManifest({
            integrationId: integration.id,
            manifest: {
                ...manifest,
                firstCapturedAt: '2026-02-01T00:00:00.000Z',
                lastUpdatedAt: '2026-02-01T00:00:00.000Z',
                templates: [{ ...manifest.templates[0]!, lastUsedAt: '2026-02-01T00:00:00.000Z' }],
                consentRequests: [
                    { ...manifest.consentRequests[0]!, lastUsedAt: '2026-02-01T00:00:00.000Z' },
                ],
            },
        });

        expect(second).toMatchObject({ version: 1, noop: true, diff: null });

        const changed = await ownerUser.clients.fullAuth.appStore.submitAppManifest({
            integrationId: integration.id,
            manifest: makeManifest({ permissions: ['send_credential', 'request_consent'] }),
        });

        expect(changed.version).toBe(2);
        expect(changed.noop).toBe(false);
        expect(changed.diff).toBeNull();

        const diff = await ownerUser.clients.fullAuth.appStore.getManifestDiff({
            integrationId: integration.id,
            fromVersion: 1,
            toVersion: 2,
        });

        expect(diff.permissions.added).toEqual(['request_consent']);

        const versions = await ownerUser.clients.fullAuth.appStore.getManifestVersions({
            integrationId: integration.id,
            limit: 10,
        });

        expect(versions.records.map(record => record.version)).toEqual([2, 1]);
    });

    it('applies manifest reconciliation idempotently', async () => {
        const { integration, listing } = await seedListedApp('owner-user');
        const signingAuthority = await createSigningAuthority('https://sa.example.com');
        const ownerProfile = await getProfileByProfileId('owner-user');

        if (!ownerProfile) {
            throw new Error('Expected owner profile to exist');
        }

        await createUseSigningAuthorityRelationship(
            ownerProfile,
            signingAuthority,
            'default',
            'did:web:sa.example.com:issuer',
            true
        );

        const manifest = makeManifest({ permissions: ['send_credential', 'request_consent'] });

        const submitted = await ownerUser.clients.fullAuth.appStore.submitAppManifest({
            integrationId: integration.id,
            manifest,
        });

        const firstApply = await ownerUser.clients.fullAuth.appStore.applyManifestVersion({
            integrationId: integration.id,
            version: submitted.version,
            listingId: listing.listing_id,
        });

        expect(firstApply).toMatchObject({
            applied: true,
            version: 1,
            reconciled: {
                templatesUpserted: 1,
                templatesSkipped: 0,
                contractsUpserted: 1,
                contractsSkipped: 0,
                signingAuthorityEnsured: true,
            },
        });

        const boost = await getBoostForListingByTemplateAlias(
            listing.listing_id,
            'completion',
            'localhost%3A3000'
        );
        expect(boost?.boost).toBeTruthy();

        const scopeHash = computeConsentScopeHash(manifest.consentRequests[0]!.scopes);
        const contract = await getConsentContractForListingByScopeHash(
            listing.listing_id,
            scopeHash
        );
        expect(contract?.id).toBeTruthy();

        const listingSigningAuthority = await getPrimarySigningAuthorityForListing(listing);
        expect(listingSigningAuthority?.signingAuthority.endpoint).toBe('https://sa.example.com');

        const secondApply = await ownerUser.clients.fullAuth.appStore.applyManifestVersion({
            integrationId: integration.id,
            version: submitted.version,
            listingId: listing.listing_id,
        });

        expect(secondApply).toMatchObject({
            applied: true,
            version: 1,
            reconciled: {
                templatesUpserted: 0,
                templatesSkipped: 1,
                contractsUpserted: 0,
                contractsSkipped: 1,
                signingAuthorityEnsured: true,
            },
        });

        const fetchedVersion = await ownerUser.clients.fullAuth.appStore.getManifestVersion({
            integrationId: integration.id,
            version: 1,
        });
        expect(fetchedVersion.status).toBe('active');
        expect(fetchedVersion.manifest.permissions).toEqual(['send_credential', 'request_consent']);

        const diff = await ownerUser.clients.fullAuth.appStore.getManifestDiff({
            integrationId: integration.id,
            fromVersion: 1,
            toVersion: 1,
        });
        expect(diff.requiresReview).toBe(false);
    });
});
