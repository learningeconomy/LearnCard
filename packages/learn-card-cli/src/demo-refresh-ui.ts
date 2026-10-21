export const requireLoopbackUrl = (value: unknown, label: string): URL => {
    try {
        if (typeof value !== 'string') throw new Error();
        const url = new URL(value);
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
            url.username ||
            url.password ||
            url.search ||
            url.hash
        )
            throw new Error();
        return url;
    } catch {
        throw new Error(
            `${label} must be an HTTP(S) loopback URL without credentials, query, or fragment.`
        );
    }
};

/** Check the running app before creating accounts or showing a demo sign-in secret. */
export const getRefreshDemoUiConfig = async (
    appUrl: string,
    network: string
): Promise<{ appOrigin: string; cloud: string; lcaApi: string; notificationsWebhook: string }> => {
    const app = requireLoopbackUrl(appUrl, '--app-url');
    const backend = requireLoopbackUrl(network, '--network');
    let config: { apis?: Record<string, unknown> } | null;
    try {
        const response = await fetch(new URL('/tenant-config.json', app), {
            redirect: 'error',
            signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        config = (await response.json()) as { apis?: Record<string, unknown> } | null;
    } catch {
        throw new Error(
            'Could not read the local app configuration. Start the LearnCard app in local development mode and check --app-url.'
        );
    }
    const configuredNetwork = requireLoopbackUrl(config?.apis?.brainService, 'App Brain service');
    if (configuredNetwork.href.replace(/\/$/, '') !== backend.href.replace(/\/$/, '')) {
        throw new Error(
            'The app and CLI must use the same Brain service. Set --network to the app’s local Brain URL.'
        );
    }
    const cloud = requireLoopbackUrl(config?.apis?.cloudService, 'App LearnCloud service');
    const api = requireLoopbackUrl(config?.apis?.lcaApi, 'App notification API');
    const notifications = requireLoopbackUrl(
        config?.apis?.notificationsEndpoint ?? new URL('/api/notifications/send', api).href,
        'App notifications endpoint'
    );
    if (notifications.origin !== api.origin) {
        throw new Error(
            'The local app’s notification API and notifications endpoint must use the same origin.'
        );
    }
    return {
        appOrigin: app.origin,
        cloud: cloud.href,
        lcaApi: api.href,
        notificationsWebhook: notifications.href,
    };
};
