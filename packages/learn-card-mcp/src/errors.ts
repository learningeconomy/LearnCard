/** Stable, client-safe error codes. Messages sent with them must never carry internal detail. */
export type McpErrorCode =
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'invalid_request'
    | 'rate_limited'
    | 'upstream_unavailable'
    | 'internal_error';

const HTTP_STATUS: Record<McpErrorCode, number> = {
    unauthorized: 401,
    forbidden: 403,
    not_found: 404,
    invalid_request: 400,
    rate_limited: 429,
    upstream_unavailable: 503,
    internal_error: 500,
};

/**
 * Throw from a tool handler to return a typed tool error (`isError: true`) to the
 * model instead of a protocol-level failure. `message` is shown to the client.
 */
export class McpToolError extends Error {
    readonly code: McpErrorCode;

    constructor(code: McpErrorCode, message: string) {
        super(message);
        this.name = 'McpToolError';
        this.code = code;
    }
}

export type McpTextContent = { type: 'text'; text: string };

export type McpToolResponse = {
    content: McpTextContent[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
};

/** A successful tool result carrying the same JSON as text and structured content. */
export const jsonToolResponse = <T extends Record<string, unknown>>(
    output: T
): McpToolResponse & { structuredContent: T } => ({
    content: [{ type: 'text', text: JSON.stringify(output) }],
    structuredContent: output,
});

/** A typed tool error result: `{ error: { code, message } }` with `isError: true`. */
export const toolErrorResponse = (code: McpErrorCode, message: string): McpToolResponse => {
    const error = { code, message };
    return {
        content: [{ type: 'text', text: JSON.stringify({ error }) }],
        structuredContent: { error },
        isError: true,
    };
};

export const httpStatusForCode = (code: McpErrorCode): number => HTTP_STATUS[code];

/** JSON body for HTTP-level failures. Kept as `{ error }` so existing clients still parse it. */
export type McpHttpErrorBody = { error: string; code: McpErrorCode };

export const httpErrorBody = (code: McpErrorCode, message: string): McpHttpErrorBody => ({
    error: message,
    code,
});
