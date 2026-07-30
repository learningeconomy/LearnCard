import { beforeEach, describe, expect, it } from 'vitest';

import { neogma } from '@instance';
import {
    AppAvailability,
    AppStoreListing,
    Binding,
    Ecosystem,
    Group,
    InstallIntent,
    IntegrationInstall,
    ListingVersion,
    Profile,
    RegistrySubscription,
    WalletEnablement,
    WorkloadDeployment,
} from '@models';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

import { getClient } from './helpers/getClient';
import { DEV_PLANNABLE_APP_FIXTURE, seedPlannableApp } from './helpers/education-os.helpers';

const OPERATOR_DID = 'did:key:z6MkFixtureOperator';
const OPERATOR_PROFILE_ID = 'fixture-operator';

const FIXTURE_TIMEOUT_MS = 30_000;

const operatorClient = getClient({
    did: OPERATOR_DID,
    isChallengeValid: true,
    scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
});

const seed = () =>
    seedPlannableApp({
        ecosystemId: DEV_PLANNABLE_APP_FIXTURE.ecosystemId,
        ecosystemSlug: DEV_PLANNABLE_APP_FIXTURE.ecosystemSlug,
        ecosystemName: DEV_PLANNABLE_APP_FIXTURE.ecosystemName,
        operatorProfileId: OPERATOR_PROFILE_ID,
        operatorDid: OPERATOR_DID,
        listingId: DEV_PLANNABLE_APP_FIXTURE.listingId,
        versionId: DEV_PLANNABLE_APP_FIXTURE.versionId,
    });

describe('EducationOS dev fixtures', () => {
    beforeEach(async () => {
        await neogma.queryRunner.run(
            'MATCH (event:InstallIntentAuditEvent) DETACH DELETE event',
            {}
        );
        await Binding.delete({ detach: true, where: {} });
        await InstallIntent.delete({ detach: true, where: {} });
        await RegistrySubscription.delete({ detach: true, where: {} });
        await WorkloadDeployment.delete({ detach: true, where: {} });
        await WalletEnablement.delete({ detach: true, where: {} });
        await AppAvailability.delete({ detach: true, where: {} });
        await IntegrationInstall.delete({ detach: true, where: {} });
        await Group.delete({ detach: true, where: {} });
        await Ecosystem.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await ListingVersion.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    it(
        'produces a fixture that can be planned and approved end to end',
        async () => {
            const fixture = await seed();

            const planned = await operatorClient.installIntent.planInstallIntent({
                ecosystemId: fixture.ecosystemId,
                listingId: fixture.listingId,
                versionId: fixture.versionId,
                requestedConfig: {},
                proposedBindings: [],
            });

            expect(planned.approval.state).toBe('PENDING_ADOPTION');
            expect(planned.policyRevision).toEqual(expect.any(String));
            expect(planned.policyRevision.length).toBeGreaterThan(0);

            const approved = await operatorClient.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: planned.plan.planHash,
                planRevision: planned.plan.planRevision,
                consentTiers: [],
            });

            expect(approved.approval.state).toBe('APPROVED');
            expect(approved.spec).toBeDefined();
        },
        FIXTURE_TIMEOUT_MS
    );

    it(
        'grants the operator real authority rather than the JIT-provisionable default',
        async () => {
            const fixture = await seed();

            expect(fixture.operatorRole).toBe('OWNER');

            const intents = await operatorClient.installIntent.listInstallIntents({
                ecosystemId: fixture.ecosystemId,
            });

            expect(Array.isArray(intents)).toBe(true);
        },
        FIXTURE_TIMEOUT_MS
    );

    it(
        'is idempotent, so re-seeding an existing dev database repairs instead of duplicating',
        async () => {
            const first = await seed();
            const second = await seed();

            expect(second).toEqual(first);

            const listings = await AppStoreListing.findMany({
                where: { listing_id: DEV_PLANNABLE_APP_FIXTURE.listingId },
            });
            const versions = await ListingVersion.findMany({
                where: { version_id: DEV_PLANNABLE_APP_FIXTURE.versionId },
            });
            const ecosystems = await Ecosystem.findMany({
                where: { id: DEV_PLANNABLE_APP_FIXTURE.ecosystemId },
            });

            expect(listings).toHaveLength(1);
            expect(versions).toHaveLength(1);
            expect(ecosystems).toHaveLength(1);
        },
        FIXTURE_TIMEOUT_MS
    );

    it(
        'pins a well-known ecosystem id with the derived hierarchy fields populated',
        async () => {
            const fixture = await seed();

            expect(fixture.ecosystemId).toBe(DEV_PLANNABLE_APP_FIXTURE.ecosystemId);

            const ecosystem = (await Ecosystem.findOne({
                where: { id: fixture.ecosystemId },
                plain: true,
            })) as Record<string, unknown> | null;

            expect(ecosystem).not.toBeNull();
            expect(ecosystem?.status).toBe('ACTIVE');
            expect(ecosystem?.ownerProfileId).toBe(OPERATOR_PROFILE_ID);
            expect(ecosystem?.rootEcosystemId).toBe(fixture.ecosystemId);
            expect(ecosystem?.pathIds).toEqual([fixture.ecosystemId]);
            expect(ecosystem?.depth).toBe(0);
        },
        FIXTURE_TIMEOUT_MS
    );
});
