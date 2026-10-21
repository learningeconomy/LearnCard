import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
    MAX_SHARE_CIPHERTEXT_BYTES,
    MAX_SHARE_RECOVERY_JWE_BYTES,
    decodedBase64UrlByteLength,
    utf8ByteLength,
} from '@learncard/types';

import {
    ShareContentObjectBindingValidator,
    ShareContentPutInputValidator,
    type ShareContentObjectBinding,
} from '@models';
import { computeShareContentRequestHash, isPlainObject } from '@helpers/share-content-auth';

import {
    SHARE_CONTENT_MAX_REQUEST_BYTES,
    type ShareContentErrorCode,
    type ShareContentPluginOptions,
    type ShareContentRouteOperation,
} from './types';

/**
 * Fixed LC-2187 service HTTP contract over the reviewed C1 verifier and C2
 * repository.
 *
 * Invariants enforced here:
 * - The operation is selected by the server route, never by the body; a body
 *   carrying an `op` field fails the strict tuple schema.
 * - The request hash is the C1 canonical SHA-256 of the entire validated request
 *   body (including the opaque envelope and recovery on `put`), bound to the
 *   token claims. A caller-supplied hash is never accepted as authority.
 * - Authentication precedes every repository operation. Parsing is not
 *   authentication.
 * - The repository result is mapped to a small fixed error vocabulary; raw
 *   errors, tokens, bodies and ciphertext are never returned or logged.
 * - Exact-object `get` never reads recovery; `readRecovery` is a separate route
 *   that requires its own signed intent.
 */

const BEARER_AUTHORIZATION_RE = /^Bearer ([A-Za-z0-9._-]+)$/;

const sendError = (reply: FastifyReply, status: number, error: ShareContentErrorCode) =>
    reply.status(status).send({ ok: false, error });

type ExtractedToken = { ok: true; token: string } | { ok: false };

/**
 * Bound and extract the bearer token before any parsing or verification. The
 * accepted header is deliberately tiny and the C1 config's `maxTokenBytes` is
 * the hard ceiling, so a caller cannot widen the accepted transport size.
 */
const extractBearerToken = (header: unknown, maxTokenBytes: number): ExtractedToken => {
    if (typeof header !== 'string') return { ok: false };
    if (header.length > maxTokenBytes + 'Bearer '.length) return { ok: false };
    if (Buffer.byteLength(header, 'utf8') > maxTokenBytes + 'Bearer '.length) return { ok: false };

    const match = BEARER_AUTHORIZATION_RE.exec(header);

    if (!match) return { ok: false };

    return { ok: true, token: match[1] as string };
};

/**
 * Fast, allocation-light size check that runs before strict schema validation so
 * an over-limit decoded ciphertext or serialized recovery is reported as a size
 * failure (413) rather than a generic shape failure (400). Legacy malformed
 * spellings still fall through to the schema.
 */
const exceedsPayloadBounds = (body: unknown): boolean => {
    if (!isPlainObject(body)) return false;

    const envelope = body.envelope;

    if (isPlainObject(envelope) && typeof envelope.ct === 'string') {
        if (envelope.ct.length > Math.ceil((MAX_SHARE_CIPHERTEXT_BYTES * 4) / 3)) return true;

        const decodedBytes = decodedBase64UrlByteLength(envelope.ct);

        if (decodedBytes !== null && decodedBytes > MAX_SHARE_CIPHERTEXT_BYTES) return true;
    }

    const recovery = body.ownerEncryptedRecovery;

    if (isPlainObject(recovery)) {
        if (utf8ByteLength(JSON.stringify(recovery)) > MAX_SHARE_RECOVERY_JWE_BYTES) return true;
    }

    return false;
};

const mapRepositoryError = (reply: FastifyReply, error: string | undefined) => {
    switch (error) {
        case 'INVALID_INPUT':
            return sendError(reply, 400, 'INVALID_INPUT');
        case 'NOT_FOUND':
            return sendError(reply, 404, 'NOT_FOUND');
        case 'TOMBSTONED':
        case 'BINDING_MISMATCH':
        case 'CONFLICT':
            return sendError(reply, 409, 'CONFLICT');
        case 'STORE_ERROR':
        default:
            return sendError(reply, 503, 'UNAVAILABLE');
    }
};

/**
 * Verify authorization and the per-service namespace policy. Returns `true` only
 * when the caller may proceed to the repository. Every failure is a generic,
 * non-distinguishing rejection; a dependency outage (unavailable replay store)
 * is reported as `UNAVAILABLE` and still never reaches the repository.
 */
const authorize = async (
    operation: ShareContentRouteOperation,
    binding: ShareContentObjectBinding,
    validatedBody: unknown,
    authorizationHeader: unknown,
    options: ShareContentPluginOptions,
    reply: FastifyReply
): Promise<boolean> => {
    const token = extractBearerToken(authorizationHeader, options.verifier.config.maxTokenBytes);

    if (!token.ok) {
        sendError(reply, 401, 'UNAUTHORIZED');

        return false;
    }

    const requestHash = computeShareContentRequestHash(validatedBody);

    const result = await options.verifier.authorize(
        {
            namespace: binding.namespace,
            op: operation,
            shareId: binding.shareId,
            contentVersion: binding.contentVersion,
            ownerProfileId: binding.ownerProfileId,
            objectId: binding.objectId,
            operationId: binding.operationId,
            requestHash,
        },
        token.token
    );

    if (!result.ok) {
        if (result.reason === 'REPLAY_STORE_UNAVAILABLE') {
            sendError(reply, 503, 'UNAVAILABLE');
        } else {
            sendError(reply, 401, 'UNAUTHORIZED');
        }

        return false;
    }

    if (!options.namespacePolicy.isAllowed(result.context.signerDid, binding.namespace)) {
        sendError(reply, 401, 'UNAUTHORIZED');

        return false;
    }

    return true;
};

