import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { loadEscrowRelayConfig } from './config';
import { createEscrowRelayHandler } from './relay';

let relay: ReturnType<typeof createEscrowRelayHandler> | undefined;

const getRelay = (): ReturnType<typeof createEscrowRelayHandler> => {
    relay ??= createEscrowRelayHandler(loadEscrowRelayConfig());

    return relay;
};

const parseBody = (body: string | undefined, isBase64Encoded?: boolean): unknown => {
    if (!body) throw new Error('Missing request body');

    const decoded = isBase64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body;

    return JSON.parse(decoded) as unknown;
};

export const handler: APIGatewayProxyHandlerV2 = async event => {
    let body: unknown;

    try {
        body = parseBody(event.body, event.isBase64Encoded);
    } catch {
        return {
            statusCode: 400,
            headers: {
                'content-type': 'application/json',
                'cache-control': 'no-store',
            },
            body: JSON.stringify({ accepted: false, error: 'Invalid request body' }),
        };
    }

    const result = await getRelay()({
        authorization: event.headers.authorization,
        body,
    });

    return {
        statusCode: result.statusCode,
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
        },
        body: JSON.stringify(result.body),
    };
};
