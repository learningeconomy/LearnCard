// Re-export from AI modules for easier imports
import {
    aiCall,
    streamingAiCall,
    streamingStructuredAiCall,
    type StreamingOptions,
} from './client';
import { generateTopics, getSuggestedTopics, warmUpTopicsCache } from './topics';
import { generateCredentialEmbeddingTexts } from './embedding-texts';
import { generateCredentialTitle } from './credential-title';
import { generateAndStoreCredentialEmbeddings } from './embeddings';

export {
    aiCall,
    streamingAiCall,
    streamingStructuredAiCall,
    type StreamingOptions,
    generateTopics,
    getSuggestedTopics,
    warmUpTopicsCache,
    generateCredentialEmbeddingTexts,
    generateCredentialTitle,
    generateAndStoreCredentialEmbeddings,
};
