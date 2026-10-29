/**
 * In-process driver for ScenarioPort: every CONSOLE, BRAIN, PARTNER and WALLET operation is
 * the brain tRPC procedure the live stack would reach, called through
 * `appRouter.createCaller` against the fresh test database. Credentials are signed by the
 * test signer (NODE_ENV=test), so credential checks are labelled MOCK-SIGNER.
 *
 * Runs only under vitest (`bun run test:scenario`, or `bun run scenario:in-process` from the
 * repo root); it refuses any other NODE_ENV so it can never write to a developer database.
 */
import {
    ConsentDecisionRecordValidator,
    ConsentFlowTermsValidator,
    JWEValidator,
    VCValidator,
} from '@learncard/types';
import { ServiceAccount, type StoredServiceAccount } from '@models';
import { CLAIM_WORKFLOW_ID } from '@helpers/claim-offer.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { signDidAuth } from '../../../test/helpers/did-auth';
import { probeServiceAccountHealthNow } from '../../../src/dev/service-account-health-probe';
import { metadataFor } from '../../../test/helpers/record-binding';
import { attempt, ScenarioError } from '../../core/expect';
import { registerSecret } from '../../core/report';
import type { ScenarioWallet, WalletRole } from '../../core/ids';
import type {
    AuditEventView,
    BindingView,
    ClaimedCredentialView,
    ConsentDecisionView,
    InstallIntentView,
    ScenarioPort,
    ScenarioPortFactoryOptions,
    ServiceAccountView,
    SubmitView,
} from '../../port';
import {
    OPERATOR,
    arrangeFoundation,
    arrangeGovernance,
    arrangeListing,
    brainDomain,
    openCaller,
    partnerCaller,
    startHealthEndpoint,
    userCaller,
    walletDid,
    walletProfileId,
    walletSeed,
    type Caller,
} from './arrange';

type IntentRecord = Awaited<ReturnType<Caller['installIntent']['planInstallIntent']>>;
type BindingRecord = Awaited<ReturnType<Caller['installIntent']['proposeBinding']>>;

const SLICE_2 = (operation: string): ScenarioError =>
    new ScenarioError({
        code: 'NOT_IMPLEMENTED',
        message: `${operation} is part of slice 2 and not implemented by the in-process driver yet.`,
    });

const toIntentView = (record: IntentRecord): InstallIntentView => ({
    intentId: record.intentId,
    approvalState: record.approval.state,
    planHash: record.plan.planHash,
    planRevision: record.plan.planRevision,
    consentTiers: [...record.plan.consentTiers],
    statusRevision: record.statusRevision,
    phase: record.status?.phase,
});

const toBindingView = (record: BindingRecord): BindingView => ({
    bindingId: record.bindingId,
    status: record.status,
    revision: record.revision,
});

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

type SeedWallet = Awaited<ReturnType<typeof getLearnCard>>;

/** Reads a credential the way a wallet does: issuer, subject, and whether its proof verifies. */
const describeCredential = async (
    wallet: SeedWallet,
    raw: unknown
): Promise<ClaimedCredentialView> => {
    const vc = VCValidator.parse(raw);
    const issuer = typeof vc.issuer === 'string' ? vc.issuer : (vc.issuer.id ?? '');
    const subject = Array.isArray(vc.credentialSubject)
        ? vc.credentialSubject[0]
        : vc.credentialSubject;
    const verification = await wallet.invoke.verifyCredential(vc, {}, true);
    return {
        id: vc.id,
        issuer,
        subjectDid: typeof subject?.id === 'string' ? subject.id : undefined,
        verified: !verification.some(item => item.status === 'Failed'),
    };
};

/** Accepts the raw exchange URL or the LearnCard /request?vc_request_url= wrapper. */
const offerIdFrom = (link: string): string => {
    const exchangeUrl = new URL(link).searchParams.get('vc_request_url') ?? link;
    const offerId = new URL(exchangeUrl).pathname.split('/').pop();
    if (!offerId) {
        throw new ScenarioError({ code: 'BAD_OFFER', message: `no offer id in ${exchangeUrl}` });
    }
    return offerId;
};

/** The fields the Binding's issuance template maps (record-binding metadataFor). */
const completionFields = (completionId: string, courseId: string): Record<string, string> => ({
    completionId,
    courseId,
    courseTitle: 'Intro to Credentials',
    completedAt: new Date().toISOString().slice(0, 10),
});

