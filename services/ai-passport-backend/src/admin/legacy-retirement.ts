import { legacyVectorInventory } from '../constants/collections';
import { db } from '../db';
import { dropRetiredLegacyCollection, legacyCollectionStatus } from '../db/qdrant';
import { legacyWritesRetired } from '../ai/embedding-generation';
import { readGenerationStatus } from '../ai/read-generation';

// Retiring the openai1536 generation, in order:
// 1. EMBEDDINGS_WRITE_GENERATION=nova1024v1 with EMBEDDINGS_DUAL_WRITE off.
//    Startup then requires Nova reads, and degraded read decisions stay on
//    Nova instead of falling back to OpenAI.
// 2. Verify (legacy sweep done, cleanup ledger drained, reads healthy on Nova).
// 3. The explicit drop below. Nothing calls it automatically; it runs only from
//    the admin endpoint with the exact collection list and confirmation phrase.
// Rolling reads back to openai1536 needs a #98 build with dual writes, and
// only before the drop.

export const dropConfirmation = () =>
    `drop ${legacyVectorInventory.length} legacy openai1536 collections`;

export async function legacyRetirementStatus() {
    const readControl = await readGenerationStatus();
    const cleanup = await db.sourceCleanupSummary();
    const preconditions = {
        legacyWritesRetired: legacyWritesRetired(),
        dualWriteOff: process.env.EMBEDDINGS_DUAL_WRITE !== 'true',
        readsOnNova: readControl.effective === 'nova1024v1' && !readControl.degraded,
        cleanupDrained: cleanup.pendingTasks === 0 && cleanup.pendingPoints === 0,
    };
    return {
        collections: await legacyCollectionStatus(),
        preconditions,
        ready: Object.values(preconditions).every(Boolean),
        confirmation: dropConfirmation(),
    };
}

export async function dropLegacyCollections(collections: string[], confirm: string) {
    const expected = legacyVectorInventory.map(({ collection }) => collection);
    if (
        confirm !== dropConfirmation() ||
        collections.length !== expected.length ||
        [...collections].sort().join('\n') !== [...expected].sort().join('\n')
    )
        throw new LegacyDropRefused(
            'The exact legacy collection list and confirmation phrase are required'
        );
    const status = await legacyRetirementStatus();
    if (!status.ready)
        throw new LegacyDropRefused(
            `Retirement preconditions not met: ${Object.entries(status.preconditions)
                .filter(([, ok]) => !ok)
                .map(([name]) => name)
                .join(', ')}`
        );
    const dropped = [];
    for (const collection of expected) dropped.push(await dropRetiredLegacyCollection(collection));
    return { dropped };
}

export class LegacyDropRefused extends Error {
    readonly code = 'legacy_drop_refused';
}
