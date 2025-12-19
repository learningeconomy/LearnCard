import React, { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';

export const AppUrlListener: React.FC = () => {
    const history = useHistory();

    const deepLinkDomains = useMemo(
        () => [
            'https://app.scoutpass.org',
            'https://scoutpass.org',
            'https://scoutpass.netlify.app',
            'https://pass.scout.org',
        ],
        []
    );

    useEffect(() => {
        let listener: PluginListenerHandle | null = null;

        const handleUrlOpen = (event: URLOpenListenerEvent) => {
            try {
                const eventUrl = new URL(event.url);

                for (const domain of deepLinkDomains) {
                    const domainUrl = new URL(domain);

                    if (eventUrl.origin === domainUrl.origin) {
                        const path = eventUrl.pathname + eventUrl.search + eventUrl.hash;
                        history.push(path);
                        return;
                    }
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
