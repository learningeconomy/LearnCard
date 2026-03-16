/**
 * Bundled JSON-LD contexts for client-side credential validation.
 * These are static copies of the contexts referenced in DEFAULT_CONTEXTS (types.ts).
 * Bundling avoids network requests during validation.
 */

import vcV2 from './vc-v2.json';
import obV3 from './ob-v3p0-3.0.3.json';

const CONTEXT_MAP: Record<string, unknown> = {
    'https://www.w3.org/ns/credentials/v2': vcV2,
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json': obV3,
};

/**
 * Custom document loader that resolves known contexts from bundled JSON files.
 * Throws for unknown context URLs (we only support the two standard OBv3 contexts).
 */
export const bundledDocumentLoader = async (url: string) => {
    const cached = CONTEXT_MAP[url];
    if (cached) {
        return { document: cached, documentUrl: url };
    }
    throw new Error(`Unknown JSON-LD context: ${url}`);
};
