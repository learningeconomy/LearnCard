import {
    type APIGatewayProxyEvent,
    type APIGatewayProxyEventV2,
    type APIGatewayProxyResult,
    type Context as AWSContext,
} from 'aws-lambda';
import { TRPCError } from '@trpc/server';
import { type IncomingMessage, type ServerResponse } from 'http';

import { OpenApiRouter } from 'trpc-to-openapi';
import { createOpenApiNodeHttpHandler, CreateOpenApiNodeHttpHandlerOptions } from 'trpc-to-openapi';

export type CreateOpenApiAwsLambdaHandlerOptions<TRouter extends OpenApiRouter> = Omit<
    CreateOpenApiNodeHttpHandlerOptions<TRouter, IncomingMessage, ServerResponse>,
    'maxBodySize'
>;

type AWSAPIGatewayEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

const isPayloadV2 = (event: AWSAPIGatewayEvent): event is APIGatewayProxyEventV2 => {
    return 'version' in event && event.version === '2.0';
};

const getPath = (event: AWSAPIGatewayEvent): string => {
    if (event.pathParameters && event.pathParameters.trpc) return `/${event.pathParameters.trpc}`;

    if (isPayloadV2(event)) return event.rawPath;

    return event.path;
};

const getMethod = (event: AWSAPIGatewayEvent): string => {
    if (isPayloadV2(event)) {
        return event.requestContext.http.method;
    }
    return event.httpMethod;
};

const getHeaders = (event: AWSAPIGatewayEvent): Record<string, string> => {
    const headers = event.headers ?? {};
    const cleanHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
            cleanHeaders[key] = value;
        }
    }

    return cleanHeaders;
};

const getQuery = (event: AWSAPIGatewayEvent): string => {
    if (isPayloadV2(event)) {
        return event.rawQueryString || '';
    }

    const queryParams = event.queryStringParameters || {};
    const cleanParams: Record<string, string> = {};

    for (const [key, value] of Object.entries(queryParams)) {
        if (value != null) {
            cleanParams[key] = value;
        }
    }

    return new URLSearchParams(cleanParams).toString();
};

const getBody = (event: AWSAPIGatewayEvent): string | null => {
    if (!event.body) {
        return null;
    }

    if (event.isBase64Encoded) {
        return Buffer.from(event.body, 'base64').toString('utf8');
    }

    return event.body;
};

const createRequestFromEvent = (event: AWSAPIGatewayEvent): IncomingMessage => {
    const path = getPath(event);
    const method = getMethod(event);
    const headers = getHeaders(event);
    const query = getQuery(event);
    const body = getBody(event);

    const url = query ? `${path}?${query}` : path;

    // Parse the body if it's JSON
    let parsedBody = body;
    const contentType = headers['content-type'] ?? headers['Content-Type'];
    if (body && contentType?.includes('application/json')) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            parsedBody = JSON.parse(body);
        } catch {
            // If parsing fails, keep the original body
            parsedBody = body;
        }
    }

    const req = {
        method,
        url,
        headers: {
            ...headers,
            // Normalize header case
            'content-type':
                headers['content-type'] ?? headers['Content-Type'] ?? 'application/json',
        },
        // Set the parsed body directly
        body: parsedBody,
        // Add required methods for incomingMessageToRequest
        socket: {
            once: () => {
                // Required for incomingMessageToRequest
            },
            off: () => {
                // Required for incomingMessageToRequest
            },
        },
    } as unknown as IncomingMessage;

    return req;
};

const createResponseHandler = (): {
    res: ServerResponse;
    promise: Promise<APIGatewayProxyResult>;
} => {
    let responseStatusCode = 200;
    const headers: Record<string, string> = {};
    let body = '';
    let resolvePromise: (value: APIGatewayProxyResult) => void;

    const promise = new Promise<APIGatewayProxyResult>(resolve => {
        resolvePromise = resolve;
    });

    const res = {
        setHeader: (key: string, value: string | readonly string[]) => {
            if (typeof value === 'string') {
                headers[key] = value;
            } else {
                headers[key] = value.join(', ');
            }
        },
        get statusCode() {
            return responseStatusCode;
        },
        set statusCode(code: number) {
            responseStatusCode = code;
        },
        end: (responseBody: string) => {
            body = responseBody || '';

            // Return appropriate format based on what we received
            const result: APIGatewayProxyResult = {
                statusCode: responseStatusCode,
                headers,
                body,
            };

            resolvePromise(result);
        },
        // Add required methods for incomingMessageToRequest
        once: () => {
            // Required for incomingMessageToRequest
        },
        off: () => {
            // Required for incomingMessageToRequest
        },
    } as unknown as ServerResponse;

    return {
        res,
        promise,
    };
};

export const createOpenApiAwsLambdaHandler = <TRouter extends OpenApiRouter>(
    opts: CreateOpenApiAwsLambdaHandlerOptions<TRouter>
) => {
    const openApiHttpHandler = createOpenApiNodeHttpHandler({
        ...opts,
        maxBodySize: undefined, // AWS Lambda handles body size limits
    });

    return async (
        event: AWSAPIGatewayEvent,
        _context: AWSContext
    ): Promise<APIGatewayProxyResult> => {
        try {
            const req = createRequestFromEvent(event);
            const { res, promise } = createResponseHandler();

            // Execute the handler
            await openApiHttpHandler(req, res);

            return await promise;
        } catch (cause) {
            // Handle any uncaught errors
            const error = cause instanceof Error ? cause : new Error('Unknown error');
            const statusCode =
                error instanceof TRPCError ? (error.code === 'NOT_FOUND' ? 404 : 500) : 500;

            return {
                statusCode,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    error: {
                        message: error.message || 'Internal server error',
                        code: error instanceof TRPCError ? error.code : 'INTERNAL_SERVER_ERROR',
                    },
                }),
            } satisfies APIGatewayProxyResult;
        }
    };
};
