import { readFile } from 'node:fs/promises';

import { generateLearnCard, LearnCard } from '@learncard/core';
import { CryptoPlugin, CryptoPluginType } from '@learncard/crypto-plugin';
import { DIDKitPlugin, DidMethod, getDidKitPlugin } from '@learncard/didkit-plugin';
import { DidKeyPlugin, getDidKeyPlugin } from '@learncard/didkey-plugin';
import { EncryptionPluginType, getEncryptionPlugin } from '@learncard/encryption-plugin';
import { VCPlugin, getVCPlugin } from '@learncard/vc-plugin';
import { VCTemplatePlugin, getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import { ExpirationPlugin, expirationPlugin } from '@learncard/expiration-plugin';
import { LearnCardPlugin, getLearnCardPlugin } from '@learncard/learn-card-plugin';
import { getDidWebPlugin, DidWebPlugin } from '@learncard/did-web-plugin';

// Initialize didkit lazily to avoid top-level await issues
let didkitPromise: Promise<Buffer> | null = null;
const getDidkitWasm = () => {
    if (!didkitPromise) {
        didkitPromise = readFile(
            require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')
        );
    }
    return didkitPromise;
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

let learnCards: Record<string, SeedLearnCard> = {};
let didWebLearnCard: DidWebLearnCard;

const IS_OFFLINE = process.env.IS_OFFLINE;

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard> => {
    if (!emptyLearnCard || IS_OFFLINE) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(await getDidkitWasm()));

        const expirationLc = await didkitLc.addPlugin(expirationPlugin(didkitLc));

        const templateLc = await expirationLc.addPlugin(getVCTemplatesPlugin());

        emptyLearnCard = await templateLc.addPlugin(getLearnCardPlugin(templateLc));
    }

    return emptyLearnCard;
};

export const getLearnCard = async (seed = process.env.SEED): Promise<SeedLearnCard> => {
    if (!seed) throw new Error('No seed set!');

    if (!learnCards[seed] || IS_OFFLINE) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(await getDidkitWasm()));

        const didkeyLc = await didkitLc.addPlugin(
            await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
        );

        const encryptionLc = await didkeyLc.addPlugin(await getEncryptionPlugin(didkeyLc));

        const vcLc = await encryptionLc.addPlugin(getVCPlugin(encryptionLc));

        const templateLc = await vcLc.addPlugin(getVCTemplatesPlugin());

        const expirationLc = await templateLc.addPlugin(expirationPlugin(templateLc));

        learnCards[seed] = await expirationLc.addPlugin(getLearnCardPlugin(expirationLc));
    }

    return learnCards[seed]!;
};

export const getDidWebLearnCard = async (): Promise<DidWebLearnCard> => {
    const seed = process.env.SEED;

    // TODO: is this best as an env variable, or can we grab implicitly, like in dids.ts?
    const domainName = process.env.DOMAIN_NAME;
    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName;
    const didWeb = `did:web:${domain}`;

    if (!seed) throw new Error('No seed set!');

    if (!didWebLearnCard || IS_OFFLINE) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(await getDidkitWasm()));

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
