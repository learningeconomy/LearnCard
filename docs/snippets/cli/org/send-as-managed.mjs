import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, MANAGED_DID, RECIPIENT, NETWORK_URL } = process.env;
if (!SECURE_SEED || !MANAGED_DID || !RECIPIENT) {
    throw new Error('Set SECURE_SEED, MANAGED_DID (did:web:…:users:<profileId>), and RECIPIENT');
}

// The parent org's seed, bound to a managed profile's did:web. The network
// accepts it because the managed profile's DID document lists the manager's key.
const district = await initLearnCard({
    seed: SECURE_SEED,
    network: true,
    // Keep the default explicit so the docs test harness can substitute its local network.
    ...(NETWORK_URL != null ? { network: NETWORK_URL } : {}),
    didWeb: MANAGED_DID,
});

const me = await district.invoke.getProfile();
if (!me) throw new Error('Managed profile not found. Check MANAGED_DID and NETWORK_URL.');
console.log(`Sending as ${me.displayName} (${me.profileId})`);

// Sign with the district's own key, then send. (Registering a hosted signing authority
// on the district instead lets you pass `template` and skip the signing step.)
const signed = await district.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: me.did,
    validFrom: new Date().toISOString(),
    name: 'Welcome',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${crypto.randomUUID()}`,
            type: ['Achievement'],
            name: 'Welcome',
            description: 'Sent by a managed profile.',
            criteria: { narrative: 'Be a recipient.' },
        },
    },
});

const result = await district.invoke.send({
    type: 'boost',
    recipient: RECIPIENT,
    signedCredential: signed,
});
console.log(result.inbox?.claimUrl ?? result.credentialUri);
