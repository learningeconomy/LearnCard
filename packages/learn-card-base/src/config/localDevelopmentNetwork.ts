/** Local development trust is runtime-only; never persist it with tenant settings. */
let localNetworkUrl: string | undefined;

/** Both the development app and its explicitly configured backend must be loopback. */
export const getLocalDevelopmentNetworkOrigin = (
    dev: boolean,
    enabled: boolean,
    appOrigin: string,
    networkUrl: string
): string | undefined => {
    if (!dev || !enabled) return undefined;

    try {
        const app = new URL(appOrigin);
        const network = new URL(networkUrl);
        const isLoopbackHttp = (url: URL): boolean =>
            ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
            ['http:', 'https:'].includes(url.protocol) &&
            !url.username &&
            !url.password;

        return isLoopbackHttp(app) && isLoopbackHttp(network) ? network.origin : undefined;
    } catch {
        return undefined;
    }
};

/** Called at app bootstrap; a production or hosted app always clears local trust. */
export const configureLocalDevelopmentNetwork = (
    dev: boolean,
    enabled: boolean,
    appOrigin: string,
    networkUrl: string
): void => {
    localNetworkUrl = getLocalDevelopmentNetworkOrigin(dev, enabled, appOrigin, networkUrl)
        ? networkUrl
        : undefined;
};

/** Trust only the configured development network, retaining normal Boost verification. */
export const getLocalDevelopmentBoostRegistry = (
    networkUrl: string | boolean
): string | undefined => {
    if (!localNetworkUrl || networkUrl !== localNetworkUrl) return undefined;

    const network = new URL(localNetworkUrl);
    const path = network.pathname.replace(/\/trpc\/?$/, '').replace(/\/$/, '');
    const did = `did:web:${encodeURIComponent(network.host)}${path.replace(/\//g, ':')}`;

    return `data:application/json,${encodeURIComponent(
        JSON.stringify([{ id: 'Local LearnCard Network', url: network.origin, did }])
    )}`;
};
