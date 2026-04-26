import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { IonContent, IonPage } from '@ionic/react';

import {
    ExchangeErrorDisplay,
    useIsLoggedIn,
    useWallet,
} from 'learn-card-base';
import type {
    AuthorizationRequest,
    CandidateCredential,
    ChosenForPresentation,
    DcqlSelectionResult,
    ProofJwtSigner,
    SelectionResult,
    SubmitPresentationResult,
} from '@learncard/openid4vc-plugin';

import LoggedOutOid4vp from './LoggedOutOid4vp';
import RequestLoading from './components/RequestLoading';
import RequestConsent, {
    type ConsentPicks,
} from './components/RequestConsent';
import RequestSubmitting from './components/RequestSubmitting';
import RequestFinished from './components/RequestFinished';
import RequestCannotSatisfy from './components/RequestCannotSatisfy';
import {
    loadCandidatePool,
    type PooledCandidate,
    type WalletForCandidates,
} from './candidatePool';
import { buildLocalDidWebSignerOverride } from '../../helpers/localDidWebOid4vcSigner';

/**
 * Phases the page can be in. Modeled as a discriminated union so the
 * compiler enforces "this field is only available in this state".
 */
type Phase =
    | { kind: 'loading' }
    | {
          kind: 'consent';
          request: AuthorizationRequest;
          selection?: SelectionResult;
          dcqlSelection?: DcqlSelectionResult;
          pool: PooledCandidate[];
      }
    /**
     * Verifier asked for credentials the wallet can’t produce. We render
     * a friendly explainer instead of the consent flow.
     */
    | {
          kind: 'cant_satisfy';
          request: AuthorizationRequest;
          selection?: SelectionResult;
          dcqlSelection?: DcqlSelectionResult;
      }
    | { kind: 'submitting' }
    | { kind: 'finished'; submitted: SubmitPresentationResult }
    | { kind: 'error'; error: unknown };

/**
 * Full OID4VP presentation flow. Drives a small state machine over
 * request resolution \u2192 user consent \u2192 sign + POST \u2192 success.
 *
 * The flow is read-only until the user explicitly approves: we resolve
 * the verifier\u2019s request, match it against the holder\u2019s candidate
 * pool, and render a consent screen showing exactly what will be
 * shared. Only on Approve do we touch the holder\u2019s keys.
 */
