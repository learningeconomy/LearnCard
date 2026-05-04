import {
    CredentialOffer,
    CredentialOfferGrants,
    CredentialOfferParseError,
    PreAuthorizedCodeGrant,
    PRE_AUTHORIZED_CODE_GRANT,
    RawDraft11CredentialOffer,
} from './types';

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0;

/**
 * Normalize a raw credential-offer JSON payload (Draft 11 or Draft 13)
 * into the Draft 13 shape the rest of the plugin consumes.
 *
 * - `credentials` (Draft 11) → `credential_configuration_ids` (Draft 13).
 * - `user_pin_required: true` (Draft 11) → synthetic `tx_code: {}` (Draft 13).
 *
 * Draft 11 `credentials` entries that are objects (in-line format metadata
 * rather than configuration ids) are preserved as their `id` or `types[0]`
 * fall-back string, with a warning logged. Wallets that need the full inline
 * metadata should fetch the issuer metadata and match by `format`.
 */
export const normalizeCredentialOffer = (raw: unknown): CredentialOffer => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new CredentialOfferParseError(
            'invalid_json',
            'Credential offer must be a JSON object'
        );
    }

    const obj = raw as Record<string, unknown>;

    if (!isNonEmptyString(obj.credential_issuer)) {
        throw new CredentialOfferParseError(
            'missing_issuer',
            'Credential offer is missing `credential_issuer`'
        );
    }

    const credentialIssuer = obj.credential_issuer;

    // Draft 13 shape
    if (Array.isArray(obj.credential_configuration_ids)) {
        const ids = obj.credential_configuration_ids.filter(isNonEmptyString);

        if (ids.length === 0) {
            throw new CredentialOfferParseError(
                'missing_credentials',
                'Credential offer `credential_configuration_ids` is empty'
            );
        }

        return {
            credential_issuer: credentialIssuer,
            credential_configuration_ids: ids,
            grants: normalizeGrants(obj.grants),
        };
    }

    // Draft 11 shape
    if (Array.isArray((obj as unknown as RawDraft11CredentialOffer).credentials)) {
        const draft11 = obj as unknown as RawDraft11CredentialOffer;
        const ids = draft11.credentials
            .map(entry => {
                if (typeof entry === 'string') return entry;

                // Inline metadata — fall back to the best available identifier.
                if (typeof entry === 'object' && entry !== null) {
                    const anyEntry = entry as { id?: unknown; types?: unknown };
                    if (isNonEmptyString(anyEntry.id)) return anyEntry.id;
                    if (
                        Array.isArray(anyEntry.types) &&
                        anyEntry.types.length > 0 &&
                        isNonEmptyString(anyEntry.types[0])
                    ) {
                        return anyEntry.types[0];
                    }
                }

                return null;
            })
            .filter(isNonEmptyString);

        if (ids.length === 0) {
            throw new CredentialOfferParseError(
                'missing_credentials',
                'Credential offer `credentials` array did not contain any resolvable identifiers'
            );
        }

        return {
            credential_issuer: credentialIssuer,
            credential_configuration_ids: ids,
            grants: normalizeGrants(obj.grants, { legacy: true }),
        };
    }

    throw new CredentialOfferParseError(
        'missing_credentials',
        'Credential offer must include `credential_configuration_ids` (Draft 13) or `credentials` (Draft 11)'
    );
};

const normalizeGrants = (
    raw: unknown,
    opts: { legacy?: boolean } = {}
): CredentialOfferGrants | undefined => {
    if (raw == null) return undefined;

    if (typeof raw !== 'object' || Array.isArray(raw)) {
        throw new CredentialOfferParseError(
            'invalid_grants',
            '`grants` must be a JSON object'
        );
    }

    const grants = raw as Record<string, unknown>;
    const out: CredentialOfferGrants = {};

    const preAuth = grants[PRE_AUTHORIZED_CODE_GRANT];

    if (preAuth && typeof preAuth === 'object' && !Array.isArray(preAuth)) {
        const preAuthObj = preAuth as Record<string, unknown>;
        const code = preAuthObj['pre-authorized_code'];

        if (!isNonEmptyString(code)) {
            throw new CredentialOfferParseError(
                'invalid_grants',
                'Pre-authorized code grant is missing `pre-authorized_code`'
            );
        }

        const normalizedPreAuth: PreAuthorizedCodeGrant = {
            'pre-authorized_code': code,
            interval: typeof preAuthObj.interval === 'number' ? preAuthObj.interval : undefined,
            authorization_server: isNonEmptyString(preAuthObj.authorization_server)
                ? preAuthObj.authorization_server
                : undefined,
        };

        // Draft 13 tx_code takes precedence
        if (
            preAuthObj.tx_code &&
            typeof preAuthObj.tx_code === 'object' &&
            !Array.isArray(preAuthObj.tx_code)
        ) {
            normalizedPreAuth.tx_code = preAuthObj.tx_code as PreAuthorizedCodeGrant['tx_code'];
        } else if (opts.legacy && preAuthObj.user_pin_required === true) {
            // Draft 11 only signalled a boolean; we surface a marker tx_code
            // so UI can prompt for a code without assuming length/mode.
            normalizedPreAuth.tx_code = {};
        }

        out[PRE_AUTHORIZED_CODE_GRANT] = normalizedPreAuth;
    }

    const authCode = grants.authorization_code;

    if (authCode && typeof authCode === 'object' && !Array.isArray(authCode)) {
        const authObj = authCode as Record<string, unknown>;
        out.authorization_code = {
            issuer_state: isNonEmptyString(authObj.issuer_state) ? authObj.issuer_state : undefined,
            authorization_server: isNonEmptyString(authObj.authorization_server)
                ? authObj.authorization_server
                : undefined,
        };
    }

    if (Object.keys(out).length === 0) return undefined;

    return out;
};
