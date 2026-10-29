/**
 * Live driver for ScenarioPort, against the running dev stack:
 * - CONSOLE steps go through the console BFF (via :5173) as the dev operator;
 * - partner steps go through the runner's own demo LMS (spawned on DEMO_LMS_PORT, default
 *   4322) and brain's open token-exchange route;
 * - WALLET steps use fixed-seed LearnCard wallets on brain's network tRPC;
 * - DIRECT steps (fixtures, credential issuance, governance, the dev health probe) call
 *   the access layer in this process (direct.ts).
 */
import { z } from 'zod';
import { InstallIntentRecordValidator } from '../../../src/types/install-intent';
import { applyLiveRedisDefaults, scenarioOrigins } from '../../env';
import { attempt, ScenarioError } from '../../core/expect';
import { ROOT_ECOSYSTEM_ID } from '../../core/ids';
import type {
    AuditEventView,
    BindingView,
    CatalogPolicyView,
    ConsentDecisionView,
    InstallIntentView,
    MemberView,
    ScenarioPort,
    ScenarioPortFactoryOptions,
} from '../../port';
import { BrainClient } from './brain-client';
import { ConsoleClient } from './bff-client';
import { DemoLmsProcess } from './demo-lms';
import { WalletPool } from './wallet';

type Direct = typeof import('./direct');

const toIntentView = (raw: unknown): InstallIntentView => {
    const intent = InstallIntentRecordValidator.parse(raw);
    return {
        intentId: intent.intentId,
        approvalState: intent.approval.state,
        planHash: intent.plan.planHash,
        planRevision: intent.plan.planRevision,
        consentTiers: intent.plan.consentTiers,
        statusRevision: intent.statusRevision,
        phase: intent.status?.phase,
    };
};

const BindingValidator = z
    .object({ bindingId: z.string(), status: z.string(), revision: z.number() })
    .passthrough();

const toBindingView = (raw: unknown): BindingView => {
    const binding = BindingValidator.parse(raw);
    return { bindingId: binding.bindingId, status: binding.status, revision: binding.revision };
};

const PreflightValidator = z
    .object({
        preflightId: z.string(),
        hash: z.string(),
        bindingRevision: z.number(),
        satisfied: z.boolean(),
        missing: z.array(z.object({ code: z.string(), message: z.string() })),
    })
    .passthrough();

const ListingsPageValidator = z.object({
    hasMore: z.boolean().optional(),
    cursor: z.string().nullish(),
    records: z.array(
        z.object({ listing_id: z.string(), slug: z.string().nullish() }).passthrough()
    ),
});

const CatalogPolicyValidator = z.object({
    ecosystemId: z.string(),
    allowedListings: z.array(z.string()).nullable(),
    unrestricted: z.boolean(),
});

const AuditEventValidator = z
    .object({
        action: z.string(),
        timestamp: z.string(),
        ecosystemId: z.string(),
        intentId: z.string().optional(),
        bindingId: z.string().optional(),
        afterSummary: z.record(z.string(), z.unknown()).optional(),
    })
    .passthrough();

const ConsentDecisionValidator = z
    .object({
        occurredAt: z.string(),
        subjectProfileId: z.string(),
        bindingId: z.string().optional(),
        decision: z.enum(['ALLOW', 'DENY']),
        reasonCodes: z.array(z.string()),
    })
    .passthrough();

const InstallTargetValidator = z
    .object({ id: z.string(), targetType: z.string(), intentId: z.string().optional() })
    .passthrough();

/** Every DIRECT call shares the runner's neo4j connection, opened on first use. */
const createDirectLoader = (): { load: () => Promise<Direct>; loaded: () => boolean } => {
    let loaded: Promise<Direct> | undefined;
    const load = (): Promise<Direct> => {
        loaded ??= import('./direct');
        return loaded;
    };
    return { load, loaded: () => loaded !== undefined };
};

