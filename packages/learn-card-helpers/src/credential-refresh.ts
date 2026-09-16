import {
    ManagedCredentialRefreshServiceValidator,
    SupportedCredentialRefreshServiceValidator,
    type ManagedCredentialRefreshService,
    type SupportedCredentialRefreshService,
} from '@learncard/types';

/**
 * Canonical helpers for credential refresh (LC-2117, LC-2135, LC-2136).
 *
 * These helpers are storage-independent: they select a supported refresh service,
 * normalize issuer/effective-time identity, and provide deterministic canonicalization
 * plus a proof-insensitive content comparison used by both the holder SDK and the
 * brain-service publication pipeline.
 */

type RefreshableCredential = Record<string, unknown> & {
    refreshService?: unknown;
    issuer?: string | { id?: unknown } | null;
    validFrom?: unknown;
    issuanceDate?: unknown;
    proof?: unknown;
};

/**
 * Selects the first supported refresh service from a credential's `refreshService`.
 *
 * Accepts a single service object or an array. An array is treated as ordered: the
 * first entry whose type is supported is selected. Supported types are
 * `1EdTechCredentialRefresh` and `LearnCardCredentialRefresh2026`.
 *
 * @returns the supported service, or `undefined` when none is present/supported
 */
export const getSupportedRefreshService = (
    vc: RefreshableCredential
): SupportedCredentialRefreshService | undefined => {
    const refreshService = vc?.refreshService;

    if (!refreshService) return undefined;

    const services = Array.isArray(refreshService) ? refreshService : [refreshService];

    for (const service of services) {
        const parsed = SupportedCredentialRefreshServiceValidator.safeParse(service);

        if (parsed.success) return parsed.data;
    }

    return undefined;
};

/**
 * Normalizes a credential's issuer to its identifier.
 *
 * Handles both the string form (`issuer: 'did:example:x'`) and the object form
 * (`issuer: { id: 'did:example:x', ... }`).
 */
export const getCredentialIssuerId = (vc: RefreshableCredential): string | undefined => {
    const issuer = vc?.issuer;

    if (!issuer) return undefined;
    if (typeof issuer === 'string') return issuer;

    return typeof issuer.id === 'string' ? issuer.id : undefined;
};

/**
 * Returns the credential's effective timestamp in milliseconds since the epoch.
 *
 * Prefers VCDM 2.0 `validFrom` and falls back to VCDM 1.1 `issuanceDate`. Returns
 * `undefined` when no parseable timestamp exists.
 */
export const getCredentialEffectiveTime = (vc: RefreshableCredential): number | undefined => {
    const raw = vc?.validFrom ?? vc?.issuanceDate;

    if (typeof raw !== 'string' || raw.length === 0) return undefined;

    const parsed = Date.parse(raw);

    return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Deterministically canonicalizes a JSON-like value: object keys are recursively
 * sorted, array order is preserved, and primitives pass through unchanged.
 */
export const canonicalizeCredentialContent = <T>(value: T): T => {
    if (Array.isArray(value)) {
        return value.map(entry => canonicalizeCredentialContent(entry)) as T;
    }

    if (value !== null && typeof value === 'object') {
        const source = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};

        for (const key of Object.keys(source).sort()) {
            sorted[key] = canonicalizeCredentialContent(source[key]);
        }

        return sorted as T;
    }

    return value;
};

/** Serializes a value to a deterministic canonical JSON string */
export const canonicalizeCredentialJson = (value: unknown): string =>
    JSON.stringify(canonicalizeCredentialContent(value));

// --- Managed refresh JSON-LD context preparation (LC-2198) --------------------

/** Term used by the LearnCard-managed refresh service type. */
const MANAGED_REFRESH_TYPE_TERM = 'LearnCardCredentialRefresh2026';

/** Term for the LearnCard DID-auth extension inside a managed refresh service. */
const MANAGED_REFRESH_DID_AUTH_TERM = 'LearnCardDIDAuth';

/** IRI the managed refresh service type term must resolve to. */
export const MANAGED_REFRESH_TYPE_IRI =
    'https://learncard.com/refresh#LearnCardCredentialRefresh2026';

/** OBv3-namespaced IRI for the authorization term of a managed refresh service. */
export const MANAGED_REFRESH_AUTHORIZATION_IRI =
    'https://purl.imsglobal.org/spec/ob/v3p0#authorization';

/** IRI for the LearnCard DID-auth scheme of a managed refresh service. */
export const MANAGED_REFRESH_DID_AUTH_IRI =
    'https://docs.learncard.com/definitions#LearnCardDIDAuth';

