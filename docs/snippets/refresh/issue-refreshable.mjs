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

// An ordinary credential template: no refresh fields, no special JSON-LD context.
// `refresh: true` makes send() allocate the managed refresh service, add it (with its
// JSON-LD context) before signing, and deliver the credential encrypted to the
// recipient only. Recipients must be LearnCard profiles or DIDs on your network —
// email and phone recipients cannot request refresh.
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
            name: 'Provisional Transcript',
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
        name: 'Provisional Transcript',
        category: 'Achievement',
    },
    refresh: true,
});

// `refresh` is the issuance receipt: the metadata every future version must reuse.
// Keep it with your own record of the claims. You cannot read the credential back —
// the network stores it encrypted to the recipient only.
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
writeFileSync('refresh.json', JSON.stringify(record, null, 2));
console.log(JSON.stringify(record));
