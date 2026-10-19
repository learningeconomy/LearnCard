import React, { useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import type { InAppMessageAction } from '@learncard/types';
import { useInAppMessageActions } from './useInAppMessageActions';
import { useCapgoUpdate } from './useCapgoUpdate';
import { useT } from '../i18n';
import type { MessagePresentationProps } from './presentationTypes';

interface MessageActionsProps extends Pick<MessagePresentationProps, 'onClose' | 'onAction'> {
    actions: InAppMessageAction[];
    stepIndex?: number;
}

/** Shared modal/story actions; the caller owns navigation-completion and dismissal effects. */
export const MessageActions: React.FC<MessageActionsProps> = ({
    actions,
    onClose,
    onAction,
    stepIndex,
}) => {
    const t = useT();
    const busy = useRef(false);
    const [error, setError] = useState(false);
    const { runAction } = useInAppMessageActions();
    const capgo = useCapgoUpdate();
    const [loadingActionIndex, setLoadingActionIndex] = useState<number | null>(null);
    const [capgoActionIndex, setCapgoActionIndex] = useState<number | null>(null);

    const handleAction = async (action: InAppMessageAction, index: number) => {
        if (busy.current || capgoActionIndex !== null) return;
        busy.current = true;
        setError(false);

        setLoadingActionIndex(index);
        try {
            onAction?.({ actionIndex: index, actionType: action.action.type, stepIndex });
            const outcome = await runAction(action.action);
            if (outcome === 'capgo') {
                setCapgoActionIndex(index);
                await capgo.startUpdate();
            } else if (action.closeOnComplete) {
                onClose(action.action.type === 'dismiss' ? 'dismissed' : 'action', { stepIndex });
            }
        } catch {
            setError(true);
        } finally {
            busy.current = false;
            setLoadingActionIndex(null);
        }
    };

    return (
        <div>
            {error && (
                <p role="alert" className="p-3 bg-red-50 text-sm text-red-700 rounded-2xl">
                    {t('inAppMessages.error')}
                </p>
            )}
            {actions.length > 0 && (
                <div className="flex flex-col gap-3 pt-2">
                    {actions.map((action, index) => {
                        const isCapgoTarget = capgoActionIndex === index;
                        const isLoading = loadingActionIndex === index;

                        if (isCapgoTarget) {
                            if (capgo.status === 'error') {
                                return (
                                    <div key={index} className="space-y-3">
                                        <div className="p-3.5 bg-red-50/80 backdrop-blur border border-red-100 rounded-[20px] flex items-start gap-2.5 text-left">
                                            <IonIcon
                                                icon={alertCircleOutline}
                                                className="text-red-400 text-lg mt-0.5 shrink-0"
                                            />
                                            <span className="text-sm text-red-700 leading-relaxed">
                                                {t('inAppMessages.error')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onClose('dismissed', { stepIndex })}
                                            className="text-sm text-grayscale-500 hover:text-grayscale-900 transition-colors py-2 font-medium w-full"
                                        >
                                            {t('common.close')}
                                        </button>
                                    </div>
                                );
                            }

                            if (capgo.status === 'uptodate') {
                                return (
                                    <div key={index} className="space-y-3">
                                        <div className="p-3.5 bg-emerald-50/80 backdrop-blur border border-emerald-100 rounded-[20px] flex items-start gap-2.5 text-left">
                                            <IonIcon
                                                icon={checkmarkCircleOutline}
                                                className="text-emerald-500 text-lg mt-0.5 shrink-0"
                                            />
                                            <span className="text-sm text-emerald-700 leading-relaxed">
                                                {t('inAppMessages.upToDate')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onClose('dismissed', { stepIndex })}
                                            className="text-sm text-grayscale-500 hover:text-grayscale-900 transition-colors py-2 font-medium w-full"
                                        >
                                            {t('inAppMessages.done')}
                                        </button>
                                    </div>
                                );
                            }

                            const progressText =
                                capgo.status === 'checking'
                                    ? t('inAppMessages.checking')
                                    : capgo.status === 'downloading'
                                      ? t('inAppMessages.downloading', {
                                            progress: Math.round(capgo.progress),
                                        })
                                      : t('inAppMessages.installing');

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
                        let spinnerClass = 'w-4 h-4 border-2 rounded-full animate-spin ';

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
    );
};
