import { withSearchGeneration } from './read-generation';
import { withEmbeddingLock, assertEmbeddingLock } from './embedding-lock';
import {
    currentGeneration,
    generationDimensions,
    withEmbeddingGeneration,
    writeGenerations,
} from './embedding-generation';
import type { EmbeddingPurpose } from './nova-embeddings';
import { embeddingAiCall } from './client';
import { storeEmbeddings, searchSimilar, createCollectionIfNotExists } from '../db/qdrant';
import { v5 as uuidv5 } from 'uuid';
import { EMBEDDINGS_COLLECTION, CREDENTIAL_COLLECTION_PREFIXES } from '../constants/collections';
import type { DBCredentialRecord } from '../db';
import { db } from '../db';
import type { CredentialEmbeddingTexts } from './generation-schemas';
import { getMessageSearchFilter } from './messageSearch';
import { getCredentialProjection } from '../credentials/projection';
import { assertCurrentAiConsent, getCurrentAiSubject } from './privacy';
import { AiConsentError } from '../learncard/consent';

const storeCredentialGeneration = async (
    credential: DBCredentialRecord,
    embeddingTexts: CredentialEmbeddingTexts,
    did: string,
    signal?: AbortSignal
): Promise<void> => {
    if (getCurrentAiSubject() !== did) throw new AiConsentError();
    getCredentialProjection(credential);
    const receipt = await assertCurrentAiConsent('embedding');
    if (
        credential.verification?.consent.revision !== receipt.revision ||
        (credential.source !== 'generated' && !receipt.credentialUris.includes(credential.uri))
    ) {
        throw new AiConsentError('Embedding source is no longer authorized');
    }
    const source = await db.getVectorSource(did, 'credential', credential.uri, {
        contentHash: credential.verification!.contentHash,
        consentRevision: receipt.revision,
        epoch: credential.embeddingEpoch,
    });
    const dimensions = [
        {
            collection: CREDENTIAL_COLLECTION_PREFIXES.FULL_TEXT,
            type: 'fullText',
            text: embeddingTexts.fullText,
        },
        {
            collection: CREDENTIAL_COLLECTION_PREFIXES.DOMAIN_SUMMARY,
            type: 'domainSummary',
            text: embeddingTexts.domainSummary,
        },
        {
            collection: CREDENTIAL_COLLECTION_PREFIXES.KEY_CLAIMS,
            type: 'keyClaims',
            text: embeddingTexts.keyClaims,
        },
        {
            collection: CREDENTIAL_COLLECTION_PREFIXES.TECHNICAL_METADATA,
            type: 'technicalMetadata',
            text: embeddingTexts.technicalMetadata,
        },
        {
            collection: CREDENTIAL_COLLECTION_PREFIXES.COMPARISON_CONTEXT,
            type: 'comparisonContext',
            text: embeddingTexts.comparisonContext,
        },
    ] as const;

    await Promise.all(
        dimensions.map(({ collection }) =>
            createCollectionIfNotExists(collection, generationDimensions(currentGeneration()))
        )
    );

    const vectors = await generateEmbeddings(
        dimensions.map(({ text }) => text),
        { signal }
    );
    await assertCurrentAiConsent('embedding');
    await assertEmbeddingLock();
    const current = await db.getEmbeddingCredentialVersion(did, credential.uri);
    if (
        !current ||
        current.contentHash !== credential.verification?.contentHash ||
        current.consent.revision !== receipt.revision
    )
        throw new AiConsentError('Embedding source changed');
    signal?.throwIfAborted();
    const timestamp = new Date().toISOString();

    await Promise.all(
        dimensions.map(({ collection, type }, index) =>
            storeEmbeddings(
                collection,
                [
                    {
                        id: uuidv5(
                            `${did}|${credential.uri}|${source.epoch}|${collection}`,
                            uuidv5.URL
                        ),
                        vector: vectors[index],
                        payload: {
                            recordType: 'credential',
                            sourceEpoch: source.epoch,
                            type,
                            did,
                            uri: credential.uri,
                            credentialType: credential.category,
                            consentRevision: receipt.revision,
                            contentHash: credential.verification!.contentHash,
                            timestamp,
                        },
                    },
                ],
                source
            )
        )
    );
};

export const generateAndStoreCredentialEmbeddings = async (
    credential: DBCredentialRecord,
    texts: CredentialEmbeddingTexts,
    did: string,
    targetOnly = false,
    signal?: AbortSignal
): Promise<void> => {
    await withEmbeddingLock(did, credential.uri, async () => {
        for (const generation of targetOnly ? [currentGeneration()] : writeGenerations())
            await withEmbeddingGeneration(generation, () =>
                storeCredentialGeneration(credential, texts, did, signal)
            );
    });
};

/**
 * Generate an embedding for a text string using OpenAI
 */
export async function generateEmbeddings(
    texts: string[],
    options: { signal?: AbortSignal; purpose?: EmbeddingPurpose } = {}
): Promise<number[][]> {
    return embeddingAiCall(texts, options.signal, options.purpose);
}

export async function generateEmbedding(
    text: string,
    options: { signal?: AbortSignal; purpose?: EmbeddingPurpose } = {}
): Promise<number[]> {
    const [embedding] = await generateEmbeddings([text], options);
    return embedding;
}

/**
 * Search for similar text based on semantic similarity
 */
export async function findSimilarText(
    text: string,
    limit = 5,
    filter?: Record<string, unknown>,
    collectionName: string = EMBEDDINGS_COLLECTION
) {
    return withSearchGeneration(async () => {
        const embedding = await generateEmbedding(text, { purpose: 'query' });
        return searchSimilar(collectionName, embedding, limit, filter);
    });
}

/**
 * Find messages that are semantically similar to the query
 */
export async function findSimilarMessages(
    query: string,
    did: string,
    limit = 5,
    threadId?: string
) {
    const points = await findSimilarText(
        query,
        limit,
        getMessageSearchFilter(did, threadId),
        EMBEDDINGS_COLLECTION
    );
    const messages = await db.getMessagesByIds(
        did,
        points.map(point =>
            typeof point.payload?.messageId === 'string'
                ? point.payload.messageId
                : String(point.id)
        ),
        threadId
    );
    const messagesById = new Map(messages.map(message => [message.id, message]));

    return points.flatMap(point => {
        const message = messagesById.get(
            typeof point.payload?.messageId === 'string'
                ? point.payload.messageId
                : String(point.id)
        );

        return message ? [{ id: point.id, score: point.score, payload: { ...message } }] : [];
    });
}
