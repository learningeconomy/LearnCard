import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IonToggle } from '@ionic/react';
import { Check } from 'lucide-react';

import { LEARNCARD_AI_PASSPORT_CONTRACT_URI, useAiFeatureGate } from 'learn-card-base';

import { useAiConsentToggle } from '../../../hooks/useAiConsentToggle';
import type { ConsentedContract } from '../../../components/data-sharing/consentSummary';
import GlassCard from './GlassCard';

type AiConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected';

type AiPersonalizationCardProps = {
    consentedContracts: ConsentedContract[];
    aiStoredPreference: boolean;
    delay?: number;
};

const AiPersonalizationCard: React.FC<AiPersonalizationCardProps> = ({
    consentedContracts,
    aiStoredPreference,
    delay = 0,
}) => {
    const { isAiEnabled: aiEnabled, reason: aiFeatureGateReason } = useAiFeatureGate();
    const { handleAiToggle } = useAiConsentToggle();

    const [aiToggleOverride, setAiToggleOverride] = useState<boolean | null>(null);
    const [retryingAiConsent, setRetryingAiConsent] = useState(false);
    const [isSyncingAiConsent, setIsSyncingAiConsent] = useState(false);
    const [aiConnectionStatus, setAiConnectionStatus] = useState<AiConnectionStatus>('idle');
    const [isAiConnectionVisible, setIsAiConnectionVisible] = useState(false);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isAiRestricted = aiFeatureGateReason === 'disabled_minor';
    const aiToggleChecked = aiToggleOverride ?? aiEnabled;

    const hasAiConsent = useMemo(
        () =>
            consentedContracts?.some(
                consent =>
                    consent?.contract?.uri === LEARNCARD_AI_PASSPORT_CONTRACT_URI &&
                    consent?.status !== 'withdrawn'
            ),
        [consentedContracts]
    );

    const showAiConsentWarning =
        aiStoredPreference &&
        !hasAiConsent &&
        !isAiRestricted &&
        !isSyncingAiConsent &&
        !retryingAiConsent;

    const showAiConnectionStatus = aiConnectionStatus !== 'idle';

    useEffect(() => {
        if (aiToggleOverride === null) return;
        if (aiToggleOverride === aiEnabled) setAiToggleOverride(null);
    }, [aiEnabled, aiToggleOverride]);

    useEffect(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        if (clearTimeoutRef.current) {
            clearTimeout(clearTimeoutRef.current);
            clearTimeoutRef.current = null;
        }

        if (aiConnectionStatus !== 'connected' && aiConnectionStatus !== 'disconnected') return;

        hideTimeoutRef.current = setTimeout(() => {
            setIsAiConnectionVisible(false);
            clearTimeoutRef.current = setTimeout(() => {
                setAiConnectionStatus('idle');
                clearTimeoutRef.current = null;
            }, 300);
        }, 2000);

        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
        };
    }, [aiConnectionStatus]);

    const handleAiFeatureToggle = useCallback(
        (enabled: boolean) => {
            setAiToggleOverride(enabled);
            setAiConnectionStatus(enabled ? 'connecting' : 'disconnecting');
            setIsAiConnectionVisible(true);
            setIsSyncingAiConsent(true);

            void (async () => {
                try {
                    const synced = await handleAiToggle(enabled);
                    if (synced) {
                        setAiConnectionStatus(enabled ? 'connected' : 'disconnected');
                        return;
                    }
                    setAiToggleOverride(null);
                    setAiConnectionStatus('idle');
                    setIsAiConnectionVisible(false);
                } finally {
                    setIsSyncingAiConsent(false);
                }
            })();
        },
        [handleAiToggle]
    );

    const handleRetryAiConsent = useCallback(async () => {
        try {
            setRetryingAiConsent(true);
            setAiToggleOverride(true);
            setAiConnectionStatus('connecting');
            setIsAiConnectionVisible(true);

            const synced = await handleAiToggle(true);
            if (synced) {
                setAiConnectionStatus('connected');
            } else {
                setAiToggleOverride(null);
                setAiConnectionStatus('idle');
                setIsAiConnectionVisible(false);
            }
        } finally {
            setRetryingAiConsent(false);
        }
    }, [handleAiToggle]);

    return (
        <div
            className="animate-fade-in-up"
            style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
        >
            <div className="px-1 mb-2">
                <h3 className="text-[15px] font-semibold text-grayscale-900">
                    AI &amp; personalization
                </h3>
                <p className="text-sm text-grayscale-600">
                    Smart help that learns from you — only if you say so.
                </p>
            </div>

            <GlassCard className="overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-grayscale-900">AI Features</p>
                        <p className="text-sm text-grayscale-500 mt-0.5 leading-relaxed">
                            AI tutoring, insights, and personalization. This may share relevant
                            messages and records with AI providers.
                        </p>
                    </div>
                    <IonToggle
                        className="ds-toggle"
                        checked={aiToggleChecked}
                        disabled={isAiRestricted || isSyncingAiConsent || retryingAiConsent}
                        onIonChange={e =>
                            !isAiRestricted && handleAiFeatureToggle(e.detail.checked)
                        }
                        aria-label="AI Features"
                    />
                </div>

                {showAiConnectionStatus && (
                    <div
                        className={`px-5 pb-4 transition-opacity duration-300 ${
                            isAiConnectionVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {aiConnectionStatus === 'connecting' ? (
                            <p className="text-xs text-grayscale-500 leading-relaxed">
                                Connecting...
                            </p>
                        ) : aiConnectionStatus === 'disconnecting' ? (
                            <p className="text-xs text-grayscale-500 leading-relaxed">
                                Disconnecting...
                            </p>
                        ) : (
                            <p className="flex items-center gap-1.5 text-xs text-emerald-600 leading-relaxed">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                    {aiConnectionStatus === 'connected'
                                        ? 'Connected'
                                        : 'Successfully Disconnected'}
                                </span>
                            </p>
                        )}
                    </div>
                )}

                {showAiConsentWarning && (
                    <div className="px-5 pb-4">
                        <div className="rounded-[16px] border border-red-100 bg-red-50 px-4 py-3">
                            <p className="text-sm text-red-700 leading-relaxed">
                                AI is on, but the connection needs to be refreshed.
                                <button
                                    type="button"
                                    onClick={handleRetryAiConsent}
                                    disabled={retryingAiConsent}
                                    className="ml-1 font-medium underline underline-offset-2 text-red-700 disabled:opacity-60"
                                >
                                    {retryingAiConsent ? 'Retrying…' : 'Try again'}
                                </button>
                                .
                            </p>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default AiPersonalizationCard;
