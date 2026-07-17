import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { InAppMessage, InAppMessageAction } from '@learncard/types';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { useInAppMessageActions } from './useInAppMessageActions';
import { useCapgoUpdate } from './useCapgoUpdate';

export interface InAppMessageBannerProps {
    message: InAppMessage;
    onClose: () => void;
}

export const InAppMessageBanner: React.FC<InAppMessageBannerProps> = ({ message, onClose }) => {
    const { runAction } = useInAppMessageActions();
    const capgo = useCapgoUpdate();
    const [isLoading, setIsLoading] = useState(false);
    const [isCapgoTarget, setIsCapgoTarget] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    const primaryAction = message.actions.find(a => a.style !== 'dismiss');
    // Unlike the modal, the banner never renders dismiss-style actions — so a
    // dismissible banner must always offer the close X or it becomes unclosable
    // (e.g. the Capgo nudge, whose "Later" dismiss action has nowhere to render).
    const showCloseX = message.dismissible;

    const handleAction = async (action: InAppMessageAction) => {
        if (isLoading || isCapgoTarget) return;

        setIsLoading(true);
        try {
            const outcome = await runAction(action.action);
            if (outcome === 'capgo') {
                setIsCapgoTarget(true);
                await capgo.startUpdate();
            } else if (action.closeOnComplete) {
                onClose();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderCapgoState = () => {
        if (capgo.status === 'error') {
            return (
                <div className="mt-3 space-y-2">
                    <div className="p-2.5 bg-red-50/80 backdrop-blur border border-red-100 rounded-xl flex items-start gap-2">
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-red-400 text-base mt-0.5 shrink-0"
                        />
                        <span className="text-xs text-red-700 leading-relaxed">
                            {capgo.error || 'Something went wrong. Please try again.'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-xs text-grayscale-500 hover:text-grayscale-900 transition-colors font-medium py-1"
                    >
                        Close
                    </button>
                </div>
            );
        }

        if (capgo.status === 'uptodate') {
            return (
                <div className="mt-3 space-y-2">
                    <div className="p-2.5 bg-emerald-50/80 backdrop-blur border border-emerald-100 rounded-xl flex items-start gap-2">
                        <IonIcon
                            icon={checkmarkCircleOutline}
                            className="text-emerald-500 text-base mt-0.5 shrink-0"
                        />
                        <span className="text-xs text-emerald-700 leading-relaxed">
                            {"You're on the latest version."}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-xs text-grayscale-500 hover:text-grayscale-900 transition-colors font-medium py-1"
                    >
                        Done
                    </button>
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
            <div className="mt-3 w-full py-2 px-3 rounded-[16px] bg-grayscale-900 text-white font-medium text-xs flex flex-col gap-1.5 overflow-hidden relative shadow-sm">
                <div className="flex items-center justify-center gap-2 relative z-10">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{progressText}</span>
                </div>
                <div
                    className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-300 ease-out shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
                    style={{ width: `${capgo.progress}%` }}
                />
            </div>
        );
    };

    const variants: Variants = {
        hidden: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.96,
            y: shouldReduceMotion ? 0 : -12,
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
            y: shouldReduceMotion ? 0 : -12,
            transition: { duration: 0.2 },
        },
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <motion.div
                className="mx-auto max-w-[600px] bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-white/60 m-3 p-4 font-poppins pointer-events-auto flex items-start gap-3 relative overflow-hidden"
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

                {message.media && message.media.type !== 'youtube' ? (
                    <img
                        src={message.media.url}
                        alt={message.media.alt ?? ''}
                        className="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-white/60 shadow-sm"
                    />
                ) : message.emoji ? (
                    <div className="w-12 h-12 rounded-[12px] bg-white/70 backdrop-blur border border-white/60 shadow-sm flex items-center justify-center shrink-0">
                        <span className="text-[24px] leading-none" aria-hidden="true">
                            {message.emoji}
                        </span>
                    </div>
                ) : null}

                <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-sm font-semibold text-grayscale-900 pr-6 truncate tracking-[-0.01em]">
                        {message.title}
                    </h3>
                    {message.body && (
                        <p className="text-xs text-grayscale-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {message.body}
                        </p>
                    )}

                    {isCapgoTarget
                        ? renderCapgoState()
                        : primaryAction && (
                              <div className="mt-3">
                                  <button
                                      onClick={() => handleAction(primaryAction)}
                                      disabled={isLoading}
                                      className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-xs hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                                  >
                                      {isLoading && (
                                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      )}
                                      {primaryAction.label}
                                  </button>
                              </div>
                          )}
                </div>

                {showCloseX && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 bg-white/60 backdrop-blur border border-white/60 text-grayscale-400 hover:text-grayscale-900 transition-colors rounded-full hover:bg-white/80 shrink-0 z-10"
                        aria-label="Close"
                    >
                        <IonIcon icon={closeOutline} className="text-lg block" />
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default InAppMessageBanner;
