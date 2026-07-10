import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useToast, ToastTypeEnum } from '../hooks/useToast';
import { useInAppMessages } from './useInAppMessages';
import { markMessageSeen } from './dismissalStore';
import { iamDebug } from './debug';
import { installInAppMessagesDebugGlobals } from './debugGlobals';
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

    const active = message && !closedIds.has(message.id) ? message : null;

    const close = useCallback((id: string) => {
        iamDebug('closed', { id });

        setClosedIds(prev => {
            const next = new Set(prev);

            next.add(id);

            return next;
        });
    }, []);

    useEffect(() => {
        if (!canPresent || !active || shownRef.current === active.id) return;

        shownRef.current = active.id;
        iamDebug('shown', { id: active.id, presentation: active.presentation });
        markMessageSeen(active.id, active.frequency);

        if (active.presentation === 'toast') {
            presentToast(active.body ? `${active.title} — ${active.body}` : active.title, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            close(active.id);
        }
    }, [canPresent, active, presentToast, close]);

    if (!canPresent || !active || active.presentation === 'toast') return null;

    if (active.presentation === 'banner') {
        return <InAppMessageBanner message={active} onClose={() => close(active.id)} />;
    }

    return <InAppMessageModal message={active} onClose={() => close(active.id)} />;
};

export default InAppMessageHost;