/**
 * Inline JSON-LD context fragment required to sign credentials carrying a
 * LearnCard-managed `LearnCardCredentialRefresh2026` refresh service.
 *
 * Neither VCDM 1.1 (which defines only `ManualRefreshService2018`), VCDM 2.0, nor the
 * live OBv3/CLR contexts define the term `LearnCardCredentialRefresh2026` (nor the
 * LearnCard `authorization` / `LearnCardDIDAuth` extension terms), so DIDKit's
 * data-loss detection refuses to sign unless issuers define these terms inline.
 */
export const MANAGED_REFRESH_SERVICE_CONTEXT = {
    [MANAGED_REFRESH_TYPE_TERM]: MANAGED_REFRESH_TYPE_IRI,
    authorization: {
        '@id': MANAGED_REFRESH_AUTHORIZATION_IRI,
        '@context': { [MANAGED_REFRESH_DID_AUTH_TERM]: MANAGED_REFRESH_DID_AUTH_IRI },
    },
} as const;

type ContextObject = Record<string, unknown>;

type CredentialWithOptionalRefreshService = {
    refreshService?: unknown;
};

const isPlainObject = (value: unknown): value is ContextObject =>
    !!value && typeof value === 'object' && !Array.isArray(value);

/** `"iri"` and `{ "@id": "iri" }` are the same JSON-LD term definition. */
const toIdForm = (definition: unknown): unknown =>
    typeof definition === 'string' ? { '@id': definition } : definition;

/** Extracts the `@id` of a term definition, accounting for the string shorthand. */
const definitionId = (definition: unknown): unknown => {
    const idForm = toIdForm(definition);

    return isPlainObject(idForm) ? idForm['@id'] : undefined;
};

/**
 * Effective (last-wins) definition of a term across the credential's inline context
 * objects. Only top-level context objects participate: nested `@context` blocks scope
 * to their term's value and cannot redefine unrelated terms.
 */
const findTopLevelDefinition = (contextObjects: ContextObject[], term: string): unknown => {
    let found: unknown;

    for (const contextObject of contextObjects) {
        if (term in contextObject) found = contextObject[term];
    }

    return found;
};

/** Ensures an existing term definition resolves to the expected IRI, or throws. */
const assertDefinitionMatchesIri = (term: string, definition: unknown, expectedIri: string) => {
    const actualIri = definitionId(definition);

    if (actualIri !== expectedIri) {
        throw new Error(
            `Conflicting JSON-LD definition for term "${term}": expected "${expectedIri}" but the credential already defines it as ${JSON.stringify(
                definition
            )}. Remove or correct the existing definition before signing.`
        );
    }
};

/**
 * Returns the LearnCard-managed refresh services carried by a credential.
 *
 * Accepts a single service object or an array; standard 1EdTech services and unknown
 * entries are ignored.
 */
export const getManagedRefreshServices = (
    vc: CredentialWithOptionalRefreshService
): ManagedCredentialRefreshService[] => {
    const refreshService = vc?.refreshService;

    if (!refreshService) return [];

    const services = Array.isArray(refreshService) ? refreshService : [refreshService];

    return services.flatMap(service => {
        const parsed = ManagedCredentialRefreshServiceValidator.safeParse(service);

        return parsed.success ? [parsed.data] : [];
    });
};

/**
 * Ensures a credential carrying a LearnCard-managed refresh service also carries the
 * inline JSON-LD context needed to sign it.
 *
 * - Credentials without a managed service are returned **by reference**, untouched.
 * - The input is never mutated; a shallow-extended copy is returned when a fragment
 *   must be appended.
 * - Equivalent existing definitions are idempotent (no duplicate fragment).
 * - Incomplete mappings are completed with only the missing terms.
 * - Conflicting definitions (same term, different IRI) throw a clear error instead of
 *   silently signing an unexpected expansion.
 */
