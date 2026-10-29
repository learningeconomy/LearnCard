/**
 * DIRECT steps of the live driver: access-layer calls against the dev stack's neo4j for
 * the parts of the walkthrough that have no console route (fixtures, credential issuance,
 * governance, the dev-only health probe). Every caller labels these steps DIRECT.
 *
 * Loaded with a dynamic import after bootstrapScenarioEnv() and the Redis defaults in
 * port.ts: brain modules read their environment at load.
 */
import { z } from 'zod';
import type { IntegrationManifest } from '@learncard/types';
import { ConsentFlowContractValidator } from '@learncard/types';
import { neogma } from '@instance';
import { getEcosystemById } from '@accesslayer/ecosystem/read';
import {
    getEcosystemMembershipRole,
    grantEcosystemMembership,
} from '@accesslayer/ecosystem/membership';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readAppStoreListingBySlug } from '@accesslayer/app-store-listing/read';
import { createIntegration } from '@accesslayer/integration/create';
import { associateIntegrationWithProfile } from '@accesslayer/integration/relationships/create';
import { associateListingWithIntegration } from '@accesslayer/app-store-listing/relationships/create';
import { createListingVersion } from '@accesslayer/listing-version/create';
import { readListingVersionById } from '@accesslayer/listing-version/read';
import {
    issueServiceAccountCredential,
    readServiceAccount,
} from '@accesslayer/service-account/auth';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import {
    acceptGovernanceConsentContract,
    governConsentContract,
} from '@accesslayer/consentflowcontract/governance';
import { ServiceAccount, type StoredServiceAccount } from '@models';
import { getLearnCard } from '@helpers/learnCard.helpers';
import {
    assertSignedListingVersionOrThrow,
    computeManifestHash,
    signManifestWithDidKey,
} from '@helpers/manifest-signature.helpers';
import { constructUri } from '@helpers/uri.helpers';
import { probeServiceAccountHealthNow } from '../../../src/dev/service-account-health-probe';
import { ensureEcosystemWithId } from '../../../test/helpers/ecosystem-with-id';
import {
    buildDemoLmsManifest,
    DEMO_LMS_APP_NAME,
    DEMO_LMS_LISTING_SLUG,
    DEMO_LMS_MANIFEST_ID,
} from '../../../test/helpers/demo-lms-manifest';
import { ScenarioError } from '../../core/expect';
import { registerSecret } from '../../core/report';
import { SCENARIO_SEEDS } from '../../core/ids';
import type {
    FoundationView,
    GovernanceView,
    HealthProbeView,
    ListingView,
    ServiceAccountView,
} from '../../port';

const MANIFEST_VERSION = '1.0.0';

const toAccountView = (account: StoredServiceAccount): ServiceAccountView => ({
    id: account.id,
    installId: account.installId,
    ecosystemId: account.ecosystemId,
    status: account.status,
    enableCause: account.enableCause,
    disabledCause: account.disabledCause,
    healthFailures: account.healthFailures,
    credentialGeneration: account.credentialGeneration,
});

/** F1: the root exists and the console operator holds OWNER on it. */
export const ensureFoundation = async (input: {
    rootEcosystemId: string;
    operatorProfileId: string;
}): Promise<FoundationView> => {
    const { rootEcosystemId, operatorProfileId } = input;
    await ensureEcosystemWithId({
        ecosystemId: rootEcosystemId,
        slug: 'eco-dev-root',
        name: 'Dev Root Ecosystem',
        ownerProfileId: operatorProfileId,
    });
    const roleOf = async (): Promise<FoundationView['operatorRole'] | null> => {
        const root = await getEcosystemById(rootEcosystemId);
        if (root?.ownerProfileId === operatorProfileId) return 'OWNER';
        return getEcosystemMembershipRole(operatorProfileId, rootEcosystemId);
    };
    if ((await roleOf()) !== 'OWNER') {
        await grantEcosystemMembership({
            profileId: operatorProfileId,
            ecosystemId: rootEcosystemId,
            role: 'OWNER',
        });
    }
    const role = await roleOf();
    if (!role) {
        throw new ScenarioError({
            code: 'NO_MEMBERSHIP',
            message: `${operatorProfileId} has no role on ${rootEcosystemId} after the grant`,
        });
    }
    return { rootEcosystemId, operatorProfileId, operatorRole: role };
};

export type ListingTarget = {
    slug: string;
    appName: string;
    manifestId: string;
    /** Where the listing's health and connect endpoints answer. */
    origin: string;
    ownerProfileId: string;
};

/**
 * The runner's listing. On the default demo LMS port it is the shared `demo-lms` listing,
 * which the runner never re-signs (a developer's own install pins it). On any other port
 * it is a separate `demo-lms-scenario` listing, so no developer install or catalog
 * "latest version" ever points at the runner's LMS.
 */
