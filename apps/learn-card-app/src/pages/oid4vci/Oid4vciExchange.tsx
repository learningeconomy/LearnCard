import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { IonContent, IonPage } from '@ionic/react';

import {
    ExchangeErrorDisplay,
    useIsLoggedIn,
    useWallet,
} from 'learn-card-base';
import {
    getCredentialName,
    getCredentialSubjectName,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    fetchCredentialIssuerMetadata,
} from '@learncard/openid4vc-plugin';
import type { VC } from '@learncard/types';
import type {
    AcceptedCredentialResult,
    AuthCodeFlowHandle,
    BeginAuthCodeFlowResult,
    CredentialIssuerMetadata,
    CredentialOffer,
    ProofJwtSigner,
    StoreAcceptedCredentialsResult,
} from '@learncard/openid4vc-plugin';

import LoggedOutOid4vci from './LoggedOutOid4vci';
import OfferLoading from './components/OfferLoading';
import OfferConsent from './components/OfferConsent';
import OfferAuthRedirect from './components/OfferAuthRedirect';
import OfferStoring from './components/OfferStoring';
import OfferFinished from './components/OfferFinished';
import {
    clearAuthCodeState,
    loadAuthCodeState,
    saveAuthCodeState,
} from './authCodeStorage';
import { buildLocalDidWebSignerOverride } from '../../helpers/localDidWebOid4vcSigner';

const PRE_AUTH_GRANT_KEY = 'urn:ietf:params:oauth:grant-type:pre-authorized_code';

/**
 * Phases the page can be in. Modeled as a discriminated union so the
 * compiler enforces "this field is only available in this state".
 */
type Phase =
    | { kind: 'loading' }
    | { kind: 'consent'; offer: CredentialOffer; metadata?: CredentialIssuerMetadata }
    | { kind: 'authRedirect'; offer: CredentialOffer; result: BeginAuthCodeFlowResult }
    | { kind: 'authReturn' }
    | { kind: 'storing'; message?: string }
    | {
          kind: 'finished';
          stored: StoreAcceptedCredentialsResult['stored'];
          failures: StoreAcceptedCredentialsResult['failures'];
          /** Carried forward from the consent or auth-code-return leg so the
           * success card can render branded issuer info instead of falling
           * back to the gradient avatar. */
          issuerUrl: string;
          issuerName?: string;
          issuerLogoUri?: string;
          /**
           * The issuer's metadata, threaded forward so the success-screen
           * preview card can read claim metadata for the issued credentials.
           */
          metadata?: CredentialIssuerMetadata;
      }
    | { kind: 'error'; error: unknown };

/**
 * The full OpenID4VCI credential-issuance flow. Drives a small state
 * machine over offer parsing \u2192 user consent \u2192 (auth-code redirect or
 * pre-authorized token exchange) \u2192 credential storage \u2192 success.
 *
 * On mount the page detects which "leg" of the flow it\u2019s on:
 *
 *  1. **Auth-code return**: query string has `code` + (optionally) `state`
 *     and we have a persisted `flowHandle` in localStorage \u2014 we hand
 *     both to `completeCredentialOfferAuthCode`, store the resulting
 *     credentials, and finish.
 *  2. **Initial offer**: query string has `offer` \u2014 we resolve the offer,
 *     fetch issuer metadata (best-effort), and ask the user to consent.
 *  3. **Bare page**: no query params \u2014 we render a friendly error.
 */
