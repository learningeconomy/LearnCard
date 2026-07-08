import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

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

const didkit = readFile(resolveDidkitWasmPath());

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
        ? await (
              await emptyLc.addPlugin(DynamicLoaderPlugin)
          ).addPlugin(await getDidKitPlugin(await didkit, allowRemoteContexts))
        : await emptyLc.addPlugin(await getDidKitPlugin(await didkit));

    const didkeyLc = await baseLc.addPlugin(await getDidKeyPlugin<DidMethod>(baseLc, seed, 'key'));

    const didkeyAndVCLc = await didkeyLc.addPlugin(getVCPlugin(didkeyLc));

    const expirationLc = await didkeyAndVCLc.addPlugin(expirationPlugin(didkeyAndVCLc));

    const learnCard = (await expirationLc.addPlugin(
        getLearnCardPlugin(expirationLc)
    )) as SeedLearnCard;

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
