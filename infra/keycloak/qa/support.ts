export const required = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Set ${name}`);
    return value;
};

export const record = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Expected a JSON object');
    return value as Record<string, unknown>;
};

export const secureUrl = (value: string): string => {
    const url = new URL(value);
    if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/'
    ) {
        throw new Error('Use an HTTPS origin without credentials, query or path');
    }
    return url.origin;
};

export const requestJson = async (url: string, options: RequestInit = {}): Promise<unknown> => {
    const response = await fetch(url, {
        ...options,
        redirect: 'error',
        signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} from Keycloak`);
    return response.json();
};
