import Fastify, { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyCors from '@fastify/cors';

import {
    getCredentialRefresh,
    getCredentialRefreshCanonicalLifecycle,
    getCredentialRefreshHead,
    getCredentialRefreshVersion,
    getCredentialRefreshVersions,
    setCredentialRefreshState,
} from '@accesslayer/credential-refresh';
import type { CredentialRefreshRecord } from 'types/credential-refresh';
import { getCredentialRefreshDigestSecret } from '@helpers/credential-refresh-materiality.helpers';
import { computeRefreshEtag } from '@helpers/credential-refresh.helpers';
import {
    CREDENTIAL_REFRESH_AUTH_SCHEME,
    issueCredentialRefreshChallenge,
    verifyCredentialRefreshAuthorization,
    enforceCredentialRefreshPreAuthRateLimit,
    enforceCredentialRefreshHolderRateLimit,
} from '@helpers/credential-refresh-auth.helpers';

/**
 * Managed credential refresh holder endpoint (LC-2117 / LC-2135 / LC-2136).
 *
 * Serves holder-encrypted current and historical versions behind a single-use
 * DID-auth challenge. Authentication always precedes conditional requests, holder
 * authorization, lifecycle, and existence distinctions, and the 401 challenge
 * response never reveals whether a refreshId exists.
 *
 * Routes are registered only when CREDENTIAL_REFRESH_ENABLED === 'true', and the
 * dedicated HMAC digest secret is validated at registration (startup) time.
 */

export { CREDENTIAL_REFRESH_AUTH_SCHEME };

export const isCredentialRefreshEnabled = (): boolean =>
    process.env.CREDENTIAL_REFRESH_ENABLED === 'true';

export type CredentialRefreshPluginOptions = {
    /** Coarse per-(sourceIp, refreshId) pre-auth limit per minute */
    preAuthRateLimit?: number;
    /** Per-(holderDid, refreshId) post-auth limit per minute */
    holderRateLimit?: number;
};

type RefreshParams = { Params: { refreshId: string } };
type VersionParams = { Params: { refreshId: string; version: string } };
type HistoryQuery = { Querystring: { cursor?: string; limit?: string } };

/** Privacy-safe request log: opaque IDs, result codes, latency, and version only. */
const logRefreshRequest = (
    refreshId: string,
    result: string,
    startedAt: number,
    version?: number
) =>
    console.info(
        JSON.stringify({
            scope: 'credential-refresh',
            refreshId,
            result,
            latencyMs: Date.now() - startedAt,
            ...(version !== undefined ? { version } : {}),
        })
    );

const formatEtag = (etag: string): string => `"${etag}"`;

const ifNoneMatchIncludes = (header: string | undefined, etag: string): boolean => {
    if (!header) return false;

    return header
        .split(',')
        .map(candidate => candidate.trim().replace(/^W\//, '').replace(/^"|"$/g, ''))
        .some(candidate => candidate === '*' || candidate === etag);
};

const getRequestDomain = (request: FastifyRequest): string =>
    process.env.DOMAIN_NAME || request.host;

const setCorsHeaders = (reply: FastifyReply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-None-Match');
};

type AuthenticatedAggregate = {
    holderDid: string;
    aggregate: CredentialRefreshRecord;
};

/**
 * Shared authentication/authorization pipeline for every refresh route. Sends the
 * terminal response and returns null on any failure; returns the authenticated
 * holder DID and active aggregate on success.
 *
 * Order is privacy-significant: rate limit → authenticate (401 challenge) →
 * holder rate limit → existence (404) → holder match (403, non-disclosing) →
 * awaiting_claim (403, non-disclosing) → revoked (410).
 */
const authenticateRefreshRequest = async (
    request: FastifyRequest<RefreshParams>,
    reply: FastifyReply,
    options: CredentialRefreshPluginOptions,
    startedAt: number
): Promise<AuthenticatedAggregate | null> => {
    const { refreshId } = request.params;
    const domain = getRequestDomain(request);

    try {
        await enforceCredentialRefreshPreAuthRateLimit(
            request.ip,
            refreshId,
            options.preAuthRateLimit
        );
    } catch {
        logRefreshRequest(refreshId, 'rate-limited', startedAt);
        await reply.status(429).send({ code: 'CREDENTIAL_REFRESH_RATE_LIMITED' });
        return null;
    }

    const auth = await verifyCredentialRefreshAuthorization(
        refreshId,
        request.headers.authorization,
        domain
    );

    if (!auth.authenticated) {
        const challenge = await issueCredentialRefreshChallenge(refreshId, domain);

        logRefreshRequest(refreshId, 'challenge-issued', startedAt);
        await reply
            .status(401)
            .header('WWW-Authenticate', CREDENTIAL_REFRESH_AUTH_SCHEME)
            .send(challenge);
        return null;
    }

    try {
        await enforceCredentialRefreshHolderRateLimit(
            auth.holderDid,
            refreshId,
            options.holderRateLimit
        );
    } catch {
        logRefreshRequest(refreshId, 'rate-limited', startedAt);
        await reply.status(429).send({ code: 'CREDENTIAL_REFRESH_RATE_LIMITED' });
        return null;
    }

    const aggregate = await getCredentialRefresh(refreshId);

    if (!aggregate) {
        logRefreshRequest(refreshId, 'not-found', startedAt);
        await reply.status(404).send({ code: 'CREDENTIAL_REFRESH_NOT_FOUND' });
        return null;
    }

    // Wrong holder deliberately shares one non-disclosing authorization response with
    // awaiting-claim below — neither reveals lifecycle state.
    if (aggregate.holderDid !== auth.holderDid) {
        logRefreshRequest(refreshId, 'unauthorized', startedAt);
        await reply.status(403).send({ code: 'CREDENTIAL_REFRESH_UNAUTHORIZED' });
        return null;
    }

    // Canonical lifecycle cross-check (LC-2117/LC-2135, plan Task 8): serving never
    // depends solely on the aggregate's cached state. The CREDENTIAL_SENT/RECEIVED
    // relationships are authoritative; a stale aggregate is repaired lazily.
    const lifecycle = await getCredentialRefreshCanonicalLifecycle(refreshId);

    if (lifecycle?.revoked || aggregate.state === 'revoked') {
        if (aggregate.state !== 'revoked') {
            try {
                await setCredentialRefreshState(refreshId, 'revoked');
            } catch {
                // Repair is best-effort; the refusal above is driven by canonical state.
            }
        }

        logRefreshRequest(refreshId, 'revoked', startedAt);
        await reply.status(410).send({ code: 'CREDENTIAL_REVOKED' });
        return null;
    }

    if (aggregate.state === 'awaiting_claim') {
        if (!lifecycle?.received) {
            logRefreshRequest(refreshId, 'unauthorized', startedAt);
            await reply.status(403).send({ code: 'CREDENTIAL_REFRESH_UNAUTHORIZED' });
            return null;
        }

        // The canonical CREDENTIAL_RECEIVED relationship exists but the activation
        // write was lost — repair the aggregate and serve.
        try {
            await setCredentialRefreshState(refreshId, 'active');
        } catch {
            // Repair is best-effort; canonical state already authorizes serving.
        }

        return { holderDid: auth.holderDid, aggregate: { ...aggregate, state: 'active' } };
    }

    return { holderDid: auth.holderDid, aggregate };
};

const sendJweEnvelope = async (
    reply: FastifyReply,
    encryptedCredential: string,
    etag: string | undefined,
    version: number
) => {
    if (etag) reply.header('ETag', formatEtag(etag));

    reply.type('application/json');

    return reply.send({
        format: 'jwe',
        jwe: JSON.parse(encryptedCredential),
        ...(etag ? { etag } : {}),
        version,
    });
};

export const credentialRefreshFastifyPlugin: FastifyPluginAsync<
    CredentialRefreshPluginOptions
> = async (fastify, options) => {
    if (!isCredentialRefreshEnabled()) return;

    // Fail startup when the dedicated HMAC secret is missing while the endpoint is
    // enabled (no-op in test environments, which use a test-only fallback).
    getCredentialRefreshDigestSecret();

    fastify.addHook('onSend', async (_request, reply) => {
        reply.header('Cache-Control', 'private, no-store');
    });

    const registerOptionsRoute = (path: string) => {
        fastify.options(path, async (_request, reply) => {
            setCorsHeaders(reply);

            return reply.status(200).send();
        });
    };

    registerOptionsRoute('/refresh/:refreshId');
    registerOptionsRoute('/refresh/:refreshId/history');
    registerOptionsRoute('/refresh/:refreshId/versions/:version');

    fastify.get<RefreshParams>('/refresh/:refreshId', async (request, reply) => {
        const startedAt = Date.now();
        const { refreshId } = request.params;

        setCorsHeaders(reply);

        const auth = await authenticateRefreshRequest(request, reply, options, startedAt);

        if (!auth) return reply;

        const head = await getCredentialRefreshHead(refreshId);

        if (!head) {
            logRefreshRequest(refreshId, 'not-found', startedAt);
            return reply.status(404).send({ code: 'CREDENTIAL_REFRESH_NOT_FOUND' });
        }

        // The original (v1) version is bound at send time without a stored ETag;
        // derive it lazily from the stored encrypted bytes (identical to the
        // publication-time derivation for later versions).
        const etag = head.etag ?? auth.aggregate.etag ?? computeRefreshEtag(head.credential);

        if (etag && ifNoneMatchIncludes(request.headers['if-none-match'], etag)) {
            logRefreshRequest(refreshId, 'not-modified', startedAt, head.version);
            return reply.status(304).header('ETag', formatEtag(etag)).send();
        }

        logRefreshRequest(refreshId, 'served', startedAt, head.version);

        return sendJweEnvelope(reply, head.credential, etag, head.version);
    });

    fastify.get<RefreshParams & HistoryQuery>(
        '/refresh/:refreshId/history',
        async (request, reply) => {
            const startedAt = Date.now();
            const { refreshId } = request.params;

            setCorsHeaders(reply);

            const auth = await authenticateRefreshRequest(request, reply, options, startedAt);

            if (!auth) return reply;

            const { cursor, limit } = request.query;
            const parsedLimit = limit === undefined ? undefined : Number(limit);

            if (parsedLimit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit < 1)) {
                return reply.status(400).send({ code: 'CREDENTIAL_REFRESH_INVALID_QUERY' });
            }

            try {
                const {
                    records,
                    hasMore,
                    cursor: nextCursor,
                } = await getCredentialRefreshVersions(refreshId, { cursor, limit: parsedLimit });

                logRefreshRequest(refreshId, 'history-served', startedAt);

                // Metadata only: version payloads are never exposed by history.
                return reply.send({
                    records: records.map(record => ({
                        version: record.version,
                        publishedAt: record.publishedAt,
                        ...(record.effectiveAt ? { effectiveAt: record.effectiveAt } : {}),
                        ...(record.etag ? { etag: record.etag } : {}),
                        ...(record.signingMode ? { signingMode: record.signingMode } : {}),
                        ...(record.updateSummary ? { updateSummary: record.updateSummary } : {}),
                    })),
                    hasMore,
                    ...(nextCursor ? { cursor: nextCursor } : {}),
                });
            } catch {
                return reply.status(400).send({ code: 'CREDENTIAL_REFRESH_INVALID_QUERY' });
            }
        }
    );

    fastify.get<VersionParams>('/refresh/:refreshId/versions/:version', async (request, reply) => {
        const startedAt = Date.now();
        const { refreshId } = request.params;

        setCorsHeaders(reply);

        const auth = await authenticateRefreshRequest(request, reply, options, startedAt);

        if (!auth) return reply;

        const version = Number(request.params.version);

        if (!Number.isInteger(version) || version < 1) {
            return reply.status(400).send({ code: 'CREDENTIAL_REFRESH_INVALID_VERSION' });
        }

        const versionNode = await getCredentialRefreshVersion(refreshId, version);

        if (!versionNode) {
            logRefreshRequest(refreshId, 'not-found', startedAt, version);
            return reply.status(404).send({ code: 'CREDENTIAL_REFRESH_NOT_FOUND' });
        }

        const versionEtag = versionNode.etag ?? computeRefreshEtag(versionNode.credential);

        if (ifNoneMatchIncludes(request.headers['if-none-match'], versionEtag)) {
            logRefreshRequest(refreshId, 'not-modified', startedAt, version);
            return reply.status(304).header('ETag', formatEtag(versionEtag)).send();
        }

        logRefreshRequest(refreshId, 'version-served', startedAt, version);

        return sendJweEnvelope(reply, versionNode.credential, versionEtag, versionNode.version);
    });
};

export const app = Fastify();

app.register(fastifyCors);
app.register(credentialRefreshFastifyPlugin);

export default app;
