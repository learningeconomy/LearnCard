import { getLogger } from 'learn-card-base';

const log = getLogger('keycloak-bridge');

const BRIDGE_PROBE_TIMEOUT_MS = 1500;

export const buildKeycloakBridgeUrl = (authorizeUrl: string, bridgeUrl?: string): string => {
    if (!bridgeUrl) {
        return authorizeUrl;
    }

    const url = new URL(bridgeUrl);
    url.hash = `next=${encodeURIComponent(authorizeUrl)}`;
    return url.toString();
};

/**
 * Use the branded bridge page only if it is reachable; otherwise open Keycloak directly.
 * An unreachable bridge would leave the user on a blank auth sheet even though Keycloak
 * is healthy. The probe is `no-cors` because the bridge is cross-origin from the app
 * WebView: it can only tell "network reachable" from "unreachable", which is the failure
 * that matters here.
 */
export const resolveKeycloakBridgeUrl = async (
    authorizeUrl: string,
    bridgeUrl?: string,
    fetcher: typeof fetch = fetch,
    timeoutMs: number = BRIDGE_PROBE_TIMEOUT_MS
): Promise<string> => {
    if (!bridgeUrl) {
        return authorizeUrl;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const probeUrl = new URL(bridgeUrl);
        probeUrl.hash = '';
        await fetcher(probeUrl.toString(), {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal,
        });
        return buildKeycloakBridgeUrl(authorizeUrl, bridgeUrl);
    } catch (error) {
        log.warn('Sign-in bridge page unreachable; opening Keycloak directly', error);
        return authorizeUrl;
    } finally {
        clearTimeout(timer);
    }
};
