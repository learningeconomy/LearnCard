/**
 * Real LearnCard wallet helpers for OpenCred interop tests.
 *
 * Unlike the openid4vc-interop-e2e suite (which uses a stub LearnCard
 * because walt.id mints all credentials), the OpenCred suite needs
 * LearnCard to self-issue the credentials it later presents. That
 * requires a real wallet with `issueCredential` / `issuePresentation`
 * wired up — i.e. the full `initLearnCard` stack, not a hand-rolled
 * mock.
 *
 * The `invoke` surface is typed permissively (`Record<string, ...>`).
 * The full plugin chain (Crypto → DIDKit → DidKey → Encryption → VC →
 * ... → OpenID4VC) is too deep for TypeScript's inference to merge all
 * method shapes — same precedent as `tests/openid4vc-interop-e2e`,
 * which uses `(plugin as any)` for the same reason. Runtime invocation
 * is exhaustively covered by the openid4vc plugin's own unit tests.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import { initLearnCard } from '@learncard/init';
import type {
    LearnCardFromSeed,
    DidWebLearnCardFromSeed,
} from '@learncard/init';

const require = createRequire(import.meta.url);

const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

/**
 * Fetch interceptor that adapts the openid4vc plugin's spec-compliant
 * `descriptor_map[].format` (VC format per DIF PEX v2 §6) to
 * OpenCred's vendor-specific reading (VP envelope format).
 *
 * The plugin emits `format: 'ldp_vc'` / `format: 'jwt_vc_json'` per
 * DIF PEX v2 spec semantics. OpenCred's verifier (audited at
 * `lib/workflows/profiles/common-oid4vp.js:356`) checks the
 * descriptor's `format` against `jwt_vp_json` / `ldp_vp` (envelope
 * format) and rejects everything else with "Format X not yet
 * supported." This is a known vendor interpretation gap that walt.id
 * and Sphereon don't share — they read it as VC format like the spec.
 *
 * For interop testing only, we rewrite the format on the wire from
 * VC to VP envelope based on the inner credential format. Production
 * integration with OpenCred-style verifiers would either change the
 * plugin or wait for OpenCred to align with the spec.
 */
const buildOpencredFetchAdapter = (): typeof fetch => {
    const adaptSubmission = (raw: string): string => {
        try {
            const submission = JSON.parse(raw) as {
                descriptor_map?: Array<{
                    path?: string;
                    format?: string;
                    path_nested?: { path?: string; format?: string };
                    [k: string]: unknown;
                }>;
            };
            const map = submission.descriptor_map;
            if (!Array.isArray(map)) return raw;

            const adapted = {
                ...submission,
                descriptor_map: map.map(d => {
                    const next = { ...d };
                    const innerFormat = d.format;
                    const innerPath = d.path ?? '$';

                    if (innerFormat === 'ldp_vc') {
                        next.format = 'ldp_vp';
                    } else if (innerFormat === 'jwt_vc_json') {
                        next.format = 'jwt_vp_json';
                    }

                    if (!d.path_nested) {
                        next.path = '$';
                        next.path_nested = {
                            format: innerFormat ?? 'ldp_vc',
                            path: innerPath,
                        };
                    }

                    return next;
                }),
            };
            return JSON.stringify(adapted);
        } catch {
            return raw;
        }
    };

    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const isAuthResponse =
            url.includes('/openid/client/authorization/response') && init?.method === 'POST';

        if (!isAuthResponse || !init?.body || typeof init.body !== 'string') {
            return fetch(input, init);
        }

        const params = new URLSearchParams(init.body);
        const submission = params.get('presentation_submission');
        if (!submission) return fetch(input, init);

        params.set('presentation_submission', adaptSubmission(submission));

        return fetch(input, { ...init, body: params.toString() });
    };
};

/**
 * Custom did:web resolver tolerating OpenCred's localhost test DID.
 *
 * Two deviations from the openid4vc plugin's built-in resolver, both
 * scoped to this test stack:
 *
 *   1. **HTTP for localhost** — `config.express.httpOnly = true` in
 *      OpenCred makes HTTPS return 503 (see compose.yaml). We swap
 *      `https://` → `http://` only for `localhost` hosts.
 *
 *   2. **Implicit port handling** — OpenCred's `domainToDidWeb`
 *      publishes `did:web:localhost:22080` (literal colon) rather
 *      than the DID:WEB spec's `did:web:localhost%3A22080` (URL-
 *      encoded). The built-in resolver follows the spec and reads
 *      `:22080` as a path segment, ending up at
 *      `http://localhost/22080/did.json` (port 80). We rejoin a
 *      trailing numeric segment back into the host when it's the
 *      sole tail piece, matching what OpenCred actually serves.
 */
