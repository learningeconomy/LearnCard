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

export const getCredentialIssuerDocumentURIs = (credential: Record<string, any>): string[] => {
    const issuer =
        typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.id;

    return typeof issuer === 'string' &&
        (issuer.startsWith('https://') || issuer.startsWith('http://'))
        ? [issuer]
        : [];
};

const getVerificationMethodDocumentURI = (verificationMethod: unknown): string[] => {
    const id =
        typeof verificationMethod === 'string'
            ? verificationMethod
            : (verificationMethod as { id?: unknown } | undefined)?.id;

    if (typeof id !== 'string' || (!id.startsWith('https://') && !id.startsWith('http://'))) {
        return [];
    }

    try {
        const documentUri = new URL(id);
        documentUri.hash = '';

        return [documentUri.toString()];
    } catch {
        return [];
    }
};

export const getVerificationMethodDocumentURIs = (credential: Record<string, any>): string[] => {
    const proofs = Array.isArray(credential.proof) ? credential.proof : [credential.proof];

    return proofs.flatMap(proof => getVerificationMethodDocumentURI(proof?.verificationMethod));
};

/** An unsigned credential has no proof yet, so the requested verification method is the key. */
export const getIssuanceDocumentURIs = (
    credential: Record<string, any>,
    options: { verificationMethod?: string } = {}
): string[] => [
    ...new Set([
        ...getCredentialIssuerDocumentURIs(credential),
        ...getVerificationMethodDocumentURIs(credential),
        ...getVerificationMethodDocumentURI(options.verificationMethod),
    ]),
];

export const getIssuerAuthorizationDocumentURIs = (
    credential: Record<string, any>,
    checks: readonly string[] = []
): string[] =>
    checks.includes('issuerAuthorization') ? getCredentialIssuerDocumentURIs(credential) : [];

export const getDocumentMap = async (
    learnCard: LearnCard<any, 'context'>,
    obj: Record<string, any>,
    allowRemoteContexts = false,
    additionalUris: string[] = []
) => {
    const uris = [...new Set([...getContextURIs(obj), ...additionalUris])].filter(
        (uri): uri is string => typeof uri === 'string'
    );
    const resolvedDocs = await Promise.all(
        uris.map(async uri => learnCard.context.resolveDocument(uri, allowRemoteContexts))
    );

    return uris.reduce<Record<string, string>>((acc, cur, index) => {
        const resolvedDoc = resolvedDocs[index];

        if (resolvedDoc) acc[cur] = JSON.stringify(resolvedDoc);

        return acc;
    }, {});
};
