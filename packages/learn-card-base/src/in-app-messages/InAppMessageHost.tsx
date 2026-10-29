import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import type { InAppMessage } from '@learncard/types';

import { useInAppMessages } from './useInAppMessages';
import { markMessageSeen, onDismissalsReset } from './dismissalStore';
import { iamDebug } from './debug';
import { installInAppMessagesDebugGlobals } from './debugGlobals';
import { useInAppMessageOverride, setInAppMessageOverride } from './debugOverrideStore';
import {
    useInAppMessagePresentationGate,
    type PresentationGateOptions,
} from './usePresentationGate';
import { InAppMessageModal } from './InAppMessageModal';
import { InAppMessageBanner } from './InAppMessageBanner';
import { InAppMessageToast } from './InAppMessageToast';
import { emitAppOpenedOnce } from './inAppMessageEvents';
import { isFatigueControlled, recordBlockingShown } from './fatigueStore';
import { useI18nLocale } from '../i18n';
import { localizeMessage } from './localizeMessage';
import { InAppMessageRichPresentation } from './InAppMessageSurface';
import { isInAppMessagePresentationSupported } from './presentationSupport';
import { clearInAppMessageRequest, useInAppMessageRequest } from './deepLinkRequestStore';
import { MessageNavigationContext } from './MessageNavigationContext';
import type {
    InAppMessagePresentationEvent,
    MessageInteraction,
    MessagePresentationProps,
} from './presentationTypes';

export interface InAppMessageHostProps extends PresentationGateOptions {
    onEvent?: (event: InAppMessagePresentationEvent) => void;
    onOpenApp?: (listingId: string, path?: string) => void;
    /** Account-bound private test; respects the presentation gate but records no engagement. */
    testDelivery?: {
        accountDid: string;
        message: InAppMessage;
        onShown: () => void;
        onClose: () => void;
    };
}

