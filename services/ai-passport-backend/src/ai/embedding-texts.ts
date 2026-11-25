import { aiCall } from './client';
import { TITLE_MODEL } from '../constants/env';
import { EmbeddingTextsSchema, type CredentialEmbeddingTexts } from './generation-schemas';

export const generateCredentialEmbeddingTexts = async (
    credential: string,
    options: { signal?: AbortSignal; maxOutputTokens?: number; timeoutMs?: number } = {}
): Promise<CredentialEmbeddingTexts> => {
    const startTime = performance.now();

    const result = await aiCall({
        model: TITLE_MODEL,
        systemPrompt: `Generate 5 different embedding text representations of the following Verifiable Credential. Each representation should be optimized for different search contexts.`,
        message: credential,
        output: EmbeddingTextsSchema,
        signal: options.signal,
        maxOutputTokens: options.maxOutputTokens,
        ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    });

    const duration = Math.round(performance.now() - startTime);
    console.log(`[EmbeddingText.batched] ${duration}ms for all 5 representations`);

    return result;
};

// Keep individual functions for backward compatibility
export const generateCredentialEmbeddingTextFullText = async (
    credential: string
): Promise<string> => {
    const texts = await generateCredentialEmbeddingTexts(credential);
    return texts.fullText;
};

export const generateCredentialEmbeddingTextDomainSummary = async (
    credential: string
): Promise<string> => {
    const texts = await generateCredentialEmbeddingTexts(credential);
    return texts.domainSummary;
};

export const generateCredentialEmbeddingTextKeyClaims = async (
    credential: string
): Promise<string> => {
    const texts = await generateCredentialEmbeddingTexts(credential);
    return texts.keyClaims;
};

export const generateCredentialEmbeddingTextTechnicalMetadata = async (
    credential: string
): Promise<string> => {
    const texts = await generateCredentialEmbeddingTexts(credential);
    return texts.technicalMetadata;
};

export const generateCredentialEmbeddingTextComparisonContext = async (
    credential: string
): Promise<string> => {
    const texts = await generateCredentialEmbeddingTexts(credential);
    return texts.comparisonContext;
};
