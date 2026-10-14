import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CredentialStoreEvent } from '@learncard/chapi-plugin';
import type { VC, VP } from '@learncard/types';
import { chapiStore, redirectStore, useCurrentUser, useWallet } from 'learn-card-base';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import {
    getCredentialName,
    getImageUrlFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    CredentialReceiveScreen,
    type CredentialReceiveScreenProps,
} from './CredentialReceiveScreen';
import { ChapiReceiveError, getReceivedCredentials, loadChapiPresentation } from './chapiReceive';

const resetInteraction = () => {
    try {
        chapiStore.set.isChapiInteraction(null);
        redirectStore.set.authRedirect(null);
    } catch {
        // Local cleanup must not turn an acknowledged save into a retry.
    }
};

type Request = {
    key: string;
    event: CredentialStoreEvent;
    presentation: VP;
    credentials: VC[];
    did: string;
};

export const CredentialReceivePage = () => {
    const currentUser = useCurrentUser();
    const { initWallet, storeAndAddVCToWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;
    const switchedDid = switchedProfileStore.use.switchedDid();
    // Opaque generation: returning to the same profile must not revive work
    // started before a switch, or copy private key material into request state.
    const generation = useMemo(
        () => (switchedDid || currentUser?.privateKey ? crypto.randomUUID() : undefined),
        [currentUser?.privateKey, switchedDid]
    );
    const key = currentUser?.privateKey ? generation : undefined;
    const currentKey = useRef(key);
    currentKey.current = key;
    const requestPromise = useRef<{ key: string; promise: Promise<Request> }>();
    const eventRef = useRef<{ key: string; event: CredentialStoreEvent }>();
    const mounted = useRef(true);
    const responded = useRef(false);
    const savingRef = useRef(false);
    const records = useRef<{ id: string; saved: boolean }[]>([]);
    const [request, setRequest] = useState<Request>();
    const [saving, setSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
    const [complete, setComplete] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [error, setError] = useState<CredentialReceiveScreenProps['error']>();

    useEffect(() => {
        mounted.current = true;
        if (!key) return;
        let cancelled = false;
        if (requestPromise.current?.key !== key) {
            setRequest(undefined);
            setError(undefined);
            setComplete(false);
            setDismissed(false);
            setSavedCount(0);
            responded.current = false;
            records.current = [];
            eventRef.current = undefined;
            requestPromise.current = {
                key,
                promise: (async () => {
                    const wallet = await initWalletRef.current();
                    const event = await wallet.invoke.receiveChapiEvent();
                    if (currentKey.current !== key) throw new ChapiReceiveError('request');
                    if (!event || !('credential' in event)) throw new ChapiReceiveError('invalid');
                    eventRef.current = { key, event };
                    const presentation = await loadChapiPresentation(wallet, event);
                    return {
                        key,
                        event,
                        presentation,
                        credentials: getReceivedCredentials(presentation),
                        did: wallet.id.did(),
                    };
                })(),
            };
        }
        // Reuse the pending request across React effect replays; consuming the
        // mediator event or starting a one-use exchange twice can time it out.
        requestPromise.current.promise
            .then(result => {
                if (cancelled || currentKey.current !== key) return;
                records.current = result.credentials.map(() => ({
                    id: crypto.randomUUID(),
                    saved: false,
                }));
                setRequest(result);
            })
            .catch(cause => {
                if (!cancelled && currentKey.current === key)
                    setError(cause instanceof ChapiReceiveError ? cause.code : 'request');
            });
        return () => {
            mounted.current = false;
            cancelled = true;
        };
    }, [key]);

    const accept = async () => {
        if (!request || request.key !== key || savingRef.current || responded.current) return;
        savingRef.current = true;
        setSaving(true);
        setError(undefined);
        try {
            for (const [index, credential] of request.credentials.entries()) {
                if (!mounted.current || currentKey.current !== key) return;
                const record = records.current[index];
                if (record.saved) continue;
                // Use the existing known-credential save path, rather than
                // immediately re-fetching a URI that was just uploaded.
                const result = await storeAndAddVCToWallet(credential, {
                    id: record.id,
                    title: getCredentialName(credential),
                    imgUrl: getImageUrlFromCredential(credential),
                });
                if (!result.result || !result.credentialUri) throw new ChapiReceiveError('save');
                if (!mounted.current || currentKey.current !== key) return;
                record.saved = true;
                setSavedCount(records.current.filter(item => item.saved).length);
            }
            try {
                request.event.respondWith(
                    Promise.resolve({
                        dataType: 'VerifiablePresentation',
                        data: request.presentation,
                    })
                );
            } catch {
                throw new ChapiReceiveError('response');
            }
            responded.current = true;
            resetInteraction();
            setComplete(true);
        } catch (cause) {
            if (currentKey.current === key)
                setError(cause instanceof ChapiReceiveError ? cause.code : 'save');
        } finally {
            savingRef.current = false;
            if (mounted.current) setSaving(false);
        }
    };

    const reject = () => {
        if (
            savingRef.current ||
            !eventRef.current ||
            eventRef.current.key !== key ||
            responded.current
        )
            return;
        try {
            eventRef.current.event.respondWith(Promise.resolve(null));
            responded.current = true;
            resetInteraction();
            setDismissed(true);
        } catch {
            setError('response');
        }
    };

    const visibleRequest = request?.key === key ? request : undefined;
    let origin: string | undefined;
    try {
        if (visibleRequest?.event.credentialRequestOrigin)
            origin = new URL(visibleRequest.event.credentialRequestOrigin).origin;
    } catch {
        /* An origin is optional, never a verified issuer identity. */
    }
    return (
        <CredentialReceiveScreen
            credentials={visibleRequest?.credentials ?? []}
            walletDid={visibleRequest?.did}
            origin={origin}
            loading={!visibleRequest && !error}
            saving={saving}
            savedCount={savedCount}
            complete={Boolean(complete && visibleRequest)}
            dismissed={dismissed}
            error={error}
            onAccept={accept}
            onReject={eventRef.current && eventRef.current.key === key ? reject : undefined}
        />
    );
};
