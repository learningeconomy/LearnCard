import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { generateLearnCard } from '@learncard/core';
import type { LearnCard } from '@learncard/core';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import type { CryptoPluginType } from '@learncard/crypto-plugin';
import type { DIDKitPlugin, DidMethod } from '@learncard/didkit-plugin';
import { getEncryptionPlugin } from '@learncard/encryption-plugin';
import type { EncryptionPluginType } from '@learncard/encryption-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import type { DidKeyPlugin } from '@learncard/didkey-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import type { VCPlugin } from '@learncard/vc-plugin';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import type { VCTemplatePlugin } from '@learncard/vc-templates-plugin';
import { expirationPlugin } from '@learncard/expiration-plugin';
import type { ExpirationPlugin } from '@learncard/expiration-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';
import type { LearnCardPlugin } from '@learncard/learn-card-plugin';
import { isTest } from './test.helpers';

// The DIDKit WASM is copied next to the compiled handler at build time (see
// esbuildPlugins.cjs). The Lambda bundle's node_modules layout doesn't match what
// require.resolve expects (the package is a hoisted workspace symlink), so prefer the
// co-located copy and fall back to package resolution for local dev / Docker.
const DIDKIT_WASM_SPECIFIER = '@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm';

const resolveDidkitWasmPath = (): string => {
    const colocated = join(__dirname, 'didkit_wasm_bg.wasm');
    if (existsSync(colocated)) return colocated;

    return require.resolve(DIDKIT_WASM_SPECIFIER);
};

// Try native plugin first, fall back to WASM
let didKitPluginPromise: Promise<DIDKitPlugin> | null = null;

const resolveDidKitPluginFactory = (
    module: Record<string, unknown>
): ((input?: unknown, allowRemoteContexts?: boolean) => Promise<DIDKitPlugin>) => {
    const factory =
        (module as { getDidKitPlugin?: unknown }).getDidKitPlugin ??
        (module as { default?: { getDidKitPlugin?: unknown } }).default?.getDidKitPlugin;

    if (typeof factory !== 'function') {
        throw new Error('DIDKit plugin factory not found in module exports');
    }

    return factory as (input?: unknown, allowRemoteContexts?: boolean) => Promise<DIDKitPlugin>;
};

const getDidKitPlugin = async (): Promise<DIDKitPlugin> => {
    if (didKitPluginPromise) return didKitPluginPromise;

    didKitPluginPromise = (async () => {
        if (process.env.SKIP_DIDKIT_NAPI) {
            const didkitModule = await import('@learncard/didkit-plugin');
            const getWasmPlugin = resolveDidKitPluginFactory(didkitModule);
            const wasmBuffer = await readFile(resolveDidkitWasmPath());
            return await getWasmPlugin(wasmBuffer);
        }

        try {
            const didkitModule = await import('@learncard/didkit-plugin-node');
            const getNativePlugin = resolveDidKitPluginFactory(didkitModule);
            return await getNativePlugin();
        } catch {
            const didkitModule = await import('@learncard/didkit-plugin');
            const getWasmPlugin = resolveDidKitPluginFactory(didkitModule);
            const wasmBuffer = await readFile(resolveDidkitWasmPath());
            return await getWasmPlugin(wasmBuffer);
        }
    })();

    return didKitPluginPromise;
};

export type EmptyLearnCard = LearnCard<
    [CryptoPluginType, DIDKitPlugin, ExpirationPlugin, VCTemplatePlugin, LearnCardPlugin]
>;

export type SeedLearnCard = LearnCard<
    [
        CryptoPluginType,
        DIDKitPlugin,
        DidKeyPlugin<DidMethod>,
        EncryptionPluginType,
        VCPlugin,
        VCTemplatePlugin,
        ExpirationPlugin,
        LearnCardPlugin
    ]
>;

let emptyLearnCard: EmptyLearnCard;

const learnCards: Record<string, SeedLearnCard> = {};

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard> => {
    if (!emptyLearnCard) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin());

        const expirationLc = await didkitLc.addPlugin(expirationPlugin(didkitLc));

        const templateLc = await expirationLc.addPlugin(getVCTemplatesPlugin());

        emptyLearnCard = await templateLc.addPlugin(getLearnCardPlugin(templateLc));
    }

    return emptyLearnCard;
};

export const getLearnCard = async (
    seed = isTest ? 'a'.repeat(64) : process.env.LEARN_CLOUD_SEED
): Promise<SeedLearnCard> => {
    if (!seed) throw new Error('No seed set!');

    if (!learnCards[seed]) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin());

        const didkeyLc = await didkitLc.addPlugin(
            await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
        );

        const encryptionLc = await didkeyLc.addPlugin(await getEncryptionPlugin(didkeyLc));

        const vcLc = await encryptionLc.addPlugin(getVCPlugin(encryptionLc));

        const templateLc = await vcLc.addPlugin(getVCTemplatesPlugin());

        const expirationLc = await templateLc.addPlugin(expirationPlugin(templateLc));

        learnCards[seed] = await expirationLc.addPlugin(getLearnCardPlugin(expirationLc));
    }

    const learnCard = learnCards[seed];

    if (!learnCard) {
        throw new Error('LearnCard not initialized');
    }

    return learnCard;
};
