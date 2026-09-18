import { pathToFileURL } from 'node:url';
import { initLearnCard } from '@learncard/init';
import { verifyConsentRedirect } from './consent-callback.mjs';
import { readUserData } from './read-user-data.mjs';

export const issueThroughContract = async (learnCard, userDid, contractUri) => {
    if ((await readUserData(learnCard, userDid, contractUri)).length === 0) {
        throw new Error('No active consent');
    }
    const base = learnCard.invoke.newCredential({ type: 'boost' });
    const unsignedCredential = {
        ...base,
        issuer: learnCard.id.did(),
        name: 'ConsentFlow Tutorial Complete',
        credentialSubject: {
            ...base.credentialSubject,
            id: userDid,
            achievement: {
                ...base.credentialSubject.achievement,
                name: 'ConsentFlow Tutorial Complete',
                description: 'Completed the ConsentFlow tutorial.',
            },
        },
    };
    const boostUri = await learnCard.invoke.createBoost(unsignedCredential, {
        name: 'ConsentFlow Tutorial Complete',
        category: 'Achievement',
        type: 'achievement',
    });
    const signedCredential = await learnCard.invoke.issueCredential({
        ...unsignedCredential,
        boostId: boostUri,
    });
    return learnCard.invoke.writeCredentialToContract(
        userDid,
        contractUri,
        signedCredential,
        boostUri
    );
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { SECURE_SEED, CONTRACT_URI, CONSENT_VP } = process.env;
    if (!SECURE_SEED || !CONTRACT_URI) throw new Error('Set SECURE_SEED and CONTRACT_URI');
    const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
    const verified = await verifyConsentRedirect(learnCard, CONSENT_VP, CONTRACT_URI);
    if (verified.status !== 'verified') throw new Error('Consent denied or abandoned');
    const credentialUri = await issueThroughContract(learnCard, verified.userDid, CONTRACT_URI);
    console.log(`Issued: ${credentialUri}`);
}
