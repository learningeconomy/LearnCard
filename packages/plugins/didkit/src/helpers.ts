import { LearnCard } from '@learncard/core';

export const getContextURIs = (jsonld: Record<string, any>) => {
    const contexts: string[] = [];

    const traverse = (obj: Record<string, any>) => {
        if (typeof obj !== 'object' || obj === null) return;

        if (obj['@context']) {
            if (Array.isArray(obj['@context'])) contexts.push(...obj['@context']);
            else contexts.push(obj['@context']);
        }

        Object.keys(obj).forEach(key => {
            traverse(obj[key]);
        });
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