export const listingTargetFor = (input: {
    origin: string;
    port: number;
    ownerProfileId: string;
}): ListingTarget =>
    input.port === 4321
        ? {
              slug: DEMO_LMS_LISTING_SLUG,
              appName: DEMO_LMS_APP_NAME,
              manifestId: DEMO_LMS_MANIFEST_ID,
              origin: input.origin,
              ownerProfileId: input.ownerProfileId,
          }
        : {
              slug: `${DEMO_LMS_LISTING_SLUG}-scenario`,
              appName: `${DEMO_LMS_APP_NAME} (scenario runner)`,
              manifestId: `${DEMO_LMS_MANIFEST_ID}.scenario`,
              origin: input.origin,
              ownerProfileId: input.ownerProfileId,
          };

const pinnedHealthUrl = (manifestJson: string | undefined): string | undefined => {
    if (!manifestJson) return undefined;
    const parsed = z
        .object({ endpoints: z.object({ healthUrl: z.string() }).partial() })
        .partial()
        .safeParse(JSON.parse(manifestJson));
    return parsed.success ? parsed.data.endpoints?.healthUrl : undefined;
};

/** F2: a LISTED INTEGRATION listing whose signed manifest pins `origin`/health. */
export const ensureListing = async (target: ListingTarget): Promise<ListingView> => {
    const publisherSeed = SCENARIO_SEEDS.publisher;
    const publisherDid = (await getLearnCard(publisherSeed)).id.did();
    const healthUrl = `${target.origin}/health`;
    const shared = target.slug === DEMO_LMS_LISTING_SLUG;

    let listing = await readAppStoreListingBySlug(target.slug);
    if (!listing) {
        listing = await createAppStoreListing({
            slug: target.slug,
            kind: 'INTEGRATION',
            display_name: target.appName,
            tagline: 'Dev lms integration',
            full_description: `Locally seeded lms integration published by ${publisherDid}`,
            icon_url: 'https://placehold.co/250x250/teal/white?text=Integration',
            app_listing_status: 'LISTED',
            launch_type: 'SERVER_HEADLESS',
            launch_config_json: JSON.stringify({ connectUrl: `${target.origin}/connect` }),
            category: 'Integrations',
            promotion_level: 'STANDARD',
        });
        const integration = await createIntegration({
            name: `${target.appName} Integration`,
            description: `Integration for ${target.appName}`,
            whitelistedDomains: ['localhost', new URL(target.origin).host],
        });
        await associateIntegrationWithProfile(integration.id, target.ownerProfileId);
        await associateListingWithIntegration(listing.listing_id, integration.id);
    }
    if (listing.kind !== 'INTEGRATION' || listing.app_listing_status !== 'LISTED') {
        throw new ScenarioError({
            code: 'LISTING_STATE',
            message: `listing ${target.slug} is ${listing.kind}/${listing.app_listing_status}, expected INTEGRATION/LISTED (run seed:dev-integration)`,
        });
    }
    const listingId = listing.listing_id;

    const existing = await neogma.queryRunner.run(
        `MATCH (:AppStoreListing {listing_id: $listingId})-[:HAS_VERSION]->(v:ListingVersion {version: $version})
         RETURN v.version_id AS versionId LIMIT 1`,
        { listingId, version: MANIFEST_VERSION }
    );
    const existingId: unknown = existing.records[0]?.get('versionId');
    let versionId = typeof existingId === 'string' ? existingId : undefined;
    const current = versionId ? await readListingVersionById(versionId) : null;
    const currentHealthUrl = pinnedHealthUrl(current?.manifest_json);

    if (!versionId || currentHealthUrl !== healthUrl) {
        if (versionId && shared) {
            throw new ScenarioError({
                code: 'LISTING_PINNED_ELSEWHERE',
                message: `${target.slug}@${MANIFEST_VERSION} pins ${currentHealthUrl ?? 'no health URL'}, not ${healthUrl}; the runner does not re-sign the shared listing`,
            });
        }
        const manifest = await signManifestWithDidKey<IntegrationManifest>(
            {
                ...buildDemoLmsManifest({
                    publisherDid,
                    origin: target.origin,
                    version: MANIFEST_VERSION,
                }),
                id: target.manifestId,
            },
            publisherSeed
        );
        const manifestJson = JSON.stringify(manifest);
        if (versionId) {
            // The scenario listing is the runner's own: re-sign in place for a new port.
            await neogma.queryRunner.run(
                `MATCH (v:ListingVersion {version_id: $versionId})
                 SET v.status = 'LISTED', v.manifest_json = $manifestJson,
                     v.manifest_hash = $manifestHash, v.publisher_did = $publisherDid,
                     v.signature = $signature`,
                {
                    versionId,
                    manifestJson,
                    manifestHash: computeManifestHash(manifest),
                    publisherDid,
                    signature: manifest.signature.sig,
                }
            );
        } else {
            versionId = (
                await createListingVersion(listingId, {
                    version: MANIFEST_VERSION,
                    status: 'LISTED',
                    manifest_json: manifestJson,
                })
            ).version_id;
        }
    }

    const version = await readListingVersionById(versionId);
    if (!version) {
        throw new ScenarioError({
            code: 'LISTING_STATE',
            message: `version ${versionId} could not be read back`,
        });
    }
    await assertSignedListingVersionOrThrow(listing.kind, version);
    return { listingId, versionId, slug: target.slug, healthUrl };
};

