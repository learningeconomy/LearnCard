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

const fetchRemoteContext = async (url: string) => {
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
