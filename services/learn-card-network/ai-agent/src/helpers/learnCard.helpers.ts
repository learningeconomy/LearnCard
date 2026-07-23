import { readFile } from 'node:fs/promises';

import { initLearnCard } from '@learncard/init';
import type { NetworkLearnCardFromSeed } from '@learncard/init';

export interface AgentLearnCardConfig {
    seed?: string;
    cloudUrl?: string;
    networkUrl?: string;
}

export type AgentNetworkWallet = NetworkLearnCardFromSeed['returnValue'];

let didKitInitPromise: Promise<'node' | Buffer> | undefined;
const walletCache = new Map<string, Promise<AgentNetworkWallet>>();

const hasDidKitPluginFactory = (
    value: unknown
): value is { getDidKitPlugin?: unknown; default?: { getDidKitPlugin?: unknown } } =>
    Boolean(value && typeof value === 'object');

const isDidKitPluginFactory = (value: unknown): value is () => Promise<unknown> =>
    typeof value === 'function';

const resolveDidKitPluginFactory = (module: Record<string, unknown>): (() => Promise<unknown>) => {
    if (!hasDidKitPluginFactory(module)) {
        throw new Error('DIDKit plugin factory not found in module exports');
    }

    const factory = module.getDidKitPlugin ?? module.default?.getDidKitPlugin;

    if (!isDidKitPluginFactory(factory)) {
        throw new Error('DIDKit plugin factory not found in module exports');
    }

    return factory;
};

const getDidKitInit = async (): Promise<'node' | Buffer> => {
    if (didKitInitPromise) return didKitInitPromise;

    didKitInitPromise = (async () => {
        if (process.env.SKIP_DIDKIT_NAPI) {
            return readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));
        }

        try {
            const didkitModule = await import('@learncard/didkit-plugin-node');
            const getNativePlugin = resolveDidKitPluginFactory(didkitModule);
            await getNativePlugin();
            return 'node' as const;
        } catch {
            return readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));
        }
    })();

    return didKitInitPromise;
};

export const getEmptyAgentLearnCard = async (): Promise<{
    invoke: {
        verifyPresentation: (
            presentation: string,
            options: Record<string, unknown>
        ) => Promise<unknown>;
    };
}> =>
    initLearnCard({
        didkit: await getDidKitInit(),
        allowRemoteContexts: true,
    }) as Promise<{
        invoke: {
            verifyPresentation: (
                presentation: string,
                options: Record<string, unknown>
            ) => Promise<unknown>;
        };
    }>;

export const getAgentLearnCard = async ({
    seed,
    cloudUrl,
    networkUrl,
}: AgentLearnCardConfig): Promise<AgentNetworkWallet> => {
    if (!seed) {
        throw new Error(
            'AI_AGENT_WALLET_SEED, LEARNCARD_AGENT_SEED, or SEED must be set to use LearnCard tools.'
        );
    }

    const cacheKey = JSON.stringify({
        seed,
        cloudUrl: cloudUrl ?? null,
        networkUrl: networkUrl ?? null,
    });
    const cachedWallet = walletCache.get(cacheKey);

    if (cachedWallet) return cachedWallet;

    const initConfig: NetworkLearnCardFromSeed['args'] = {
        didkit: await getDidKitInit(),
        seed,
        network: networkUrl ?? true,
        ...(cloudUrl ? { cloud: { url: cloudUrl } } : {}),
    };
    const wallet = initLearnCard(initConfig) as unknown as Promise<AgentNetworkWallet>;

    walletCache.set(cacheKey, wallet);

    return wallet;
};
