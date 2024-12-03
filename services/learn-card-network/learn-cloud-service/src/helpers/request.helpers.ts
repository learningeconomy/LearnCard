import type { XAPIRequest } from 'types/xapi';

export const createBasicAuth = (username: string, password: string) =>
    `Basic ${btoa(`${username}:${password}`)}`;

export const createXapiFetchOptions = (request: XAPIRequest, targetUrl: URL, auth: string) => {
    const options: any = {
        method: request.method,
        headers: { ...request.headers, Authorization: auth, host: targetUrl.host },
    };

    delete options.headers['content-length'];

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        options.body = JSON.stringify(request.body);
    }

    return options;
};
