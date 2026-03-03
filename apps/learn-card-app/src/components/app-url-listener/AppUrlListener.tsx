import React, { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';

export const AppUrlListener: React.FC = () => {
    const history = useHistory();

    const deepLinkDomains = useMemo(
        () => ({
            // HTTPS domains for universal links / app links
            httpsDomains: [
                'https://learncard.app',
                'https://learncardapp.netlify.app',
                'https://learncardapp.netlify.com',
                'https://lcw.app', // Added for the new https://lcw.app/request.html
            ],
            // Custom schemes for deep linking
            customSchemes: ['dccrequest', 'msprequest', 'asuprequest'],
        }),
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