const buildTestDidWebResolver = (): ((did: string) => Promise<Record<string, unknown>>) => {
    return async (did: string) => {
        if (!did.startsWith('did:web:')) {
            throw new Error(`Test did:web resolver only handles did:web (got ${did})`);
        }

        const rest = did.replace(/^did:web:/, '');
        const segments = rest.split(':').map(s => decodeURIComponent(s));
        let host = segments.shift()!;

        if (
            host === 'localhost' &&
            segments.length === 1 &&
            /^\d+$/.test(segments[0]!)
        ) {
            host = `${host}:${segments.shift()!}`;
        }

        const path =
            segments.length === 0
                ? '/.well-known/did.json'
                : `/${segments.join('/')}/did.json`;

        const scheme = host.startsWith('localhost') ? 'http' : 'https';
        const url = `${scheme}://${host}${path}`;

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`did:web fetch ${url} failed: ${res.status}`);
        }
        return (await res.json()) as Record<string, unknown>;
    };
};

type InteropInvoke = {
    issueCredential: (
        credential: unknown,
        options?: Record<string, unknown>
    ) => Promise<unknown>;
    issuePresentation: (
        presentation: unknown,
        options?: Record<string, unknown>
    ) => Promise<unknown>;
    parseAuthorizationRequest: (uri: string) => unknown;
    resolveAuthorizationRequest: (uri: string) => Promise<Record<string, unknown>>;
    prepareVerifiablePresentation: (
        uri: string,
        candidates: unknown[]
    ) => Promise<Record<string, unknown>>;
    presentCredentials: (
        uri: string,
        chosen: unknown[]
    ) => Promise<{ submitted: { status: number; body?: unknown } }>;
    [k: string]: ((...args: any[]) => any) | undefined;
};

type RawSeedLearnCard = LearnCardFromSeed['returnValue'];
type RawDidWebLearnCard = DidWebLearnCardFromSeed['returnValue'];

export type SeedLearnCard = Omit<RawSeedLearnCard, 'invoke'> & {
    invoke: InteropInvoke;
};

export type DidWebSeedLearnCard = Omit<RawDidWebLearnCard, 'invoke'> & {
    invoke: InteropInvoke;
};

/**
 * Wrap `wallet.invoke.issuePresentation` so VPs signed for OID4VP
 * verifiers carry the correct W3C VCDM proof purpose.
 *
 * The vc-plugin defaults VP signing to `proofPurpose: 'assertionMethod'`
 * (correct for credentials, wrong for presentations per VCDM §4.2 and
 * Data Integrity §2.2.1). OpenCred — and any other spec-strict
 * verifier — runs LD proofs through a `presentationSuite` that
 * requires `authentication`, so the wallet's VP is rejected with
 * "Did not verify any proofs; insufficient proofs matched the
 * acceptable suite(s) and required purpose(s)". When the openid4vc
 * plugin signals VP signing by passing `{domain, challenge}`, we
 * inject `proofPurpose: 'authentication'`; other calls flow through
 * untouched.
 */
const wrapIssuePresentationForOid4vp = (wallet: { invoke: Record<string, unknown> }): void => {
    const original = wallet.invoke.issuePresentation as
        | ((vp: unknown, opts?: Record<string, unknown>) => Promise<unknown>)
        | undefined;
    if (typeof original !== 'function') return;

    wallet.invoke.issuePresentation = async (
        vp: unknown,
        opts: Record<string, unknown> = {}
    ) => {
        const isOid4vpVpSigning =
            typeof opts.domain === 'string' && typeof opts.challenge === 'string';
        const patched = isOid4vpVpSigning
            ? { proofPurpose: 'authentication', ...opts }
            : opts;
        return original(vp, patched);
    };
};

export const getLearnCard = async (
    seed: string = 'a'.repeat(64)
): Promise<SeedLearnCard> => {
    const wallet = await initLearnCard({
        seed,
        didkit,
        openid4vc: {
            didResolver: buildTestDidWebResolver() as never,
            fetch: buildOpencredFetchAdapter(),
        },
    });
    wrapIssuePresentationForOid4vp(wallet as { invoke: Record<string, unknown> });
    return wallet as unknown as SeedLearnCard;
};

export const getLearnCardWithDidWeb = async (
    seed: string,
    didWeb: string
): Promise<DidWebSeedLearnCard> => {
    const wallet = await initLearnCard({
        seed,
        didkit,
        didWeb,
        openid4vc: {
            didResolver: buildTestDidWebResolver() as never,
            fetch: buildOpencredFetchAdapter(),
        },
    });
    wrapIssuePresentationForOid4vp(wallet as { invoke: Record<string, unknown> });
    return wallet as unknown as DidWebSeedLearnCard;
};
