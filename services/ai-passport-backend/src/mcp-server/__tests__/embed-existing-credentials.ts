/**
 * Embeds existing credentials from MongoDB into Qdrant for semantic search testing.
 *
 * This enables testing the getAnswerAboutUser MCP tool which uses vector search.
 *
 * Usage (run from services/ai-passport-backend):
 * ```
 * bun run src/mcp-server/__tests__/embed-existing-credentials.ts
 * ```
 *
 * Prerequisites:
 * - Add DIDs to DIDS_TO_EMBED array below
 * - Run `docker compose up` to start MongoDB, Qdrant, and Redis
 * - Ensure credentials already exist in MongoDB for the DIDs
 */

import { db } from '../../db';
import { storeCredentialEmbeddings } from '../../credentials/service';

const DIDS_TO_EMBED: string[] = [
    /* Your DID here, e.g. "did:web:network.learncard.com:users:alexficachi" */
];

(async () => {
    console.log('🚀 Starting credential embedding process...\n');

    for (const did of DIDS_TO_EMBED) {
        console.log(`📋 Processing DID: ${did}`);

        try {
            const vcs = await db.getVCs(did);
            console.log(`   Found ${vcs.length} credentials`);

            if (vcs.length === 0) {
                console.log(`   ⚠️  No credentials found, skipping\n`);
                continue;
            }

            for (let i = 0; i < vcs.length; i++) {
                const vc = vcs[i];
                try {
                    console.log(`   [${i + 1}/${vcs.length}] Embedding: ${vc.uri}`);
                    await storeCredentialEmbeddings(vc, did);
                    console.log(`   ✓ Embedded successfully`);
                } catch (error) {
                    console.error(`   ✗ Failed:`, error instanceof Error ? error.message : error);
                }
            }

            console.log(`   ✅ Completed ${vcs.length} credentials\n`);
        } catch (error) {
            console.error(
                `   ❌ Failed to process DID:`,
                error instanceof Error ? error.message : error
            );
            console.log();
        }
    }

    console.log('🎉 Done! All credentials have been processed.');
    process.exit(0);
})();
