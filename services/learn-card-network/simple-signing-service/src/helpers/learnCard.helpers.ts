import { readFile } from 'node:fs/promises';

import { generateLearnCard, type LearnCard } from '@learncard/core';
import { getDidKitPlugin, type DIDKitPlugin, type DidMethod } from '@learncard/didkit-plugin';
import { getDidKeyPlugin, type DidKeyPlugin } from '@learncard/didkey-plugin';
import { getVCPlugin, type VCPlugin } from '@learncard/vc-plugin';
import { expirationPlugin, type ExpirationPlugin } from '@learncard/expiration-plugin';
import { getLearnCardPlugin, type LearnCardPlugin } from '@learncard/learn-card-plugin';
import { getDidWebPlugin, type DidWebPlugin } from '@learncard/did-web-plugin';
import { getLRUCache } from '@cache/in-memory-lru';
import { getSigningAuthorityForDid } from '@accesslayer/signing-authority/read';

const didkit = readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));

export type EmptyLearnCard = LearnCard<[DIDKitPlugin, ExpirationPlugin, LearnCardPlugin]>;

export type SeedLearnCard = LearnCard<
    [DIDKitPlugin, DidKeyPlugin<DidMethod>, VCPlugin, ExpirationPlugin, LearnCardPlugin]
>;

export type DidWebLearnCard = LearnCard<
    [
        DIDKitPlugin,
        DidKeyPlugin<DidMethod>,
        VCPlugin,
        ExpirationPlugin,
        LearnCardPlugin,
        DidWebPlugin
    ]
>;

const learnCardsCache = getLRUCache<SeedLearnCard>();
const saCardsCache = getLRUCache<SeedLearnCard | DidWebLearnCard>();

let emptyLearnCard: EmptyLearnCard;

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard> => {
    if (!emptyLearnCard) {
        const didkitLc = await (
            await generateLearnCard()
        ).addPlugin(await getDidKitPlugin(await didkit));

        const expirationLc = await didkitLc.addPlugin(expirationPlugin(didkitLc));

        emptyLearnCard = await expirationLc.addPlugin(getLearnCardPlugin(expirationLc));
    }

    return emptyLearnCard;
};

export const getLearnCard = async (seed = process.env.SEED): Promise<SeedLearnCard> => {
    if (!seed) throw new Error('No seed set!');

    let cachedValue = learnCardsCache.get(seed);

    if (cachedValue) return cachedValue;

    const didkitLc = await (
        await generateLearnCard()
    ).addPlugin(await getDidKitPlugin(await didkit));

    const didkeyLc = await didkitLc.addPlugin(
        await getDidKeyPlugin<DidMethod>(didkitLc, seed, 'key')
    );

    const didkeyAndVCLc = await didkeyLc.addPlugin(getVCPlugin(didkeyLc));

    const expirationLc = await didkeyAndVCLc.addPlugin(expirationPlugin(didkeyAndVCLc));

    const learnCard = await expirationLc.addPlugin(getLearnCardPlugin(expirationLc));

    learnCardsCache.add(seed, learnCard);

    return learnCard;
};

export const getSigningAuthorityLearnCard = async (
    ownerDID: string,
    name: string
): Promise<SeedLearnCard | DidWebLearnCard> => {
    const seed = (await getSigningAuthorityForDid(ownerDID, name))?.seed;

    if (!seed) throw new Error('No seed set for SA!');

    let cachedValue = saCardsCache.get(seed);

    if (cachedValue) return cachedValue;

    const learnCard = await getLearnCard(seed);

    const saLearnCard = ownerDID.startsWith('did:web:')
        ? await learnCard.addPlugin(await getDidWebPlugin(learnCard, ownerDID))
        : learnCard;

    saCardsCache.add(seed, saLearnCard);

    return saLearnCard;
};
