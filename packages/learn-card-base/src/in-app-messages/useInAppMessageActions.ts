import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import type { InAppMessageActionTarget } from '@learncard/types';

import { useLinksConfig } from '../config/TenantConfigProvider';
import { openStoreLink } from './storeLinks';

export type RunActionOutcome = 'closed' | 'capgo' | 'noop';

export const useInAppMessageActions = (): {
    runAction: (action: InAppMessageActionTarget) => Promise<RunActionOutcome>;
} => {
    const history = useHistory();
    const links = useLinksConfig();

    const runAction = useCallback(
        async (action: InAppMessageActionTarget): Promise<RunActionOutcome> => {
            switch (action.type) {
                case 'internalLink':
                    history.push(action.path);

                    return 'closed';

                case 'externalLink': {
                    if (Capacitor.isNativePlatform()) {
                        const { Browser } = await import('@capacitor/browser');

                        await Browser.open({ url: action.url });
                    } else {
                        globalThis.open?.(action.url, '_blank', 'noopener,noreferrer');
                    }

                    return 'closed';
                }

                case 'appStore':
                    await openStoreLink(action, {
                        platform: Capacitor.getPlatform(),
                        appStoreUrl: links?.appStoreUrl,
                        playStoreUrl: links?.playStoreUrl,
                    });

                    return 'closed';

                case 'capgoUpdate':
                    return 'capgo';

                case 'dismiss':
                default:
                    return 'closed';
            }
        },
        [history, links]
    );

    return { runAction };
};
