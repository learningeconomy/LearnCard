import { AUTHOR_EXTENSION, XAPI_PASSWORD, XAPI_USERNAME } from '../constants/xapi';
import type { XAPIRequest } from 'types/xapi';

export const createBasicAuth = (username: string, password: string) =>
    `Basic ${btoa(`${username}:${password}`)}`;

export const createXapiFetchOptions = (request: XAPIRequest, targetUrl: URL, did?: string) => {
    const options: any = {
        method: request.method,
        headers: {
            ...request.headers,
            Authorization: createBasicAuth(XAPI_USERNAME!, XAPI_PASSWORD!),
            host: targetUrl.host,
        },
    };

    delete options.headers['content-length'];

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const newBody = request.body as any;

        if (request.url.replace('/xapi', '') === '/statements' && newBody) {
            if (!newBody.context) newBody.context = {};
            if (!newBody.context.extensions) newBody.context.extensions = {};
            newBody.context.extensions[AUTHOR_EXTENSION] = did;
        }

        options.body = JSON.stringify(newBody);
    }

    return options;
};
