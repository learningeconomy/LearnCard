/**
 * The domain operations the MVP walkthrough needs, independent of transport. The live
 * driver implements them over the console BFF, brain HTTP, a spawned demo LMS and direct
 * access-layer calls; the in-process driver over `appRouter.createCaller` and a fresh
 * test database. Steps (mvp-walkthrough.ts) only ever see this interface.
 *
 * Conventions:
 * - Operations throw on failure; drivers throw `ScenarioError` (core/expect.ts) where they
 *   can, and core normalises anything else.
 * - Operations a step expects to be refused return `Outcome<T>` instead of throwing.
 * - Secrets (service-account secrets, tokens, cookies) stay inside the driver; nothing in
 *   these return types is a secret.
 */
import type { Outcome } from './core/expect';
import type { ScenarioIssuer, ScenarioWallet, WalletRole } from './core/ids';

export type DriverName = 'live' | 'in-process';

export type FoundationView = {
    rootEcosystemId: string;
    operatorProfileId: string;
    operatorRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

export type ListingView = {
    listingId: string;
    versionId: string;
    slug: string;
    /** Pinned in the signed manifest; the partner's health endpoint must answer here. */
    healthUrl: string;
};

export type CatalogListingView = { listingId: string; slug?: string };

/** ADR-010 catalog policy at one ecosystem; `allowedListings: null` is permissive. */
export type CatalogPolicyView = {
    ecosystemId: string;
    allowedListings: string[] | null;
    unrestricted: boolean;
};

export type EnableListingView = CatalogPolicyView & {
    /**
     * False when the driver deliberately left an unrestricted shared root alone (live
     * eco_dev_root): the first enablement would curate it to this one listing.
     */
    written: boolean;
};

export type MemberView = { profileId: string; role: string };

export type IssuingIdentityView = ScenarioIssuer & { signingReady: boolean };

export type InstallIntentView = {
    intentId: string;
    /** e.g. PENDING_ADOPTION, APPROVED. */
    approvalState: string;
    planHash: string;
    planRevision: number;
    consentTiers: string[];
    statusRevision: number;
    /** Reconciler phase (READY, DEGRADED, ...), when the intent has a status. */
    phase?: string;
};

export type ServiceAccountView = {
    id: string;
    installId: string;
    ecosystemId: string;
    status: 'PROVISIONED' | 'ENABLED' | 'DISABLED' | 'REVOKED';
    enableCause?: string;
    disabledCause?: string;
    healthFailures?: number;
    credentialGeneration: number;
};

/** Mirrors src/dev/service-account-health-probe.ts `HealthProbeResult`. */
export type HealthProbeView = {
    serviceAccountId: string;
    intentId: string;
    status: ServiceAccountView['status'];
    enableCause?: string;
    disabledCause?: string;
    healthFailures: number;
    credentialGeneration: number;
    /** Set when a guard stopped the probe from running; names the guard. */
    blockedBy?: string;
    blockedDetail?: string;
};

export type GovernanceView = { contractId: string; contractUri: string };

export type BindingView = {
    bindingId: string;
    status: string;
    revision: number;
};

export type PreflightView = {
    preflightId: string;
    hash: string;
    bindingRevision: number;
    satisfied: boolean;
    missing: { code: string; message: string }[];
};

export type Delivery = 'push' | 'offer';

export type ConsentView = { termsUri: string };

export type SubmitView = {
    recordId: string;
    status: 'ACCEPTED' | 'DUPLICATE';
    issuance?:
        | { status: 'ISSUED'; credentialUri: string }
        | { status: 'OFFERED'; offerUri: string }
        | { status: 'ISSUE_FAILED' }
        | { status: 'PENDING' };
    /** Offer link exactly as the partner shows it (live: from the demo LMS JSON response). */
    offerUrl?: string;
};

export type SubmitInput = {
    subject: ScenarioWallet;
    completionId: string;
    courseId: string;
};

export type IncomingCredentialView = { uri: string; recordId?: string; from?: string };

export type ClaimedCredentialView = {
    issuer: string;
    subjectDid?: string;
    /** Whether the wallet verified the credential's proof. */
    verified: boolean;
};

export type AuditEventView = {
    action: string;
    timestamp: string;
    ecosystemId: string;
    intentId?: string;
    bindingId?: string;
    afterSummary?: Record<string, unknown>;
};

export type ConsentDecisionView = {
    occurredAt: string;
    subjectProfileId: string;
    bindingId?: string;
    decision: 'ALLOW' | 'DENY';
    reasonCodes: string[];
};

export interface ScenarioPort {
    readonly driver: DriverName;
    /** In-process signs with the test signer; credential checks are labelled MOCK-SIGNER. */
    readonly mockSigner: boolean;

    // ── Fixtures (DIRECT) ────────────────────────────────────────────────────────────
    /** F1: root ecosystem with the console operator as OWNER. */
    ensureFoundation(): Promise<FoundationView>;
    /** F2: signed Demo LMS listing; passes `assertSignedListingVersionOrThrow`. */
    ensureListing(): Promise<ListingView>;
    /** Registers (or finds) the fixed-seed wallet's profile. */
    ensureWallet(role: WalletRole): Promise<ScenarioWallet>;

    // ── Catalog and district (CONSOLE) ───────────────────────────────────────────────
    enableListing(input: { ecosystemId: string; listingId: string }): Promise<EnableListingView>;
    catalogPolicy(ecosystemId: string): Promise<CatalogPolicyView>;
    visibleListings(ecosystemId: string): Promise<CatalogListingView[]>;
    /** Creates `slug` under the parent, or returns `reuseId` when given (live `--district`). */
    createDistrict(input: {
        parentEcosystemId: string;
        name: string;
        slug: string;
        reuseId?: string;
    }): Promise<{ ecosystemId: string }>;
    grantMember(input: {
        ecosystemId: string;
        profileId: string;
        role: 'ADMIN' | 'MEMBER' | 'VIEWER';
    }): Promise<void>;
    listMembers(ecosystemId: string): Promise<MemberView[]>;
    provisionIssuer(input: { ecosystemId: string; name: string }): Promise<IssuingIdentityView>;

    // ── Install (CONSOLE) ────────────────────────────────────────────────────────────
    plan(input: {
        ecosystemId: string;
        listingId: string;
        versionId: string;
    }): Promise<InstallIntentView>;
    approve(intent: InstallIntentView): Promise<InstallIntentView>;
    apply(intent: InstallIntentView): Promise<InstallIntentView>;
    findInstallTarget(input: {
        ecosystemId: string;
        intentId: string;
    }): Promise<{ installId: string } | null>;
    readServiceAccount(
        input: { serviceAccountId: string } | { installId: string }
    ): Promise<ServiceAccountView | null>;

    // ── Partner credential and health (BRAIN) ────────────────────────────────────────
    /**
     * Issues a credential and hands it to the partner (live: (re)spawns the demo LMS with
     * the secret in its env). The secret never leaves the driver.
     */
    issueCredential(input: {
        serviceAccountId: string;
        ecosystemId: string;
        installId: string;
    }): Promise<{ expiresAt: string }>;
    /** Exchanges the partner's current secret for a bearer token. */
    exchangeToken(input: { serviceAccountId: string }): Promise<Outcome<{ expiresIn?: number }>>;
    /** On-demand health probe (src/dev/service-account-health-probe.ts), no route. */
    probeHealth(
        input: { serviceAccountId: string } | { intentId: string }
    ): Promise<HealthProbeView>;

    // ── Governance and binding ───────────────────────────────────────────────────────
    /** DIRECT: governConsentContract + operator terms + acceptGovernanceConsentContract. */
    governAndAccept(input: { ecosystemId: string }): Promise<GovernanceView>;
    proposeBinding(input: {
        ecosystemId: string;
        installId: string;
        issuer: ScenarioIssuer;
        delivery: Delivery;
    }): Promise<BindingView>;
    preflight(input: { bindingId: string }): Promise<PreflightView>;
    approveBinding(input: {
        bindingId: string;
        expectedRevision: number;
        preflightId: string;
        preflightHash: string;
    }): Promise<BindingView>;
    revokeBinding(input: { bindingId: string; expectedRevision: number }): Promise<BindingView>;

    // ── Learner (WALLET) ─────────────────────────────────────────────────────────────
    consent(input: {
        wallet: ScenarioWallet;
        contractUri: string;
        via?: 'contract' | 'exchange';
    }): Promise<ConsentView>;
    withdraw(input: { wallet: ScenarioWallet; termsUri: string }): Promise<void>;
    incomingCredentials(wallet: ScenarioWallet): Promise<IncomingCredentialView[]>;
    acceptCredential(input: {
        wallet: ScenarioWallet;
        uri: string;
    }): Promise<ClaimedCredentialView>;
    claimOffer(input: {
        wallet: ScenarioWallet;
        offerUri: string;
    }): Promise<Outcome<ClaimedCredentialView>>;

    // ── Partner (PARTNER) ────────────────────────────────────────────────────────────
    submit(input: SubmitInput): Promise<Outcome<SubmitView>>;

    // ── Evidence ─────────────────────────────────────────────────────────────────────
    auditEvents(input: { ecosystemId: string; limit?: number }): Promise<AuditEventView[]>;
    consentDecisions(input: { bindingId: string }): Promise<ConsentDecisionView[]>;

    /** Stops spawned processes and closes connections. Safe to call twice. */
    close(): Promise<void>;
}

export type ScenarioPortFactoryOptions = {
    runId: string;
    keepLms: boolean;
};

/** What scenario/drivers/{live,in-process}/port.ts export. */
export type ScenarioPortFactory = (options: ScenarioPortFactoryOptions) => Promise<ScenarioPort>;
