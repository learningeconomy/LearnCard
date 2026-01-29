import { useCallback, useRef, useEffect, useState } from 'react';
import type { EdlinkIntegrationData, EdlinkOnboardingInstance, LMSConnection } from '../types';
import { EDLINK_CONFIG } from '../services/edlinkApi';
import { transformOnboardingData } from '../services/transformers';

const EDLINK_SDK_URL = 'https://ed.link/widgets/edlink.js';

/**
 * Dynamically loads the Ed.link Widget SDK script.
 * Returns a promise that resolves when the script is loaded.
 */
const loadEdlinkSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Already loaded
        if (window.Edlink) {
            resolve();
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector(`script[src="${EDLINK_SDK_URL}"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Ed.link SDK')));
            return;
        }

        // Create and append script
        const script = document.createElement('script');
        script.src = EDLINK_SDK_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Ed.link SDK'));
        document.head.appendChild(script);
    });
};

interface UseEdlinkOnboardingOptions {
    onSuccess: (connection: LMSConnection) => void;
    onError?: (error: Error) => void;
}

export const useEdlinkOnboarding = ({ onSuccess, onError }: UseEdlinkOnboardingOptions) => {
    const onboardingRef = useRef<EdlinkOnboardingInstance | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Load SDK on mount
    useEffect(() => {
        let mounted = true;

        loadEdlinkSdk()
            .then(() => {
                if (mounted) setIsReady(true);
            })
            .catch((err) => {
                console.error('Failed to load Ed.link SDK:', err);
                if (mounted) onError?.(err);
            });

        return () => {
            mounted = false;
        };
    }, [onError]);

    const startOnboarding = useCallback(() => {
        if (!window.Edlink) {
            console.error('Ed.link SDK not loaded');
            onError?.(new Error('Ed.link SDK not loaded'));
            return;
        }

        setIsLoading(true);

        // Clean up any existing instance
        if (onboardingRef.current) {
            onboardingRef.current.destroy();
        }

        const edlink = new window.Edlink({ client_id: EDLINK_CONFIG.APP_ID });

        const onboarding = edlink.createOnboarding({
            theme: {
                primary_color: EDLINK_CONFIG.THEME_COLOR,
            },
            onSuccess: (data: EdlinkIntegrationData) => {
                setIsLoading(false);
                console.log('Ed.link onboarding data:', JSON.stringify(data, null, 2));
                const connection = transformOnboardingData(data);
                console.log('Transformed connection:', JSON.stringify(connection, null, 2));
                onSuccess(connection);
            },
            onError: (error: Error) => {
                setIsLoading(false);
                console.error('Ed.link onboarding error:', error);
                onError?.(error);
            },
        });

        // Event listeners for debugging/logging
        onboarding.on('integrate.success', (data) => {
            console.log('Integration successful via event:', data);
        });

        onboarding.on('integrate.error', (error) => {
            console.error('Integration error via event:', error);
        });

        onboarding.on('integrate.cancel', () => {
            setIsLoading(false);
            console.log('User cancelled onboarding');
        });

        onboardingRef.current = onboarding;
        onboarding.show();
    }, [onSuccess, onError]);

    const cleanup = useCallback(() => {
        if (onboardingRef.current) {
            onboardingRef.current.destroy();
            onboardingRef.current = null;
        }
    }, []);

    return { startOnboarding, cleanup, isLoading, isReady };
};
