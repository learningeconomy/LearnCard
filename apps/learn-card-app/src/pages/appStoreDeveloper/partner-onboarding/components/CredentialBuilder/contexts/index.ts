/**
 * Bundled JSON-LD contexts for client-side credential validation.
 * These are static copies of the contexts referenced in DEFAULT_CONTEXTS (types.ts).
 * Bundling avoids network requests during validation.
 */

import vcV2 from './vc-v2.json';
import obV3 from './ob-v3p0-3.0.3.json';
import clrV2p0 from './clr-v2p0.json';

const CONTEXT_MAP: Record<string, unknown> = {
    'https://www.w3.org/ns/credentials/v2': vcV2,
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json': obV3,
    'https://purl.imsglobal.org/spec/clr/v2p0/context.json': clrV2p0,
    'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json': clrV2p0,
};

const REMOTE_CONTEXT_TIMEOUT_MS = 8000;

const PRIVATE_HOSTNAME = /^(localhost|.*\.local)$/i;

const isPrivateIpv4 = (host: string): boolean => {
    const parts = host.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) return false;
    const [a, b] = parts;
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
    );
};

// User-supplied credential @context URLs are fetched live from the browser, so a
// crafted credential could point at internal/loopback/link-local hosts (e.g. the
// cloud metadata endpoint 169.254.169.254) to probe the private network or leak
// data. Restrict remote contexts to https on public hosts before fetching.
const assertSafeRemoteContextUrl = (url: string): void => {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error(`Invalid JSON-LD context URL: ${url}`);
    }
    if (parsed.protocol !== 'https:') {
        throw new Error(`Refusing to load non-https JSON-LD context: ${url}`);
    }
    const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (PRIVATE_HOSTNAME.test(host) || host === '::1' || isPrivateIpv4(host)) {
        throw new Error(`Refusing to load JSON-LD context from a private host: ${url}`);
    }
};

const fetchRemoteContext = async (url: string) => {
    assertSafeRemoteContextUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REMOTE_CONTEXT_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            headers: { Accept: 'application/ld+json, application/json' },
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error(`Unable to load JSON-LD context (${response.status}): ${url}`);
        }
        return { document: await response.json(), documentUrl: url, contextUrl: null };
    } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
            throw new Error(`Timed out loading JSON-LD context: ${url}`);
        }
        throw e instanceof Error ? e : new Error(`Unable to load JSON-LD context: ${url}`);
    } finally {
        clearTimeout(timeout);
    }
};

/**
 * JSON-LD document loader. Always resolves the bundled standard contexts (OBv3,
 * CLR 2.0, VC v2) without a network call. When `allowRemote` is set, unknown
 * context URLs are fetched live instead of rejected — letting any credential
 * whose contexts genuinely resolve be treated as valid, mirroring what
 * `issueCredential` requires. The strict default keeps the partner flow offline
 * and limited to the standard contexts.
 */
export const createDocumentLoader =
    ({ allowRemote = false }: { allowRemote?: boolean } = {}) =>
    async (url: string) => {
        const cached = CONTEXT_MAP[url];
        if (cached) return { document: cached, documentUrl: url };
        if (allowRemote) return fetchRemoteContext(url);
        throw new Error(`Unknown JSON-LD context: ${url}`);
    };

export const bundledDocumentLoader = createDocumentLoader();
