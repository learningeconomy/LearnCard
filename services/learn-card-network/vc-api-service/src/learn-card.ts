import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { generateLearnCard } from '@learncard/core';
import type { LearnCard } from '@learncard/core';
import { CryptoPlugin } from '@learncard/crypto-plugin';
import type { CryptoPluginType } from '@learncard/crypto-plugin';
import type { DIDKitPlugin, DidMethod } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import type { DidKeyPlugin } from '@learncard/didkey-plugin';
import { getEncryptionPlugin } from '@learncard/encryption-plugin';
import type { EncryptionPluginType } from '@learncard/encryption-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import type { VCPlugin } from '@learncard/vc-plugin';
import { getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import type { VCTemplatePlugin } from '@learncard/vc-templates-plugin';
import { expirationPlugin } from '@learncard/expiration-plugin';
import type { ExpirationPlugin } from '@learncard/expiration-plugin';
import { getLearnCardPlugin } from '@learncard/learn-card-plugin';
import type { LearnCardPlugin } from '@learncard/learn-card-plugin';
import { DynamicLoaderPlugin } from '@learncard/dynamic-loader-plugin';

const DIDKIT_WASM_SPECIFIER = '@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm';

const resolveDidkitWasmPath = (): string => {
    const colocated = join(__dirname, 'didkit_wasm_bg.wasm');
    if (existsSync(colocated)) return colocated;

    return require.resolve(DIDKIT_WASM_SPECIFIER);
};

const didKitPluginPromises = new Map<boolean, Promise<DIDKitPlugin>>();

const getDidKitPlugin = async (allowRemoteContexts = false): Promise<DIDKitPlugin> => {
    const cached = didKitPluginPromises.get(allowRemoteContexts);
    if (cached) return cached;

    const promise = (async () => {
        const { getDidKitPlugin: getWasmPlugin } = await import('@learncard/didkit-plugin');
        const wasmBuffer = await readFile(resolveDidkitWasmPath());
        return getWasmPlugin(wasmBuffer, allowRemoteContexts);
    })();

    didKitPluginPromises.set(allowRemoteContexts, promise);

    return promise;
};

export type VcApiLearnCard = LearnCard<
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

const learnCards: Record<string, VcApiLearnCard> = {};

const IS_OFFLINE = process.env.IS_OFFLINE;

export const getLearnCard = async (
    seed = process.env.SEED,
    allowRemoteContexts = false
): Promise<VcApiLearnCard> => {
    if (!seed) throw new Error('No seed set! Set SEED in the environment.');

    const cacheKey = `${seed}:${allowRemoteContexts}`;

    if (!learnCards[cacheKey] || IS_OFFLINE) {
        const emptyLc = await generateLearnCard();

        const cryptoLc = allowRemoteContexts
            ? await (await emptyLc.addPlugin(DynamicLoaderPlugin)).addPlugin(CryptoPlugin)
            : await emptyLc.addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(allowRemoteContexts));

        const didkeyLc = await didkitLc.addPlugin(
            await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
        );

        const encryptionLc = await didkeyLc.addPlugin(await getEncryptionPlugin(didkeyLc));

        const vcLc = await encryptionLc.addPlugin(getVCPlugin(encryptionLc));

        const templateLc = await vcLc.addPlugin(getVCTemplatesPlugin());

        const expirationLc = await templateLc.addPlugin(expirationPlugin(templateLc));

        learnCards[cacheKey] = (await expirationLc.addPlugin(
            getLearnCardPlugin(expirationLc)
        )) as VcApiLearnCard;
    }

    const learnCard = learnCards[cacheKey];

    if (!learnCard) throw new Error('LearnCard not initialized');

    return learnCard;
};
