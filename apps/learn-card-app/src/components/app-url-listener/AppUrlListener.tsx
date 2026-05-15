import React, { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';

import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';
import {
    parseClaimInput,
    type ParseClaimInputConfig,
} from '../../hooks/parseClaimInput';

export const AppUrlListener: React.FC = () => {
    const history = useHistory();

    const parserConfig = useMemo<ParseClaimInputConfig>(() => {
        const config = getResolvedTenantConfig();
        const nativeConfig = config.native;
        return {
            customSchemes:
                nativeConfig?.customSchemes ?? ['dccrequest', 'msprequest', 'asuprequest'],
            httpsDomains: nativeConfig?.deepLinkDomains ?? ['learncard.app'],
        };
    }, []);

    useEffect(() => {
        let listener: PluginListenerHandle | null = null;

        const handleUrlOpen = (event: URLOpenListenerEvent) => {
            try {
                const parsed = parseClaimInput(event.url, parserConfig);

                switch (parsed.kind) {
                    case 'oid4vci':
                        history.push(`/oid4vci?offer=${encodeURIComponent(parsed.offerUrl)}`);
                        return;
                    case 'oid4vp':
                        history.push(`/oid4vp?request=${encodeURIComponent(parsed.requestUrl)}`);
                        return;
                    case 'vc-api-custom-scheme':
                    case 'lcw-https':
                        history.push(parsed.path);
                        return;
                    default:
                        // Other kinds (boost-claim, interaction-url, connection-request,
                        // raw-vc-candidate, unrecognized) aren't valid deep-link payloads:
                        // they only make sense from inside the app (scanner or paste
                        // modal), not from an OS-level URL open.
                        return;
                }
            } catch (error) {
                console.error('Error processing deep link:', error);
            }
        };

        const setupListener = async () => {
            listener = await App.addListener('appUrlOpen', handleUrlOpen);
        };
        setupListener();

        return () => {
            if (listener) {
                listener.remove();
            }
        };
    }, [history, parserConfig]);

    return null;
};
export default AppUrlListener;
