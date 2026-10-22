import { enterSharePrivacy } from '../share-links/sharePrivacy';
import React, { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

import {
    isTenantHttpsUrl,
    parseClaimInput,
    type ParseClaimInputConfig,
} from '../../hooks/parseClaimInput';
import { resolveTenantParseConfig } from '../../hooks/resolveTenantParseConfig';
import { getLogger } from 'learn-card-base';

const log = getLogger('app-url-listener');

export const AppUrlListener: React.FC = () => {
    const history = useHistory();

    const parserConfig = useMemo<ParseClaimInputConfig>(() => resolveTenantParseConfig(), []);

    useEffect(() => {
        let listener: PluginListenerHandle | null = null;
        let disposed = false;
        let receivedWarmLink = false;

        const handleUrlOpen = (event: URLOpenListenerEvent) => {
            try {
                const isOnTenantHttpsDomain = isTenantHttpsUrl(event.url, parserConfig);
                const incoming = new URL(event.url);
                if (isOnTenantHttpsDomain && /^\/m\/[^/]+\/?$/.test(incoming.pathname)) {
                    history.push(encodeURI(incoming.pathname));
                    return;
                }
                if (isOnTenantHttpsDomain && /^\/s(?:\/|$)/.test(incoming.pathname)) {
                    enterSharePrivacy();
                    history.push(incoming.pathname + incoming.hash);
                    return;
                }
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
                    case 'boost-claim':
                    case 'interaction-url':
                    case 'connection-request':
                        // Legacy fallback: parseClaimInput's query-classified kinds
                        // (`?boostUri=&challenge=`, `?iuv=1`, `?did=did:web:…:users:…`)
                        // preempt the HTTPS-host check by design — that's correct for
                        // the in-app paste flow where the consumer is a modal. But the
                        // OLD AppUrlListener trusted the tenant domain and ALWAYS
                        // pushed `pathname+search+hash` for Universal Links on it. We
                        // preserve that here so OS-level deep links on the tenant
                        // domain remain a passthrough (regardless of whether a current
                        // consumer reads those query params — preserves forward
                        // compatibility with planned consumers).
                        if (isOnTenantHttpsDomain) {
                            try {
                                const url = new URL(event.url);
                                history.push(url.pathname + url.search + url.hash);
                            } catch {
                                // unreachable: we already know event.url parses
                            }
                        }
                        return;
                    default:
                        // raw-vc-candidate / unrecognized — never produced by an OS-
                        // level URL open. No-op.
                        return;
                }
            } catch (error) {
                log.error('Error processing deep link', error);
            }
        };

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

        return () => {
            disposed = true;
            if (listener) {
                listener.remove();
            }
        };
    }, [history, parserConfig]);

    return null;
};
export default AppUrlListener;
