import { VC } from '@learncard/types';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { GenericVCInputFields } from './types';

// ACHIEVEMENTS

export const getCredentialSubject = (credential: VC) => {
    if (!credential) return;

    const credentialSubject = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject[0]
        : credential.credentialSubject;

    return credentialSubject;
};

export const addCredentialSelfAttest = async (
    vcInput: GenericVCInputFields,
    wallet: BespokeLearnCard
) => {
    const walletDid = wallet.id.did();
    const currentDate = new Date()?.toISOString();

    const newCredential = wallet.invoke.newCredential({
        type: 'achievement',
        name: vcInput?.name,
        achievementName: vcInput?.name,
        description: vcInput?.description,
        criteriaNarrative: vcInput?.narrative,
        issuanceDate: currentDate,
    });

    newCredential.credentialSubject.achievement.achievementType = vcInput.achievementType;
    newCredential.credentialSubject.id = walletDid;
    newCredential.issuer = walletDid;
    const signedVc = await wallet.invoke.issueCredential(newCredential);
    const uri = await wallet.store.LearnCloud.uploadEncrypted?.(signedVc);
    return uri;
};