const Oid4vpExchange: React.FC = () => {
    const history = useHistory();
    const { search } = useLocation();
    const params = queryString.parse(search);
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    const requestUri = singleParam(params.request);

    const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
    const initialized = useRef(false);

    // -----------------------------------------------------------------
    // Resolve the request + load the candidate pool.
    // -----------------------------------------------------------------
    useEffect(() => {
        if (!isLoggedIn || !requestUri) return;
        if (initialized.current) return;
        initialized.current = true;

        (async () => {
            try {
                const wallet = (await initWallet()) as unknown as {
                    invoke: WalletOidcVpInvoke;
                } & WalletForCandidates;

                const pool = await loadCandidatePool(wallet);

                const result = await wallet.invoke.prepareVerifiablePresentation(
                    requestUri,
                    pool as unknown as CandidateCredential[]
                );

                // If neither selection can be satisfied, surface a
                // dedicated “missing credentials” screen instead of
                // letting the user try-and-fail at the consent step.
                const canSatisfy =
                    result.selection?.canSatisfy
                    ?? result.dcqlSelection?.canSatisfy
                    ?? false;

                if (!canSatisfy) {
                    setPhase({
                        kind: 'cant_satisfy',
                        request: result.request,
                        selection: result.selection,
                        dcqlSelection: result.dcqlSelection,
                    });
                    return;
                }

                setPhase({
                    kind: 'consent',
                    request: result.request,
                    selection: result.selection,
                    dcqlSelection: result.dcqlSelection,
                    pool,
                });
            } catch (error) {
                console.error('OID4VP: failed to resolve request', error);
                setPhase({ kind: 'error', error });
            }
        })();
    }, [isLoggedIn, requestUri, initWallet]);

    // -----------------------------------------------------------------
    // Approve handler: build picks, sign, submit.
    // -----------------------------------------------------------------
    const handleApprove = useCallback(async (picks: ConsentPicks) => {
        if (phase.kind !== 'consent') return;
        const currentPhase = phase;

        try {
            setPhase({ kind: 'submitting' });

            const wallet = (await initWallet()) as unknown as {
                invoke: WalletOidcVpInvoke;
            };

            const chosen = buildChosenList(
                currentPhase.selection,
                currentPhase.dcqlSelection,
                picks
            );

            if (chosen.length === 0) {
                throw new Error(
                    'No credentials matched the verifier’s request — cannot submit.'
                );
            }

            // Fall back to did:key for local-dev `did:web:localhost`
            // profiles — foreign verifiers can't HTTPS-resolve them.
            // When we swap the signer we must also swap the VP holder
            // so the outer VP's `holder` field matches the proof JWT
            // issuer (otherwise the verifier rejects the mismatch).
            const signer = await buildLocalDidWebSignerOverride(
                wallet as unknown as Parameters<
                    typeof buildLocalDidWebSignerOverride
                >[0]
            );
            const holder = signer
                ? (wallet as unknown as {
                      id: { did: (m?: string) => string };
                  }).id.did('key')
                : undefined;

            const result = await wallet.invoke.presentCredentials(
                currentPhase.request,
                chosen,
                { signer, holder }
            );

            setPhase({ kind: 'finished', submitted: result.submitted });
        } catch (error) {
            console.error('OID4VP: presentation failed', error);
            setPhase({ kind: 'error', error });
        }
    }, [phase, initWallet]);

    const handleCancel = useCallback(() => {
        history.push('/');
    }, [history]);

    // -----------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------

    if (!isLoggedIn) {
        return <LoggedOutOid4vp request={requestUri ?? undefined} />;
    }

    if (!requestUri) {
        return (
            <IonPage>
                <IonContent>
                    <ExchangeErrorDisplay
                        friendly={{
                            title: 'No presentation request',
                            description:
                                'This page expects a `request` query parameter pointing at an OpenID4VP authorization request.',
                            suggestion:
                                'Scan the QR code or click the link the verifier gave you again.',
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
                {phase.kind === 'loading' && <RequestLoading />}

                {phase.kind === 'consent' && (
                    <RequestConsent
                        request={phase.request}
                        selection={phase.selection}
                        dcqlSelection={phase.dcqlSelection}
                        onApprove={handleApprove}
                        onCancel={handleCancel}
                    />
                )}

                {phase.kind === 'cant_satisfy' && (
                    <RequestCannotSatisfy
                        request={phase.request}
                        selection={phase.selection}
                        dcqlSelection={phase.dcqlSelection}
                        onDone={() => history.push('/')}
                    />
                )}

                {phase.kind === 'submitting' && <RequestSubmitting />}

                {phase.kind === 'finished' && (
                    <RequestFinished
                        redirectUri={phase.submitted.redirectUri}
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

export default Oid4vpExchange;

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

const singleParam = (
    raw: string | (string | null)[] | null | undefined
): string | undefined => {
    if (typeof raw === 'string' && raw.length > 0) return raw;
    return undefined;
};

/**
 * Subset of OID4VP plugin methods we touch on the wallet's `invoke`
 * namespace. `BespokeLearnCard` doesn\u2019t reflect the OpenID4VC plugin
 * in its type surface, so we narrow to the methods we use.
 */
interface WalletOidcVpInvoke {
    prepareVerifiablePresentation: (
        input: string | AuthorizationRequest,
        credentials: CandidateCredential[]
    ) => Promise<{
        request: AuthorizationRequest;
        selection?: SelectionResult;
        dcqlSelection?: DcqlSelectionResult;
    }>;

    presentCredentials: (
        input: string | AuthorizationRequest,
        chosen: ChosenForPresentation[],
        options?: {
            holder?: string;
            signer?: ProofJwtSigner;
        }
    ) => Promise<{
        request: AuthorizationRequest;
        submitted: SubmitPresentationResult;
    }>;
}

/**
 * Translate the user’s per-row picks into the plugin’s
 * `ChosenForPresentation[]` shape. Honors picks when present, falls
 * back to the first eligible candidate per row otherwise.
 */
const buildChosenList = (
    selection?: SelectionResult,
    dcqlSelection?: DcqlSelectionResult,
    userPicks: ConsentPicks = {}
): ChosenForPresentation[] => {
    if (selection) {
        const out: ChosenForPresentation[] = [];
        for (const d of selection.descriptors) {
            const idx = userPicks[d.descriptorId] ?? 0;
            const chosen = d.candidates[idx] ?? d.candidates[0];
            if (!chosen) continue;
            out.push({
                descriptorId: d.descriptorId,
                candidate: chosen.candidate,
            });
        }
        return out;
    }

    if (dcqlSelection) {
        const out: ChosenForPresentation[] = [];
        for (const [queryId, match] of Object.entries(dcqlSelection.matches)) {
            const idx = userPicks[queryId] ?? 0;
            const chosen = match.candidates[idx] ?? match.candidates[0];
            if (!chosen) continue;
            out.push({
                credentialQueryId: queryId,
                candidate: chosen as unknown as CandidateCredential,
            });
        }
        return out;
    }

    return [];
};
