import { readFile } from 'node:fs/promises';

import { generateLearnCard, LearnCard } from '@learncard/core';
import { CryptoPlugin, CryptoPluginType } from '@learncard/crypto-plugin';
import { DIDKitPlugin, DidMethod, getDidKitPlugin } from '@learncard/didkit-plugin';
import { EncryptionPluginType, getEncryptionPlugin } from '@learncard/encryption-plugin';
import { DidKeyPlugin, getDidKeyPlugin } from '@learncard/didkey-plugin';
import { VCPlugin, getVCPlugin } from '@learncard/vc-plugin';
import { VCTemplatePlugin, getVCTemplatesPlugin } from '@learncard/vc-templates-plugin';
import { ExpirationPlugin, expirationPlugin } from '@learncard/expiration-plugin';
import { LearnCardPlugin, getLearnCardPlugin } from '@learncard/learn-card-plugin';
import { isTest } from './test.helpers';

const didkit = readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));

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

let learnCards: Record<string, SeedLearnCard> = {};

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard> => {
    if (!emptyLearnCard) {
        const cryptoLc = await (await generateLearnCard()).addPlugin(CryptoPlugin);

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(await didkit));

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

        const didkitLc = await cryptoLc.addPlugin(await getDidKitPlugin(await didkit));

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
