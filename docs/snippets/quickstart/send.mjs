import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

const recipientEmail = process.argv[2];
if (!recipientEmail) throw new Error('Usage: node --env-file=.env send.mjs you@example.com');

// `network: true` connects to the production LearnCard Network.
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

// Your public identity on the network. Created once; safe to re-run.
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createProfile({
        profileId: process.env.PROFILE_ID,
        displayName: 'My Organization',
    });
}

// A minimal Open Badges 3.0 credential, signed by you.
const credential = await learnCard.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: learnCard.id.did(),
    validFrom: new Date().toISOString(),
    name: 'Quickstart Complete',
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Quickstart Complete',
            description: 'Sent a verifiable credential with LearnCard.',
            criteria: { narrative: 'Ran the LearnCard quickstart.' },
        },
    },
});

const result = await learnCard.invoke.sendCredentialViaInbox({
    recipient: { type: 'email', value: recipientEmail },
    credential,
});

if (result.status === 'PENDING') {
    console.log(
        `Sent. ${recipientEmail} will get an email with this claim link:\n${result.claimUrl}`
    );
} else {
    console.log(
        `Delivered. ${recipientEmail} already uses LearnCard — the credential is in their wallet.`
    );
}
