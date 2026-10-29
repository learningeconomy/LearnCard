/**
 * In-process fixtures and callers for the scenario runner. Everything here runs inside a
 * vitest worker against the fresh test database (vitest.scenario.config.ts): callers are
 * `appRouter.createCaller` with a typed Context, and the DIRECT fixtures (F1, F2, S08)
 * call the access layer as the seed scripts do.
 *
 * Deliberately avoids test/helpers/getClient.ts and manifest.helpers.ts: both fail the
 * scenario typecheck today (tsconfig.scenario.json).
 */
import { randomUUID } from 'node:crypto';
import { ConsentFlowContractValidator, type IntegrationManifest } from '@learncard/types';
import { neogma } from '@instance';
import { appRouter } from '../../../src/app';
import { createContext, type Context } from '@routes';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { grantEcosystemMembership } from '@accesslayer/ecosystem/membership';
import { createProfile } from '@accesslayer/profile/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readAppStoreListingById } from '@accesslayer/app-store-listing/read';
import { createListingVersion } from '@accesslayer/listing-version/create';
import { readListingVersionById } from '@accesslayer/listing-version/read';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import {
    acceptGovernanceConsentContract,
    governConsentContract,
} from '@accesslayer/consentflowcontract/governance';
import { getLearnCard } from '@helpers/learnCard.helpers';
import {
    assertSignedListingVersionOrThrow,
    signManifestWithDidKey,
} from '@helpers/manifest-signature.helpers';
import { constructUri } from '@helpers/uri.helpers';
import {
    DEMO_LMS_APP_NAME,
    DEMO_LMS_LISTING_SLUG,
    buildDemoLmsManifest,
} from '../../../test/helpers/demo-lms-manifest';
import { withHealthServer, type HealthServerControl } from '../../../test/helpers/health-server';
import { SCENARIO_PROFILE_IDS, SCENARIO_SEEDS, type WalletRole } from '../../core/ids';
import type { FoundationView, GovernanceView, ListingView } from '../../port';

export type Caller = ReturnType<typeof appRouter.createCaller>;

/** The console operator in the fresh database. The did is only ever a Context value. */
export const OPERATOR = {
    profileId: 'scenario-operator',
    did: 'did:key:z6MkScenarioConsoleOperator',
} as const;

const WALLET_SEEDS: Record<WalletRole, string> = {
    learnerA: SCENARIO_SEEDS.learnerA,
    learnerB: SCENARIO_SEEDS.learnerB,
    otherWallet: SCENARIO_SEEDS.otherWallet,
};

/** Domain and tenant exactly as brain derives them for a header-less request. */
const baseContext = (): Promise<Context> => createContext({ req: { headers: new Map() } });

/** A DID-authenticated caller with a valid challenge and full scope (a console session). */
export const userCaller = async (did: string): Promise<Caller> =>
    appRouter.createCaller({
        ...(await baseContext()),
        user: { did, isChallengeValid: true, scope: AUTH_GRANT_FULL_ACCESS_SCOPE },
    });

/** An unauthenticated caller (open routes: token exchange). */
export const openCaller = async (): Promise<Caller> => appRouter.createCaller(await baseContext());

/**
 * A partner caller, as the demo LMS calls brain: the bearer token is verified while the
 * Context is built, so a bad token throws here rather than from the procedure.
 */
export const partnerCaller = async (token: string): Promise<Caller> =>
    appRouter.createCaller(
        await createContext({
            req: { headers: new Map([['authorization', `Bearer ${token}`]]) },
        })
    );

export const brainDomain = async (): Promise<string> => (await baseContext()).domain;

/** DID of a fixed-seed wallet (did:key, as LearnCard registers it). */
export const walletDid = async (role: WalletRole): Promise<string> =>
    (await getLearnCard(WALLET_SEEDS[role])).id.did();

export const walletProfileId = (role: WalletRole): string => SCENARIO_PROFILE_IDS[role];

/** The wallet's seed, for the in-process LearnCard that decrypts, verifies and signs as it. */
export const walletSeed = (role: WalletRole): string => WALLET_SEEDS[role];

/**
 * A long-lived health endpoint built on the shared `withHealthServer` helper: the server
 * stays up until `stop()`, so its URL can be pinned in the signed manifest (F2) and probed
 * on demand (S07).
 */
export type HealthEndpoint = {
    endpoint: string;
    control: HealthServerControl;
    stop: () => Promise<void>;
};

export const startHealthEndpoint = async (): Promise<HealthEndpoint> => {
    let release: () => void = () => undefined;
    const released = new Promise<void>(resolve => {
        release = resolve;
    });
    let ready: (value: { endpoint: string; control: HealthServerControl }) => void = () =>
        undefined;
    const started = new Promise<{ endpoint: string; control: HealthServerControl }>(resolve => {
        ready = resolve;
    });
    const serving = withHealthServer(async (endpoint, control) => {
        ready({ endpoint, control });
        await released;
    });
    // A listen failure rejects `serving` before `started` resolves.
    const { endpoint, control } = await Promise.race([
        started,
        serving.then(() => {
            throw new Error('health server stopped before it started');
        }),
    ]);
    let stopped = false;

    return {
        endpoint,
        control,
        stop: async () => {
            if (stopped) return;
            stopped = true;
            release();
            await serving;
        },
    };
};

const ensureProfile = async (profileId: string, did: string, displayName: string) => {
    if (await getProfileByProfileId(profileId)) return;
    await createProfile({ profileId, did, displayName } as Parameters<typeof createProfile>[0]);
};

