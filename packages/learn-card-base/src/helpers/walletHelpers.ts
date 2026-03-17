import { isEqual } from 'lodash';
import { initLearnCard } from '@learncard/init';
import type { CredentialRecord } from '@learncard/types';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';
import { getLCAPlugin } from '@learncard/lca-api-plugin';
import { getLinkedClaimsPlugin } from '@learncard/linked-claims-plugin';
import { getLerRsPlugin } from '@learncard/ler-rs-plugin';

import { getSQLitePlugin } from 'learn-card-base/plugins/sqlite';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { switchedProfileStore, walletStore } from 'learn-card-base/stores/walletStore';
import { isPlatformWeb } from 'learn-card-base/helpers/platformHelpers';
import { requireCurrentUserPrivateKey } from 'learn-card-base/helpers/privateKeyHelpers';
import { LEARNCARD_NETWORK_URL } from 'learn-card-base/constants/Networks';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { QueryClient } from '@tanstack/react-query';

let LEARN_CARDS: Record<string, BespokeLearnCard> = {};

let SIGNING_LEARN_CARDS: Record<string, Awaited<ReturnType<typeof initLearnCard>>> = {};

export const clearLearnCardCache = () => {
    LEARN_CARDS = {};
    SIGNING_LEARN_CARDS = {};
};

/**
 * Returns a lightweight LearnCard instance (no network) for DID-Auth VP signing.
 * Because network is omitted, lc.id.did() deterministically returns did:key,
 * which is directly tied to the private key — exactly what we want for key-share auth.
 */
export const getSigningLearnCard = async (seed: string) => {
    if (SIGNING_LEARN_CARDS[seed]) return SIGNING_LEARN_CARDS[seed];

    const lc = await initLearnCard({ seed, allowRemoteContexts: true });

    SIGNING_LEARN_CARDS[seed] = lc;

    return lc;
};

export const getBespokeLearnCard = async (
    seed: string,
    didWeb?: string
): Promise<BespokeLearnCard> => {
    const cacheKey = [seed, didWeb].toString();

    if (LEARN_CARDS[cacheKey]) return LEARN_CARDS[cacheKey];

    let network: string | boolean = networkStore.get.networkUrl();
    if (!network || network === LEARNCARD_NETWORK_URL) network = true;

    const cloudUrl = networkStore.get.cloudUrl();

    const apiEndpoint = networkStore.get.apiEndpoint();

    const networkLearnCard = await initLearnCard({
        seed,
        network: network,
        cloud: { url: cloudUrl, automaticallyAssociateDids: !Boolean(didWeb) },
        allowRemoteContexts: true,
        ...(didWeb && { didWeb }),
    });

    const lcaLearnCard = await networkLearnCard.addPlugin(
        await getLCAPlugin(networkLearnCard, apiEndpoint, Boolean(didWeb))
    );

    const linkedClaimsLca = await lcaLearnCard.addPlugin(await getLinkedClaimsPlugin(lcaLearnCard));
    const lerRsLc = await linkedClaimsLca.addPlugin(getLerRsPlugin(linkedClaimsLca as any));

    // Conditionally add SQLite plugin on native platforms only
    const sqliteAugmented = isPlatformWeb()
        ? lerRsLc
        : await lerRsLc.addPlugin(await getSQLitePlugin(lerRsLc));

    const bespokeLearnCard = sqliteAugmented as BespokeLearnCard;

    LEARN_CARDS[cacheKey] = bespokeLearnCard;

    return bespokeLearnCard;
};

// tip: the useSwitchProfile hook will do this while also updating currentUserStore
export const switchProfile = async (didWeb?: string) => {
    const queryClient = new QueryClient();
    const pk = await requireCurrentUserPrivateKey();

    walletStore.set.wallet(await getBespokeLearnCard(pk, didWeb));
    switchedProfileStore.set.switchedDid(didWeb);

    // await queryClient.resetQueries();
};

// returns emoji 🔑 , 🌐, based on did:web or did:key
// will be replaced by actual name in future
export const getEmojiFromDidString = (did: string) => {
    if (!did) return null;

    if (did.hasOwnProperty('includes')) {
        if (did?.includes('web')) return '🌐';

        if (did?.includes('key')) return '🔑';
    }

    return '🌐';
};

// get user ID / handle from user did
export const getUserHandleFromDid = (userDid: string) => {
    // ie: did:web:network.learncard.com:users:kent
    const regex = /(users:)(.*)/;

    const match = userDid.match(regex);

    return match?.[2]; // returns kent
};

// checks if a users did -> is an LCnetwork did
export const hasLCNetworkDid = (userDid: string): boolean => {
    // ie: did:web:network.learncard.com:users:kent
    if (!userDid) return false;

    const regex = /did:web:network\.learncard\.com/;

    return regex.test(userDid); // return true || false
};

export const generatePK = async (str: string) => {
    const msgUint8 = new TextEncoder().encode(str); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
};