const toBinding = (body: ShareContentObjectBinding): ShareContentObjectBinding => ({
    namespace: body.namespace,
    ownerProfileId: body.ownerProfileId,
    shareId: body.shareId,
    contentVersion: body.contentVersion,
    objectId: body.objectId,
    operationId: body.operationId,
});

const handlePut = async (
    request: FastifyRequest,
    reply: FastifyReply,
    options: ShareContentPluginOptions
) => {
    if (exceedsPayloadBounds(request.body)) return sendError(reply, 413, 'PAYLOAD_TOO_LARGE');

    const parsed = ShareContentPutInputValidator.safeParse(request.body);

    if (!parsed.success) return sendError(reply, 400, 'INVALID_INPUT');

    const body = parsed.data;

    if (
        !(await authorize(
            'put',
            toBinding(body),
            body,
            request.headers.authorization,
            options,
            reply
        ))
    ) {
        return reply;
    }

    try {
        const result = await options.repository.put(body);

        if (!result.ok) return mapRepositoryError(reply, result.error);

        return reply.status(200).send({ ok: true, value: result.value });
    } catch {
        return sendError(reply, 503, 'UNAVAILABLE');
    }
};

const handleExactObject = async (
    operation: Exclude<ShareContentRouteOperation, 'put'>,
    request: FastifyRequest,
    reply: FastifyReply,
    options: ShareContentPluginOptions
) => {
    const parsed = ShareContentObjectBindingValidator.safeParse(request.body);

    if (!parsed.success) return sendError(reply, 400, 'INVALID_INPUT');

    const binding = parsed.data;

    if (
        !(await authorize(
            operation,
            binding,
            binding,
            request.headers.authorization,
            options,
            reply
        ))
    ) {
        return reply;
    }

    try {
        const result =
            operation === 'get'
                ? await options.repository.getContent(binding)
                : operation === 'stat'
                  ? await options.repository.stat(binding)
                  : operation === 'delete'
                    ? await options.repository.delete(binding)
                    : await options.repository.getRecovery(binding);

        if (!result.ok) return mapRepositoryError(reply, result.error);

        return reply.status(200).send({ ok: true, value: result.value });
    } catch {
        return sendError(reply, 503, 'UNAVAILABLE');
    }
};

/**
 * The dedicated Fastify plugin. It reads no environment and opens no
 * connections: the startup wrapper injects the verifier, the initialized
 * repository and the namespace policy, and only registers the plugin when the
 * configuration is valid and enabled.
 */
export const shareContentFastifyPlugin: FastifyPluginAsync<ShareContentPluginOptions> = async (
    fastify: FastifyInstance,
    options: ShareContentPluginOptions
) => {
    const bodyLimit = Math.max(
        1,
        Math.min(
            options.maxRequestBytes ?? SHARE_CONTENT_MAX_REQUEST_BYTES,
            SHARE_CONTENT_MAX_REQUEST_BYTES
        )
    );

    fastify.addHook('onSend', async (_request, reply) => {
        reply.header('Cache-Control', 'no-store');
    });

    // Route-scoped sanitized error handling. Parser errors (too large, malformed
    // JSON, unsupported content type) never leak a raw message, and unknown
    // failures collapse to the same non-disclosing `UNAVAILABLE` shape.
    fastify.setErrorHandler((error, _request, reply) => {
        const code =
            typeof error === 'object' && error !== null
                ? (error as { code?: unknown }).code
                : undefined;

        if (code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
            return sendError(reply, 413, 'PAYLOAD_TOO_LARGE');
        }

        if (
            code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE' ||
            code === 'FST_ERR_CTP_INVALID_JSON' ||
            code === 'FST_ERR_CTP_INVALID_JSON_BODY' ||
            code === 'FST_ERR_CTP_EMPTY_JSON_BODY'
        ) {
            return sendError(reply, 400, 'INVALID_INPUT');
        }

        return sendError(reply, 503, 'UNAVAILABLE');
    });

    fastify.post('/put', { bodyLimit }, (request, reply) => handlePut(request, reply, options));
    fastify.post('/get', { bodyLimit }, (request, reply) =>
        handleExactObject('get', request, reply, options)
    );
    fastify.post('/stat', { bodyLimit }, (request, reply) =>
        handleExactObject('stat', request, reply, options)
    );
    fastify.post('/delete', { bodyLimit }, (request, reply) =>
        handleExactObject('delete', request, reply, options)
    );
    fastify.post('/readRecovery', { bodyLimit }, (request, reply) =>
        handleExactObject('readRecovery', request, reply, options)
    );
};

export default shareContentFastifyPlugin;