/** F1 (DIRECT): root ecosystem owned by the operator, with an explicit OWNER membership. */
export const arrangeFoundation = async (runId: string): Promise<FoundationView> => {
    await ensureProfile(OPERATOR.profileId, OPERATOR.did, 'Scenario Operator');
    const root = await createEcosystem({
        name: 'Scenario State',
        slug: `scenario-state-${runId}`,
        ownerProfileId: OPERATOR.profileId,
        parentEcosystemId: null,
        description: undefined,
        settings: {},
        status: 'ACTIVE',
    });
    // Ownership alone is not a membership; seed-education-os grants OWNER explicitly too.
    await grantEcosystemMembership({
        profileId: OPERATOR.profileId,
        ecosystemId: root.id,
        role: 'OWNER',
    });

    // Read the role back the way the console does, rather than trusting the write.
    const operator = await userCaller(OPERATOR.did);
    const memberships = await operator.ecosystem.listMyMemberships();
    const role = memberships.find(membership => membership.ecosystemId === root.id)?.role;
    if (!role) throw new Error(`operator has no membership in ${root.id}`);

    return { rootEcosystemId: root.id, operatorProfileId: OPERATOR.profileId, operatorRole: role };
};

/**
 * F2 (DIRECT): the Demo LMS listing with a manifest signed by the publisher seed, its
 * health endpoint pinned to the in-process health server. Checked with the same guard the
 * planner runs.
 */
export const arrangeListing = async (healthEndpoint: string): Promise<ListingView> => {
    const publisherSeed = SCENARIO_SEEDS.publisher;
    const publisherDid = (await getLearnCard(publisherSeed)).id.did();
    const origin = healthEndpoint.replace(/\/health$/, '');

    const listing = await createAppStoreListing({
        slug: DEMO_LMS_LISTING_SLUG,
        kind: 'INTEGRATION',
        display_name: DEMO_LMS_APP_NAME,
        tagline: 'Dev lms integration',
        full_description: `Scenario Demo LMS published by ${publisherDid}`,
        icon_url: 'https://placehold.co/250x250/teal/white?text=Integration',
        app_listing_status: 'LISTED',
        launch_type: 'SERVER_HEADLESS',
        launch_config_json: JSON.stringify({ connectUrl: `${origin}/connect` }),
        category: 'Integrations',
        promotion_level: 'STANDARD',
    });
    const manifest = await signManifestWithDidKey<IntegrationManifest>(
        buildDemoLmsManifest({ publisherDid, origin }),
        publisherSeed
    );
    const created = await createListingVersion(listing.listing_id, {
        version: manifest.version,
        status: 'LISTED',
        manifest_json: JSON.stringify(manifest),
    });

    const stored = await readAppStoreListingById(listing.listing_id);
    const version = await readListingVersionById(created.version_id);
    if (!stored || !version) throw new Error('Demo LMS listing or version could not be read back');
    await assertSignedListingVersionOrThrow(stored.kind, version);

    return {
        listingId: listing.listing_id,
        versionId: created.version_id,
        slug: stored.slug ?? DEMO_LMS_LISTING_SLUG,
        healthUrl: manifest.endpoints.healthUrl ?? healthEndpoint,
    };
};

/**
 * S08 (DIRECT, labelled): the district's data-sharing agreement as a real ConsentFlow
 * contract, governed with a record-provisioning grant and accepted by the operator, exactly
 * as seed-demo-lms does it. Operator ConsentFlowTerms are a raw MERGE there too; governance
 * acceptance is never learner consent.
 */
export const arrangeGovernance = async (input: {
    ecosystemId: string;
    ownerProfileId: string;
    domain: string;
}): Promise<GovernanceView> => {
    const { ecosystemId, ownerProfileId, domain } = input;
    const created = await createConsentFlowContract({
        contract: ConsentFlowContractValidator.parse({
            read: { anonymize: false },
            write: { credentials: { categories: { Achievement: { required: true } } } },
        }),
        ownerProfileId,
        name: 'Scenario District data sharing',
        subtitle: 'Course completions from Demo LMS',
        description:
            'Demo LMS shares course completions, which the district issues as credentials.',
        reasonForAccessing: 'To issue your course completions as credentials you own.',
    });
    const contractId = created.id;
    await governConsentContract({
        ecosystemId,
        contractId,
        actorProfileId: ownerProfileId,
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
                    purpose: 'SCENARIO: course completions for credential issuance.',
                },
            ],
        },
    });
    const now = new Date().toISOString();
    const termsId = `${contractId}-operator-terms-${randomUUID()}`;
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $ownerProfileId}), (c:ConsentFlowContract {id: $contractId})
         MERGE (t:ConsentFlowTerms {id: $termsId})
         ON CREATE SET t.status = 'live', t.createdAt = $now, t.updatedAt = $now, t.mutationVersion = 1
         MERGE (p)-[:CREATED_BY]->(t) MERGE (t)-[:CONSENTS_TO]->(c)`,
        { ownerProfileId, contractId, termsId, now }
    );
    const revision = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $contractId})
         RETURN c.educationOsGrantRevision AS revision, c.educationOsGrantHash AS hash`,
        { contractId }
    );
    const row = revision.records[0];
    if (!row) throw new Error(`governed contract ${contractId} could not be read back`);
    await acceptGovernanceConsentContract(
        {
            ecosystemId,
            contractId,
            termsId,
            contractRevision: String(row.get('revision')),
            grantHash: String(row.get('hash')),
        },
        ownerProfileId
    );

    return { contractId, contractUri: constructUri('contract', contractId, domain) };
};
