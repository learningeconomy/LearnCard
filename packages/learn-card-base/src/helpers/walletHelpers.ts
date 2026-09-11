import { isEqual } from 'lodash';
import { initLearnCard, type LearnCardFromSeed } from '@learncard/init';
import type { CredentialRecord } from '@learncard/types';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';
import { getLCAPlugin } from '@learncard/lca-api-plugin';
import { getLinkedClaimsPlugin } from '@learncard/linked-claims-plugin';
import { getLerRsPlugin } from '@learncard/ler-rs-plugin';
import { getRenderMethodPlugin } from '@learncard/render-method-plugin';

import { getSQLitePlugin } from 'learn-card-base/plugins/sqlite';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { switchedProfileStore, walletStore } from 'learn-card-base/stores/walletStore';
import { isPlatformWeb } from 'learn-card-base/helpers/platformHelpers';
import { requireCurrentUserPrivateKey } from 'learn-card-base/helpers/privateKeyHelpers';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { QueryClient } from '@tanstack/react-query';
import { getGuardianApprovalVP } from 'learn-card-base/stores/guardianApprovalStore';
import { PRODUCTION_NETWORK_URL } from './networkHelpers';
import { wrapWalletForDemo } from './demoWalletAdapter';
import { demoSessionStore } from 'learn-card-base/stores/demoSessionStore';
import { getLogger } from '../logging/logger';

const log = getLogger('wallet-helpers');

// Both caches hold in-flight promises (not resolved instances) so concurrent
// callers during boot share a single construction instead of each building
// their own wallet (and its network clients). Rejected builds evict their
// entry so the next caller can retry.
let LEARN_CARDS: Record<string, Promise<BespokeLearnCard>> = {};

let SIGNING_LEARN_CARDS: Record<string, Promise<LearnCardFromSeed['returnValue']>> = {};

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
    // Pass the locally-bundled DIDKit WASM so did:key derivation works offline.
    // Without it DIDKit fetches its WASM from the network and lc.id.did() throws
    // on a cold offline start — breaking the private-key-first boot path.
    SIGNING_LEARN_CARDS[seed] ??= initLearnCard({ seed, didkit, allowRemoteContexts: true }).catch(
        error => {
            delete SIGNING_LEARN_CARDS[seed];

            throw error;
        }
    );

    return SIGNING_LEARN_CARDS[seed];
};

export interface GetBespokeLearnCardOptions {
    /**
     * Build a network-free wallet for offline use. Skips the `network`/`cloud`
     * connection in `initLearnCard` (which is what depends on connectivity),
     * but keeps the full plugin stack so the returned wallet is still a valid
     * `BespokeLearnCard`: local planes (SQLite read/store/index/cache, signing,
     * verification, render) work, and network-only methods degrade gracefully.
     * Previously-viewed credentials remain readable from the SQLite cache plane.
     */
    offline?: boolean;
}

export const getBespokeLearnCard = async (
    seed: string,
    didWeb?: string,
    options?: GetBespokeLearnCardOptions
): Promise<BespokeLearnCard> => {
    const offline = options?.offline ?? false;
    const cacheKey = [seed, didWeb, offline ? 'offline' : 'full'].toString();

    LEARN_CARDS[cacheKey] ??= buildBespokeLearnCard(seed, didWeb, offline)
        .then(wrapWalletForDemo)
        .catch(error => {
            delete LEARN_CARDS[cacheKey];

            throw error;
        });

    return LEARN_CARDS[cacheKey];
};

const buildBespokeLearnCard = async (
    seed: string,
    didWeb: string | undefined,
    offline: boolean
): Promise<BespokeLearnCard> => {
    // Each log = one full wallet construction (a promise-cache miss). Wallet builds
    // are expensive (plugin init makes network calls), so duplicate logs for the
    // same seed/didWeb/offline combo indicate a boot-perf regression.
    // Raw seed intentionally not logged.
    log.debug('Building wallet', {
        seed: seed === 'a' ? 'fallback-dummy-seed' : `user-seed(len:${seed.length})`,
        didWeb: didWeb ?? '(base did:key)',
        offline,
    });

    let network: string | boolean = networkStore.get.networkUrl();
    if (!network || network === PRODUCTION_NETWORK_URL) network = true;

    const cloudUrl = networkStore.get.cloudUrl();

    const apiEndpoint = networkStore.get.apiEndpoint();

    const tenantId = networkStore.get.tenantId();
    const extraHeaders = tenantId ? { 'X-Tenant-Id': tenantId } : undefined;

    const networkLearnCard = offline
        ? await initLearnCard({
              seed,
              didkit,
              allowRemoteContexts: true,
              guardianApprovalGetter: getGuardianApprovalVP,
              extraHeaders,
              ...(didWeb && { didWeb }),
          })
        : await initLearnCard({
              seed,
              didkit,
              network: network,
              cloud: { url: cloudUrl, automaticallyAssociateDids: !Boolean(didWeb) },
              allowRemoteContexts: true,
              guardianApprovalGetter: getGuardianApprovalVP,
              extraHeaders,
              ...(didWeb && { didWeb }),
          });

    const lcaLearnCard = await networkLearnCard.addPlugin(
        await getLCAPlugin(networkLearnCard, apiEndpoint, Boolean(didWeb), extraHeaders)
    );

    const linkedClaimsLca = await lcaLearnCard.addPlugin(await getLinkedClaimsPlugin(lcaLearnCard));
    const lerRsLc = await linkedClaimsLca.addPlugin(getLerRsPlugin(linkedClaimsLca as any));

    // Conditionally add SQLite plugin on native platforms only
    const sqliteAugmented = isPlatformWeb()
        ? lerRsLc
        : await lerRsLc.addPlugin(await getSQLitePlugin(lerRsLc));

    const renderMethodAugmented = await sqliteAugmented.addPlugin(
        getRenderMethodPlugin(sqliteAugmented)
    );

    return renderMethodAugmented as BespokeLearnCard;
};

// tip: the useSwitchProfile hook will do this while also updating currentUserStore
export const switchProfile = async (didWeb?: string) => {
    const queryClient = new QueryClient();
    const pk = await requireCurrentUserPrivateKey();

    demoSessionStore.set.exitDemo();

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
