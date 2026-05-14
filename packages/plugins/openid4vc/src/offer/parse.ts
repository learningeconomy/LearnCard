import {
    CredentialOfferParseError,
    ParsedCredentialOfferUri,
} from './types';
import { normalizeCredentialOffer } from './normalize';

/**
 * Parse an OpenID4VCI Credential Offer URI.
 *
 * Accepts:
 * - `openid-credential-offer://?credential_offer=<url-encoded JSON>`
 * - `openid-credential-offer://?credential_offer_uri=<url-encoded https URL>`
 * - `haip://` variants of the above
 * - A bare query string (`?credential_offer=...` or `credential_offer=...`)
 *
 * Does not hit the network. For `by_reference` offers, use
 * {@link resolveCredentialOfferByReference} with a fetch implementation.
 *
 * @throws {CredentialOfferParseError}
 */
export const parseCredentialOfferUri = (input: string): ParsedCredentialOfferUri => {
    if (typeof input !== 'string' || input.trim().length === 0) {
        throw new CredentialOfferParseError('invalid_uri', 'Offer URI must be a non-empty string');
    }

    const params = extractSearchParams(input.trim());

    const offerParam = params.get('credential_offer');
    const offerUriParam = params.get('credential_offer_uri');

    if (offerParam && offerUriParam) {
        throw new CredentialOfferParseError(
            'both_offer_and_uri',
            'Credential offer URI must contain exactly one of `credential_offer` or `credential_offer_uri`, not both'
        );
    }

    if (offerUriParam) {
        if (!isHttpsUrl(offerUriParam)) {
            throw new CredentialOfferParseError(
                'invalid_uri',
                '`credential_offer_uri` must be an absolute https:// URL'
            );
        }

        return { kind: 'by_reference', uri: offerUriParam };
    }

    if (offerParam) {
        let parsed: unknown;

        try {
            parsed = JSON.parse(offerParam);
        } catch {
            throw new CredentialOfferParseError(
                'invalid_json',
                '`credential_offer` value is not valid JSON'
            );
        }

        return { kind: 'by_value', offer: normalizeCredentialOffer(parsed) };
    }

    throw new CredentialOfferParseError(
        'missing_offer',
        'Credential offer URI must contain `credential_offer` or `credential_offer_uri`'
    );
};

/**
 * Fetch a by-reference credential offer and normalize it.
 *
 * @param fetchImpl - Defaults to `globalThis.fetch` when available.
 * @throws {CredentialOfferParseError}
 */
export const resolveCredentialOfferByReference = async (
    uri: string,
    fetchImpl: typeof fetch = globalThis.fetch
): Promise<ParsedCredentialOfferUri> => {
    if (typeof fetchImpl !== 'function') {
        throw new CredentialOfferParseError(
            'invalid_uri',
            'No fetch implementation available to resolve credential_offer_uri'
        );
    }

    if (!isHttpsUrl(uri)) {
        throw new CredentialOfferParseError(
            'invalid_uri',
            'credential_offer_uri must be an absolute https:// URL'
        );
    }

    let response: Response;

    try {
        response = await fetchImpl(uri, { method: 'GET' });
    } catch (e) {
        throw new CredentialOfferParseError(
            'invalid_uri',
            `Failed to fetch credential_offer_uri: ${e instanceof Error ? e.message : String(e)}`
        );
    }

    if (!response.ok) {
        throw new CredentialOfferParseError(
            'invalid_uri',
            `credential_offer_uri returned ${response.status} ${response.statusText}`
        );
    }

    let json: unknown;

    try {
        json = await response.json();
    } catch {
        throw new CredentialOfferParseError(
            'invalid_json',
            'credential_offer_uri response was not valid JSON'
        );
    }

    return { kind: 'by_value', offer: normalizeCredentialOffer(json) };
};

/**
 * Extract query params from an offer URI, tolerating the various shapes
 * wallets see in the wild:
 * - `openid-credential-offer://?credential_offer=...`
 * - `openid-credential-offer:?credential_offer=...` (no `//`)
 * - `haip://?credential_offer=...`
 * - `https://issuer.example.com/offer?credential_offer_uri=...`
 * - `?credential_offer=...` (bare query)
 * - `credential_offer=...` (raw query fragment)
 */
const extractSearchParams = (input: string): URLSearchParams => {
    // Covers every URI shape we care about (`openid-credential-offer://?...`,
    // `openid-credential-offer:?...`, `haip://?...`, `https://.../?...`,
    // and bare `?...`). Doing this first means scheme-with-colon-no-slash
    // URIs like `openid-credential-offer:?credential_offer=...` are handled
    // correctly instead of being mis-detected as raw key=value fragments.
    const queryStart = input.indexOf('?');

    if (queryStart !== -1) {
        return new URLSearchParams(input.slice(queryStart + 1));
    }

    // No `?` — only valid shape left is a raw `key=value[&...]` fragment.
    // Reject anything that still looks like a URI (has a scheme), so we
    // surface `invalid_uri` instead of silently parsing garbage.
    if (input.includes('://') || /^[a-z][a-z0-9+.-]*:/i.test(input)) {
        throw new CredentialOfferParseError('invalid_uri', 'Offer URI has no query string');
    }

    if (input.includes('=')) {
        return new URLSearchParams(input);
    }

    throw new CredentialOfferParseError('invalid_uri', 'Offer URI has no query string');
};

const isHttpsUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
};
