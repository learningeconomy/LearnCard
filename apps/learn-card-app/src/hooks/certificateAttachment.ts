const ATTACHMENTS_CONTEXT = {
    lcn: 'https://docs.learncard.com/definitions#',
    xsd: 'https://www.w3.org/2001/XMLSchema#',
    attachments: {
        '@id': 'lcn:boostAttachments',
        '@container': '@set',
        '@context': {
            title: {
                '@id': 'lcn:boostAttachmentTitle',
                '@type': 'xsd:string',
            },
            type: {
                '@id': 'lcn:boostAttachmentType',
                '@type': 'xsd:string',
            },
            url: {
                '@id': 'lcn:boostAttachmentUrl',
                '@type': 'xsd:string',
            },
            data: {
                '@id': 'lcn:boostAttachmentData',
                '@type': 'xsd:string',
            },
            fileName: {
                '@id': 'lcn:boostAttachmentFileName',
                '@type': 'xsd:string',
            },
            fileSize: {
                '@id': 'lcn:boostAttachmentFileSize',
                '@type': 'xsd:string',
            },
            fileType: {
                '@id': 'lcn:boostAttachmentFileType',
                '@type': 'xsd:string',
            },
        },
    },
} as const;

const BOOST_CONTEXT_URL = 'https://ctx.learncard.com/boosts/1.0.3.json';

const ATTACHMENT_DATA_CONTEXT = {
    data: {
        '@id': 'https://docs.learncard.com/definitions#boostAttachmentData',
        '@type': 'https://www.w3.org/2001/XMLSchema#string',
    },
} as const;

type CredentialRecord = Record<string, unknown>;

type CredentialWithAttachments<Credential extends CredentialRecord> = Credential & {
    '@context': unknown[];
    attachments: unknown[];
};

type AttachmentTerm = keyof (typeof ATTACHMENTS_CONTEXT.attachments)['@context'];

const ATTACHMENT_TERMS = Object.keys(
    ATTACHMENTS_CONTEXT.attachments['@context']
) as AttachmentTerm[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const hasCanonicalAttachmentsContext = (context: unknown): boolean => {
    if (!isRecord(context) || !isRecord(context.attachments)) return false;

    const attachments = context.attachments;
    const terms = attachments['@context'];
    if (!isRecord(terms)) return false;

    return (
        context.lcn === ATTACHMENTS_CONTEXT.lcn &&
        context.xsd === ATTACHMENTS_CONTEXT.xsd &&
        attachments['@id'] === ATTACHMENTS_CONTEXT.attachments['@id'] &&
        attachments['@container'] === ATTACHMENTS_CONTEXT.attachments['@container'] &&
        ATTACHMENT_TERMS.every(term => {
            const mapping = terms[term];
            const canonicalMapping = ATTACHMENTS_CONTEXT.attachments['@context'][term];

            return (
                isRecord(mapping) &&
                mapping['@id'] === canonicalMapping['@id'] &&
                mapping['@type'] === canonicalMapping['@type']
            );
        })
    );
};

const removeLegacyAttachmentsContext = (context: unknown): unknown => {
    if (
        !isRecord(context) ||
        hasCanonicalAttachmentsContext(context) ||
        !isRecord(context.attachments) ||
        context.attachments['@id'] !== 'lcn:boostAttachments'
    ) {
        return context;
    }

    const { attachments: _attachments, ...remainingContext } = context;

    return Object.keys(remainingContext).length > 0 ? remainingContext : null;
};

export const addCertificateAttachment = <Credential extends CredentialRecord>(
    vc: Credential,
    rawArtifactVc: unknown
): Credential | CredentialWithAttachments<Credential> => {
    if (!isRecord(rawArtifactVc) || !isRecord(rawArtifactVc.rawArtifact)) return vc;

    const artifact = rawArtifactVc.rawArtifact;
    if (
        artifact.type !== 'certificate' ||
        typeof artifact.data !== 'string' ||
        typeof artifact.fileName !== 'string' ||
        typeof artifact.fileSize !== 'string' ||
        typeof artifact.fileType !== 'string'
    ) {
        return vc;
    }

    const existingAttachments = Array.isArray(vc.attachments) ? vc.attachments : [];
    const credentialContext = vc['@context'];
    const contexts = Array.isArray(credentialContext)
        ? credentialContext
        : credentialContext
        ? [credentialContext]
        : [];
    const credentialType = vc.type;
    const credentialTypes = Array.isArray(credentialType)
        ? credentialType
        : credentialType
        ? [credentialType]
        : [];
    const usesPublishedBoostAttachments =
        contexts.includes(BOOST_CONTEXT_URL) && credentialTypes.includes('BoostCredential');
    const normalizedContexts = contexts
        .map(removeLegacyAttachmentsContext)
        .filter(context => context !== null);
    const compatibleContexts = usesPublishedBoostAttachments
        ? normalizedContexts.filter(context => !hasCanonicalAttachmentsContext(context))
        : normalizedContexts;
    const attachmentContexts =
        usesPublishedBoostAttachments || compatibleContexts.some(hasCanonicalAttachmentsContext)
            ? compatibleContexts
            : [...compatibleContexts, ATTACHMENTS_CONTEXT];
    const attachment = {
        ...(usesPublishedBoostAttachments ? { '@context': ATTACHMENT_DATA_CONTEXT } : {}),
        title: artifact.fileName,
        fileName: artifact.fileName,
        fileSize: artifact.fileSize,
        fileType: artifact.fileType,
        data: artifact.data,
        type: ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(artifact.fileType) ? 'photo' : 'document',
    };

    return {
        ...vc,
        '@context': attachmentContexts,
        attachments: [
            attachment,
            ...existingAttachments.filter(existing => {
                if (!isRecord(existing)) return true;

                const hasSameData = existing.data === attachment.data;
                const hasSameFileIdentity =
                    existing.fileName === attachment.fileName &&
                    existing.fileSize === attachment.fileSize &&
                    existing.fileType === attachment.fileType;

                return !hasSameData && !hasSameFileIdentity;
            }),
        ],
    };
};
