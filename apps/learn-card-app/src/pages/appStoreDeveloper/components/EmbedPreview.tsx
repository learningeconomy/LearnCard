import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { init as initEmbed } from '@learncard/embed-sdk';
import { clearFinalizeCache } from '../../../hooks/useFinalizeInboxCredentials';
import { autoVerifyStore } from '../../../stores/autoVerifyStore';
import { getResolvedTenantConfig } from '../../../config/bootstrapTenantConfig';
import { useTenantBrandingAssets } from '../../../config/brandingAssets';

export interface EmbedPreviewProps {
    publishableKey: string;
    partnerName: string;
    credential: { name: string; [key: string]: unknown };
    branding?: { primaryColor?: string; accentColor?: string; partnerLogoUrl?: string };
    requestBackgroundIssuance?: boolean;
    apiBaseUrl?: string;
    issuerName?: string;
    issuerLogoUrl?: string;
}

export const EmbedPreview: React.FC<EmbedPreviewProps> = ({
    publishableKey,
    partnerName,
    credential,
    branding,
    requestBackgroundIssuance,
    apiBaseUrl,
    issuerName,
    issuerLogoUrl,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const credentialKey = JSON.stringify(credential);
    const brandingKey = JSON.stringify(branding);

    const { brandMark } = useTenantBrandingAssets();

    // Match the preview modal copy + "Secured by" footer to the active tenant.
    // Tenant resolution for the brain-service (OTP / claim email branding)
    // is handled separately via publishable-key-derived lookup in a follow-up PR.
    const walletName = (() => {
        try {
            return getResolvedTenantConfig().branding?.name;
        } catch {
            return undefined;
        }
    })();

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.innerHTML = '';
        setError(null);
        setIsLoaded(false);

        // Clear stored session so switching templates starts a fresh claim flow
        const storageKey = `lcEmbed:v1:${publishableKey || 'anon'}`;
        try { localStorage.removeItem(storageKey); } catch {}

        try {
            initEmbed({
                target: el,
                publishableKey,
                partnerName,
                issuerName,
                issuerLogoUrl,
                credential,
                branding: {
                    ...branding,
                    // Suppress the SDK's auto-open wallet behavior; the preview
                    // opens the local wallet via onSuccess instead.
                    walletUrl: '',
                    // Brand the modal copy ("...added to your {walletName} wallet",
                    // "View My {walletName}") and footer image for the active tenant.
                    ...(walletName ? { walletName } : {}),
                    ...(brandMark ? { logoUrl: brandMark } : {}),
                },
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
    }, [publishableKey, partnerName, issuerName, issuerLogoUrl, credentialKey, brandingKey, requestBackgroundIssuance, apiBaseUrl, walletName, brandMark]);

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
