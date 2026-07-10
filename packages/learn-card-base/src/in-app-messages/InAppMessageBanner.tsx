import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { InAppMessage, InAppMessageAction } from '@learncard/types';
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

    const primaryAction = message.actions.find(a => a.style !== 'dismiss');
    const hasExplicitDismiss = message.actions.some(a => a.style === 'dismiss');
    const showCloseX = message.dismissible && !hasExplicitDismiss;

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
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-base mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-red-700 leading-relaxed">
                        {capgo.error || 'Something went wrong. Please try again.'}
                    </span>
                </div>
            );
        }

        if (capgo.status === 'uptodate') {
            return (
                <div className="mt-3 p-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2">
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="text-emerald-500 text-base mt-0.5 shrink-0"
                    />
                    <span className="text-xs text-emerald-700 leading-relaxed">
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
            <div className="mt-3 w-full py-2 px-3 rounded-[16px] bg-grayscale-900 text-white font-medium text-xs flex flex-col gap-1.5 overflow-hidden relative">
                <div className="flex items-center justify-center gap-2 relative z-10">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{progressText}</span>
                </div>
                <div
                    className="absolute bottom-0 left-0 h-1 bg-emerald-600 transition-all duration-300 ease-out"
                    style={{ width: `${capgo.progress}%` }}
                />
            </div>
        );
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="mx-auto max-w-[600px] bg-white rounded-[20px] shadow-lg border border-grayscale-200 m-3 p-4 animate-fade-in-up font-poppins pointer-events-auto flex items-start gap-3 relative">
                {message.media && message.media.type !== 'youtube' && (
                    <img
                        src={message.media.url}
                        alt={message.media.alt ?? ''}
                        className="w-12 h-12 rounded-[12px] object-cover shrink-0"
                    />
                )}

                <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-sm font-semibold text-grayscale-900 pr-6 truncate">
                        {message.title}
                    </h3>
                    {message.body && (
                        <p className="text-xs text-grayscale-600 mt-0.5 line-clamp-2">
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
                                      className="py-2 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-xs hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
                        className="absolute top-3 right-3 p-1.5 text-grayscale-400 hover:text-grayscale-900 transition-colors rounded-full hover:bg-grayscale-10 shrink-0"
                        aria-label="Close"
                    >
                        <IonIcon icon={closeOutline} className="text-lg" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default InAppMessageBanner;
