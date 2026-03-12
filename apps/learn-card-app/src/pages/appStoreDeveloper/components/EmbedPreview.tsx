import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { init as initEmbed } from '@learncard/embed-sdk';
import { clearFinalizeCache } from '../../../hooks/useFinalizeInboxCredentials';
import { autoVerifyStore } from '../../../stores/autoVerifyStore';

export interface EmbedPreviewProps {
    publishableKey: string;
    partnerName: string;
    credential: { name: string; [key: string]: unknown };
    branding?: { primaryColor?: string; accentColor?: string; partnerLogoUrl?: string };
    requestBackgroundIssuance?: boolean;
    apiBaseUrl?: string;
}

export const EmbedPreview: React.FC<EmbedPreviewProps> = ({
    publishableKey,
    partnerName,
    credential,
    branding,
    requestBackgroundIssuance,
    apiBaseUrl,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const credentialKey = JSON.stringify(credential);
    const brandingKey = JSON.stringify(branding);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.innerHTML = '';
        setError(null);
        setIsLoaded(false);

        try {
            initEmbed({
                target: el,
                publishableKey,
                partnerName,
                credential,
                branding: { ...branding, walletUrl: '' },
                requestBackgroundIssuance,
                ...(apiBaseUrl ? { apiBaseUrl } : {}),
                onSuccess: () => {
                    // Trigger inbox finalize so the claimed credential appears in the wallet
                    clearFinalizeCache();
                    autoVerifyStore.set.markVerifySuccess();
                    // Open the local wallet directly — walletUrl: '' suppresses SDK's auto-open
                    window.open(window.location.origin + '/wallet', '_blank', 'noopener,noreferrer');
                },
            });
            setIsLoaded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load embed SDK');
        }

        return () => {
            if (el) el.innerHTML = '';
        };
    }, [publishableKey, partnerName, credentialKey, brandingKey, requestBackgroundIssuance, apiBaseUrl]);

    return (
        <div className="border rounded-lg bg-gray-50 p-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h4>

            <p className="text-xs text-gray-500 mb-4">
                This is the actual claim button your users will see. Click it to test the full flow.
            </p>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded p-3 mb-4">{error}</div>
            )}

            <div ref={containerRef} className="min-h-[60px] flex items-center justify-center" />

            {!isLoaded && !error && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading preview...
                </div>
            )}
        </div>
    );
};