export const createLivePort = async (
    options: ScenarioPortFactoryOptions
): Promise<ScenarioPort> => {
    applyLiveRedisDefaults();
    const origins = scenarioOrigins();
    const domain = process.env.DOMAIN_NAME ?? 'localhost%3A4000';
    const bff = new ConsoleClient(origins.console);
    const brain = new BrainClient(origins.brain);
    const wallets = new WalletPool(`${origins.brain}/trpc`);
    const lms = new DemoLmsProcess(options.keepLms);
    const directLoader = createDirectLoader();
    const direct = directLoader.load;

    /** The partner's current secret; only the driver and the spawned LMS hold it. */
    let partnerSecret: { serviceAccountId: string; secret: string } | undefined;
    let operatorProfileId: string | undefined;
    let closed = false;

    const consoleSession = async (): Promise<ConsoleClient> => {
        if (!bff.loggedIn) await bff.login();
        return bff;
    };

    const operator = async (): Promise<string> => {
        if (!operatorProfileId) {
            const session = z
                .object({ profileId: z.string() })
                .passthrough()
                .parse(await (await consoleSession()).query('session.get'));
            operatorProfileId = session.profileId;
        }
        return operatorProfileId;
    };

    const listMembers = async (ecosystemId: string): Promise<MemberView[]> => {
        const detail = z
            .object({
                members: z.array(
                    z.object({ profileId: z.string(), role: z.string() }).passthrough()
                ),
            })
            .passthrough()
            .parse(await (await consoleSession()).query('ecosystem.get', { id: ecosystemId }));
        return detail.members.map(member => ({ profileId: member.profileId, role: member.role }));
    };

    const catalogPolicy = async (ecosystemId: string): Promise<CatalogPolicyView> =>
        CatalogPolicyValidator.parse(
            await (await consoleSession()).query('catalog.enablement.get', { ecosystemId })
        );

    return {
        driver: 'live',
        mockSigner: false,

        ensureFoundation: async () =>
            (await direct()).ensureFoundation({
                rootEcosystemId: ROOT_ECOSYSTEM_ID,
                operatorProfileId: await operator(),
            }),

        ensureListing: async () => {
            const module = await direct();
            return module.ensureListing(
                module.listingTargetFor({
                    origin: origins.demoLms,
                    port: origins.demoLmsPort,
                    ownerProfileId: await operator(),
                })
            );
        },

        ensureWallet: role => wallets.ensure(role),

        catalogPolicy,

        enableListing: async ({ ecosystemId, listingId }) => {
            const before = await catalogPolicy(ecosystemId);
            // ADR-010 §3.2: the first explicit enablement turns a permissive catalog into an
            // allowlist of just this listing. On the shared eco_dev_root that would hide
            // every other listing for the developer, so (like seed-demo-lms) only append to
            // a root that is already curated.
            if (ecosystemId === ROOT_ECOSYSTEM_ID && before.unrestricted) {
                return { ...before, written: false };
            }
            const after = CatalogPolicyValidator.parse(
                await (
                    await consoleSession()
                ).mutate('catalog.enablement.enable', { ecosystemId, listingId })
            );
            return { ...after, written: true };
        },

        visibleListings: async ecosystemId => {
            const client = await consoleSession();
            const found: { listingId: string; slug?: string }[] = [];
            let cursor: string | undefined;
            for (let page = 0; page < 20; page++) {
                const result = ListingsPageValidator.parse(
                    await client.query('catalog.listingsForEcosystem', {
                        ecosystemId,
                        limit: 100,
                        ...(cursor ? { cursor } : {}),
                    })
                );
                found.push(
                    ...result.records.map(record => ({
                        listingId: record.listing_id,
                        slug: record.slug ?? undefined,
                    }))
                );
                if (!result.hasMore || !result.cursor) break;
                cursor = result.cursor;
            }
            return found;
        },

        createDistrict: async ({ parentEcosystemId, name, slug, reuseId }) => {
            if (reuseId) return { ecosystemId: reuseId };
            const created = z
                .object({ id: z.string() })
                .passthrough()
                .parse(
                    await (
                        await consoleSession()
                    ).mutate('ecosystem.create', { parentEcosystemId, name, slug })
                );
            return { ecosystemId: created.id };
        },

        grantMember: async ({ ecosystemId, profileId, role }) => {
            await (
                await consoleSession()
            ).mutate('ecosystem.grantMembership', { id: ecosystemId, profileId, role });
        },

        listMembers,

        provisionIssuer: async ({ ecosystemId, name }) => {
            const identity = z
                .object({
                    groupId: z.string(),
                    profileId: z.string(),
                    did: z.string(),
                    signingReady: z.boolean(),
                })
                .passthrough()
                .parse(
                    await (
                        await consoleSession()
                    ).mutate('ecosystem.provisionIssuingIdentity', { id: ecosystemId, name })
                );
            return {
                did: identity.did,
                groupId: identity.groupId,
                profileId: identity.profileId,
                signingReady: identity.signingReady,
            };
        },

        plan: async ({ ecosystemId, listingId, versionId }) =>
            toIntentView(
                await (
                    await consoleSession()
                ).mutate('installIntents.planInstallIntent', {
                    ecosystemId,
                    listingId,
                    versionId,
                    requestedConfig: {},
                    proposedBindings: [],
                })
            ),

        approve: async intent =>
            toIntentView(
                await (
                    await consoleSession()
                ).mutate('installIntents.approveInstallIntent', {
                    intentId: intent.intentId,
                    planHash: intent.planHash,
                    planRevision: intent.planRevision,
                    consentTiers: intent.consentTiers,
                })
            ),

        apply: async intent =>
            toIntentView(
                await (
                    await consoleSession()
                ).mutate('installIntents.applyInstallIntent', {
                    intentId: intent.intentId,
                    expectedStatusRevision: intent.statusRevision,
                })
            ),

        findInstallTarget: async ({ ecosystemId, intentId }) => {
            const targets = z
                .array(InstallTargetValidator)
                .parse(
                    await (await consoleSession()).query('installTargets.list', { ecosystemId })
                );
            const target = targets.find(
                candidate =>
                    candidate.targetType === 'INTEGRATION_INSTALL' &&
                    candidate.intentId === intentId
            );
            return target ? { installId: target.id } : null;
        },

        readServiceAccount: async input => (await direct()).readAccount(input),

        issueCredential: async ({ serviceAccountId, ecosystemId, installId }) => {
            const issued = await (
                await direct()
            ).issueCredential(serviceAccountId, await operator());
            partnerSecret = { serviceAccountId, secret: issued.secret };
            // The partner gets the secret in its environment, never on disk.
            await lms.start({
                port: origins.demoLmsPort,
                origin: origins.demoLms,
                brainOrigin: origins.brain,
                serviceAccountId,
                secret: issued.secret,
                installId,
                ecosystemId,
                platformJwk: await brain.platformJwk(),
            });
            return { expiresAt: issued.expiresAt };
        },

        exchangeToken: ({ serviceAccountId }) =>
            attempt(async () => {
                if (partnerSecret?.serviceAccountId !== serviceAccountId) {
                    throw new ScenarioError({
                        code: 'NO_SECRET',
                        message: `the runner holds no secret for ${serviceAccountId} (S06 issues one)`,
                    });
                }
                const { expiresIn } = await brain.exchangeToken(
                    serviceAccountId,
                    partnerSecret.secret
                );
                return { expiresIn };
            }),

        probeHealth: async input => (await direct()).probeHealth(input),

        healthFlipUnsupported:
            'the live demo LMS has no unhealthy switch; stopping it would also break the ' +
            'partner for later steps (N5 runs in-process)',

        setPartnerHealthy: async () => {
            throw new ScenarioError({
                code: 'NOT_SUPPORTED',
                message: 'the live driver cannot flip the demo LMS health endpoint',
            });
        },

        governAndAccept: async ({ ecosystemId }) =>
            (await direct()).governAndAccept({
                ecosystemId,
                actorProfileId: await operator(),
                domain,
            }),

        proposeBinding: async ({ ecosystemId, installId, issuer, delivery }) => {
            const { metadataFor } = await direct();
            const base = metadataFor(issuer);
            const metadata =
                delivery === 'offer' && base.issuance
                    ? { ...base, issuance: { ...base.issuance, delivery } }
                    : base;
            return toBindingView(
                await (
                    await consoleSession()
                ).mutate('bindings.propose', {
                    ecosystemId,
                    capability: 'record-provisioning',
                    provider: {
                        resourceType: 'INTEGRATION_INSTALL',
                        resourceId: installId,
                        ecosystemId,
                    },
                    consumer: { resourceType: 'ECOSYSTEM', resourceId: ecosystemId, ecosystemId },
                    capabilityMetadata: metadata,
                })
            );
        },

        preflight: async ({ bindingId }) => {
            const preflight = PreflightValidator.parse(
                await (
                    await consoleSession()
                ).mutate('bindings.prepareConsentPreflight', { bindingId })
            );
            return {
                preflightId: preflight.preflightId,
                hash: preflight.hash,
                bindingRevision: preflight.bindingRevision,
                satisfied: preflight.satisfied,
                missing: preflight.missing,
            };
        },

        approveBinding: async input =>
            toBindingView(await (await consoleSession()).mutate('bindings.approve', input)),

        revokeBinding: async input =>
            toBindingView(await (await consoleSession()).mutate('bindings.revoke', input)),

        consent: async ({ wallet, contractUri, via }) => {
            if (via === 'exchange') {
                throw new ScenarioError({
                    code: 'NOT_SUPPORTED',
                    message:
                        'live consent via exchange needs the hosted consent page link (slice 2)',
                });
            }
            return { termsUri: await wallets.consent(wallet.role, contractUri) };
        },

        withdraw: ({ wallet, termsUri }) => wallets.withdraw(wallet.role, termsUri),

        incomingCredentials: wallet => wallets.incoming(wallet.role),

        acceptCredential: ({ wallet, uri }) => wallets.accept(wallet.role, uri),

        claimOffer: ({ wallet, offerUri }) =>
            attempt(() => wallets.claimOffer(wallet.role, offerUri)),

        submit: ({ subject, completionId, courseId }) =>
            attempt(async () => {
                const outcome = await lms.submit(origins.demoLms, {
                    learner: subject.profileId,
                    courseId,
                    completionId,
                });
                if (!outcome.ok) {
                    // Brain's {code, message}, passed through unchanged by the demo LMS.
                    throw new ScenarioError({
                        code: outcome.code,
                        message: outcome.message,
                        path: 'integrationService.submitRecord',
                    });
                }
                return outcome.result;
            }),

        auditEvents: async ({ ecosystemId, limit }) => {
            const events = z
                .array(AuditEventValidator)
                .parse(
                    await (
                        await consoleSession()
                    ).query('activity.list', { ecosystemId, limit: limit ?? 200 })
                );
            return events.map((event): AuditEventView => ({
                action: event.action,
                timestamp: event.timestamp,
                ecosystemId: event.ecosystemId,
                intentId: event.intentId,
                bindingId: event.bindingId,
                afterSummary: event.afterSummary,
            }));
        },

        consentDecisions: async ({ bindingId }) => {
            const records = z
                .array(ConsentDecisionValidator)
                .parse(
                    await (await consoleSession()).query('bindings.consentRecords', { bindingId })
                );
            return records.map((record): ConsentDecisionView => ({
                occurredAt: record.occurredAt,
                subjectProfileId: record.subjectProfileId,
                bindingId: record.bindingId,
                decision: record.decision,
                reasonCodes: record.reasonCodes,
            }));
        },

        close: async () => {
            if (closed) return;
            closed = true;
            if (options.keepLms && lms.running) {
                const pid = lms.detach();
                process.stdout.write(
                    `demo LMS left running on ${origins.demoLms} (pid ${pid ?? '?'}, --keep-lms)\n`
                );
            } else {
                await lms.stop();
            }
            if (directLoader.loaded()) {
                await (await direct()).closeDirect().catch(() => undefined);
            }
        },
    };
};