const Oid4vciExchange: React.FC = () => {
    const history = useHistory();
    const { search } = useLocation();
    const params = queryString.parse(search);
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    const offer = singleParam(params.offer);
    const code = singleParam(params.code);
    const state = singleParam(params.state);

    const [phase, setPhase] = useState<Phase>(() =>
        code ? { kind: 'authReturn' } : { kind: 'loading' }
    );

    // Guard against double-effects under React 18 strict mode.
    const initialized = useRef(false);

    // -----------------------------------------------------------------
    // Drive auth-code RETURN leg (resume from issuer redirect).
    // -----------------------------------------------------------------
    useEffect(() => {
        if (phase.kind !== 'authReturn' || !isLoggedIn) return;
        if (initialized.current) return;
        initialized.current = true;

        (async () => {
            const persisted = loadAuthCodeState(state);

            if (!persisted) {
                setPhase({
                    kind: 'error',
                    error: {
                        name: 'VciError',
                        code: 'token_request_failed',
                        message:
                            'We couldn\u2019t resume your sign-in flow. The flow may have expired or the wallet was opened in a different tab. Please scan the offer again.',
                    },
                });
                return;
            }

            try {
                setPhase({ kind: 'storing', message: 'Finishing sign-in...' });

                const wallet = (await initWallet()) as unknown as {
                    invoke: WalletOidcInvoke;
                };

                if (!code) {
                    throw new Error(
                        'Authorization-code callback fired without a `code` parameter'
                    );
                }

                // Fall back to did:key for local-dev `did:web:localhost`
                // profiles — foreign issuers can't HTTPS-resolve them.
                const signer = await buildLocalDidWebSignerOverride(
                    wallet as unknown as Parameters<
                        typeof buildLocalDidWebSignerOverride
                    >[0]
                );

                const accepted = await wallet.invoke.completeCredentialOfferAuthCode({
                    flowHandle: persisted.flowHandle,
                    code,
                    state: state ?? undefined,
                    signer,
                });

                // `completeCredentialOfferAuthCode` returns the issued
                // credentials but does not persist them — storage is
                // delegated to the same `storeAcceptedCredentials` helper
                // the pre-auth path uses, so the two flows produce
                // indistinguishable wallet entries.
                const stored = await persistAcceptedCredentials(
                    wallet,
                    accepted,
                    buildStoreOptions()
                );

                // Best-effort metadata refetch so the success card can
                // brand the issuer. We don't block on it: if it fails,
                // the card falls through the same avatar chain that
                // handles unbranded issuers gracefully.
                let metadata: CredentialIssuerMetadata | undefined;
                try {
                    metadata = await fetchCredentialIssuerMetadata(
                        persisted.flowHandle.issuer
                    );
                } catch (metadataError) {
                    console.warn(
                        'OID4VCI auth-code return: failed to refetch metadata for success-screen branding',
                        metadataError
                    );
                }

                const issuerInfo = pickIssuerInfo(
                    persisted.flowHandle.issuer,
                    metadata
                );

                clearAuthCodeState();
                setPhase({
                    kind: 'finished',
                    stored: stored.stored,
                    failures: stored.failures,
                    issuerUrl: persisted.flowHandle.issuer,
                    issuerName: issuerInfo.name,
                    issuerLogoUri: issuerInfo.logoUri,
                    metadata,
                });
            } catch (error) {
                console.error('OID4VCI auth-code return failed', error);
                clearAuthCodeState();
                setPhase({ kind: 'error', error });
            }
        })();
    }, [phase.kind, isLoggedIn, code, state, initWallet]);

    // -----------------------------------------------------------------
    // Drive INITIAL offer leg (parse + fetch metadata).
    // -----------------------------------------------------------------
    useEffect(() => {
        if (phase.kind !== 'loading' || !isLoggedIn || !offer) return;
        if (initialized.current) return;
        initialized.current = true;

        (async () => {
            try {
                const wallet = (await initWallet()) as unknown as {
                    invoke: WalletOidcInvoke;
                };

                const resolved = await wallet.invoke.resolveCredentialOffer(offer);

                // Best-effort metadata fetch \u2014 Consent renders gracefully
                // without it. We don\u2019t block consent on this network call.
                let metadata: CredentialIssuerMetadata | undefined;
                try {
                    metadata = await fetchCredentialIssuerMetadata(resolved.credential_issuer);
                } catch (metadataError) {
                    console.warn(
                        'OID4VCI: failed to fetch issuer metadata, falling back to URL display',
                        metadataError
                    );
                }

                setPhase({ kind: 'consent', offer: resolved, metadata });
            } catch (error) {
                console.error('OID4VCI: failed to resolve offer', error);
                setPhase({ kind: 'error', error });
            }
        })();
    }, [phase.kind, isLoggedIn, offer, initWallet]);

    // -----------------------------------------------------------------
    // Handlers triggered by sub-components.
    // -----------------------------------------------------------------

    const handleCancel = useCallback(() => {
        clearAuthCodeState();
        history.push('/');
    }, [history]);

    const handleAccept = useCallback(
        async ({ txCode }: { txCode?: string }) => {
            if (phase.kind !== 'consent') return;
            const currentOffer = phase.offer;
            // Capture before any setPhase calls reshape `phase` so we can
            // forward the metadata into the `finished` state for branded
            // success-card rendering.
            const currentMetadata = phase.metadata;

            try {
                const wallet = (await initWallet()) as unknown as {
                    invoke: WalletOidcInvoke;
                };

                const hasPreAuth = Boolean(currentOffer.grants?.[PRE_AUTH_GRANT_KEY]);

                if (hasPreAuth) {
                    setPhase({ kind: 'storing' });

                    // Fall back to did:key for local-dev `did:web:localhost`
                    // profiles — foreign issuers can't HTTPS-resolve them.
                    const signer = await buildLocalDidWebSignerOverride(
                        wallet as unknown as Parameters<
                            typeof buildLocalDidWebSignerOverride
                        >[0]
                    );

                    const result = await wallet.invoke.acceptAndStoreCredentialOffer(
                        currentOffer,
                        {
                            txCode,
                            signer,
                            ...buildStoreOptions(),
                        }
                    );

                    const issuerInfo = pickIssuerInfo(
                        currentOffer.credential_issuer,
                        currentMetadata
                    );

                    setPhase({
                        kind: 'finished',
                        stored: result.stored,
                        failures: result.failures,
                        issuerUrl: currentOffer.credential_issuer,
                        issuerName: issuerInfo.name,
                        issuerLogoUri: issuerInfo.logoUri,
                        metadata: currentMetadata,
                    });
                    return;
                }

                // Authorization-code grant: kick off the redirect flow.
                if (!offer) {
                    throw new Error(
                        'Cannot start authorization-code flow without the original offer URI'
                    );
                }

                const redirectUri = `${window.location.origin}/oid4vci`;
                const clientId = `${window.location.origin}`;

                const authResult = await wallet.invoke.beginCredentialOfferAuthCode(
                    currentOffer,
                    {
                        redirectUri,
                        clientId,
                    }
                );

                const persisted = saveAuthCodeState(authResult.flowHandle, offer);
                if (!persisted) {
                    setPhase({
                        kind: 'error',
                        error: {
                            name: 'VciError',
                            code: 'token_request_failed',
                            message:
                                'Storage is unavailable, so we can\u2019t resume after the issuer redirect. Try again with browsing data enabled.',
                        },
                    });
                    return;
                }

                setPhase({
                    kind: 'authRedirect',
                    offer: currentOffer,
                    result: authResult,
                });
            } catch (error) {
                console.error('OID4VCI: accept failed', error);
                setPhase({ kind: 'error', error });
            }
        },
        [phase, initWallet, offer]
    );

    const handleViewWallet = useCallback(() => {
        history.push('/');
    }, [history]);

    // -----------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------

    if (!isLoggedIn) {
        return <LoggedOutOid4vci offer={offer ?? undefined} />;
    }

    if (!offer && !code) {
        return (
            <IonPage>
                <IonContent>
                    <ExchangeErrorDisplay
                        friendly={{
                            title: 'No credential offer',
                            description:
                                'This page expects an `offer` query parameter pointing at an OpenID4VCI credential offer.',
                            suggestion:
                                'Scan the QR code or click the link the issuer gave you again.',
                        }}
                        onCancel={() => history.push('/')}
                    />
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonContent>
                {phase.kind === 'loading' && <OfferLoading />}

                {phase.kind === 'authReturn' && (
                    <OfferStoring message="Finishing sign-in..." />
                )}

                {phase.kind === 'consent' && (
                    <OfferConsent
                        offer={phase.offer}
                        metadata={phase.metadata}
                        onAccept={handleAccept}
                        onCancel={handleCancel}
                    />
                )}

                {phase.kind === 'authRedirect' && (
                    <OfferAuthRedirect
                        offer={phase.offer}
                        authorizationUrl={phase.result.authorizationUrl}
                        onCancel={handleCancel}
                    />
                )}

                {phase.kind === 'storing' && (
                    <OfferStoring message={phase.message} />
                )}

                {phase.kind === 'finished' && (
                    <OfferFinished
                        stored={phase.stored.map(entry => ({
                            configurationId: entry.configurationId,
                            format: entry.format,
                            title: extractTitle(entry.vc),
                            description: extractDescription(entry.vc),
                            // Pass the raw VC body so OfferFinished can
                            // render `BoostEarnedCard` directly when the
                            // shape is VCDM-compliant. The component
                            // gracefully falls back to a metadata-only
                            // preview otherwise (SD-JWT, mdoc).
                            vc: entry.vc as VC | undefined,
                        }))}
                        failures={phase.failures}
                        issuerUrl={phase.issuerUrl}
                        issuerName={phase.issuerName}
                        issuerLogoUri={phase.issuerLogoUri}
                        onViewWallet={handleViewWallet}
                        onShare={() => history.push('/wallet')}
                        onDone={() => history.push('/')}
                    />
                )}

                {phase.kind === 'error' && (
                    <ExchangeErrorDisplay
                        error={phase.error}
                        onCancel={() => history.push('/')}
                    />
                )}
            </IonContent>
        </IonPage>
    );
};

export default Oid4vciExchange;

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

/**
 * Narrow query-string params (which can be `string | (string | null)[] | null`)
 * down to a single string when present.
 */
const singleParam = (
    raw: string | (string | null)[] | null | undefined
): string | undefined => {
    if (typeof raw === 'string' && raw.length > 0) return raw;
    return undefined;
};

/**
 * Subset of plugin methods we call on the wallet's `invoke` namespace.
 * `BespokeLearnCard` doesn\u2019t reflect the OpenID4VC plugin in its type
 * surface (the plugin is wired in transparently via `learn-card-init`),
 * so we narrow to the methods we actually use to keep call sites typed.
 */
interface WalletOidcInvoke {
    resolveCredentialOffer: (input: string) => Promise<CredentialOffer>;

    acceptAndStoreCredentialOffer: (
        input: string | CredentialOffer,
        options?: {
            txCode?: string;
            signer?: ProofJwtSigner;
            // Storage-side overrides forwarded to `storeAcceptedCredentials`.
            // Typed loosely here because we don't import the VC shape from the
            // plugin and the helper is the source of truth.
            category?: string | ((vc: any, index: number) => string);
            title?: string | ((vc: any, index: number) => string | undefined);
            imgUrl?: string | ((vc: any, index: number) => string | undefined);
        }
    ) => Promise<AcceptedCredentialResult & StoreAcceptedCredentialsResult>;

    beginCredentialOfferAuthCode: (
        input: string | CredentialOffer,
        options: { redirectUri: string; clientId: string }
    ) => Promise<BeginAuthCodeFlowResult>;

    completeCredentialOfferAuthCode: (options: {
        flowHandle: AuthCodeFlowHandle;
        code: string;
        state?: string;
        signer?: ProofJwtSigner;
    }) => Promise<AcceptedCredentialResult>;
}

/**
 * Persist the freshly-issued credentials returned from
 * `completeCredentialOfferAuthCode`. The plugin\u2019s pre-auth pathway
 * has a turnkey `acceptAndStoreCredentialOffer`, but the auth-code
 * pathway returns just the issued credentials \u2014 storage is the
 * caller\u2019s responsibility.
 *
 * We thread the storage through the SAME `storeAcceptedCredentials`
 * helper the pre-auth path uses (re-exported from the plugin) so
 * the two flows produce indistinguishable wallet entries.
 */
const persistAcceptedCredentials = async (
    wallet: { invoke: WalletOidcInvoke } & {
        invoke: { storeAcceptedCredentials?: unknown };
    },
    accepted: AcceptedCredentialResult,
    options: ReturnType<typeof buildStoreOptions>
): Promise<StoreAcceptedCredentialsResult> => {
    // Lazy import keeps the plugin out of the initial bundle for users
    // who never hit this code path.
    const { storeAcceptedCredentials } = await import('@learncard/openid4vc-plugin');
    return storeAcceptedCredentials(
        wallet as unknown as Parameters<typeof storeAcceptedCredentials>[0],
        accepted,
        options
    );
};

/**
 * Build the storage-side options bag passed to `acceptAndStoreCredentialOffer`
 * (pre-auth path) and `storeAcceptedCredentials` (auth-code path).
 *
 * Two concerns, shared between the two call sites so the resulting
 * wallet entries are indistinguishable:
 *
 *  1. **Canonical category routing**. The plugin ships a small VC-type
 *     heuristic that classifies `UniversityDegreeCredential` as
 *     `Achievement`. The host wallet's canonical mapper
 *     (`getDefaultCategoryForCredential`) routes it to `Learning History`.
 *     Pass the canonical mapper so the OIDC and `/request` paths put a
 *     given credential in the same wallet shelf.
 *
 *  2. **Canonical title extraction**. Without a `title` override the
 *     plugin omits the field on the IndexRecord, and the wallet falls
 *     back to displaying the *category* name (e.g. "ACHIEVEMENTS") on
 *     the credential card. We thread the wallet's `getCredentialName`
 *     (with a `credentialSubject.name` fallback) so each entry has a
 *     real human-readable title.
 */
const buildStoreOptions = () => ({
    category: (vc: any) => getDefaultCategoryForCredential(vc),
    title: (vc: any) =>
        getCredentialName(vc) || getCredentialSubjectName(vc) || undefined,
});

/**
 * Best-effort title extraction from a stored credential. Falls back to
 * `undefined` so OfferFinished renders the configuration id instead.
 */
const extractTitle = (vc: unknown): string | undefined => {
    if (!vc || typeof vc !== 'object') return undefined;
    const v = vc as Record<string, unknown>;

    if (typeof v.name === 'string' && v.name.length > 0) return v.name;

    const subject = v.credentialSubject;
    if (subject && typeof subject === 'object') {
        const achievement = (subject as Record<string, unknown>).achievement;
        if (achievement && typeof achievement === 'object') {
            const a = achievement as Record<string, unknown>;
            if (typeof a.name === 'string' && a.name.length > 0) return a.name;
        }
    }

    return undefined;
};

/**
 * Best-effort one-line description from a stored credential. Tries the
 * top-level `description`, then `credentialSubject.achievement.description`
 * (OBv3 shape). Falls back to `undefined` so the success card omits the
 * line entirely instead of showing an empty placeholder.
 */
const extractDescription = (vc: unknown): string | undefined => {
    if (!vc || typeof vc !== 'object') return undefined;
    const v = vc as Record<string, unknown>;

    if (typeof v.description === 'string' && v.description.length > 0) {
        return v.description;
    }

    const subject = v.credentialSubject;
    if (subject && typeof subject === 'object') {
        const achievement = (subject as Record<string, unknown>).achievement;
        if (achievement && typeof achievement === 'object') {
            const a = achievement as Record<string, unknown>;
            if (typeof a.description === 'string' && a.description.length > 0) {
                return a.description;
            }
        }
    }

    return undefined;
};

/**
 * Pull a stable display name + logo URI from issuer metadata for the
 * post-issuance success screen. Both are optional \u2014 the components
 * gracefully fall back to favicon \u2192 gradient avatar when absent.
 */
const pickIssuerInfo = (
    _issuerUrl: string,
    metadata?: CredentialIssuerMetadata
): { name?: string; logoUri?: string } => {
    if (!metadata) return {};

    const display = metadata.display;
    if (!Array.isArray(display) || display.length === 0) return {};

    const first = display[0];
    if (!first || typeof first !== 'object') return {};

    const f = first as Record<string, unknown>;
    const name =
        typeof f.name === 'string' && f.name.trim().length > 0
            ? f.name.trim()
            : undefined;

    let logoUri: string | undefined;
    const logo = f.logo;
    if (logo && typeof logo === 'object') {
        const uri = (logo as Record<string, unknown>).uri;
        if (typeof uri === 'string' && uri.length > 0) {
            logoUri = uri;
        }
    }

    return { name, logoUri };
};