export const createInProcessPort = async (
    options: ScenarioPortFactoryOptions
): Promise<ScenarioPort> => {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error(
            'The in-process scenario driver runs only under vitest against a fresh test database: ' +
                '`bun run scenario:in-process` from the repo root, or `bun run test:scenario` in ' +
                'brain-service (NODE_ENV is ' +
                `${process.env.NODE_ENV ?? 'unset'}).`
        );
    }

    const health = await startHealthEndpoint();
    const domain = await brainDomain();
    const operator = await userCaller(OPERATOR.did);
    const open = await openCaller();
    const wallets = new Map<WalletRole, ScenarioWallet>();
    /** The partner's credential and token, per ServiceAccount. Never returned. */
    const secrets = new Map<string, string>();
    const tokens = new Map<string, string>();

    const walletCaller = (wallet: ScenarioWallet): Promise<Caller> => userCaller(wallet.did);
    /** The wallet's own LearnCard (same seed, same did:key): decrypts, verifies, signs VPs. */
    const learnCardOf = (wallet: ScenarioWallet): Promise<SeedWallet> =>
        getLearnCard(walletSeed(wallet.role));

    const exchange = async (serviceAccountId: string) => {
        const secret = secrets.get(serviceAccountId);
        if (!secret) {
            throw new ScenarioError({
                code: 'NO_CREDENTIAL',
                message: `no credential has been issued to the partner for ${serviceAccountId}`,
            });
        }
        const result = await open.installIntent.exchangeServiceAccountToken({
            serviceAccountId,
            secret,
        });
        registerSecret(result.token);
        tokens.set(serviceAccountId, result.token);
        return result;
    };

    let closed = false;

    const port: ScenarioPort = {
        driver: 'in-process',
        mockSigner: true,

        ensureFoundation: () => arrangeFoundation(options.runId),
        ensureListing: () => arrangeListing(health.endpoint),
        ensureWallet: async role => {
            const known = wallets.get(role);
            if (known) return known;
            const did = await walletDid(role);
            const profileId = walletProfileId(role);
            const caller = await userCaller(did);
            // The route a wallet registers with (prove-demo-learner --register).
            const existing = await caller.profile.getProfile();
            if (!existing) {
                await caller.profile.createProfile({
                    profileId,
                    displayName: `Scenario ${role}`,
                    shortBio: 'EducationOS scenario wallet (dev fixture)',
                    bio: '',
                });
            }
            const wallet: ScenarioWallet = {
                role,
                profileId: existing?.profileId ?? profileId,
                did,
            };
            wallets.set(role, wallet);
            return wallet;
        },

        // The in-process root is a per-run fixture, so curating it is harmless.
        enableListing: async ({ ecosystemId, listingId }) => {
            const state = await operator.ecosystem.enableListing({ id: ecosystemId, listingId });
            return {
                ecosystemId: state.ecosystemId,
                allowedListings: state.allowedListings,
                unrestricted: state.unrestricted,
                written: true,
            };
        },
        catalogPolicy: async ecosystemId => {
            const state = await operator.ecosystem.getCatalogPolicy({ id: ecosystemId });
            return {
                ecosystemId: state.ecosystemId,
                allowedListings: state.allowedListings,
                unrestricted: state.unrestricted,
            };
        },
        visibleListings: async ecosystemId =>
            (
                await operator.installIntent.listInstallableCatalogListings({
                    ecosystemId,
                    limit: 100,
                })
            ).map(listing => ({ listingId: listing.listing_id, slug: listing.slug ?? undefined })),
        createDistrict: async ({ parentEcosystemId, name, slug, reuseId }) => {
            if (reuseId) return { ecosystemId: reuseId };
            const created = await operator.ecosystem.createEcosystem({
                parentEcosystemId,
                name,
                slug,
            });
            return { ecosystemId: created.id };
        },
        grantMember: async ({ ecosystemId, profileId, role }) => {
            await operator.ecosystem.grantMembership({ id: ecosystemId, profileId, role });
        },
        listMembers: async ecosystemId =>
            (await operator.ecosystem.listMembers({ id: ecosystemId })).map(member => ({
                profileId: member.profileId,
                role: member.role,
            })),
        provisionIssuer: async ({ ecosystemId, name }) => {
            const identity = await operator.ecosystem.provisionIssuingIdentity({
                id: ecosystemId,
                name,
            });
            return {
                did: identity.did,
                groupId: identity.groupId,
                profileId: identity.profileId,
                signingReady: identity.signingReady,
            };
        },

        plan: async ({ ecosystemId, listingId, versionId }) =>
            toIntentView(
                await operator.installIntent.planInstallIntent({
                    ecosystemId,
                    listingId,
                    versionId,
                    requestedConfig: {},
                    proposedBindings: [],
                })
            ),
        approve: async intent =>
            toIntentView(
                await operator.installIntent.approveInstallIntent({
                    intentId: intent.intentId,
                    planHash: intent.planHash,
                    planRevision: intent.planRevision,
                    consentTiers: intent.consentTiers,
                })
            ),
        apply: async intent =>
            toIntentView(
                await operator.installIntent.applyInstallIntent({
                    intentId: intent.intentId,
                    expectedStatusRevision: intent.statusRevision,
                })
            ),
        findInstallTarget: async ({ ecosystemId, intentId }) => {
            const targets = await operator.installIntent.listInstallTargets({ ecosystemId });
            const install = targets.find(
                target =>
                    target.targetType === 'INTEGRATION_INSTALL' && target.intentId === intentId
            );
            return install ? { installId: install.id } : null;
        },
        readServiceAccount: async input => {
            const account =
                'serviceAccountId' in input
                    ? await ServiceAccount.findOne({
                          where: { id: input.serviceAccountId },
                          plain: true,
                      })
                    : await ServiceAccount.findOne({
                          where: { installId: input.installId },
                          plain: true,
                      });
            return account ? toAccountView(account) : null;
        },
        removeInstall: async ({ intentId }) => {
            const intent = await operator.installIntent.getInstallIntent({ intentId });
            if (!intent) {
                throw new ScenarioError({
                    code: 'NOT_FOUND',
                    message: `no install intent ${intentId}`,
                });
            }
            return toIntentView(
                await operator.installIntent.revokeInstallIntent({
                    intentId,
                    expectedStatusRevision: intent.statusRevision,
                    phase: 'REMOVED',
                })
            );
        },

        issueCredential: async ({ serviceAccountId }) => {
            const issued = await operator.installIntent.issueServiceAccountCredential({
                serviceAccountId,
            });
            registerSecret(issued.secret);
            secrets.set(serviceAccountId, issued.secret);
            // A new credential invalidates any token the partner held.
            tokens.delete(serviceAccountId);
            return { expiresAt: issued.expiresAt };
        },
        exchangeToken: ({ serviceAccountId }) =>
            attempt(async () => ({ expiresIn: (await exchange(serviceAccountId)).expiresIn })),
        probeHealth: target => probeServiceAccountHealthNow(target),
        setPartnerHealthy: async healthy => {
            health.control.healthy = healthy;
        },

        governAndAccept: ({ ecosystemId }) =>
            arrangeGovernance({ ecosystemId, ownerProfileId: OPERATOR.profileId, domain }),
        proposeBinding: async ({ ecosystemId, installId, issuer, delivery }) => {
            const metadata = metadataFor(issuer);
            // Push is the default; prove-demo-lms only declares delivery for offers.
            const capabilityMetadata =
                delivery === 'offer' && metadata.issuance
                    ? { ...metadata, issuance: { ...metadata.issuance, delivery } }
                    : metadata;
            return toBindingView(
                await operator.installIntent.proposeBinding({
                    ecosystemId,
                    capability: 'record-provisioning',
                    provider: {
                        resourceType: 'INTEGRATION_INSTALL',
                        resourceId: installId,
                        ecosystemId,
                    },
                    consumer: { resourceType: 'ECOSYSTEM', resourceId: ecosystemId, ecosystemId },
                    capabilityMetadata,
                })
            );
        },
        preflight: async ({ bindingId }) => {
            const preflight = await operator.installIntent.prepareBindingConsentPreflight({
                bindingId,
            });
            return {
                preflightId: preflight.preflightId,
                hash: preflight.hash,
                bindingRevision: preflight.bindingRevision,
                satisfied: preflight.satisfied,
                missing: preflight.missing.map(item => ({
                    code: item.code,
                    message: item.message,
                })),
            };
        },
        approveBinding: async input =>
            toBindingView(await operator.installIntent.approveBinding(input)),
        revokeBinding: async input =>
            toBindingView(await operator.installIntent.revokeBinding(input)),

        consent: async ({ wallet, contractUri, via }) => {
            if (via === 'exchange') throw SLICE_2('consent via exchange');
            const caller = await walletCaller(wallet);
            // Grant exactly the categories the contract requires, as the app's consent screen does.
            const details = await caller.contracts.getConsentFlowContract({ uri: contractUri });
            const categories = details.contract.write?.credentials?.categories ?? {};
            const terms = ConsentFlowTermsValidator.parse({
                read: { credentials: { categories: {} } },
                write: {
                    credentials: {
                        categories: Object.fromEntries(
                            Object.entries(categories)
                                .filter(([, category]) => category.required)
                                .map(([name]) => [name, true])
                        ),
                    },
                },
            });
            const { termsUri } = await caller.contracts.consentToContract({
                contractUri,
                terms,
                audienceVersion: details.audienceVersion,
            });
            return { termsUri };
        },
        withdraw: async ({ wallet, termsUri }) => {
            await (await walletCaller(wallet)).contracts.withdrawConsent({ uri: termsUri });
        },
        incomingCredentials: async wallet => {
            const incoming = await (
                await walletCaller(wallet)
            ).credential.incomingCredentials({ limit: 50 });
            return [...incoming]
                .sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent))
                .map(entry => {
                    const recordId = entry.metadata?.educationOsRecordId;
                    return {
                        uri: entry.uri,
                        from: entry.from,
                        recordId: typeof recordId === 'string' ? recordId : undefined,
                    };
                });
        },
        acceptCredential: async ({ wallet, uri }) => {
            await (await walletCaller(wallet)).credential.acceptCredential({ uri });
            // The stored credential is a JWE encrypted to the learner; only their key opens it.
            const stored = await open.storage.resolve({ uri });
            const learnCard = await learnCardOf(wallet);
            const jwe = JWEValidator.safeParse(stored);
            if (jwe.success && !jwe.data.recipients?.length) {
                // The test signer encrypts to the learner's and owner's did:web, which do not
                // resolve without a running brain, so the JWE carries no recipient at all.
                return {
                    issuer: '',
                    verified: false,
                    unreadable:
                        'the test signer stored a JWE with no recipients (its did:web recipients ' +
                        'do not resolve in-process), so no wallet can decrypt it',
                };
            }
            const raw = jwe.success ? await learnCard.invoke.decryptDagJwe(jwe.data) : stored;
            return describeCredential(learnCard, raw);
        },
        claimOffer: ({ wallet, offerUri }) =>
            attempt(async () => {
                const offerId = offerIdFrom(offerUri);
                // The VC-API exchange as a wallet drives it: unauthenticated until the VP.
                const participate = (await openCaller()).workflows.participateInExchange;
                const request = await participate({
                    localWorkflowId: CLAIM_WORKFLOW_ID,
                    localExchangeId: offerId,
                });
                const challenge = request.verifiablePresentationRequest?.challenge;
                if (!challenge) {
                    throw new ScenarioError({
                        code: 'NO_CHALLENGE',
                        message: 'claim offer returned no DID-auth challenge',
                    });
                }
                const learnCard = await learnCardOf(wallet);
                const response = await participate({
                    localWorkflowId: CLAIM_WORKFLOW_ID,
                    localExchangeId: offerId,
                    verifiablePresentation: await signDidAuth(
                        learnCard,
                        challenge,
                        request.verifiablePresentationRequest?.domain ?? domain
                    ),
                });
                const vcs = response.verifiablePresentation?.verifiableCredential;
                const vc = Array.isArray(vcs) ? vcs[0] : vcs;
                if (!vc) {
                    throw new ScenarioError({
                        code: 'NO_CREDENTIAL',
                        message: 'claim response carried no credential',
                    });
                }
                return describeCredential(learnCard, vc);
            }),

        submit: ({ subject, completionId, courseId }) =>
            attempt(async (): Promise<SubmitView> => {
                // The partner is the one ServiceAccount the driver issued a credential to.
                const [serviceAccountId] = [...secrets.keys()];
                if (!serviceAccountId) {
                    throw new ScenarioError({
                        code: 'NO_CREDENTIAL',
                        message: 'the partner holds no credential (S06 did not run)',
                    });
                }
                const token =
                    tokens.get(serviceAccountId) ?? (await exchange(serviceAccountId)).token;
                try {
                    const result = await (
                        await partnerCaller(token)
                    ).integrationService.submitRecord({
                        subjectProfileId: subject.profileId,
                        fields: completionFields(completionId, courseId),
                    });
                    return {
                        recordId: result.recordId,
                        status: result.status,
                        issuance: result.issuance,
                    };
                } catch (error) {
                    // Like the demo LMS: a refused token is dropped, the next submit re-exchanges.
                    if (
                        error instanceof Error &&
                        'code' in error &&
                        error.code === 'UNAUTHORIZED'
                    ) {
                        tokens.delete(serviceAccountId);
                    }
                    throw error;
                }
            }),

        auditEvents: async ({ ecosystemId, limit }) =>
            (
                await operator.installIntent.listEcosystemAuditEvents({
                    ecosystemId,
                    limit: limit ?? 200,
                })
            ).map((event): AuditEventView => ({
                action: event.action,
                timestamp: event.timestamp,
                ecosystemId: event.ecosystemId,
                intentId: event.intentId,
                bindingId: event.bindingId,
                afterSummary: event.afterSummary,
            })),
        consentDecisions: async ({ bindingId }) =>
            (await operator.installIntent.getBindingConsentDecisionRecords({ bindingId })).map(
                (raw): ConsentDecisionView => {
                    const record = ConsentDecisionRecordValidator.parse(raw);
                    return {
                        occurredAt: record.occurredAt,
                        subjectProfileId: record.subjectProfileId,
                        bindingId: record.bindingId,
                        decision: record.decision,
                        reasonCodes: record.reasonCodes,
                    };
                }
            ),

        close: async () => {
            if (closed) return;
            closed = true;
            await health.stop();
        },
    };

    return port;
};
