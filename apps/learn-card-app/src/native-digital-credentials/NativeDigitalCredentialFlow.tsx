import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useIsLoggedIn, useWallet, redirectStore } from 'learn-card-base';
import {
    captureHistoryAccount,
    isHistoryAccountEligible,
    useHistoryAccountRevision,
} from '../helpers/verifier-history/account';
import RequestConsent, { type ConsentPicks } from '../pages/oid4vp/components/RequestConsent';
import ClaimLoginPage from '../pages/login/ClaimLoginPage';
import { nativeDigitalCredentials } from './plugin';
import { readNativeInventory } from './runtime';
import { prepareAccountPresentation } from './presentation';
import type { DigitalCredentialWallet } from './inventory';
import type { PendingDigitalCredentialRequest } from './types';
import { markStartupPhase } from '../helpers/startupDiagnostics';
import { NativeRequestState } from './NativeRequestState';

type Prepared = Awaited<ReturnType<typeof prepareAccountPresentation>>;

/** Native result delivery replaces HTTP submission; consent and account services stay shared. */
export default function NativeDigitalCredentialFlow() {
    const loggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const revision = useHistoryAccountRevision();
    const history = useHistory();
    const [pending, setPending] = useState<PendingDigitalCredentialRequest>();
    const [isProvider, setIsProvider] = useState(false);
    const [prepared, setPrepared] = useState<Prepared>();
    const [error, setError] = useState(false);
    const [sending, setSending] = useState(false);
    const [canceling, setCanceling] = useState(false);

    useEffect(() => {
        if (prepared && !error) markStartupPhase('consent');
        if (error) markStartupPhase('unavailable');
    }, [prepared, error]);

    useEffect(() => {
        let stopped = false;
        const currentAccount = captureHistoryAccount();
        setPrepared(undefined);
        setError(false);
        void (async () => {
            const context = await nativeDigitalCredentials.getPendingRequest();
            const request = context.pending;
            if (stopped) return;
            setPending(request);
            setIsProvider(Boolean(context.isProvider));
            if (!request) throw new Error('Request unavailable');
            if (!loggedIn) {
                redirectStore.set.lcnRedirect('/native-digital-credentials');
                return;
            }
            if (!isHistoryAccountEligible()) throw new Error('Account unavailable');
            const wallet = (await initWallet()) as unknown as DigitalCredentialWallet;
            const inventory = await readNativeInventory();
            if (!inventory) throw new Error('Inventory unavailable');
            const result = await prepareAccountPresentation(
                wallet,
                inventory,
                request,
                () => !stopped && currentAccount()
            );
            if (!stopped) setPrepared(result);
        })().catch(() => {
            if (!stopped) setError(true);
        });
        return () => {
            stopped = true;
        };
        // initWallet is recreated by the shared hook; account revision is the initialization boundary.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loggedIn, revision]);

    const cancel = async () => {
        if (sending || canceling) return;
        setCanceling(true);
        try {
            if (pending || isProvider)
                await nativeDigitalCredentials.cancel({ requestId: pending?.requestId });
            else history.replace('/wallet');
        } catch {
            setError(true);
            setCanceling(false);
        }
    };
    const approve = async (picks: ConsentPicks) => {
        if (!prepared || !pending || sending) return;
        const accountCurrent = captureHistoryAccount();
        setSending(true);
        try {
            const responseJson = await prepared.approve(picks);
            const active = (await nativeDigitalCredentials.getPendingRequest()).pending;
            if (!accountCurrent() || active?.requestId !== pending.requestId)
                throw new Error('Request expired');
            await nativeDigitalCredentials.complete({ requestId: pending.requestId, responseJson });
        } catch {
            setPrepared(undefined);
            setError(true);
            setSending(false);
        }
    };

    if (!loggedIn && !error) return <ClaimLoginPage />;
    return (
        <IonPage>
            <IonContent>
                {prepared && !error && (
                    <RequestConsent
                        request={prepared.request}
                        dcqlSelection={prepared.selection}
                        disclosurePolicy={prepared.policy}
                        nativeRequester={{
                            name: pending?.callerName,
                            packageName: pending?.callerPackage,
                            origin: prepared.request.client_id,
                        }}
                        onApprove={approve}
                        onCancel={() => void cancel()}
                        submitting={sending}
                        canceling={canceling}
                    />
                )}
                {!prepared && !error && (
                    <NativeRequestState
                        canceling={canceling}
                        onCancel={pending || isProvider ? () => void cancel() : undefined}
                    />
                )}
                {error && (
                    <NativeRequestState
                        unavailable
                        canceling={canceling}
                        onCancel={() => void cancel()}
                    />
                )}
            </IonContent>
        </IonPage>
    );
}
