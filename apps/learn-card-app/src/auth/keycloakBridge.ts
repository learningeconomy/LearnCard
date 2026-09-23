export const buildKeycloakBridgeUrl = (authorizeUrl: string, bridgeUrl?: string): string => {
    if (!bridgeUrl) {
        return authorizeUrl;
    }

    const url = new URL(bridgeUrl);
    url.hash = `next=${encodeURIComponent(authorizeUrl)}`;
    return url.toString();
};
