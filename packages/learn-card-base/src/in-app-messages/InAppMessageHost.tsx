import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

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

export type InAppMessageHostProps = PresentationGateOptions;

export const InAppMessageHost: React.FC<InAppMessageHostProps> = gateOptions => {
    const { message } = useInAppMessages();
    const { canPresent, reason } = useInAppMessagePresentationGate(gateOptions);
    const override = useInAppMessageOverride();

    const [closedIds, setClosedIds] = useState<Set<string>>(() => new Set());
    const shownRef = useRef<string | null>(null);
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
            shownRef.current = null;
        });
    }, []);

    useEffect(() => {
        if (gateReasonRef.current === reason) return;

        gateReasonRef.current = reason;
        iamDebug('gate', { canPresent, reason });
    }, [canPresent, reason]);

    const realActive = message && !closedIds.has(message.id) ? message : null;
    const active = override ?? (canPresent ? realActive : null);
    const isOverride = Boolean(override);

    const close = useCallback(
        (id: string) => {
            if (override) {
                iamDebug('override:cleared', { id });
                setInAppMessageOverride(null);

                return;
            }

            iamDebug('closed', { id });

            setClosedIds(prev => {
                const next = new Set(prev);

                next.add(id);

                return next;
            });
        },
        [override]
    );

    useEffect(() => {
        if (!active) {
            // Only reset dedupe state for overrides: clearing a preview must
            // allow the same draft (same id) to be previewed again, while real
            // messages keep their once-per-appearance semantics intact.
            if (shownRef.current?.startsWith('override:')) shownRef.current = null;

            return;
        }

        const key = isOverride ? `override:${active.id}:${active.presentation}` : active.id;

        if (shownRef.current === key) return;

        shownRef.current = key;
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
        if (!isOverride) markMessageSeen(active.id, active.frequency);
    }, [active, isOverride]);

    // AnimatePresence must live here, in the always-mounted host: the
    // presented component is removed wholesale on close, so exit animations
    // only play if the presence boundary survives that unmount.
    const key = active ? `${active.id}:${active.presentation}` : null;

    return (
        <AnimatePresence>
            {active && active.presentation === 'toast' && (
                <InAppMessageToast key={key} message={active} onClose={() => close(active.id)} />
            )}

            {active && active.presentation === 'banner' && (
                <InAppMessageBanner key={key} message={active} onClose={() => close(active.id)} />
            )}

            {active && active.presentation === 'modal' && (
                <InAppMessageModal key={key} message={active} onClose={() => close(active.id)} />
            )}
        </AnimatePresence>
    );
};

export default InAppMessageHost;
