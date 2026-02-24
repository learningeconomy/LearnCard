import React from 'react';
import { Link } from 'react-router-dom';

import { useAiFeatureGate, AiFeatureGateReason } from 'learn-card-base';

const REASON_MESSAGES: Record<AiFeatureGateReason, string | null> = {
    enabled: null,
    loading: null,
    disabled_minor: 'AI features are not available for users under 18.',
    disabled_by_user: 'AI features are currently disabled.',
};

const AiFeatureDisabledCard: React.FC<{ reason: AiFeatureGateReason }> = ({ reason }) => {
    const message = REASON_MESSAGES[reason];
    const isMinor = reason === 'disabled_minor';

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-4xl">🔒</div>
            <p className="text-grayscale-600 text-sm max-w-[280px]">{message}</p>
            {!isMinor && (
                <Link
                    to="/privacy-and-data"
                    className="text-sm text-blue-600 underline"
                >
                    Manage privacy settings
                </Link>
            )}
        </div>
    );
};

export const AiFeatureGate: React.FC<{
    children: React.ReactNode;
    fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
    const { isAiEnabled, isLoading, reason } = useAiFeatureGate();

    if (isLoading) return null;

    if (!isAiEnabled) {
        return fallback ? <>{fallback}</> : <AiFeatureDisabledCard reason={reason} />;
    }

    return <>{children}</>;
};

export default AiFeatureGate;
