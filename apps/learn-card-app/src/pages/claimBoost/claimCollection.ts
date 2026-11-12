import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { CredentialMetadata, LCR } from 'learn-card-base/types/credential-records';
import type { AddVCToWalletInput } from 'learn-card-base/hooks/useWallet';

/** Stable IDs are enforced by LearnCloud's unique (did, id) index, including lost-response retries. */
export const saveClaimToCollection = async (
    wallet: BespokeLearnCard,
    credentialUri: string,
    boostUri: string,
    addVCtoWallet: (input: AddVCToWalletInput) => Promise<boolean | undefined>
): Promise<void> => {
    const id = `claim:${credentialUri}`;
    const findSaved = async (): Promise<boolean> => {
        const records = await wallet.index.LearnCloud.get<CredentialMetadata>({ id });
        if (records.some(record => record.uri === credentialUri)) return true;
        if (records.length) throw new Error('Claim collection identity does not match');
        // Also recognize entries created before staged recovery used a deterministic record ID.
        const existing = await wallet.index.LearnCloud.get<CredentialMetadata>({
            uri: credentialUri,
        });
        return existing.some(record => record.uri === credentialUri);
    };

    if (await findSaved()) return;
    try {
        const saved = await addVCtoWallet({
            id,
            uri: credentialUri,
            boostUri,
            skipSync: true,
            deferRefresh: true,
            expectedDid: wallet.id.did(),
        });
        if (!saved) throw new Error('Credential collection save was not confirmed');
    } catch (error) {
        // The insert can commit even when its response is lost, or another recovery wins the insert.
        if (await findSaved()) return;
        throw error;
    }
};

export const getSavedClaimRecord = async (
    wallet: BespokeLearnCard,
    credentialUri: string
): Promise<LCR> => {
    const records = await wallet.index.LearnCloud.get<CredentialMetadata>({ uri: credentialUri });
    const record = records.find(record => record.uri === credentialUri);
    if (!record) throw new Error('Saved credential is not available yet');
    return record as LCR;
};
