import { LearnCard } from '@learncard/core';

/**
 * Collects every remote context URI (string `@context` entry) in a JSON-LD document,
 * including scoped contexts nested inside term definitions.
 *
 * Inline context objects are skipped: they are already part of the document, so there
 * is nothing to resolve. Forwarding them to the DIDKit WASM `contextLoader` (whose
 * `url` parameter is a string) makes wasm-bindgen reallocate a dangling pointer, which
 * traps inside the WASM allocator (LC-2380).
 */
export const getContextURIs = (jsonld: unknown): string[] => {
    const contexts: string[] = [];

    const traverse = (obj: unknown) => {
        if (typeof obj !== 'object' || obj === null) return;

        const context = '@context' in obj ? obj['@context'] : undefined;

        for (const entry of Array.isArray(context) ? context : [context]) {
            if (typeof entry === 'string') contexts.push(entry);
        }

        Object.values(obj).forEach(traverse);
    };

    traverse(jsonld);

    return contexts;
};

export const getDocumentMap = async (
    learnCard: LearnCard<any, 'context'>,
    obj: Record<string, any>,
    allowRemoteContexts = false
) => {
    const uris = getContextURIs(obj);
    const resolvedDocs = await Promise.all(
        uris.map(async uri => learnCard.context.resolveDocument(uri, allowRemoteContexts))
    );

    return uris.reduce<Record<string, string>>((acc, cur, index) => {
        const resolvedDoc = resolvedDocs[index];

        if (resolvedDoc) acc[cur] = JSON.stringify(resolvedDoc);

        return acc;
    }, {});
};
