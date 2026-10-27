// Offline inventory only. No credentials, client construction or provider calls.
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { buildResponsesRequest, buildResponsesTools } from '../src/ai/bedrock-responses';
import { generationSchemaInventory, type GenerationRole } from '../src/ai/generation-schemas';
import { CHAT_MODEL, PLANNING_MODEL, FORMATTING_MODEL, TITLE_MODEL } from '../src/constants/env';

const models: Record<GenerationRole, string> = {
    chat: CHAT_MODEL,
    planning: PLANNING_MODEL,
    formatting: FORMATTING_MODEL,
    title: TITLE_MODEL,
};
if (process.argv.length !== 2) {
    console.log(
        JSON.stringify({
            mode: 'offline-no-network',
            status: 'rejected_arguments',
            providerCalls: 0,
        })
    );
    process.exitCode = 1;
} else {
    const inventory = generationSchemaInventory.map(entry => {
        const configuredModel = models[entry.role];
        try {
            const request = buildResponsesRequest({
                model: configuredModel,
                message: 'Fixed synthetic offline inventory.',
            });
            const schemas: z.ZodType[] = Array.isArray(entry.schema)
                ? entry.schema
                : [entry.schema];
            const { tools } = buildResponsesTools(
                schemas,
                configuredModel,
                entry.toolName ? [entry.toolName] : undefined
            );
            return {
                id: entry.id,
                role: entry.role,
                configuredModel,
                model: request.model,
                reasoning: request.reasoning,
                status: 'supported_locally_not_live_verified',
                providerStrict: false,
                authoritativeValidation: 'original-zod',
                schemaSHA256: createHash('sha256').update(JSON.stringify(tools)).digest('hex'),
            };
        } catch {
            return {
                id: entry.id,
                role: entry.role,
                configuredModel,
                status: 'rejected_locally',
            };
        }
    });
    console.log(
        JSON.stringify(
            {
                mode: 'offline-no-network',
                transport: 'openai-sdk-bedrock-runtime-responses',
                providerCalls: 0,
                store: false,
                inventory,
                supportedLocally: inventory.filter(
                    entry => entry.status === 'supported_locally_not_live_verified'
                ).length,
                blocked: inventory.filter(entry => entry.status === 'rejected_locally').length,
                releaseReady: false,
                remainingGates: [
                    'live-synthetic-provider-acceptance',
                    'account-model-default-project-authorization',
                    'privacy-logging-retention-review',
                ],
            },
            null,
            2
        )
    );
    if (inventory.some(entry => entry.status === 'rejected_locally')) process.exitCode = 1;
}
