import {
    OpenID4VCDependentLearnCard,
    OpenID4VCPlugin,
    OpenID4VCPluginConfig,
} from './types';
import {
    parseCredentialOfferUri,
    resolveCredentialOfferByReference,
} from './offer/parse';
import { CredentialOffer, CredentialOfferParseError } from './offer/types';
import { acceptCredentialOffer as acceptCredentialOfferFn } from './vci/accept';
import { createJoseEd25519Signer } from './vci/proof';
import {
    storeAcceptedCredentials,
    StoreAcceptedCredentialsOptions,
} from './vci/store';
import { AcceptCredentialOfferOptions } from './vci/types';

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

    const resolveOffer = async (input: string): Promise<CredentialOffer> => {
        const parsed = parseCredentialOfferUri(input);

        if (parsed.kind === 'by_value') return parsed.offer;

        if (typeof fetchImpl !== 'function') {
            throw new CredentialOfferParseError(
                'invalid_uri',
                'No fetch implementation available; pass `config.fetch` to getOpenID4VCPlugin()'
            );
        }

        const resolved = await resolveCredentialOfferByReference(parsed.uri, fetchImpl);

        if (resolved.kind !== 'by_value') {
            throw new CredentialOfferParseError(
                'invalid_uri',
                'Unexpected by_reference result after resolving credential_offer_uri'
            );
        }

        return resolved.offer;
    };

    return {
        name: 'OpenID4VC',
        displayName: 'OpenID4VC',
        description:
            'OpenID for Verifiable Credentials holder support — Credential Offers, VCI, VP, and SIOPv2.',
        methods: {
            parseCredentialOffer: (_lc, input) => parseCredentialOfferUri(input),

            resolveCredentialOffer: async (_lc, input) => resolveOffer(input),

            acceptCredentialOffer: async (learnCard, input, options = {}) => {
                const offer = typeof input === 'string' ? await resolveOffer(input) : input;
                const signer = await ensureSigner(learnCard, options);

                return acceptCredentialOfferFn({
                    offer,
                    signer,
                    options,
                    fetchImpl,
                });
            },

            acceptAndStoreCredentialOffer: async (learnCard, input, options = {}) => {
                // Split the merged options into the two concerns so each helper
                // sees only what it cares about. This is purely hygienic —
                // everything passes through by name.
                const accepted = await (async () => {
                    const offer = typeof input === 'string' ? await resolveOffer(input) : input;
                    const signer = await ensureSigner(learnCard, options);

                    return acceptCredentialOfferFn({
                        offer,
                        signer,
                        options,
                        fetchImpl,
                    });
                })();

                const stored = await storeAcceptedCredentials(
                    learnCard as any,
                    accepted,
                    splitStoreOptions(options)
                );

                return { ...accepted, ...stored };
            },
        },
    };
};

/**
 * Build an Ed25519 proof-of-possession signer from the host LearnCard's
 * primary keypair, unless the caller already supplied a signer (for HSM /
 * secp256k1 / external key backends).
 */
const ensureSigner = async (
    learnCard: any,
    options: { signer?: AcceptCredentialOfferOptions['signer'] }
) => {
    if (options.signer) return options.signer;

    const keypair = learnCard.id.keypair('ed25519');
    const did = learnCard.id.did();
    const kid = await learnCard.invoke.didToVerificationMethod(did);

    return createJoseEd25519Signer({ keypair, kid });
};

/**
 * Extract just the {@link StoreAcceptedCredentialsOptions} fields from the
 * merged options bag. Keeps `storeAcceptedCredentials` from seeing irrelevant
 * VCI options (like `txCode` or `signer`).
 */
const splitStoreOptions = (
    options: AcceptCredentialOfferOptions & StoreAcceptedCredentialsOptions
): StoreAcceptedCredentialsOptions => ({
    storage: options.storage,
    encrypt: options.encrypt,
    category: options.category,
    title: options.title,
    imgUrl: options.imgUrl,
    upload: options.upload,
    addToIndex: options.addToIndex,
    makeId: options.makeId,
});
