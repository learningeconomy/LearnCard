import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { InAppMessage, InAppMessageAction } from '@learncard/types';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';
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
    const shouldReduceMotion = useReducedMotion();

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

    const backdropVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
    };

    const cardVariants: Variants = {
        hidden: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.96,
            y: shouldReduceMotion ? 0 : 12,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 300 },
        },
        exit: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.96,
            transition: { duration: 0.2 },
        },
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-grayscale-900/40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)] backdrop-blur-md"
                style={{
                    paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
                }}
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <motion.div
                    className="relative w-full max-w-[480px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] font-poppins text-center overflow-hidden"
                    variants={cardVariants}
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

                    {showCloseX && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/60 backdrop-blur border border-white/60 text-grayscale-400 hover:text-grayscale-900 transition-colors rounded-full hover:bg-white/80 z-10"
                            aria-label="Close"
                        >
                            <IonIcon icon={closeOutline} className="text-xl block" />
                        </button>
                    )}

                    <div className="p-6 sm:p-8 space-y-6">
                        {message.media && <MessageMedia media={message.media} />}

                        <div className="space-y-2 px-2">
                            <h2 className="text-[22px] font-semibold text-grayscale-900 tracking-[-0.01em]">
                                {message.title}
                            </h2>
                            {message.body && (
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    {message.body}
                                </p>
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
                                                    className="p-3.5 bg-red-50/80 backdrop-blur border border-red-100 rounded-[20px] flex items-start gap-2.5 text-left"
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
                                                    className="p-3.5 bg-emerald-50/80 backdrop-blur border border-emerald-100 rounded-[20px] flex items-start gap-2.5 text-left"
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
                                                className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm flex flex-col gap-2 overflow-hidden relative shadow-sm"
                                            >
                                                <div className="flex items-center justify-center gap-2 relative z-10">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>{progressText}</span>
                                                </div>
                                                <div
                                                    className="absolute bottom-0 left-0 h-1.5 bg-emerald-500 transition-all duration-300 ease-out shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
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
                                                className="text-sm text-grayscale-500 hover:text-grayscale-900 transition-colors py-2 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
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
                                        'py-3.5 px-4 rounded-[20px] font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ';
                                    let spinnerClass =
                                        'w-4 h-4 border-2 rounded-full animate-spin ';

                                    if (action.style === 'primary') {
                                        buttonClass +=
                                            'bg-grayscale-900 text-white hover:opacity-90 active:scale-[0.98] shadow-sm';
                                        spinnerClass += 'border-white/30 border-t-white';
                                    } else if (action.style === 'positive') {
                                        buttonClass +=
                                            'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-sm';
                                        spinnerClass += 'border-white/30 border-t-white';
                                    } else if (action.style === 'secondary') {
                                        buttonClass +=
                                            'border border-grayscale-300 text-grayscale-700 hover:bg-white/50 active:scale-[0.98]';
                                        spinnerClass +=
                                            'border-grayscale-300 border-t-grayscale-700';
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
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InAppMessageModal;
