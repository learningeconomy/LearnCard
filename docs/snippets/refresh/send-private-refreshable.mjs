import { writeFileSync } from 'node:fs';
import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, PROFILE_ID, RECIPIENT_PROFILE_ID } = process.env;
if (!SECURE_SEED || !PROFILE_ID || !RECIPIENT_PROFILE_ID) {
    throw new Error('Set SECURE_SEED, PROFILE_ID, and RECIPIENT_PROFILE_ID');
}

const issuer = await initLearnCard({ seed: SECURE_SEED, network: true });
if (!(await issuer.invoke.getProfile())) {
    await issuer.invoke.createProfile({ profileId: PROFILE_ID, displayName: 'Example University' });
}

// Identical to an ordinary refreshable send, except `encryption: 'holder'`: the SDK
// signs and encrypts this credential locally, and only the resulting ciphertext —
// never the claims below — is sent to the network.
const result = await issuer.invoke.send({
    type: 'boost',
    recipient: RECIPIENT_PROFILE_ID,
    template: {
        credential: {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer: issuer.id.did(),
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: 'urn:uuid:5b2d6c4e-1f57-4b9a-9d0f-3a8c2e7f1b10',
                    type: ['Achievement'],
                    name: 'Introduction to Biology',
                    description: 'Grade pending final exam.',
                    criteria: { narrative: 'Complete all coursework and the final exam.' },
                },
            },
        },
    },
    // `display` is the only part of this send the network ever sees. Holder mode
    // never transmits the claims above, so there is no content to read a title from.
    display: { name: 'Official Transcript', category: 'Learning History' },
    refresh: true,
    encryption: 'holder',
});

// Same receipt shape as network mode. Keep it with your own record of the claims —
// you still can't read the credential back from it, and now neither can the network.
const record = {
    refreshId: result.refresh.refreshId,
    refreshService: result.refresh.refreshService,
    credentialId: result.refresh.credentialId,
    issuerDid: result.refresh.issuerDid,
    holderDid: result.refresh.holderDid,
    credentialStatus: result.refresh.credentialStatus,
    credentialUri: result.credentialUri,
    activityId: result.activityId,
};
writeFileSync('refresh-private.json', JSON.stringify(record, null, 2));
console.log(JSON.stringify(record));
