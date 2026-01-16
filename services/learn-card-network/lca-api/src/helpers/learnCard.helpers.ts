import { readFile } from 'node:fs/promises';

import {
    initLearnCard,
    EmptyLearnCard,
    LearnCardFromSeed,
    DidWebLearnCardFromSeed,
} from '@learncard/init';
import type { DIDKitPlugin } from '@learncard/didkit-plugin';
import { getSigningAuthorityForDid } from '@accesslayer/signing-authority/read';
import { getLRUCache } from '@cache/in-memory-lru';

const cloud = process.env.LEARN_CLOUD_URL
    ? { url: process.env.LEARN_CLOUD_URL }
    : { url: 'https://cloud.learncard.com/trpc' };

let emptyLearnCard: EmptyLearnCard['returnValue'];
let learnCard: LearnCardFromSeed['returnValue'];

const saCardsCache = getLRUCache<
    LearnCardFromSeed['returnValue'] | DidWebLearnCardFromSeed['returnValue']
>();
const didWebCardsCache = getLRUCache<DidWebLearnCardFromSeed['returnValue']>();
const ephemeralCardsCache = getLRUCache<LearnCardFromSeed['returnValue']>();

// Try native plugin first, fall back to WASM
let didKitPluginPromise: Promise<DIDKitPlugin> | null = null;

const getDidKitPlugin = async (): Promise<DIDKitPlugin> => {
    if (didKitPluginPromise) return didKitPluginPromise;

    didKitPluginPromise = (async () => {
        try {
            const {
                default: { getDidKitPlugin: getNativePlugin },
            } = await import('@learncard/didkit-plugin-node');

            return await getNativePlugin();
        } catch (e) {
            console.log('Native DIDKit plugin not available, falling back to WASM');

            const {
                default: { getDidKitPlugin: getWasmPlugin },
            } = await import('@learncard/didkit-plugin');

            const wasmBuffer = await readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')
            );

            return await getWasmPlugin(wasmBuffer);
        }
    })();

    return didKitPluginPromise;
};

export const getEmptyLearnCard = async (): Promise<EmptyLearnCard['returnValue']> => {
    if (!emptyLearnCard)
        emptyLearnCard = await initLearnCard({
            didkit: await getDidKitPlugin(),
        });

    return emptyLearnCard;
};

export const getLearnCard = async (): Promise<LearnCardFromSeed['returnValue']> => {
    const seed = process.env.SEED;

    if (!seed) throw new Error('No seed set!');

    if (!learnCard)
        learnCard = await initLearnCard({
            didkit: await getDidKitPlugin(),
            seed,
            cloud,
        });

    return learnCard;
};

export const getSigningAuthorityLearnCard = async (
    ownerDID: string,
    name: string
): Promise<DidWebLearnCardFromSeed['returnValue'] | LearnCardFromSeed['returnValue']> => {
    const seed = (await getSigningAuthorityForDid(ownerDID, name))?.seed;

    if (!seed) throw new Error('No seed set for SA!');

    let cachedValue = saCardsCache.get(seed);

    if (cachedValue) return cachedValue;

    const saLearnCard = ownerDID.startsWith('did:web:')
        ? await initLearnCard({
              didkit: await getDidKitPlugin(),
              seed,
              didWeb: ownerDID,
              cloud,
          })
        : await initLearnCard({
              didkit: await getDidKitPlugin(),
              seed,
              cloud,
          });

    saCardsCache.add(seed, saLearnCard);

    return saLearnCard;
};

export const getServerDidWebDID = (): string => {
    const domainName = process.env.DOMAIN_NAME;
    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName.replace(/:/g, '%3A');
    return `did:web:${domain}`;
};

export const getDidWebLearnCard = async (
    seed?: string,
    didWeb?: string
): Promise<DidWebLearnCardFromSeed['returnValue']> => {
    const _seed = seed || process.env.SEED;
    const _didWeb = didWeb || getServerDidWebDID();
    if (!_seed) throw new Error('No seed set!');
    if (!_didWeb) throw new Error('No didWeb set!');

    const cachedValue = didWebCardsCache.get(`${_seed}|${_didWeb}`);

    if (cachedValue) return cachedValue;

    const didWebLearnCard = await initLearnCard({
        didkit: await getDidKitPlugin(),
        seed: _seed,
        didWeb: _didWeb,
        cloud,
    });

    didWebCardsCache.add(`${_seed}|${_didWeb}`, didWebLearnCard);

    return didWebLearnCard;
};

export const getEphemeralLearnCard = async (
    seed: string
): Promise<LearnCardFromSeed['returnValue']> => {
    const cachedValue = ephemeralCardsCache.get(seed);

    if (cachedValue) return cachedValue;

    const ephemeralLearnCard = await initLearnCard({
        didkit: await getDidKitPlugin(),
        seed,
        cloud,
    });

    ephemeralCardsCache.add(seed, ephemeralLearnCard);

    return ephemeralLearnCard;
};
