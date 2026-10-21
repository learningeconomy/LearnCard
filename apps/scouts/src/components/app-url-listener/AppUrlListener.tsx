import React, { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { getLogger } from 'learn-card-base';
import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';

const log = getLogger('scouts/app-url-listener');

export const AppUrlListener: React.FC = () => {
    const history = useHistory();

    const deepLinkDomains = useMemo(
        () => [
            'https://app.scoutpass.org',
            'https://scoutpass.org',
            'https://scoutpass.netlify.app',
            getAppBaseUrl(),
        ],
        []
    );

    useEffect(() => {
        let listener: PluginListenerHandle | null = null;
        let disposed = false;
        let receivedWarmLink = false;

        const handleUrlOpen = (event: URLOpenListenerEvent) => {
            try {
                const eventUrl = new URL(event.url);

                for (const domain of deepLinkDomains) {
                    const domainUrl = new URL(domain);

                    if (eventUrl.protocol === 'https:' && eventUrl.origin === domainUrl.origin) {
                        const path = eventUrl.pathname + eventUrl.search + eventUrl.hash;
                        history.push(path);
                        return;
                    }
                }
            } catch (error) {
                log.error('Error processing deep link', error);
            }
        };

        // Async setup with proper Promise handling
        const setupListener = async () => {
            listener = await App.addListener('appUrlOpen', event => {
                receivedWarmLink = true;
                if (!disposed) handleUrlOpen(event);
            });
            if (disposed) {
                await listener.remove();
                return;
            }
            if (Capacitor.isNativePlatform()) {
                const launch = await App.getLaunchUrl();
                if (!disposed && !receivedWarmLink && launch) handleUrlOpen(launch);
            }
        };
        void setupListener().catch(() => log.warn('Unable to register app links'));

        // Cleanup function
        return () => {
            disposed = true;
            if (listener) {
                listener.remove();
            }
        };
    }, [history, deepLinkDomains]);

    return null;
};

export default AppUrlListener;
