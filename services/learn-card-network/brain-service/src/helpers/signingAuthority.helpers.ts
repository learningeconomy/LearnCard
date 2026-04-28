import dotenv from 'dotenv';
import { Agent, setGlobalDispatcher } from 'undici';
import { getDidWebLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { UnsignedVC, VCValidator, JWEValidator, VC, JWE } from '@learncard/types';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import { getDidWeb } from '@helpers/did.helpers';
import { trace, traceCrypto, traceHttp } from '@tracing';
import { PerfTracker } from '@helpers/perf';
import { benchContextStorage } from '@helpers/bench-context.helpers';

dotenv.config();

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

// LC-1644 Phase 4e: the SA HTTP call previously used a 21s timeout with no retry.
// In practice a healthy SA responds in ~220ms warm / ~1.5s cold; when it fails it's
// usually a transient 5xx or a lambda cold-start that never returned. The old config
// meant the user sat through a full 21s wait on those stalls. New shape:
//   - 8s per-attempt timeout (kills the long-tail stall case at 8s instead of 21s)
//   - single retry on transient failure (5xx, 408, 429, network, timeout)
//   - small jittered backoff between attempts
// Worst case now is 2 × 8s + backoff ≈ 16s (still < the old 21s), and typical
// transient failures now succeed on retry in ~500ms instead of the full 21s wait.
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 1; // total attempts = MAX_RETRIES + 1 = 2
const RETRY_BACKOFF_BASE_MS = 150;
const RETRY_BACKOFF_JITTER_MS = 150;

/**
 * Error thrown from the SA issue path. Adds structured fields so callers can
 * distinguish transient vs. permanent failures and log the SA response body.
 * `retryable` is only meaningful inside this module — it drives the retry
 * decision; callers should treat any thrown SaIssueError as a hard failure.
 */
export class SaIssueError extends Error {
    readonly status: number;
    readonly body?: string;
    readonly kind:
        | 'timeout'
        | 'network'
        | 'http_5xx'
        | 'http_429'
        | 'http_408'
        | 'http_4xx'
        | 'malformed_response'
        | 'validation_error';
    readonly retryable: boolean;
    readonly cause?: unknown;

    constructor(opts: {
        message: string;
        status: number;
        kind: SaIssueError['kind'];
        retryable: boolean;
        body?: string;
        cause?: unknown;
    }) {
        super(opts.message);
        this.name = 'SaIssueError';
        this.status = opts.status;
        this.body = opts.body;
        this.kind = opts.kind;
        this.retryable = opts.retryable;
        this.cause = opts.cause;
    }
}

const classifyHttpStatus = (
    status: number
): { kind: SaIssueError['kind']; retryable: boolean } => {
    if (status >= 500) return { kind: 'http_5xx', retryable: true };
    if (status === 408) return { kind: 'http_408', retryable: true };
    if (status === 429) return { kind: 'http_429', retryable: true };
    return { kind: 'http_4xx', retryable: false };
};

const sleep = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

// LC-1644 Task 3: persistent HTTP agent with keepAlive + connection pool for SA calls.
//
// Before this change, every SA issue call did a full TCP+TLS handshake. Staging p50 for
// the http phase was 222ms (warm), spiking to ~4s on cold lambda due to fresh TLS. Keeping
// the socket warm across calls eliminates the handshake on subsequent requests to the
// same SA origin — expected savings 100-300ms per warm call and multiple seconds on cold
// paths that would otherwise re-handshake.
//
// Agent is per-origin pooled; one shared instance handles all SA endpoints. Created lazily
// so tests that stub fetch don't trigger socket allocation. `pipelining: 1` keeps request
// ordering deterministic (SA responses aren't idempotent — we don't want body reordering).
let _saAgent: Agent | undefined;
const getSaAgent = (): Agent => {
    if (!_saAgent) {
        _saAgent = new Agent({
            keepAliveTimeout: 30_000,
            keepAliveMaxTimeout: 60_000,
            connections: 10,
            pipelining: 1,
            // Prefer HTTP/2 when the server supports it (e.g. staging.api.learncard.app
            // fronted by API Gateway). H/2 multiplexes streams over a single TCP
            // connection, further reducing handshake overhead across concurrent SA calls.
            allowH2: true,
        });
        // Install as global dispatcher so native fetch() picks it up. Node's global
        // fetch only honors a per-call `dispatcher` option when it's on undici's
        // internal options object; setting the global dispatcher is the reliable path
        // and also benefits any other SA-adjacent calls that use plain fetch.
        setGlobalDispatcher(_saAgent);
        console.log('[SA Helper] undici keepAlive agent installed as global dispatcher');
    }
    return _saAgent;
};

const _mockIssueCredentialWithSigningAuthority = async (credential: UnsignedVC): Promise<VC> => {
    const learnCard = await getLearnCard();
    return learnCard.invoke.issueCredential({ ...credential, issuer: learnCard.id.did() });
};

export async function issueCredentialWithSigningAuthority(
    owner: ProfileType,
    credential: UnsignedVC,
    signingAuthorityForUser: SigningAuthorityForUserType,
    domain: string,
    encrypt: boolean = true,
    ownerDidOverride?: string
): Promise<VC | JWE> {
    const issuerEndpoint = `${signingAuthorityForUser.signingAuthority.endpoint}/credentials/issue`;
    const saName = signingAuthorityForUser.relationship.name;
    const saDid = signingAuthorityForUser.relationship.did;
    // LC-1644 bench: allow SA_OWNER_DID_OVERRIDE env var to force a specific ownerDid
    // without threading the param through every caller. Takes precedence over the
    // caller-supplied override so benches against remote SAs can redirect all calls
    // to a registered owner — only set in bench/dev environments.
    //
    // We treat empty string as "unset" because compose interpolation (e.g. `${VAR:-}`)
    // produces `""` when the host var is missing, and `??` would otherwise let that
    // empty string through and break the SA lookup.
    const envOverride = process.env.SA_OWNER_DID_OVERRIDE;
    const ownerDid =
        (envOverride && envOverride.length > 0 ? envOverride : undefined)
        ?? ownerDidOverride
        ?? getDidWeb(domain ?? 'network.learncard.com', owner.profileId);

    const logContext = {
        owner: owner.profileId,
        ownerDid,
        saName,
        saDid,
        issuerEndpoint,
        encrypt,
    };

    return trace('signing-authority', 'issueCredentialWithSigningAuthority', async () => {
        const perf = new PerfTracker('issueCredentialWithSigningAuthority');

        try {

            if (IS_TEST_ENVIRONMENT) {
                return await _mockIssueCredentialWithSigningAuthority(credential);
            }

            console.log('[SA Helper] Initiating credential issuance', logContext);

            const learnCard = await trace('init', 'getDidWebLearnCard', () => getDidWebLearnCard());
            perf.mark('initDid');

            const brainDid = learnCard.id.did();
            console.log('[SA Helper] Brain DID resolved:', brainDid);

            const didJwt = await traceCrypto('getDidAuthVp', () =>
                learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' })
            );
            perf.mark('didAuthVp');

            if (!didJwt) {
                console.error('[SA Helper] Failed to generate DID Auth VP - got falsy value');
            }

            const subjectId = Array.isArray(credential?.credentialSubject)
                ? credential?.credentialSubject[0]?.id
                : credential?.credentialSubject?.id;

            const encryption = encrypt
                ? {
                      recipients: [brainDid, ...(subjectId ? [subjectId] : [])],
                  }
                : undefined;

            console.log('[SA Helper] Request details:', {
                subjectId,
                encryptionRecipients: encryption?.recipients,
                credentialType: credential?.type,
            });

            const requestBody = JSON.stringify({
                credential,
                signingAuthority: {
                    ownerDid,
                    name: saName,
                    did: saDid,
                },
                encryption,
            });

            /**
             * One HTTP attempt against the SA. Throws a structured SaIssueError that
             * carries the status + body + classification the retry loop needs to decide
             * whether to try again. Per-attempt timeout is REQUEST_TIMEOUT_MS.
             */
            const attempt = async (attemptIndex: number): Promise<VC | JWE> => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

                let response: Response;
                try {
                    response = await traceHttp(
                        'fetch-lca-api',
                        () =>
                            fetch(issuerEndpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${didJwt}`,
                                },
                                body: requestBody,
                                signal: controller.signal,
                                // LC-1644 Task 3: keepAlive + pooling via shared undici Agent
                                dispatcher: getSaAgent(),
                            } as RequestInit & { dispatcher: Agent }),
                        { endpoint: issuerEndpoint, attempt: attemptIndex + 1 }
                    );
                } catch (err) {
                    clearTimeout(timeoutId);
                    // AbortError → timeout; everything else is a generic network error.
                    // Both are retryable; we only get here if fetch itself throws.
                    const isAbort =
                        err instanceof Error &&
                        (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'));
                    throw new SaIssueError({
                        message: isAbort
                            ? `SA request aborted after ${REQUEST_TIMEOUT_MS}ms timeout`
                            : `SA network error: ${err instanceof Error ? err.message : String(err)}`,
                        status: 0,
                        kind: isAbort ? 'timeout' : 'network',
                        retryable: true,
                        cause: err,
                    });
                }
                clearTimeout(timeoutId);

                console.log(
                    '[SA Helper] LCA-API response status:',
                    response.status,
                    response.statusText,
                    attemptIndex > 0 ? `(attempt ${attemptIndex + 1})` : ''
                );

                if (!response.ok) {
                    const errorBody = await response.text().catch(() => '');
                    const { kind, retryable } = classifyHttpStatus(response.status);
                    console.error('[SA Helper] LCA-API returned non-OK response:', {
                        status: response.status,
                        statusText: response.statusText,
                        body: errorBody,
                        attempt: attemptIndex + 1,
                        retryable,
                        ...logContext,
                    });
                    throw new SaIssueError({
                        message: `LCA-API returned ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
                        status: response.status,
                        body: errorBody,
                        kind,
                        retryable,
                    });
                }

                const res = await trace('internal', 'parseResponse', () => response.json());

                if (!res || res?.code === 'INTERNAL_SERVER_ERROR') {
                    console.error('[SA Helper] LCA-API returned error in body:', JSON.stringify(res));
                    throw new SaIssueError({
                        message: `LCA-API error response: ${JSON.stringify(res)}`,
                        status: response.status,
                        body: JSON.stringify(res),
                        kind: 'http_5xx',
                        retryable: true,
                    });
                }

                if (encryption) {
                    const validationResult = await JWEValidator.spa(res);
                    if (!validationResult.success) {
                        console.error('[SA Helper] JWE validation failed:', validationResult.error);
                        throw new SaIssueError({
                            message: 'Signing Authority returned malformed JWE',
                            status: response.status,
                            body: typeof res === 'string' ? res : JSON.stringify(res),
                            kind: 'malformed_response',
                            retryable: false,
                        });
                    }
                    return validationResult.data;
                }
                const validationResult = await VCValidator.spa(res);
                if (!validationResult.success) {
                    console.error('[SA Helper] VC validation failed:', validationResult.error);
                    throw new SaIssueError({
                        message: 'Signing Authority returned malformed VC',
                        status: response.status,
                        body: typeof res === 'string' ? res : JSON.stringify(res),
                        kind: 'malformed_response',
                        retryable: false,
                    });
                }
                return validationResult.data;
            };

            // Retry loop. See REQUEST_TIMEOUT_MS / MAX_RETRIES notes at top of file.
            let lastError: SaIssueError | undefined;
            for (let i = 0; i <= MAX_RETRIES; i++) {
                try {
                    const result = await attempt(i);
                    perf.mark(i === 0 ? 'http' : `http_retry_${i}`);
                    perf.done({
                        saEndpoint: signingAuthorityForUser.signingAuthority.endpoint,
                        attempts: i + 1,
                    });
                    const benchCtx = benchContextStorage.getStore();
                    if (benchCtx) {
                        const captured = perf.capture();
                        benchCtx.sa_http_ms = captured.phases.http ?? 0;
                        benchCtx.sa_didauthvp_ms = captured.phases.didAuthVp ?? 0;
                    }
                    return result;
                } catch (err) {
                    if (!(err instanceof SaIssueError)) throw err; // unexpected: let it bubble
                    lastError = err;
                    if (!err.retryable || i === MAX_RETRIES) break;
                    const backoff =
                        RETRY_BACKOFF_BASE_MS + Math.floor(Math.random() * RETRY_BACKOFF_JITTER_MS);
                    console.warn('[SA Helper] retrying SA call', {
                        kind: err.kind,
                        status: err.status,
                        attempt: i + 1,
                        nextAttemptIn: `${backoff}ms`,
                        ...logContext,
                    });
                    await sleep(backoff);
                }
            }
            // Exhausted retries. Re-throw the last error with full context preserved.
            throw lastError;
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            const errStack = error instanceof Error ? error.stack : undefined;
            const errDetail =
                error instanceof SaIssueError
                    ? { status: error.status, kind: error.kind, body: error.body }
                    : {};
            perf.done({ saEndpoint: signingAuthorityForUser.signingAuthority.endpoint, error: errMsg });
            console.error('[SA Helper] issueCredentialWithSigningAuthority failed:', {
                error: errMsg,
                stack: errStack,
                ...errDetail,
                ...logContext,
            });
            throw error;
        }
    }, { owner: owner.profileId, saEndpoint: signingAuthorityForUser.signingAuthority.endpoint });
}
