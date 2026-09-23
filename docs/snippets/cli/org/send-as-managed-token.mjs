import { initLearnCard } from '@learncard/init';

const { API_TOKEN, DISTRICT_PROFILE_ID, RECIPIENT } = process.env;
if (!API_TOKEN || !DISTRICT_PROFILE_ID || !RECIPIENT) {
    throw new Error('Set API_TOKEN (from --secrets-out), DISTRICT_PROFILE_ID, and RECIPIENT');
}

// One token for the whole org. Each request names the profile it acts as; the network
// enforces both the manager relationship and the token's actAs policy.
const org = await initLearnCard({ apiKey: API_TOKEN, network: true });
const district = await org.invoke.actAs(DISTRICT_PROFILE_ID);

const me = await district.invoke.getProfile();
console.log(`Acting as ${me.displayName} (${me.profileId})`);

// A token has no signing key, so LearnCard signs for the district through the hosted
// signing authority that `org apply` registered on it. Passing `template` (not a
// pre-signed credential) is what asks the network to sign.
const result = await district.invoke.send({
    type: 'boost',
    recipient: RECIPIENT,
    template: {
        credential: {
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
                    description: 'Sent by a district through the org token.',
                    criteria: { narrative: 'Be a recipient.' },
                },
            },
        },
        name: 'Welcome',
        category: 'Achievement',
    },
});
console.log(result.inbox?.claimUrl ?? result.credentialUri);
