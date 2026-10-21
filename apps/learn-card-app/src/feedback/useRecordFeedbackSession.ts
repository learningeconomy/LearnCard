import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

import { getLogger } from 'learn-card-base';

import { feedbackGovernorStore } from './feedbackGovernor';

const log = getLogger('feedback-session');

/**
 * Feeds the visit counter that gates advocacy asks.
 *
 * Mount alone is not enough on native: the Capacitor webview survives
 * backgrounding, so a user who opens the app every day would only ever be
 * counted once. Resuming from background is therefore also a visit. The store
 * collapses anything inside its gap window, so both call sites can fire freely
 * without inflating the count.
 */
export const useRecordFeedbackSession = () => {
    useEffect(() => {
        feedbackGovernorStore.set.recordSession();

        if (!Capacitor.isNativePlatform()) return;

        const listener = (async () => {
            try {
                const { App } = await import('@capacitor/app');

                return await App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) feedbackGovernorStore.set.recordSession();
                });
            } catch (e) {
                log.debug('app state listener unavailable', e);

                return undefined;
            }
        })();

        return () => {
            void listener.then(handle => handle?.remove());
        };
    }, []);
};

export default useRecordFeedbackSession;
