import { readFile } from 'node:fs/promises';

import { generateLearnCard, LearnCard } from '@learncard/core';
import { DIDKitPlugin, DidMethod, getDidKitPlugin } from '@learncard/didkit-plugin';
import { DidKeyPlugin, getDidKeyPlugin } from '@learncard/didkey-plugin';
import { VCPlugin, getVCPlugin } from '@learncard/vc-plugin';
import { ExpirationPlugin, expirationPlugin } from '@learncard/expiration-plugin';
import { LearnCardPlugin, getLearnCardPlugin } from '@learncard/learn-card-plugin';
import { getDidWebPlugin, DidWebPlugin } from '@learncard/did-web-plugin';
import { DynamicLoaderPlugin } from '@learncard/dynamic-loader-plugin';
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

export const getLearnCard = async (
    seed = process.env.SEED,
    allowRemoteContexts = false
): Promise<SeedLearnCard> => {
    if (!seed) throw new Error('No seed set!');

    const cacheKey = `${seed}:${allowRemoteContexts}`;

    let cachedValue = learnCardsCache.get(cacheKey);

    if (cachedValue) return cachedValue;

    const emptyLc = await generateLearnCard();

    const baseLc = allowRemoteContexts
        ? await (await emptyLc.addPlugin(DynamicLoaderPlugin)).addPlugin(
              await getDidKitPlugin(await didkit, allowRemoteContexts)
          )
        : await emptyLc.addPlugin(await getDidKitPlugin(await didkit));

    const didkeyLc = await baseLc.addPlugin(
        await getDidKeyPlugin<DidMethod>(baseLc, seed, 'key')
    );

    const didkeyAndVCLc = await didkeyLc.addPlugin(getVCPlugin(didkeyLc));

    const expirationLc = await didkeyAndVCLc.addPlugin(expirationPlugin(didkeyAndVCLc));

    const learnCard = await expirationLc.addPlugin(getLearnCardPlugin(expirationLc)) as SeedLearnCard;

    learnCardsCache.add(cacheKey, learnCard);

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

    const learnCard = await getLearnCard(seed, true);

    const saLearnCard = ownerDID.startsWith('did:web:')
        ? await learnCard.addPlugin(await getDidWebPlugin(learnCard, ownerDID))
        : learnCard;

    saCardsCache.add(seed, saLearnCard);

    return saLearnCard;
};
