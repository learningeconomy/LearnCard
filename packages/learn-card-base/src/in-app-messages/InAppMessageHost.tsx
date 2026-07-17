import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useToast, ToastTypeEnum } from '../hooks/useToast';
import { useInAppMessages } from './useInAppMessages';
import { markMessageSeen } from './dismissalStore';
import { iamDebug } from './debug';
import { installInAppMessagesDebugGlobals } from './debugGlobals';
import { useInAppMessageOverride, setInAppMessageOverride } from './debugOverrideStore';
import {
    useInAppMessagePresentationGate,
    type PresentationGateOptions,
} from './usePresentationGate';
import { InAppMessageModal } from './InAppMessageModal';
import { InAppMessageBanner } from './InAppMessageBanner';

export type InAppMessageHostProps = PresentationGateOptions;

export const InAppMessageHost: React.FC<InAppMessageHostProps> = gateOptions => {
    const { message } = useInAppMessages();
    const { presentToast } = useToast();
    const { canPresent, reason } = useInAppMessagePresentationGate(gateOptions);
    const override = useInAppMessageOverride();

    const [closedIds, setClosedIds] = useState<Set<string>>(() => new Set());
    const shownRef = useRef<string | null>(null);
    const gateReasonRef = useRef<string | null>(null);

    useEffect(() => {
        installInAppMessagesDebugGlobals();
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

        if (!isOverride) markMessageSeen(active.id, active.frequency);

        if (active.presentation === 'toast') {
            presentToast(active.body ? `${active.title} — ${active.body}` : active.title, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            close(active.id);
        }
    }, [active, isOverride, presentToast, close]);

    if (!active || active.presentation === 'toast') return null;

    if (active.presentation === 'banner') {
        return <InAppMessageBanner message={active} onClose={() => close(active.id)} />;
    }

    return <InAppMessageModal message={active} onClose={() => close(active.id)} />;
};

export default InAppMessageHost;
