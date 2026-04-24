import {
    OpenID4VCDependentLearnCard,
    OpenID4VCPlugin,
    OpenID4VCPluginConfig,
} from './types';
import {
    parseCredentialOfferUri,
    resolveCredentialOfferByReference,
} from './offer/parse';
import { CredentialOfferParseError } from './offer/types';

/**
 * Create the OpenID4VC holder plugin.
 *
 * Current scope (Slice 1): Credential Offer URI parsing + by-reference
 * resolution. Subsequent slices will add token exchange, credential request,
 * OID4VP Authorization Request handling, and SIOPv2 ID tokens.
 *
 * @group Plugins
 */
export const getOpenID4VCPlugin = (
    _learnCard: OpenID4VCDependentLearnCard,
    config: OpenID4VCPluginConfig = {}
): OpenID4VCPlugin => {
    const fetchImpl = config.fetch ?? globalThis.fetch;

    return {
        name: 'OpenID4VC',
        displayName: 'OpenID4VC',
        description:
            'OpenID for Verifiable Credentials holder support — Credential Offers, VCI, VP, and SIOPv2.',
        methods: {
            parseCredentialOffer: (_lc, input) => parseCredentialOfferUri(input),

            resolveCredentialOffer: async (_lc, input) => {
                const parsed = parseCredentialOfferUri(input);

                if (parsed.kind === 'by_value') return parsed.offer;

                if (typeof fetchImpl !== 'function') {
                    throw new CredentialOfferParseError(
                        'invalid_uri',
                        'No fetch implementation available; pass `config.fetch` to getOpenID4VCPlugin()'
                    );
                }

                const resolved = await resolveCredentialOfferByReference(parsed.uri, fetchImpl);

                // resolveCredentialOfferByReference always returns by_value.
                if (resolved.kind !== 'by_value') {
                    throw new CredentialOfferParseError(
                        'invalid_uri',
                        'Unexpected by_reference result after resolving credential_offer_uri'
                    );
                }

                return resolved.offer;
            },
        },
    };
};
