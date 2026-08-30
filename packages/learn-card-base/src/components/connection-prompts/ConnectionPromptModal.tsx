import React, { useCallback, useImperativeHandle, useState } from 'react';
import { IonIcon } from '@ionic/react';
import type { LCNConnectionPrompt } from '@learncard/types';
import { alertCircleOutline } from 'ionicons/icons';

import { UserProfilePicture } from '../profilePicture/ProfilePicture';

export type ConnectionPromptCopy = {
    title: (name: string) => string;
    description: string;
    connect: string;
    skipForNow: string;
    connecting: string;
    skipping: string;
    error: string;
};

export type ConnectionPromptModalProps = {
    prompt: LCNConnectionPrompt;
    copy: ConnectionPromptCopy;
    onConnect: (promptId: string) => Promise<void>;
    onSkip: (promptId: string) => Promise<void>;
    actionsRef?: React.MutableRefObject<ConnectionPromptModalActions | null>;
};

export type ConnectionPromptModalActions = {
    requestSkip: () => void;
};

type PendingAction = 'connect' | 'skip' | null;

export const ConnectionPromptModal: React.FC<ConnectionPromptModalProps> = ({
    prompt,
    copy,
    onConnect,
    onSkip,
    actionsRef,
}) => {
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [hasError, setHasError] = useState(false);
    const counterpartName = prompt.counterpart.displayName || prompt.counterpart.profileId;
    const busy = pendingAction !== null;

    const runAction = useCallback(
        async (
            action: Exclude<PendingAction, null>,
            handler: (promptId: string) => Promise<void>
        ): Promise<void> => {
            if (busy) return;

            setPendingAction(action);
            setHasError(false);

            try {
                await handler(prompt.promptId);
            } catch {
                setHasError(true);
            } finally {
                setPendingAction(null);
            }
        },
        [busy, prompt.promptId]
    );

    useImperativeHandle(actionsRef, () => ({ requestSkip: () => void runAction('skip', onSkip) }), [
        onSkip,
        runAction,
    ]);

    return (
        <div className="font-poppins p-6 text-center space-y-5 bg-white rounded-[20px]">
            <div className="flex justify-center">
                <UserProfilePicture
                    user={prompt.counterpart}
                    customContainerClass="w-20 h-20 text-2xl"
                    customImageClass="w-20 h-20 object-cover"
                    customSize={160}
                />
            </div>

            <div>
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {copy.title(counterpartName)}
                </h2>
                <p className="text-sm text-grayscale-600 leading-relaxed">{copy.description}</p>
            </div>

            {hasError && (
                <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-start"
                >
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">{copy.error}</span>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runAction('connect', onConnect)}
                    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {pendingAction === 'connect' ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {copy.connecting}
                        </span>
                    ) : (
                        copy.connect
                    )}
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runAction('skip', onSkip)}
                    className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {pendingAction === 'skip' ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                            {copy.skipping}
                        </span>
                    ) : (
                        copy.skipForNow
                    )}
                </button>
            </div>
        </div>
    );
};

export default ConnectionPromptModal;
