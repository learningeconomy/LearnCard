import type { OpenID4VCDependentLearnCard, OpenID4VCPlugin, OpenID4VCPluginConfig } from './types';
import { parseCredentialOfferUri } from './offer/parse';
import { parseAuthorizationRequestUri } from './vp/parse';

type Methods = OpenID4VCPlugin['methods'];

/**
 * Create the OpenID4VC holder plugin.
 *
 * The two sync parsers run here; every async method loads the VCI / VP / SIOP implementation
 * (`./plugin`, with jose and the presentation-exchange matcher) on its first call, so wallet
 * start-up does not download or evaluate it.
 *
 * @group Plugins
 */
export const getOpenID4VCPlugin = (
    learnCard: OpenID4VCDependentLearnCard,
    config: OpenID4VCPluginConfig = {}
): OpenID4VCPlugin => {
    // Resolve fetch now, as the eager plugin did, so a later global swap does not change behavior.
    const implConfig: OpenID4VCPluginConfig = {
        ...config,
        fetch: config.fetch ?? globalThis.fetch,
    };
    let impl: Promise<Methods> | undefined;
    const load = (): Promise<Methods> =>
        (impl ??= import('./plugin').then(
            m => m.getOpenID4VCPlugin(learnCard, implConfig).methods
        ));
    const lazy = <K extends keyof Methods>(name: K): Methods[K] =>
        (async (...args: unknown[]) => {
            const methods = await load();
            return (methods[name] as (...a: unknown[]) => unknown)(...args);
        }) as unknown as Methods[K];

    return {
        name: 'OpenID4VC',
        displayName: 'OpenID4VC',
        description:
            'OpenID for Verifiable Credentials holder support — Credential Offers, VCI, VP, and SIOPv2.',
        methods: {
            parseCredentialOffer: (_lc, input) => parseCredentialOfferUri(input),
            resolveCredentialOffer: lazy('resolveCredentialOffer'),
            acceptCredentialOffer: lazy('acceptCredentialOffer'),
            exchangePreAuthCodeForToken: lazy('exchangePreAuthCodeForToken'),
            requestCredentialsFromPreAuthToken: lazy('requestCredentialsFromPreAuthToken'),
            acceptAndStoreCredentialOffer: lazy('acceptAndStoreCredentialOffer'),
            beginCredentialOfferAuthCode: lazy('beginCredentialOfferAuthCode'),
            completeCredentialOfferAuthCode: lazy('completeCredentialOfferAuthCode'),
            exchangeAuthCodeForToken: lazy('exchangeAuthCodeForToken'),
            requestCredentialsFromAuthCodeToken: lazy('requestCredentialsFromAuthCodeToken'),
            parseAuthorizationRequest: (_lc, input) => parseAuthorizationRequestUri(input),
            createDcApiResponse: lazy('createDcApiResponse'),
            resolveAuthorizationRequest: lazy('resolveAuthorizationRequest'),
            prepareVerifiablePresentation: lazy('prepareVerifiablePresentation'),
            buildPresentation: lazy('buildPresentation'),
            signPresentation: lazy('signPresentation'),
            submitPresentation: lazy('submitPresentation'),
            signIdToken: lazy('signIdToken'),
            presentCredentials: lazy('presentCredentials'),
        },
    };
};
