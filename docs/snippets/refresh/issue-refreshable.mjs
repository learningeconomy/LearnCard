import { randomUUID } from 'node:crypto';
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
// Your network identity. Every version of the credential must be issued by this exact DID.
const issuerDid = (await issuer.invoke.getProfile()).did;

const recipient = await issuer.invoke.getProfile(RECIPIENT_PROFILE_ID);
if (!recipient) throw new Error(`No profile named ${RECIPIENT_PROFILE_ID}`);

// Every version of this credential must reuse this exact ID.
const credentialId = `urn:uuid:${randomUUID()}`;

// 1. Allocate the refresh service BEFORE signing. Its URL becomes part of the signed credential.
const { refreshId, refreshService } = await issuer.invoke.allocateCredentialRefresh({
    holder: { profileId: RECIPIENT_PROFILE_ID, did: recipient.did },
    credentialId,
});

// 2. Add the service to the credential. The inline context defines the LearnCard refresh
//    terms, which the standard Open Badges context does not include.
const credential = await issuer.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        {
            LearnCardCredentialRefresh2026:
                'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
            authorization: {
                '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
                '@context': {
                    LearnCardDIDAuth: 'https://docs.learncard.com/definitions#LearnCardDIDAuth',
                },
            },
        },
    ],
    id: credentialId,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: issuerDid,
    validFrom: new Date().toISOString(),
    name: 'Provisional Transcript',
    refreshService,
    credentialSubject: {
        id: recipient.did,
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:5b2d6c4e-1f57-4b9a-9d0f-3a8c2e7f1b10',
            type: ['Achievement'],
            name: 'Introduction to Biology',
            description: 'Grade pending final exam.',
            criteria: { narrative: 'Complete all coursework and the final exam.' },
        },
    },
});

// 3. Send through the refresh path. The network stores it encrypted to the recipient only.
const credentialUri = await issuer.invoke.sendRefreshableCredential(refreshId, credential);

// Keep these with your own record of the credential: publishing an update needs all of them.
const record = {
    refreshId,
    issuerDid,
    refreshService,
    credentialId,
    credentialUri,
    recipientDid: recipient.did,
};
writeFileSync('refresh.json', JSON.stringify(record, null, 2));
console.log(JSON.stringify(record));
