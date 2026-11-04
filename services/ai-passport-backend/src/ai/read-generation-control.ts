import type { EmbeddingGeneration } from './embedding-generation';
export type ReadGenerationConfig = {
    enabled: boolean;
    configured: EmbeddingGeneration;
    sdkKey?: string;
    flagKey: string;
    environment?: string;
    novaEnabled: boolean;
    // Legacy writes are off (EMBEDDINGS_WRITE_GENERATION=nova1024v1 without dual
    // writes). openai1536 copies are no longer current, so nothing falls back to
    // them: degraded decisions stay on Nova.
    legacyRetired?: boolean;
};
export type ReadGenerationDecision = {
    configured: EmbeddingGeneration;
    effective: EmbeddingGeneration;
    control: 'deployment' | 'launchdarkly';
    degraded: boolean;
    reason: string;
    evaluatedAt: string;
};
export type FlagClient = {
    waitForInitialization: (options: { timeout: number }) => Promise<unknown>;
    variationDetail: (
        key: string,
        context: { kind: string; key: string },
        fallback: string
    ) => Promise<{ value: unknown; reason: { kind: string } }>;
    close: () => unknown;
};
async function bounded<T>(promise: Promise<T>, milliseconds: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timer = setTimeout(() => reject(new Error('timeout')), milliseconds);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}
const fallbackFor = (settings: ReadGenerationConfig): EmbeddingGeneration =>
    settings.legacyRetired ? 'nova1024v1' : 'openai1536';
export function createReadGenerationControl(
    config: () => ReadGenerationConfig,
    initialize: (key: string) => FlagClient,
    timeoutMs = 2000
) {
    let client: FlagClient | undefined,
        clientKey: string | undefined,
        initialization: Promise<unknown> | undefined;
    const decision = (
        settings: ReadGenerationConfig,
        effective: EmbeddingGeneration,
        reason: string,
        degraded = false
    ): ReadGenerationDecision => ({
        configured: settings.configured,
        effective,
        control: settings.enabled ? 'launchdarkly' : 'deployment',
        degraded,
        reason,
        evaluatedAt: new Date().toISOString(),
    });
    return {
        async resolve(): Promise<ReadGenerationDecision> {
            const settings = config();
            if (!settings.enabled) {
                if (settings.configured === 'nova1024v1' && !settings.novaEnabled)
                    return decision(
                        settings,
                        fallbackFor(settings),
                        'nova_provider_disabled',
                        true
                    );
                return decision(settings, settings.configured, 'deployment_configuration');
            }
            if (
                !settings.sdkKey ||
                !/^[a-z][a-z0-9_-]{0,31}$/.test(settings.environment ?? '') ||
                !/^[A-Za-z0-9_-]{1,120}$/.test(settings.flagKey)
            )
                return decision(
                    settings,
                    fallbackFor(settings),
                    'flag_configuration_missing',
                    true
                );
            if (clientKey && clientKey !== settings.sdkKey)
                return decision(settings, fallbackFor(settings), 'sdk_configuration_changed', true);
            try {
                if (!client) {
                    client = initialize(settings.sdkKey);
                    clientKey = settings.sdkKey;
                    initialization = bounded(
                        client.waitForInitialization({ timeout: timeoutMs / 1000 }),
                        timeoutMs
                    );
                }
                // All callers share one bounded initialization. Startup failure stays on OpenAI until restart.
                if (initialization) {
                    const waiting = initialization;
                    try {
                        await waiting;
                    } catch {
                        return decision(
                            settings,
                            fallbackFor(settings),
                            'flag_initialization_failed',
                            true
                        );
                    }
                }
                const detail = await bounded(
                    client.variationDetail(
                        settings.flagKey,
                        { kind: 'application', key: `ai-passport-${settings.environment}` },
                        fallbackFor(settings)
                    ),
                    500
                );
                if (detail.reason.kind === 'ERROR')
                    return decision(
                        settings,
                        fallbackFor(settings),
                        'flag_evaluation_failed',
                        true
                    );
                if (detail.value !== 'openai1536' && detail.value !== 'nova1024v1')
                    return decision(settings, fallbackFor(settings), 'flag_value_invalid', true);
                if (detail.value === 'openai1536' && settings.legacyRetired)
                    return decision(
                        settings,
                        fallbackFor(settings),
                        'legacy_generation_retired',
                        true
                    );
                if (detail.value === 'nova1024v1' && !settings.novaEnabled)
                    return decision(
                        settings,
                        fallbackFor(settings),
                        'nova_provider_disabled',
                        true
                    );
                return decision(settings, detail.value, 'flag_evaluation');
            } catch {
                return decision(settings, fallbackFor(settings), 'flag_evaluation_failed', true);
            }
        },
        async close() {
            await client?.close();
            client = undefined;
            clientKey = undefined;
            initialization = undefined;
        },
    };
}
