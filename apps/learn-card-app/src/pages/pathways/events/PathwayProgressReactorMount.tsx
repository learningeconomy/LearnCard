/**
 * PathwayProgressReactorMount — two-job app-shell component.
 *
 * 1. **Reactor subscription.** Mounts `pathwayProgressReactor` on
 *    the default `walletEventBus` exactly once per app session.
 *    The reactor does the interesting work (invoking the binders,
 *    writing proposals, auto-accepting); this component is the
 *    React-lifecycle glue around that singleton.
 *
 * 2. **Affordance presentation.** Observes every dispatch record
 *    and, when a credential ingest advanced at least one node or
 *    bound at least one outcome, presents the
 *    `CredentialClaimedPathwayCta` as a modal via the app's
 *    shared `useModal` surface.
 *
 *    Presenting globally (rather than per-claim-surface) matters
 *    because credentials land through many paths — interactive
 *    claim links, dashboard claims, partner-SDK postMessages,
 *    consent-flow background sync, notification claims. Every one
 *    of them flows through `useAddCredentialToWallet` and out to
 *    the reactor; a single subscriber here means every ingest
 *    source automatically gets the pathway affordance without the
 *    surfaces needing to know about pathways at all.
 *
 *    The component is explicitly NOT a toast replacement — claim
 *    surfaces keep their own success toast. This presenter only
 *    *adds* the pathway affordance when there's something
 *    pathway-relevant to say, which is a smaller universe than
 *    "every claim succeeded".
 *
 * ## Placement
 *
 * Rendered inside `FullApp` under `ModalsProvider` so the
 * `useModal` surface is available. Strict-Mode double-mount safe
 * via the useEffect cleanup.
 */

import React, { useEffect, useRef } from 'react';
import { useModal, ModalTypes } from 'learn-card-base';

import CredentialClaimedPathwayCta from './CredentialClaimedPathwayCta';
import {
    pathwayProgressReactor,
    type ProgressDispatchRecord,
} from './pathwayProgressReactor';

/**
 * Does this dispatch have learner-visible progress to celebrate?
 * We only present the modal for credential ingests — AI session
 * completions already have their own in-chat summary UX, and
 * surfacing a second modal on top of that would be noisy.
 */
const shouldPresentForDispatch = (record: ProgressDispatchRecord): boolean => {
    if (record.eventKind !== 'credential-ingested') return false;

    const hasAnyProgress =
        record.nodeCompletions.length > 0
        || (record.outcomeBindings?.length ?? 0) > 0;

    return hasAnyProgress;
};

const PathwayProgressReactorMount: React.FC = () => {
    const { newModal, closeModal } = useModal();

    // Debounce: a single credential can produce multiple
    // dispatches rapidly (outcomes + nodes), but we only want ONE
    // modal per credentialUri. Track the most-recently-shown URI
    // to collapse rapid-fire duplicate presentations.
    const lastShownCredentialUri = useRef<string | null>(null);

    useEffect(() => {
        const stopReactor = pathwayProgressReactor.mount();

        const unsubscribe = pathwayProgressReactor.subscribe(record => {
            if (!shouldPresentForDispatch(record)) return;
            if (!record.credentialUri) return;
            if (record.credentialUri === lastShownCredentialUri.current) return;

            lastShownCredentialUri.current = record.credentialUri;

            // Defer to the next tick so any in-flight claim-surface
            // modal dismiss finishes first — presenting a fresh
            // modal while another is dismissing leaves a stacking
            // glitch on Ionic's side.
            const scheduled = setTimeout(() => {
                newModal(
                    <CredentialClaimedPathwayCta
                        credentialUri={record.credentialUri ?? null}
                        onNavigate={() => closeModal()}
                        onDismiss={() => closeModal()}
                        className="w-full"
                    />,
                    {
                        sectionClassName: '!max-w-[500px] !bg-transparent !shadow-none',
                        // `hideButton: true` suppresses the modal-chrome
                        // X. The CTA component has its own primary
                        // action + "Later" dismiss + auto-dismiss path,
                        // so adding a third close affordance competes
                        // with the primary and muddies the moment. The
                        // transparent sectionClassName above lets our
                        // glass card provide the only visible surface.
                        hideButton: true,
                        usePortal: true,
                    },
                    { desktop: ModalTypes.Center, mobile: ModalTypes.Center },
                );
            }, 150);

            return () => clearTimeout(scheduled);
        });

        return () => {
            unsubscribe();
            stopReactor();
        };
        // `newModal` / `closeModal` are stable function references
        // from the modals provider; the subscription lifetime is
        // tied to the component's, not theirs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};

export default PathwayProgressReactorMount;
