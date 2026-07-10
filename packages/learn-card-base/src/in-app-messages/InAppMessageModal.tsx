import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { InAppMessage, InAppMessageAction } from '@learncard/types';
import { Overlay } from '../auth-coordinator/components/Overlay';
import { MessageMedia } from './MessageMedia';
import { useInAppMessageActions } from './useInAppMessageActions';
import { useCapgoUpdate } from './useCapgoUpdate';

export interface InAppMessageModalProps {
    message: InAppMessage;
    onClose: () => void;
}

export const InAppMessageModal: React.FC<InAppMessageModalProps> = ({ message, onClose }) => {
    const { runAction } = useInAppMessageActions();
    const capgo = useCapgoUpdate();
    const [loadingActionIndex, setLoadingActionIndex] = useState<number | null>(null);
    const [capgoActionIndex, setCapgoActionIndex] = useState<number | null>(null);

    const handleAction = async (action: InAppMessageAction, index: number) => {
        if (loadingActionIndex !== null || capgoActionIndex !== null) return;

        setLoadingActionIndex(index);
        try {
            const outcome = await runAction(action.action);
            if (outcome === 'capgo') {
                setCapgoActionIndex(index);
                await capgo.startUpdate();
            } else if (action.closeOnComplete) {
                onClose();
            }
        } finally {
            setLoadingActionIndex(null);
        }
    };

    const hasExplicitDismiss = message.actions.some(a => a.style === 'dismiss');
    const showCloseX = message.dismissible && !hasExplicitDismiss;

    return (
        <Overlay>
            <div className="relative p-6 font-poppins space-y-5 max-w-md mx-auto text-left">
                {showCloseX && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-grayscale-400 hover:text-grayscale-900 transition-colors rounded-full hover:bg-grayscale-10"
                        aria-label="Close"
                    >
                        <IonIcon icon={closeOutline} className="text-xl" />
                    </button>
                )}

                {message.media && <MessageMedia media={message.media} />}

                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-grayscale-900 pr-8">
                        {message.title}
                    </h2>
                    {message.body && (
                        <p className="text-sm text-grayscale-600 leading-relaxed">{message.body}</p>
                    )}
                </div>

                {message.actions.length > 0 && (
                    <div className="flex flex-col gap-3 pt-2">
                        {message.actions.map((action, index) => {
                            const isCapgoTarget = capgoActionIndex === index;
                            const isLoading = loadingActionIndex === index;

                            if (isCapgoTarget) {
                                if (capgo.status === 'error') {
                                    return (
                                        <div
                                            key={index}
                                            className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
                                        >
                                            <IonIcon
                                                icon={alertCircleOutline}
                                                className="text-red-400 text-lg mt-0.5 shrink-0"
                                            />
                                            <span className="text-sm text-red-700 leading-relaxed">
                                                {capgo.error ||
                                                    'Something went wrong. Please try again.'}
                                            </span>
                                        </div>
                                    );
                                }

                                if (capgo.status === 'uptodate') {
                                    return (
                                        <div
                                            key={index}
                                            className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5"
                                        >
                                            <IonIcon
                                                icon={checkmarkCircleOutline}
                                                className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                            />
                                            <span className="text-sm text-emerald-700 leading-relaxed">
                                                {"You're on the latest version."}
                                            </span>
                                        </div>
                                    );
                                }

                                const progressText =
                                    capgo.status === 'checking'
                                        ? 'Checking...'
                                        : capgo.status === 'downloading'
                                        ? `Downloading... ${Math.round(capgo.progress)}%`
                                        : 'Installing...';

                                return (
                                    <div
                                        key={index}
                                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm flex flex-col gap-2 overflow-hidden relative"
                                    >
                                        <div className="flex items-center justify-center gap-2 relative z-10">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{progressText}</span>
                                        </div>
                                        <div
                                            className="absolute bottom-0 left-0 h-1 bg-emerald-600 transition-all duration-300 ease-out"
                                            style={{ width: `${capgo.progress}%` }}
                                        />
                                    </div>
                                );
                            }

                            if (action.style === 'dismiss') {
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAction(action, index)}
                                        disabled={isLoading || capgoActionIndex !== null}
                                        className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors py-2 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-600 rounded-full animate-spin" />
                                                {action.label}
                                            </span>
                                        ) : (
                                            action.label
                                        )}
                                    </button>
                                );
                            }

                            let buttonClass =
                                'py-3 px-4 rounded-[20px] font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ';
                            let spinnerClass = 'w-4 h-4 border-2 rounded-full animate-spin ';

                            if (action.style === 'primary') {
                                buttonClass += 'bg-grayscale-900 text-white hover:opacity-90';
                                spinnerClass += 'border-white/30 border-t-white';
                            } else if (action.style === 'positive') {
                                buttonClass += 'bg-emerald-600 text-white hover:bg-emerald-700';
                                spinnerClass += 'border-white/30 border-t-white';
                            } else if (action.style === 'secondary') {
                                buttonClass +=
                                    'border border-grayscale-300 text-grayscale-700 hover:bg-grayscale-10';
                                spinnerClass += 'border-grayscale-300 border-t-grayscale-700';
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAction(action, index)}
                                    disabled={isLoading || capgoActionIndex !== null}
                                    className={buttonClass}
                                >
                                    {isLoading && <span className={spinnerClass} />}
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Overlay>
    );
};

export default InAppMessageModal;
