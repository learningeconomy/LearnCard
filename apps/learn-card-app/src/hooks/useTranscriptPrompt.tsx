import React, { useEffect, useRef, useState } from 'react';
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
import { KeepAccountStep } from '../components/classlink/KeepAccountStep';
import { useKeepAccountOffer } from '../components/classlink/useKeepAccountOffer';
import { markKeepAccountAskedThisSession } from '../components/classlink/keepAccountSession';
import { redirectStore } from 'learn-card-base';

const log = getLogger('transcript-prompt');

const PROMPT_DISMISSAL_KEY_PREFIX = 'transcript_prompt_dismissed_';
const PROMPT_REOFFER_DAYS = 14;

/** Per-account key for when the prompt was last offered (short hash: no raw DID stored). */
export const getTranscriptPromptKey = (did: string): string =>
    `${PROMPT_DISMISSAL_KEY_PREFIX}${Array.from(did).reduce(
        (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
        0
    )}`;

/**
 * Record that the transcript was just offered (e.g. the onboarding step the user
 * skipped), so the prompt waits its usual 14 days before offering it again.
 */
export const markTranscriptPromptOffered = (did: string): void => {
    try {
        localStorage.setItem(getTranscriptPromptKey(did), Date.now().toString());
    } catch {
        /* Best effort: at worst the prompt offers it again. */
    }
};

/** The sheet's "keep your account" step on its own, e.g. reopened after an overlay. */
const KeepAccountSheet: React.FC<{ onClose: () => void; onReopen: () => void }> = ({
    onClose,
    onReopen,
}) => (
    <KeepAccountStep
        variant="sheet"
        source="transcript_modal"
        onComplete={onClose}
        onDismiss={onClose}
        onBeforeOverlay={onClose}
        onOverlayComplete={onReopen}
    />
);

/**
 * The transcript prompt sheet: the guided request flow and, once the server reports the
 * transcript arrived, the "keep your account" step when the account still needs its
 * personal email.
 */
export const TranscriptPromptSheet: React.FC<{
    stateDisplayName: string;
    onClose: () => void;
    /** Reopen the sheet on the keep-account step after a provider overlay finished. */
    onReopenKeepAccount?: () => void;
}> = ({ stateDisplayName, onClose, onReopenKeepAccount }) => {
    const [keepAccount, setKeepAccount] = useState(false);
    const { offer, continuity } = useKeepAccountOffer();

    return (
        <div className="p-6 bg-white rounded-t-[20px] max-h-[90vh] overflow-y-auto">
            {keepAccount ? (
                <KeepAccountSheet onClose={onClose} onReopen={onReopenKeepAccount ?? onClose} />
            ) : (
                <TranscriptRequestFlow
                    variant="modal"
                    stateDisplayName={stateDisplayName}
                    onDone={({ arrived }) => {
                        if (arrived && offer && continuity?.nextStep === 'email') {
                            // Asked here: the dashboard banner waits for a later session,
                            // however this sheet is closed.
                            markKeepAccountAskedThisSession();
                            setKeepAccount(true);
                        } else onClose();
                    }}
                />
            )}
        </div>
    );
};

export const useTranscriptPrompt = () => {
    const isLoggedIn = useIsLoggedIn();
    const features = useFeatureConfig();
    const { state: coordinatorState, providerOverlayOpen } = useAppAuth();
    const { newModal, closeModal } = useModal();
    const { initWallet } = useWallet();
    const isOnboardingOpen = redirectStore.use.isOnboardingOpen();
    const hasShownRef = useRef(false);

    // Never stacked over a provider overlay (e.g. the first-time PIN prompt): wait for it.
    const isReady =
        coordinatorState.status === 'ready' &&
        isLoggedIn &&
        !isOnboardingOpen &&
        !providerOverlayOpen;
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
                const shownAt = Number(localStorage.getItem(getTranscriptPromptKey(did)));
                const daysSinceShown = (Date.now() - shownAt) / (1000 * 60 * 60 * 24);
                if (shownAt && daysSinceShown < PROMPT_REOFFER_DAYS) return;

                // Showing counts as an offer: closing it any way waits 14 days to re-offer.
                markTranscriptPromptOffered(did);

                const sheetOptions = { className: 'bg-transparent!' };
                const sheetTypes = { desktop: ModalTypes.Center, mobile: ModalTypes.BottomSheet };
                const reopenKeepAccount = (): void => {
                    newModal(
                        <div className="p-6 bg-white rounded-t-[20px] max-h-[90vh] overflow-y-auto">
                            <KeepAccountSheet
                                onClose={() => closeModal()}
                                onReopen={reopenKeepAccount}
                            />
                        </div>,
                        sheetOptions,
                        sheetTypes
                    );
                };
                newModal(
                    <TranscriptPromptSheet
                        stateDisplayName={data.stateDisplayName ?? ''}
                        onClose={() => closeModal()}
                        onReopenKeepAccount={reopenKeepAccount}
                    />,
                    sheetOptions,
                    sheetTypes
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
