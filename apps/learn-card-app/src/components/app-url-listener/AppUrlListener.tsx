import React, { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';

export const AppUrlListener: React.FC = () => {
    const history = useHistory();

    const deepLinkDomains = useMemo(
        () => {
            const config = getResolvedTenantConfig();
            const nativeConfig = config.native;

            const domains = (nativeConfig?.deepLinkDomains ?? ['learncard.app'])
                .map(d => `https://${d}`);

            const schemes = nativeConfig?.customSchemes ?? ['dccrequest', 'msprequest', 'asuprequest'];

            return {
                httpsDomains: domains,
                customSchemes: schemes,
            };
        },
        []
    );

    useEffect(() => {
        let listener: PluginListenerHandle | null = null;

        const handleUrlOpen = (event: URLOpenListenerEvent) => {
            try {
                const eventUrl = new URL(event.url);

                for (const domain of deepLinkDomains.httpsDomains) {
                    const domainUrl = new URL(domain);

                    if (eventUrl.origin === domainUrl.origin) {
                        const path = eventUrl.pathname + eventUrl.search + eventUrl.hash;
                        history.push(path);
                        return;
                    }
                }

                if (deepLinkDomains.customSchemes.includes(eventUrl.protocol.replace(':', ''))) {
                    const fullPath = eventUrl.pathname + eventUrl.search + eventUrl.hash;

                    // Route to the request page
                    const targetPath = `/request${fullPath}`;

                    history.push(targetPath);
                    return;
                }
            } catch (error) {
                console.error('Error processing deep link:', error);
            }
        };

        // Async setup with proper Promise handling
        const setupListener = async () => {
            listener = await App.addListener('appUrlOpen', handleUrlOpen);
        };
        setupListener();

        // Cleanup function
        return () => {
            if (listener) {
                listener.remove();
            }
        };
    }, [history, deepLinkDomains]);

    return null;
};
export default AppUrlListener;