export const readAccount = async (
    input: { serviceAccountId: string } | { installId: string }
): Promise<ServiceAccountView | null> => {
    const account =
        'serviceAccountId' in input
            ? await readServiceAccount(input.serviceAccountId)
            : await ServiceAccount.findOne({
                  where: { installId: input.installId },
                  plain: true,
              });
    return account ? toAccountView(account) : null;
};

/** DIRECT: the brain route exists, but only the BFF's managed DID can call it. */
export const issueCredential = async (
    serviceAccountId: string,
    actorProfileId: string
): Promise<{ secret: string; expiresAt: string }> => {
    const issued = await issueServiceAccountCredential(serviceAccountId, actorProfileId);
    registerSecret(issued.secret);
    return { secret: issued.secret, expiresAt: issued.expiresAt };
};

export const probeHealth = async (
    input: { serviceAccountId: string } | { intentId: string }
): Promise<HealthProbeView> => probeServiceAccountHealthNow(input);

/**
 * S08 DIRECT (owner decision 4): a fresh agreement for this district, governed with the
 * record-provisioning grant, plus the operator's ConsentFlowTerms (raw MERGE, as
 * seed-demo-lms does) and the operator's governance acceptance. ConsentFlow code is not
 * touched.
 */
export const governAndAccept = async (input: {
    ecosystemId: string;
    actorProfileId: string;
    domain: string;
}): Promise<GovernanceView> => {
    const { ecosystemId, actorProfileId, domain } = input;
    const name = `Scenario data sharing ${ecosystemId}`;
    const governed = await neogma.queryRunner.run(
        `MATCH (:Ecosystem {id: $ecosystemId})-[:GOVERNS_CONSENT_CONTRACT]->
             (c:ConsentFlowContract {name: $name}) RETURN c.id AS id LIMIT 1`,
        { ecosystemId, name }
    );
    const governedId: unknown = governed.records[0]?.get('id');
    const contractId =
        typeof governedId === 'string'
            ? governedId
            : (
                  await createConsentFlowContract({
                      // Non-empty on purpose: empty objects are dropped when stored.
                      contract: ConsentFlowContractValidator.parse({
                          read: { anonymize: false },
                          write: {
                              credentials: { categories: { Achievement: { required: true } } },
                          },
                      }),
                      ownerProfileId: actorProfileId,
                      name,
                      subtitle: 'Course completions from Demo LMS',
                      description:
                          'Demo LMS shares your course completions (course, title, completion date) with this district, which issues them to you as credentials. Scenario runner fixture.',
                      reasonForAccessing:
                          'To issue your course completions as credentials you own.',
                  })
              ).id;

    await governConsentContract({
        ecosystemId,
        contractId,
        actorProfileId,
        agreement: 'institutional-data-sharing',
        grant: {
            apiVersion: 'lc.consent-grant/v1',
            grants: [
                {
                    capability: 'record-provisioning',
                    operation: 'read',
                    scopes: [`completion:ingest:tree:${ecosystemId}`],
                    selectors: { ecosystemIds: [ecosystemId] },
                    tiers: ['credential-body'],
                    purpose: 'DEMO: course completions for credential issuance.',
                },
            ],
        },
    });
    const now = new Date().toISOString();
    const termsId = `${contractId}-operator-terms`;
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $actorProfileId}), (c:ConsentFlowContract {id: $contractId})
         MERGE (t:ConsentFlowTerms {id: $termsId})
         ON CREATE SET t.status = 'live', t.createdAt = $now, t.updatedAt = $now, t.mutationVersion = 1
         MERGE (p)-[:CREATED_BY]->(t) MERGE (t)-[:CONSENTS_TO]->(c)`,
        { actorProfileId, contractId, termsId, now }
    );
    const revision = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $contractId})
         RETURN c.educationOsGrantRevision AS revision, c.educationOsGrantHash AS hash`,
        { contractId }
    );
    await acceptGovernanceConsentContract(
        {
            ecosystemId,
            contractId,
            termsId,
            contractRevision: String(revision.records[0]?.get('revision')),
            grantHash: String(revision.records[0]?.get('hash')),
        },
        actorProfileId
    );
    return { contractId, contractUri: constructUri('contract', contractId, domain) };
};

export const closeDirect = async (): Promise<void> => {
    await neogma.driver.close();
};

export { metadataFor } from '../../../test/helpers/record-binding';