export const InAppMessageHost: React.FC<InAppMessageHostProps> = ({
    onEvent,
    onOpenApp,
    testDelivery,
    ...gateOptions
}) => {
    const locale = useI18nLocale();
    const eventRef = useRef(onEvent);
    useLayoutEffect(() => {
        eventRef.current = onEvent;
    }, [onEvent]);
    const { message, messages, credentialFacts } = useInAppMessages();
    const { canPresent, reason } = useInAppMessagePresentationGate(gateOptions);
    const override = useInAppMessageOverride();
    const request = useInAppMessageRequest();
    const launchDarklyClient = useLDClient();
    const [initializedLaunchDarklyClient, setInitializedLaunchDarklyClient] =
        useState<typeof launchDarklyClient>();
    useEffect(() => {
        let canceled = false;

        launchDarklyClient
            ?.waitForInitialization()
            .then(() => {
                if (!canceled) setInitializedLaunchDarklyClient(launchDarklyClient);
            })
            .catch(() => undefined);

        return () => {
            canceled = true;
        };
    }, [launchDarklyClient]);
    const flagDeliveryReady =
        Boolean(launchDarklyClient) && initializedLaunchDarklyClient === launchDarklyClient;
    const previousAccount = useRef(credentialFacts.accountDid);
    useEffect(() => {
        if (previousAccount.current && previousAccount.current !== credentialFacts.accountDid) {
            clearInAppMessageRequest();
        }
        previousAccount.current = credentialFacts.accountDid;
    }, [credentialFacts.accountDid]);
    const requestedMessage = request
        ? messages.find(
              item =>
                  item.id === request.messageId &&
                  item.enabled &&
                  isInAppMessagePresentationSupported(item)
          )
        : undefined;
    useEffect(() => {
        if (!request || requestedMessage || !flagDeliveryReady) return;
        const timer = setTimeout(
            () => clearInAppMessageRequest(request.token),
            Math.max(0, request.requestedAt + 5000 - Date.now())
        );
        return () => clearTimeout(timer);
    }, [flagDeliveryReady, request, requestedMessage]);
    const [opening, setOpening] = useState({
        accountDid: credentialFacts.accountDid,
        ready: false,
    });
    if (opening.accountDid !== credentialFacts.accountDid) {
        setOpening({ accountDid: credentialFacts.accountDid, ready: false });
    }
    const [presented, setPresented] = useState<{
        message: InAppMessage;
        accountDid?: string;
    } | null>(null);

    const [closedIds, setClosedIds] = useState<Set<string>>(() => new Set());
    const shownRef = useRef<string | null>(null);
    const shownOverrideRef = useRef<string | null>(null);
    const gateReasonRef = useRef<string | null>(null);

    useEffect(() => {
        installInAppMessagesDebugGlobals();
    }, []);

    // Without this, "Reset seen state" (debug panel / __inAppMessages.reset())
    // clears the persisted store but a message closed this session would still
    // be blocked by the in-memory closedIds gate, making the reset look broken.
    useEffect(() => {
        return onDismissalsReset(() => {
            setClosedIds(new Set());
            setPresented(null);
            shownRef.current = null;
            shownOverrideRef.current = null;
        });
    }, []);

    useEffect(() => {
        if (gateReasonRef.current === reason) return;

        gateReasonRef.current = reason;
        iamDebug('gate', { canPresent, reason });
    }, [canPresent, reason]);

    useEffect(() => {
        const did = credentialFacts.accountDid;

        if (!canPresent) return;

        if (did) emitAppOpenedOnce(did);
        // Let the event subscription reach evaluation before consuming an impression.
        let canceled = false;
        queueMicrotask(() => {
            if (!canceled) setOpening({ accountDid: did, ready: true });
        });
        return () => {
            canceled = true;
        };
    }, [canPresent, credentialFacts.accountDid]);

    const accountDid = credentialFacts.accountDid ?? undefined;
    const retained =
        presented?.accountDid === accountDid
            ? messages.find(current => current.id === presented?.message.id && current.enabled)
            : undefined;
    const candidate = retained ?? message;
    const messageKey = candidate ? `${accountDid ?? 'anonymous'}:${candidate.id}` : null;
    const realActive = candidate && messageKey && !closedIds.has(messageKey) ? candidate : null;
    const openingReady = opening.accountDid === credentialFacts.accountDid && opening.ready;
    const pendingTest =
        testDelivery &&
        testDelivery.accountDid === accountDid &&
        !closedIds.has(`${accountDid}:${testDelivery.message.id}`)
            ? testDelivery.message
            : null;
    const requested =
        override ??
        (canPresent && openingReady
            ? (pendingTest ?? (request ? (requestedMessage ?? null) : realActive))
            : null);
    // Preview overrides bypass targeting and frequency, never platform security policy.
    const active = requested && isInAppMessagePresentationSupported(requested) ? requested : null;
    const isOverride = Boolean(override);
    const isTest = !isOverride && Boolean(pendingTest && active === pendingTest);
    const isDeepLink = !isOverride && !isTest && Boolean(requestedMessage && request);
    const localized = active ? localizeMessage(active, locale) : null;
    const emit = useCallback(
        (type: InAppMessagePresentationEvent['type'], details: MessageInteraction = {}) => {
            if (!active) return;
            try {
                eventRef.current?.({
                    type,
                    messageId: active.id,
                    presentation: active.presentation,
                    source: isOverride
                        ? 'override'
                        : isTest
                          ? 'test'
                          : isDeepLink
                            ? 'deepLink'
                            : 'flag',
                    ...details,
                });
            } catch {
                // Optional telemetry must never prevent presentation or dismissal.
            }
        },
        [active, isOverride, isTest, isDeepLink]
    );

    // Retain a presented message after its own impression makes it ineligible.
    if (presented && !retained) setPresented(null);
    if (!presented && active && !isOverride && !isTest && !isDeepLink)
        setPresented({ message: active, accountDid });

    const close = useCallback(
        (id: string) => {
            if (override) {
                iamDebug('override:cleared', { id });
                setInAppMessageOverride(null);

                return;
            }

            iamDebug('closed', { id });
            if (isTest) testDelivery?.onClose();
            if (isDeepLink && request) clearInAppMessageRequest(request.token);
            setPresented(current =>
                current?.message.id === id && current.accountDid === accountDid ? null : current
            );

            setClosedIds(prev => {
                const next = new Set(prev);

                next.add(`${accountDid ?? 'anonymous'}:${id}`);

                return next;
            });
        },
        [accountDid, override, isTest, testDelivery, isDeepLink, request]
    );

    const onShown = useCallback(() => {
        // Clearing a preview permits another preview without forgetting the retained campaign.
        if (!isOverride) shownOverrideRef.current = null;
        if (!active) return;

        const key = isOverride
            ? `override:${active.id}:${active.presentation}`
            : `${accountDid ?? 'anonymous'}:${active.id}:${isDeepLink ? request?.token : 'flag'}`;

        const shown = isOverride ? shownOverrideRef : shownRef;
        if (shown.current === key) return;

        shown.current = key;
        iamDebug('shown', {
            id: active.id,
            presentation: active.presentation,
            override: isOverride,
        });

        // Marked seen on first render, not on interaction. Safe because this
        // only runs post-gate (auth settled + route allowed + settleDelayMs of
        // stability), so a transient boot/navigation flicker cannot burn a
        // "once" impression. If the gate's settle debounce is ever removed,
        // revisit this.
        if (isTest) testDelivery?.onShown();
        if (!isOverride && !isTest) {
            markMessageSeen(active.id, active.frequency, Date.now(), accountDid);

            if (isFatigueControlled(active)) recordBlockingShown(Date.now(), accountDid);
        }
        emit('shown');
    }, [accountDid, active, isOverride, isTest, testDelivery, isDeepLink, request, emit]);

    useLayoutEffect(() => {
        if (!active || (active.presentation !== 'story' && active.presentation !== 'iframe'))
            onShown();
    }, [active, onShown]);

    // AnimatePresence must live here, in the always-mounted host: the
    // presented component is removed wholesale on close, so exit animations
    // only play if the presence boundary survives that unmount.
    const key = active
        ? `${accountDid ?? 'anonymous'}:${isOverride}:${isDeepLink ? request?.token : 'flag'}:${active.id}:${active.presentation}`
        : null;
    const onClose: MessagePresentationProps['onClose'] = (reason = 'dismissed', details): void => {
        if (!active) return;
        if (reason === 'dismissed') emit('dismissed', details);
        close(active.id);
    };
    const onAction = (details: MessageInteraction): void => emit('action', details);

    return (
        <MessageNavigationContext.Provider value={{ openApp: onOpenApp }}>
            <AnimatePresence>
                {localized && localized.presentation === 'toast' && (
                    <InAppMessageToast
                        key={key}
                        message={localized}
                        onClose={onClose}
                        onAction={onAction}
                    />
                )}

                {localized && localized.presentation === 'banner' && (
                    <InAppMessageBanner
                        key={key}
                        message={localized}
                        onClose={onClose}
                        onAction={onAction}
                    />
                )}

                {localized && localized.presentation === 'modal' && (
                    <InAppMessageModal
                        key={key}
                        message={localized}
                        onClose={onClose}
                        onAction={onAction}
                    />
                )}
                {localized &&
                    (localized.presentation === 'story' || localized.presentation === 'iframe') && (
                        <InAppMessageRichPresentation
                            key={key}
                            message={localized}
                            onClose={onClose}
                            onShown={onShown}
                            onAction={onAction}
                        />
                    )}
            </AnimatePresence>
        </MessageNavigationContext.Provider>
    );
};

export default InAppMessageHost;
