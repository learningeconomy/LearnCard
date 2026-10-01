import type {
    BundleManifest,
    CatalogReadinessGate,
    IntegrationManifest,
    WalletManifest,
} from '@learncard/types';

// Source: educationos/docs/partners/dcc-pilot-scope.md (2026-08-05 public evidence).
// These are catalog candidates, not evidence that any pilot gate has been cleared.
export const DCC_READINESS: CatalogReadinessGate[] = [
    {
        name: 'Named DCC counterpart',
        status: 'OPEN',
        note: 'No named public support owner or commercial counterparty found; a human must confirm product, operations and legal ownership.',
    },
    {
        name: 'License verification',
        status: 'Passable',
        note: 'MIT surfaced for the pilot repositories; verify every license once the package BOM is frozen.',
    },
    {
        name: 'Release / pinning',
        status: 'OPEN',
        note: 'LCW changelog 2.2.10 and Docker tags are public evidence, not immutable package pins. LEF must record exact pins.',
    },
    {
        name: 'Support boundary (009-D5)',
        status: 'OPEN',
        note: 'Patch owner, pager owner, SLO, backups, upgrades and retirement owner are not named. Catalog publication supplies none of these commitments.',
    },
    {
        name: 'Protocol conformance',
        status: 'Passable',
        note: 'Scope claims to documented VC-API/exchange, CHAPI, Interaction URL, deep link, Bitstring Status List and OIDF-style anchors. OID4VCI is not evidenced.',
    },
    {
        name: 'Wallet sanctioning',
        status: 'OPEN',
        note: 'Signed LCW catalog candidate only; sanctioned-wallet review remains pending. Preserve learner choice, verify claim endpoints and the pinned build; LCW moved to openwallet-foundation-labs.',
    },
    {
        name: 'Registry subscription clarity',
        status: 'Passable',
        note: 'DCC Member/Test Member OIDF and legacy Sandbox/Community/Member subset selected as advisory only. Exact OIDF/community URLs, refresh policy and authority review remain unverified; .invalid URLs are placeholders.',
    },
    {
        name: 'Status-service production lane',
        status: 'Passable',
        note: 'Phase E W1 must use status-service-db; the Git variant is experimental. No status service is deployed in Phase C.',
    },
    {
        name: 'Admin/UI necessity',
        status: 'Keep optional',
        note: 'Keep the dashboard optional in W1 core; direct exchange can use workflow-coordinator. No console surface is declared here.',
    },
    {
        name: 'Security/privacy review',
        status: 'OPEN',
        note: 'Secrets, DID custody, logs and subject-data boundaries require review. No public review package found; this bundle grants no partner authority or subject-data release.',
    },
];

export const DCC_REGISTRIES: IntegrationManifest['subscribes'] = [
    {
        declarationId: 'dcc-member-oidf',
        registryId: 'dcc-member-oidf',
        displayName: 'DCC Member Registry OIDF',
        registryUrl: 'https://dcc-catalog-placeholder.invalid/member-oidf',
        description:
            'Advisory OIDF trust-anchor candidate. PLACEHOLDER URL: exact anchor unverified; never auto-trusted.',
    },
    {
        declarationId: 'dcc-test-member-oidf',
        registryId: 'dcc-test-member-oidf',
        displayName: 'Test DCC Member Registry OIDF',
        registryUrl: 'https://dcc-catalog-placeholder.invalid/test-member-oidf',
        description:
            'Advisory, test-only OIDF candidate. PLACEHOLDER URL: exact anchor unverified; never auto-trusted.',
    },
    {
        declarationId: 'dcc-sandbox-legacy',
        registryId: 'dcc-sandbox-legacy',
        displayName: 'DCC Sandbox Registry (legacy)',
        registryUrl: 'https://digitalcredentials.github.io/sandbox-registry/registry.json',
        description:
            'Advisory, test-only legacy JSON. Not a signed manifest; public guidance points production verification to Credential Engine.',
    },
    {
        declarationId: 'dcc-community-legacy',
        registryId: 'dcc-community-legacy',
        displayName: 'DCC Community Registry (legacy)',
        registryUrl: 'https://dcc-catalog-placeholder.invalid/community-registry/registry.json',
        description:
            'Advisory backwards-compatibility candidate. PLACEHOLDER URL: exact artifact unverified. Not a signed manifest.',
    },
    {
        declarationId: 'dcc-member-legacy',
        registryId: 'dcc-member-legacy',
        displayName: 'DCC Member Registry (legacy)',
        registryUrl: 'https://digitalcredentials.github.io/issuer-registry/registry.json',
        description:
            'Advisory legacy issuer/member JSON; upstream issuer-registry is archived. Not a signed manifest or production trust authority.',
    },
];

export const lcwManifest = (publisherDid: string): Omit<WalletManifest, 'signature'> => ({
    apiVersion: 'lc.wallet/v1',
    id: 'org.dcc.lcw',
    version: '1.0.0',
    listingKind: 'WALLET',
    walletName: 'Learner Credential Wallet (LCW)',
    publisherDid,
    provides: ['wallet-claim'],
    platforms: ['ios', 'android'],
    claimProtocols: ['vc-api', 'chapi', 'deep-link'],
    supportsApps: false,
    endpoints: {
        // PLACEHOLDER: public evidence does not establish a production claim endpoint.
        claimUrl: 'https://lcw-catalog-placeholder.invalid/claim',
        inviteUrl: 'https://github.com/openwallet-foundation-labs/learner-credential-wallet',
        // No known wallet health URL: omit rather than manufacture a health claim.
    },
});

export const dccRegistryManifest = (
    publisherDid: string
): Omit<IntegrationManifest, 'signature'> => ({
    apiVersion: 'lc.integration/v1.3',
    id: 'org.dcc.registry-adapter',
    version: '1.0.0',
    listingKind: 'INTEGRATION',
    publisherDid,
    category: 'registry-adapter',
    scopes: [],
    consentRequirements: [],
    capabilities: { provided: ['registry-adapter'], consumed: [] },
    supportedRecordClasses: [],
    extensionPoints: [],
    consoleSurfaces: [],
    endpoints: {},
    subscribes: DCC_REGISTRIES,
});

export const dccBundleManifest = (
    publisherDid: string,
    contains: BundleManifest['contains']
): Omit<BundleManifest, 'signature'> => ({
    apiVersion: 'lc.bundle/v1',
    id: 'org.dcc.tools',
    version: '1.0.0',
    publisherDid,
    contains,
    preflight: [],
    readiness: DCC_READINESS,
    defaultBindings: [
        {
            capability: 'wallet-claim',
            providerDeclarationId: '$ecosystem',
            consumerDeclarationId: 'lcw',
            reason: 'Propose learner-choice LCW claim routing; sanctioning and endpoint review remain OPEN. No issuance or data release is authorized.',
        },
        {
            capability: 'registry-adapter',
            providerDeclarationId: 'dcc-registry-adapter',
            consumerDeclarationId: '$ecosystem',
            reason: 'Propose advisory DCC registry reference data only; registry membership never grants authority or automatic trust.',
        },
    ],
});