export const prepareManagedRefreshContext = <T>(credential: T): T => {
    const source = credential as unknown as CredentialWithOptionalRefreshService;

    if (getManagedRefreshServices(source).length === 0) return credential;

    const existingContext = (credential as unknown as ContextObject)['@context'];
    const contextList: unknown[] =
        existingContext === undefined || existingContext === null
            ? []
            : Array.isArray(existingContext)
              ? [...existingContext]
              : [existingContext];
    const inlineObjects = contextList.filter(isPlainObject);

    const fragment: Record<string, unknown> = {};

    // Managed refresh service type term
    const typeDefinition = findTopLevelDefinition(inlineObjects, MANAGED_REFRESH_TYPE_TERM);

    if (typeDefinition === undefined) {
        fragment[MANAGED_REFRESH_TYPE_TERM] = MANAGED_REFRESH_TYPE_IRI;
    } else {
        assertDefinitionMatchesIri(
            MANAGED_REFRESH_TYPE_TERM,
            typeDefinition,
            MANAGED_REFRESH_TYPE_IRI
        );
    }

    // Authorization term (scopes the DID-auth term inside managed refresh services)
    const authorizationDefinition = findTopLevelDefinition(inlineObjects, 'authorization');
    let didAuthCovered = false;

    if (authorizationDefinition === undefined) {
        // Full definition, including the nested LearnCardDIDAuth scope.
        fragment['authorization'] = MANAGED_REFRESH_SERVICE_CONTEXT.authorization;
        didAuthCovered = true;
    } else {
        assertDefinitionMatchesIri(
            'authorization',
            authorizationDefinition,
            MANAGED_REFRESH_AUTHORIZATION_IRI
        );

        if (
            isPlainObject(authorizationDefinition) &&
            isPlainObject(authorizationDefinition['@context'])
        ) {
            const scopedContext = authorizationDefinition['@context'];

            if (MANAGED_REFRESH_DID_AUTH_TERM in scopedContext) {
                assertDefinitionMatchesIri(
                    MANAGED_REFRESH_DID_AUTH_TERM,
                    scopedContext[MANAGED_REFRESH_DID_AUTH_TERM],
                    MANAGED_REFRESH_DID_AUTH_IRI
                );
                didAuthCovered = true;
            }
        }
    }

    // LearnCardDIDAuth term (top-level fallback when not covered by authorization's scope)
    if (!didAuthCovered) {
        const didAuthDefinition = findTopLevelDefinition(
            inlineObjects,
            MANAGED_REFRESH_DID_AUTH_TERM
        );

        if (didAuthDefinition === undefined) {
            fragment[MANAGED_REFRESH_DID_AUTH_TERM] = MANAGED_REFRESH_DID_AUTH_IRI;
        } else {
            assertDefinitionMatchesIri(
                MANAGED_REFRESH_DID_AUTH_TERM,
                didAuthDefinition,
                MANAGED_REFRESH_DID_AUTH_IRI
            );
        }
    }

    if (Object.keys(fragment).length === 0) return credential;

    return {
        ...credential,
        '@context': [...contextList, fragment],
    } as T;
};

/**
 * Injects an allocated managed refresh service into an unsigned credential so the
 * service becomes part of the signed payload.
 *
 * The managed service is made primary: any existing refresh services (for example a
 * standard `1EdTechCredentialRefresh` service) are kept unchanged after it. Injecting
 * a second, different managed service is rejected. The required inline context is
 * prepared via {@link prepareManagedRefreshContext}.
 */
export const injectManagedRefreshService = <T>(
    credential: T,
    refreshService: ManagedCredentialRefreshService
): T => {
    const service = ManagedCredentialRefreshServiceValidator.parse(refreshService);
    const source = credential as unknown as ContextObject;

    const existing = source['refreshService'];
    const existingServices: unknown[] =
        existing === undefined || existing === null
            ? []
            : Array.isArray(existing)
              ? [...existing]
              : [existing];

    const existingManaged = getManagedRefreshServices({ refreshService: existingServices });

    if (existingManaged.some(entry => entry.id !== service.id)) {
        throw new Error(
            'Credential already carries a different managed refresh service; a credential can only reference one managed refresh service.'
        );
    }

    const nonManagedEntries = existingServices.filter(
        entry => !existingManaged.includes(entry as ManagedCredentialRefreshService)
    );

    const mergedRefreshService: unknown =
        existingServices.length === 0
            ? service
            : !Array.isArray(existing) && existingManaged.length > 0
              ? // Re-injecting the same managed service: keep object form (idempotent)
                service
              : [service, ...nonManagedEntries];

    return prepareManagedRefreshContext({
        ...credential,
        refreshService: mergedRefreshService,
    } as T);
};

/**
 * Proof-insensitive content comparison for refresh changed-content detection.
 *
 * Only the top-level `proof` property is excluded; everything else (subject claims,
 * identifiers, timestamps, services) participates in the comparison.
 */
export const credentialContentsEqual = (
    first: RefreshableCredential,
    second: RefreshableCredential
): boolean => {
    const stripProof = (vc: RefreshableCredential) => {
        const { proof: _proof, ...rest } = vc ?? {};

        return rest;
    };

    return (
        canonicalizeCredentialJson(stripProof(first)) ===
        canonicalizeCredentialJson(stripProof(second))
    );
};
