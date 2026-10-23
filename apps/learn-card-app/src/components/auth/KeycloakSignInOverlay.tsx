import React from 'react';
import { useBrandingConfig } from 'learn-card-base';

export interface KeycloakSignInOverlayProps {
    phase: 'signing-in' | 'setting-up';
}

export const KeycloakSignInOverlay: React.FC<KeycloakSignInOverlayProps> = ({ phase }) => {
    const branding = useBrandingConfig();
    const brandMarkUrl = branding.brandMarkUrl || branding.appIconUrl;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white font-poppins">
            <div
                className="flex flex-col items-center text-center motion-safe:animate-fade-in-up"
                role="status"
                aria-live="polite"
            >
                <div className="mb-6 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl">
                    {brandMarkUrl && (
                        <img
                            src={brandMarkUrl}
                            alt={branding.name || 'Logo'}
                            className="h-full w-full object-contain motion-safe:animate-fade-in"
                        />
                    )}
                </div>
                <h1 className="mb-2 text-xl font-semibold text-grayscale-900">
                    {phase === 'signing-in' ? 'Signing you in…' : 'Setting up your account…'}
                </h1>
                <p className="mb-6 text-sm text-grayscale-600">This only takes a moment.</p>
                <div className="h-5 w-5 rounded-full border-2 border-grayscale-200 border-t-grayscale-900 motion-safe:animate-spin motion-reduce:animate-pulse motion-reduce:border-grayscale-900" />
            </div>
        </div>
    );
};
