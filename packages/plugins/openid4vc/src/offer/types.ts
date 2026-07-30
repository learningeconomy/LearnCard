/**
 * Domain types for OpenID4VCI Credential Offers.
 *
 * Normalized to OID4VCI Draft 13. Draft 11 offers (still widely deployed)
 * are accepted at parse time and normalized to the Draft 13 shape, so the
 * rest of the wallet only has to reason about one shape.
 *
 * Spec: https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html
 */

/** OID4VCI Draft 13 pre-authorized code grant-type URN. */
export const PRE_AUTHORIZED_CODE_GRANT =
    'urn:ietf:params:oauth:grant-type:pre-authorized_code';

/** Transaction-code metadata (replaces Draft 11's boolean `user_pin_required`). */
export interface TxCode {
    /** `numeric` or `text`. Defaults to `numeric`. */
    input_mode?: 'numeric' | 'text';
    /** Expected length of the transaction code. Optional. */
    length?: number;
    /** Human-readable hint shown to the user. Optional. */
    description?: string;
}

export interface PreAuthorizedCodeGrant {
    /** The pre-authorized code the wallet exchanges for an access token. */
    'pre-authorized_code': string;
    /** If present, the wallet must collect a tx code from the user. */
    tx_code?: TxCode;
    /** Minimum seconds the wallet should wait between deferred polls. */
    interval?: number;
    /** Authorization server to use if the issuer delegates token issuance. */
    authorization_server?: string;
}

export interface AuthorizationCodeGrant {
    /** Opaque state the wallet must forward in the authorization request. */
    issuer_state?: string;
    /** Authorization server to use if the issuer delegates authorization. */
    authorization_server?: string;
}

export interface CredentialOfferGrants {
    [PRE_AUTHORIZED_CODE_GRANT]?: PreAuthorizedCodeGrant;
    authorization_code?: AuthorizationCodeGrant;
}

/**
 * Normalized Draft 13 Credential Offer.
 *
 * `credential_configuration_ids` is the Draft 13 field name. Draft 11
 * `credentials` (array of strings or objects) is normalized into this field
 * by {@link normalizeCredentialOffer}.
 */
export interface CredentialOffer {
    credential_issuer: string;
    credential_configuration_ids: string[];
    grants?: CredentialOfferGrants;
}

/**
 * Raw Draft 11 shape accepted at parse time. Everything else downstream
 * should consume the normalized {@link CredentialOffer}.
 */
export interface RawDraft11CredentialOffer {
    credential_issuer: string;
    credentials: Array<string | { format: string; types?: string[]; [k: string]: unknown }>;
    grants?: {
        [PRE_AUTHORIZED_CODE_GRANT]?: {
            'pre-authorized_code': string;
            user_pin_required?: boolean;
            interval?: number;
        };
        authorization_code?: AuthorizationCodeGrant;
    };
}

/** Result of parsing an `openid-credential-offer://` URI. */
export type ParsedCredentialOfferUri =
    | { kind: 'by_value'; offer: CredentialOffer }
    | { kind: 'by_reference'; uri: string };

/** Schemes recognized as carrying OID4VCI credential offers. */
export const CREDENTIAL_OFFER_SCHEMES = [
    'openid-credential-offer',
    // HAIP (High Assurance Interoperability Profile) reuses the same payload.
    'haip',
] as const;

export type CredentialOfferScheme = (typeof CREDENTIAL_OFFER_SCHEMES)[number];

/**
 * Thrown when an offer URI or payload is malformed. Carries a stable `code`
 * so UI layers can map to friendly copy without string-matching messages.
 */
export class CredentialOfferParseError extends Error {
    readonly code:
        | 'invalid_uri'
        | 'missing_offer'
        | 'both_offer_and_uri'
        | 'invalid_json'
        | 'missing_issuer'
        | 'missing_credentials'
        | 'invalid_grants';

    constructor(code: CredentialOfferParseError['code'], message: string) {
        super(message);
        this.name = 'CredentialOfferParseError';
        this.code = code;
    }
}
