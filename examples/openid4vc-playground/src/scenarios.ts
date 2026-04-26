/**
 * Single source of truth for the scenarios surfaced in the playground UI.
 *
 * Each scenario is a UI-side description \u2014 metadata only. The actual
 * server logic that mints offers / creates verify sessions lives in
 * `server/api.ts` keyed by `<providerId>:<scenarioId>`. Adding a new
 * scenario is a two-step process: (1) define it here, (2) implement
 * it server-side. Keeping the two halves separate lets us mark a
 * scenario as "designed but not yet implemented for this provider"
 * without breaking the catalogue.
 */

export type ProviderId = 'waltid' | 'sphereon';

export type ScenarioKind = 'vci' | 'vp';

export interface Scenario {
    id: string;
    kind: ScenarioKind;
    name: string;
    description: string;
    /**
     * What the scenario is meant to exercise in the wallet UI \u2014 keeps
     * each card scoped to a single behavior so the dev can pattern-match
     * on regression cause when something breaks.
     */
    exercises: string;
    /** Providers that have a server-side implementation. */
    supportedProviders: ProviderId[];
    /**
     * Optional supplemental info the LaunchPanel surfaces to the dev
     * after they click \u201cLaunch\u201d (e.g. \u201cuse PIN: 1234\u201d).
     */
    note?: string;
}

export const SCENARIOS: Scenario[] = [
    /* ----------------------------- VCI scenarios ---------------------------- */

    {
        id: 'vci-pre-auth-no-pin',
        kind: 'vci',
        name: 'Pre-auth offer (no PIN)',
        description:
            'The simplest issuance path: a pre-authorized credential offer with no transaction code.',
        exercises:
            'Offer parser + token exchange + credential issuance happy path.',
        supportedProviders: ['waltid'],
    },
    {
        id: 'vci-pre-auth-pin',
        kind: 'vci',
        name: 'Pre-auth offer with PIN',
        description:
            'Offer that requires the holder to type a transaction code before redeeming.',
        exercises:
            'PIN modal flow + tx_code passthrough on the token exchange.',
        supportedProviders: ['waltid'],
        note: 'Wallet will prompt for PIN. Use **1234**.',
    },
    {
        id: 'vci-auth-code',
        kind: 'vci',
        name: 'Authorization code flow',
        description:
            'OAuth-style flow: wallet opens an authorize URL, gets a code, exchanges it for the credential.',
        exercises:
            'PKCE + authorize redirect + token exchange (Slice 4 of the VCI plugin).',
        supportedProviders: ['waltid'],
    },
    {
        id: 'vci-sdjwt',
        kind: 'vci',
        name: 'SD-JWT VC issuance',
        description:
            'Issuer mints an IETF SD-JWT VC instead of a W3C JSON-LD credential. Wallet receives a tilde-delimited (`<jwt>~<disclosure>~...`) string.',
        exercises:
            'Plugin\u2019s SD-JWT decode path + selective-disclosure storage (different code branch from `jwt_vc_json`).',
        supportedProviders: ['waltid'],
    },
    {
        id: 'vci-batch',
        kind: 'vci',
        name: 'Batch issuance (2 credentials)',
        description:
            'Single offer carries multiple credential_configuration_ids. Wallet runs one credential request per id and stores all results.',
        exercises:
            'Multi-credential offer loop + per-id POP JWT generation + batched storage indexing.',
        supportedProviders: ['waltid'],
    },

    /* ----------------------------- VP scenarios ----------------------------- */

    {
        id: 'vp-pex-single',
        kind: 'vp',
        name: 'PEX, single descriptor',
        description:
            'Verifier asks for one credential type via DIF Presentation Exchange.',
        exercises:
            'PEX matcher + consent screen happy path with a single row.',
        supportedProviders: ['waltid'],
    },
    {
        id: 'vp-pex-multi-candidate',
        kind: 'vp',
        name: 'PEX, multi-candidate (picker)',
        description:
            'Verifier asks for a credential the holder has multiple of \u2014 the consent screen shows a picker.',
        exercises:
            'Per-row candidate picker + selected-index threading through buildChosenList.',
        supportedProviders: ['waltid'],
        note: 'Issue at least 2 UniversityDegree VCs first via the VCI scenarios.',
    },
    {
        id: 'vp-pex-claims',
        kind: 'vp',
        name: 'PEX with claims constraint',
        description:
            'Verifier sends a custom presentation_definition that requires a specific JSON-path inside the credential to exist (`degree.name`).',
        exercises:
            'Wallet\u2019s PEX field-matching path \u2014 different from the type-only PEX scenarios.',
        supportedProviders: ['waltid'],
        note: 'Issue a UniversityDegree VC first via the VCI scenarios.',
    },
    {
        id: 'vp-jarm',
        kind: 'vp',
        name: 'JARM (encrypted response)',
        description:
            'Verifier requests `response_mode=direct_post.jwt` \u2014 wallet encrypts the response object to the verifier\u2019s key.',
        exercises:
            'JARM badge on consent screen + encrypted response transport.',
        supportedProviders: ['waltid'],
    },

    /* ------------------- Designed-but-blocked-on-vendor-support ------------- */
    /*                                                                         */
    /* These scenarios have wallet-side code paths worth exercising, but no    */
    /* current playground vendor exposes them on the wire. Listed here so the  */
    /* matrix gap is visible \u2014 the moment EUDI (or another vendor) is added,  */
    /* flip `supportedProviders` to enable them in the UI.                     */

    {
        id: 'vp-dcql',
        kind: 'vp',
        name: 'DCQL query',
        description:
            'Verifier sends a `dcql_query` instead of `presentation_definition`. Tests the wallet\u2019s DCQL routing layer (Slice 6).',
        exercises:
            'DCQL parser + multi-credential matching + per-query VP signing.',
        supportedProviders: [],
        note: 'walt.id\u2019s verifier-api silently ignores `dcql_query` and falls back to PEX. Awaiting EUDI integration.',
    },
    {
        id: 'vp-siop-idtoken',
        kind: 'vp',
        name: 'SIOPv2 id_token only',
        description:
            'Verifier requests `response_type=id_token` \u2014 wallet proves DID control without sharing any VCs.',
        exercises:
            'Plugin\u2019s SIOPv2 sign path (Slice 8) standalone.',
        supportedProviders: [],
        note: 'walt.id\u2019s verifier-api always emits `response_type=vp_token` and requires `request_credentials`. Awaiting EUDI integration.',
    },
];

/* -------------------------------------------------------------------------- */
/*                            provider metadata                                */
/* -------------------------------------------------------------------------- */

export interface ProviderInfo {
    id: ProviderId;
    name: string;
    /** Short one-liner shown in the picker. */
    blurb: string;
    /** Whether this provider has any scenarios in v1. */
    enabled: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
    {
        id: 'waltid',
        name: 'walt.id',
        blurb: 'Local Docker stack from tests/openid4vc-interop-e2e/compose.yaml',
        enabled: true,
    },
    {
        id: 'sphereon',
        name: 'Sphereon',
        blurb: 'Reserved \u2014 implement scenarios under "sphereon:..." in server/api.ts',
        enabled: false,
    },
];

export const filterScenarios = (kind: ScenarioKind, providerId: ProviderId): Scenario[] =>
    SCENARIOS.filter(
        s => s.kind === kind && s.supportedProviders.includes(providerId)
    );
