import type { ShareContentRepository } from '@accesslayer/share-content';
import type { ReplayStore, ShareContentAuthorizationVerifier } from '@helpers/share-content-auth';

import type { ShareContentNamespacePolicy } from './config';

/**
 * LC-2187 LearnCloud service-only share-content transport.
 *
 * This module is the C4 transport seam: it turns the reviewed C1 authorization
 * verifier and the C2 immutable repository into the fixed service HTTP contract
 * (`POST /internal/share-content/{op}`). It never redesigns the claim format,
 * the repository state machine or the public share feature; those stay owned by
 * their batches.
 */

/** All shared-content service routes live under this configured prefix. */
export const SHARE_CONTENT_PLUGIN_PREFIX = '/internal/share-content';

/** The exact operation is selected by the server route, never by the body. */
export type ShareContentRouteOperation = 'put' | 'get' | 'stat' | 'delete' | 'readRecovery';

/** Hard transport bound mandated by the A2 review; the Fastify default. */
export const SHARE_CONTENT_MAX_REQUEST_BYTES = 1024 * 1024;

/**
 * Contract error statuses. Response bodies are always the generic
 * `{ ok: false, error }` shape; internal rejection reasons are never returned.
 */
export const SHARE_CONTENT_ERROR_CODES = [
    'UNAUTHORIZED',
    'INVALID_INPUT',
    'PAYLOAD_TOO_LARGE',
    'NOT_FOUND',
    'CONFLICT',
    'UNAVAILABLE',
] as const;

export type ShareContentErrorCode = (typeof SHARE_CONTENT_ERROR_CODES)[number];

export type ShareContentErrorBody = { ok: false; error: ShareContentErrorCode };

/**
 * Injected transport dependencies. The route layer only orchestrates: it
 * validates the wire body, hashes it, asks the injected verifier to authorize,
 * checks the configured namespace policy, then calls the repository.
 */
export type ShareContentPluginOptions = {
    verifier: ShareContentAuthorizationVerifier;
    repository: ShareContentRepository;
    namespacePolicy: ShareContentNamespacePolicy;
    /** Route body limit; must never exceed {@link SHARE_CONTENT_MAX_REQUEST_BYTES}. */
    maxRequestBytes?: number;
};

/** Structural view of a Redis-like atomic replay store used by the runtime. */
export type ShareContentReplayStoreFactory = () => {
    store: ReplayStore;
    close: () => Promise<void>;
};
