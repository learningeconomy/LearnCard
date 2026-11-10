import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

/** Matches the shape of `useWallet().addVCtoWallet`. */
type AddVCToWallet = (input: { uri: string }) => Promise<boolean>;

/**
 * Make sure an accepted transcript has a wallet index entry (the LearnCloud index that
 * `ReceivedTranscript` reads) before the request is acknowledged as received.
 *
 * `addVCtoWallet` can resolve `false` on a real insertion failure while the network accept
 * succeeded. Acknowledging then would set `receivedAt` with no transcript to open, and stop
 * every recovery path. So: look the URI up (skipping the cache); if it is missing, add it
 * again; throw when that fails, so the caller does not acknowledge.
 */
export const ensureTranscriptInWallet = async (
    wallet: Pick<BespokeLearnCard, 'index'>,
    uri: string,
    addVCtoWallet: AddVCToWallet
): Promise<void> => {
    const records = await wallet.index.LearnCloud.get({ uri }, { cache: 'skip-cache' });
    if (records && records.length > 0) return;
    if (!(await addVCtoWallet({ uri }))) {
        throw new Error('The transcript could not be added to the wallet');
    }
};
