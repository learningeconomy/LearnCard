import React, { useEffect, useRef, useState } from 'react';
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
    const account = useRef({
        privateKey: currentUser?.privateKey,
        switchedDid,
        generation: currentUser?.privateKey ? crypto.randomUUID() : undefined,
    });
    if (
        account.current.privateKey !== currentUser?.privateKey ||
        account.current.switchedDid !== switchedDid
    ) {
        account.current = {
            privateKey: currentUser?.privateKey,
            switchedDid,
            generation: currentUser?.privateKey ? crypto.randomUUID() : undefined,
        };
    }
    const key = account.current.generation;
    const currentKey = useRef(key);
    currentKey.current = key;
    const requestPromise = useRef<{ key: string; promise: Promise<Request> }>();
    const eventRef = useRef<CredentialStoreEvent>();
    const [eventAvailable, setEventAvailable] = useState(false);
    const invalidated = useRef(false);
    const dismissedRef = useRef(false);
    const exchangeController = useRef<AbortController>();
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
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        // The mediator event and exchange are one-shot. A profile change must
        // never consume another event or repeat an already-used exchange.
        if (requestPromise.current && requestPromise.current.key !== key) {
            invalidated.current = true;
            exchangeController.current?.abort();
            setRequest(undefined);
            setSavedCount(0);
            setError('account');
        }
        if (!key || invalidated.current) return;
        if (!requestPromise.current) {
            const controller = new AbortController();
            exchangeController.current = controller;
            requestPromise.current = {
                key,
                promise: (async () => {
                    const wallet = await initWalletRef.current();
                    const event = await wallet.invoke.receiveChapiEvent();
                    if (!event || !('credential' in event)) throw new ChapiReceiveError('invalid');
                    eventRef.current = event;
                    if (mounted.current) setEventAvailable(true);
                    if (currentKey.current !== key || invalidated.current)
                        throw new ChapiReceiveError('account');
                    const presentation = await loadChapiPresentation(
                        wallet,
                        event,
                        controller.signal
                    );
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
                if (
                    cancelled ||
                    currentKey.current !== key ||
                    invalidated.current ||
                    dismissedRef.current
                )
                    return;
                records.current = result.credentials.map(credential => ({
                    id: credential.id || crypto.randomUUID(),
                    saved: false,
                }));
                setRequest(result);
            })
            .catch(cause => {
                if (
                    !cancelled &&
                    currentKey.current === key &&
                    !invalidated.current &&
                    !dismissedRef.current
                )
                    setError(cause instanceof ChapiReceiveError ? cause.code : 'request');
            });
        return () => {
            cancelled = true;
        };
    }, [key]);

    const accept = async () => {
        if (
            !request ||
            request.key !== key ||
            invalidated.current ||
            savingRef.current ||
            responded.current
        )
            return;
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
                // Even a throwing respondWith may have consumed the event.
                // All credentials are saved; never offer a second response attempt.
                responded.current = true;
                request.event.respondWith(
                    Promise.resolve({
                        dataType: 'VerifiablePresentation',
                        data: request.presentation,
                    })
                );
            } catch {
                throw new ChapiReceiveError('response');
            }
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
        if (savingRef.current || !eventRef.current || responded.current) return;
        dismissedRef.current = true;
        exchangeController.current?.abort();
        responded.current = true;
        try {
            eventRef.current.respondWith(Promise.resolve(null));
            resetInteraction();
            setError(undefined);
            setDismissed(true);
        } catch {
            setError('request');
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
            loading={!visibleRequest && !error && !dismissed}
            saving={saving}
            savedCount={savedCount}
            complete={Boolean(complete && visibleRequest)}
            dismissed={dismissed}
            error={error}
            key={key}
            onAccept={error === 'response' ? undefined : accept}
            onReject={eventAvailable && !responded.current ? reject : undefined}
        />
    );
};
