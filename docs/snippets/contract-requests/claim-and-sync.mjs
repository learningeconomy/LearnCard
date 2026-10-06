import { randomUUID } from 'node:crypto';

// Call only after the learner approves sharing this Achievement with this audience.
export const claimAndShareOutcome = async (learner, { contractUri, termsUri, credentialUri }) => {
    const details = await learner.invoke.getContract(contractUri);
    await learner.invoke.acceptCredential(credentialUri);
    const credential = await learner.read.get(credentialUri);
    if (!credential) throw new Error('Outcome could not be loaded');
    const personalUri = await learner.store.LearnCloud.uploadEncrypted(credential);
    await learner.index.LearnCloud.add({
        id: randomUUID(),
        uri: personalUri,
        category: 'Achievement',
    });
    const sharedUri = await learner.store.LearnCloud.uploadEncrypted(credential, {
        recipients: [details.owner.did, ...(details.recipients ?? []).map(profile => profile.did)],
    });
    await learner.invoke.syncCredentialsToContract(
        termsUri,
        { Achievement: [sharedUri] },
        details.audienceVersion
    );
    return sharedUri;
};
