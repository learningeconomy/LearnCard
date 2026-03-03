import { readFile } from 'node:fs/promises';

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
import { getDidWebPlugin } from '@learncard/did-web-plugin';
import type { DidWebPlugin } from '@learncard/did-web-plugin';

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

const getDidKitPlugin = async (allowRemoteContexts = false): Promise<DIDKitPlugin> => {
    if (didKitPluginPromise) return didKitPluginPromise;

    didKitPluginPromise = (async () => {
        try {
            const didkitModule = await import('@learncard/didkit-plugin-node');
            const getNativePlugin = resolveDidKitPluginFactory(didkitModule);
            return await getNativePlugin(undefined, allowRemoteContexts);
        } catch (e) {
            console.log('Native DIDKit plugin not available, falling back to WASM');
            const didkitModule = await import('@learncard/didkit-plugin');
            const getWasmPlugin = resolveDidKitPluginFactory(didkitModule);
            const wasmBuffer = await readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')
            );
            return await getWasmPlugin(wasmBuffer, allowRemoteContexts);
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

export type DidWebLearnCard = LearnCard<
    [
        CryptoPluginType,
        DIDKitPlugin,
        DidKeyPlugin<DidMethod>,
        EncryptionPluginType,
        VCPlugin,
        VCTemplatePlugin,
        ExpirationPlugin,
        LearnCardPlugin,
        DidWebPlugin
    ]
>;

let emptyLearnCard: EmptyLearnCard;

const learnCards: Record<string, SeedLearnCard> = {};
let didWebLearnCard: DidWebLearnCard;

const IS_OFFLINE = process.env.IS_OFFLINE;

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard> => {
    if (!emptyLearnCard || IS_OFFLINE) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin());

        const expirationLc = await didkitLc.addPlugin(expirationPlugin(didkitLc));

        const templateLc = await expirationLc.addPlugin(getVCTemplatesPlugin());

        emptyLearnCard = await templateLc.addPlugin(getLearnCardPlugin(templateLc));
    }

    return emptyLearnCard;
};

export const getLearnCard = async (
    seed = process.env.SEED,
    allowRemoteContexts = false
): Promise<SeedLearnCard> => {
    if (!seed) throw new Error('No seed set!');

    if (!learnCards[seed] || IS_OFFLINE) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(allowRemoteContexts));

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

export const getServerDidWebDID = (): string => {
    const domainName = process.env.DOMAIN_NAME;
    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName.replace(/:/g, '%3A');
    return `did:web:${domain}`;
};

export const isServersDidWebDID = (did: string): boolean => {
    return did === getServerDidWebDID();
};

export const isTrustedLoginProviderDID = (did: string): boolean => {
    const loginProviderDid = process.env.LOGIN_PROVIDER_DID;

    return did === getServerDidWebDID() || (loginProviderDid ? did === loginProviderDid : false);
};

export const getDidWebLearnCard = async (): Promise<DidWebLearnCard> => {
    const seed = process.env.SEED;

    const didWeb = getServerDidWebDID();

    if (!seed) throw new Error('No seed set!');

    if (!didWebLearnCard || IS_OFFLINE) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin());

        const didkeyLc = await didkitLc.addPlugin(
            await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
        );

        const encryptionLc = await didkeyLc.addPlugin(await getEncryptionPlugin(didkeyLc));

        const vcLc = await encryptionLc.addPlugin(getVCPlugin(encryptionLc));

        const templateLc = await vcLc.addPlugin(getVCTemplatesPlugin());

        const expirationLc = await templateLc.addPlugin(expirationPlugin(templateLc));

        const lcLc = await expirationLc.addPlugin(getLearnCardPlugin(expirationLc));

        didWebLearnCard = await lcLc.addPlugin(await getDidWebPlugin(lcLc, didWeb));
    }

    return didWebLearnCard;
};
