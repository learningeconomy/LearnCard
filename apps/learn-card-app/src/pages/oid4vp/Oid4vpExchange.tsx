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
    SelectionResult,
    SubmitPresentationResult,
} from '@learncard/openid4vc-plugin';

import LoggedOutOid4vp from './LoggedOutOid4vp';
import RequestLoading from './components/RequestLoading';
import RequestConsent from './components/RequestConsent';
import RequestSubmitting from './components/RequestSubmitting';
import RequestFinished from './components/RequestFinished';
import {
    loadCandidatePool,
    type PooledCandidate,
    type WalletForCandidates,
} from './candidatePool';

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
    const handleApprove = useCallback(async () => {
        if (phase.kind !== 'consent') return;
        const currentPhase = phase;

        try {
            setPhase({ kind: 'submitting' });

            const wallet = (await initWallet()) as unknown as {
                invoke: WalletOidcVpInvoke;
            };

            const chosen = buildChosenList(
                currentPhase.selection,
                currentPhase.dcqlSelection
            );

            if (chosen.length === 0) {
                throw new Error(
                    'No credentials matched the verifier\u2019s request \u2014 cannot submit.'
                );
            }

            const result = await wallet.invoke.presentCredentials(
                currentPhase.request,
                chosen
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
        chosen: ChosenForPresentation[]
    ) => Promise<{
        request: AuthorizationRequest;
        submitted: SubmitPresentationResult;
    }>;
}

/**
 * Auto-pick the first eligible candidate per descriptor (PEX) or per
 * credential-query (DCQL). Stage 4 polish will swap this for an
 * interactive picker when a row has multiple candidates.
 */
const buildChosenList = (
    selection?: SelectionResult,
    dcqlSelection?: DcqlSelectionResult
): ChosenForPresentation[] => {
    if (selection) {
        const picks: ChosenForPresentation[] = [];
        for (const d of selection.descriptors) {
            const first = d.candidates[0];
            if (!first) continue;
            picks.push({
                descriptorId: d.descriptorId,
                candidate: first.candidate,
            });
        }
        return picks;
    }

    if (dcqlSelection) {
        const picks: ChosenForPresentation[] = [];
        for (const [queryId, match] of Object.entries(dcqlSelection.matches)) {
            const first = match.candidates[0];
            if (!first) continue;
            picks.push({
                credentialQueryId: queryId,
                candidate: first as unknown as CandidateCredential,
            });
        }
        return picks;
    }

    return [];
};
