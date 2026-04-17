import dotenv from 'dotenv';
import { Agent, setGlobalDispatcher } from 'undici';
import { getDidWebLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { UnsignedVC, VCValidator, JWEValidator, VC, JWE } from '@learncard/types';
import { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import { getDidWeb } from '@helpers/did.helpers';
import { trace, traceCrypto, traceHttp } from '@tracing';
import { PerfTracker } from '@helpers/perf';

dotenv.config();

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

// Timeout value in milliseconds for aborting the request
const TIMEOUT = 21_000;

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
    const ownerDid =
        process.env.SA_OWNER_DID_OVERRIDE
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

            // Create an AbortController instance and get the signal
            const controller = new AbortController();
            const { signal } = controller;

            // Set a timeout to abort the fetch request
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

            const response = await traceHttp('fetch-lca-api', async () => {
                const resp = await fetch(issuerEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${didJwt}`,
                    },
                    body: JSON.stringify({
                        credential,
                        signingAuthority: {
                            ownerDid,
                            name: saName,
                            did: saDid,
                        },
                        encryption,
                    }),
                    signal,
                    // LC-1644 Task 3: keepAlive + pooling via shared undici Agent
                    dispatcher: getSaAgent(),
                } as RequestInit & { dispatcher: Agent });

                return resp;
            }, { endpoint: issuerEndpoint });

            clearTimeout(timeoutId);

            perf.mark('http');

            console.log('[SA Helper] LCA-API response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[SA Helper] LCA-API returned non-OK response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody,
                    ...logContext,
                });
                throw new Error(
                    `LCA-API returned ${response.status}: ${errorBody}`
                );
            }

            const res = await trace('internal', 'parseResponse', () => response.json());
            perf.mark('parse');

            if (!res || res?.code === 'INTERNAL_SERVER_ERROR') {
                console.error('[SA Helper] LCA-API returned error in body:', JSON.stringify(res));
                throw new Error(
                    `LCA-API error response: ${JSON.stringify(res)}`
                );
            }

            if (encryption) {
                const validationResult = await JWEValidator.spa(res);

                if (!validationResult.success) {
                    console.error('[SA Helper] JWE validation failed:', validationResult.error);
                    throw new Error('Signing Authority returned malformed JWE');
                }

                perf.done({ saEndpoint: signingAuthorityForUser.signingAuthority.endpoint });
                return validationResult.data;
            } else {
                const validationResult = await VCValidator.spa(res);

                if (!validationResult.success) {
                    console.error('[SA Helper] VC validation failed:', validationResult.error);
                    throw new Error('Signing Authority returned malformed VC');
                }

                perf.done({ saEndpoint: signingAuthorityForUser.signingAuthority.endpoint });
                return validationResult.data;
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            const errStack = error instanceof Error ? error.stack : undefined;
            perf.done({ saEndpoint: signingAuthorityForUser.signingAuthority.endpoint, error: errMsg });
            console.error('[SA Helper] issueCredentialWithSigningAuthority failed:', {
                error: errMsg,
                stack: errStack,
                ...logContext,
            });
            throw error;
        }
    }, { owner: owner.profileId, saEndpoint: signingAuthorityForUser.signingAuthority.endpoint });
}
