import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, MANAGED_DID, RECIPIENT } = process.env;
if (!SECURE_SEED || !MANAGED_DID || !RECIPIENT) {
    throw new Error('Set SECURE_SEED, MANAGED_DID (did:web:…:users:<profileId>), and RECIPIENT');
}

// The parent org's seed, bound to a managed profile's did:web. The network
// accepts it because the managed profile's DID document lists the manager's key.
const district = await initLearnCard({ seed: SECURE_SEED, network: true, didWeb: MANAGED_DID });

const me = await district.invoke.getProfile();
console.log(`Sending as ${me.displayName} (${me.profileId})`);

const result = await district.invoke.send({
    type: 'boost',
    recipient: RECIPIENT,
    template: {
        name: 'Welcome',
        achievementType: 'Achievement',
        description: 'Sent by a managed profile.',
        criteria: 'Be a recipient.',
    },
});
console.log(result.inbox?.claimUrl ?? result.credentialUri);
