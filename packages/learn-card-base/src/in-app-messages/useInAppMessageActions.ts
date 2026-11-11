import { useCallback, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import type { InAppMessageActionTarget } from '@learncard/types';
import { openAppActionValidator, openMessageActionValidator } from '@learncard/types';
import { MessageNavigationContext } from './MessageNavigationContext';
import { requestInAppMessage } from './deepLinkRequestStore';

import { useLinksConfig } from '../config/TenantConfigProvider';
import { openStoreLink } from './storeLinks';

export type RunActionOutcome = 'closed' | 'capgo' | 'noop';

export const useInAppMessageActions = (): {
    runAction: (action: InAppMessageActionTarget) => Promise<RunActionOutcome>;
} => {
    const history = useHistory();
    const links = useLinksConfig();
    const { openApp } = useContext(MessageNavigationContext);

    const runAction = useCallback(
        async (action: InAppMessageActionTarget): Promise<RunActionOutcome> => {
            switch (action.type) {
                case 'openApp': {
                    const parsed = openAppActionValidator.safeParse(action);
                    if (!parsed.success || !openApp) return 'noop';
                    openApp(parsed.data.listingId, parsed.data.path);
                    return 'closed';
                }
                case 'openMessage': {
                    const parsed = openMessageActionValidator.safeParse(action);
                    if (!parsed.success) return 'noop';
                    requestInAppMessage(parsed.data.messageId);
                    return 'closed';
                }
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

                case 'appStore': {
                    const opened = await openStoreLink(action, {
                        platform: Capacitor.getPlatform(),
                        appStoreUrl: links?.appStoreUrl,
                        playStoreUrl: links?.playStoreUrl,
                    });

                    return opened ? 'closed' : 'noop';
                }

                case 'capgoUpdate':
                    return 'capgo';

                case 'dismiss':
                default:
                    return 'closed';
            }
        },
        [history, links, openApp]
    );

    return { runAction };
};
