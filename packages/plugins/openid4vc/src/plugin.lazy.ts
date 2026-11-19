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
    // Keep a loaded implementation for the plugin's lifetime, but never a failed load. A failed
    // import is retried once in place (as the app's lazyWithRetry does); if that fails too, the call
    // rejects with the first import error, unchanged so the app's stale-chunk recovery
    // (isStaleChunkError) still matches it, and the next call imports again instead of replaying the
    // same rejection until the wallet is rebuilt.
    let impl: Promise<Methods> | undefined;
    const importImpl = () => import('./plugin');
    const load = (): Promise<Methods> => {
        if (impl) return impl;
        const pending = importImpl()
            .catch(firstError =>
                importImpl().catch(() => {
                    throw firstError;
                })
            )
            .then(m => m.getOpenID4VCPlugin(learnCard, implConfig).methods);
        impl = pending;
        pending.catch(() => {
            if (impl === pending) impl = undefined;
        });
        return pending;
    };
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
