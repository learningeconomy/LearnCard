import React, { useEffect, useRef } from 'react';
import {
    useIsLoggedIn,
    useFeatureConfig,
    useTranscriptStatus,
    useModal,
    ModalTypes,
    useWallet,
    getLogger,
} from 'learn-card-base';
import { useAppAuth } from '../providers/AuthCoordinatorProvider';
import { TranscriptRequestFlow } from '../components/classlink/TranscriptRequestFlow';
import { redirectStore } from 'learn-card-base';

const log = getLogger('transcript-prompt');

const PROMPT_DISMISSAL_KEY_PREFIX = 'transcript_prompt_dismissed_';
const PROMPT_REOFFER_DAYS = 14;

export const useTranscriptPrompt = () => {
    const isLoggedIn = useIsLoggedIn();
    const features = useFeatureConfig();
    const { state: coordinatorState } = useAppAuth();
    const { newModal, closeModal } = useModal();
    const { initWallet } = useWallet();
    const isOnboardingOpen = redirectStore.use.isOnboardingOpen();
    const hasShownRef = useRef(false);

    const isReady = coordinatorState.status === 'ready' && isLoggedIn && !isOnboardingOpen;
    const isEnabled = features.classlinkTranscriptOptIn;

    // Only fetch status if we might show the prompt
    const status = useTranscriptStatus(isReady && isEnabled);

    useEffect(() => {
        if (!isReady || !isEnabled || status.isLoading || status.isError || !status.data) return;
        if (hasShownRef.current) return;
        const data = status.data;

        // Only show if eligible and no latest request
        if (!data.eligible || data.latest) return;

        // Claim the session slot before any await so concurrent effect runs cannot stack modals.
        hasShownRef.current = true;
        const checkAndShowPrompt = async () => {
            try {
                const wallet = await initWallet();
                const did = wallet.id.did();
                // Short non-reversible key so the raw DID is not stored.
                const hash = Array.from(did).reduce(
                    (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
                    0
                );
                const storageKey = `${PROMPT_DISMISSAL_KEY_PREFIX}${hash}`;
                const shownAt = Number(localStorage.getItem(storageKey));
                const daysSinceShown = (Date.now() - shownAt) / (1000 * 60 * 60 * 24);
                if (shownAt && daysSinceShown < PROMPT_REOFFER_DAYS) return;

                // Showing counts as an offer: closing it any way waits 14 days to re-offer.
                localStorage.setItem(storageKey, Date.now().toString());

                newModal(
                    <div className="p-6 bg-white rounded-t-[20px] max-h-[90vh] overflow-y-auto">
                        <TranscriptRequestFlow
                            variant="modal"
                            stateDisplayName={data.stateDisplayName ?? ''}
                            onDone={() => closeModal()}
                        />
                    </div>,
                    { className: 'bg-transparent!' },
                    { desktop: ModalTypes.Center, mobile: ModalTypes.BottomSheet }
                );
            } catch (error) {
                log.error('Failed to show transcript prompt', error);
            }
        };

        void checkAndShowPrompt();
    }, [
        isReady,
        isEnabled,
        status.isLoading,
        status.isError,
        status.data,
        initWallet,
        newModal,
        closeModal,
    ]);
};
