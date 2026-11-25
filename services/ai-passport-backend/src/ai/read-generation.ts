import { init } from '@launchdarkly/node-server-sdk';
import {
    activeGeneration,
    legacyWritesRetired,
    novaEmbeddingsEnabled,
    pinnedEmbeddingGeneration,
    withEmbeddingGeneration,
} from './embedding-generation';
import { createReadGenerationControl } from './read-generation-control';
const control = createReadGenerationControl(
    () => ({
        enabled: process.env.EMBEDDINGS_LAUNCHDARKLY_ENABLED === 'true',
        configured: activeGeneration(),
        sdkKey: process.env.EMBEDDINGS_LAUNCHDARKLY_SDK_KEY,
        flagKey:
            process.env.EMBEDDINGS_LAUNCHDARKLY_FLAG_KEY ?? 'ai-passport-embedding-read-generation',
        environment: process.env.EMBEDDINGS_FLAG_ENVIRONMENT,
        novaEnabled: novaEmbeddingsEnabled(),
        legacyRetired: legacyWritesRetired(),
    }),
    key =>
        init(key, {
            sendEvents: false,
            logger: { debug() {}, info() {}, warn() {}, error() {} },
        })
);
export const readGenerationStatus = () => control.resolve();
export const closeReadGenerationControl = () => control.close();
/** Evaluate once, then preserve the model/index decision across all awaited subcalls. */
export async function withSearchGeneration<T>(operation: () => Promise<T>): Promise<T> {
    if (pinnedEmbeddingGeneration()) return operation();
    const decision = await readGenerationStatus();
    return withEmbeddingGeneration(decision.effective, operation);
}
