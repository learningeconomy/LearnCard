import { readFileSync } from 'node:fs';
import { initLearnCard } from '@learncard/init';

if (!process.env.SECURE_SEED) throw new Error('Set SECURE_SEED');

// Written by issue-refreshable.mjs.
const { refreshId, refreshService, credentialId, issuerDid, recipientDid } = JSON.parse(
    readFileSync('refresh.json', 'utf8')
);

const issuer = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

// The update is a complete credential: same id, issuer, and refreshService; newer validFrom.
const updated = await issuer.invoke.issueCredential({
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
    name: 'Final Transcript',
    refreshService,
    credentialSubject: {
        id: recipientDid,
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:5b2d6c4e-1f57-4b9a-9d0f-3a8c2e7f1b10',
            type: ['Achievement'],
            name: 'Introduction to Biology',
            description: 'Final grade: A.',
            criteria: { narrative: 'Complete all coursework and the final exam.' },
        },
    },
});

const result = await issuer.invoke.publishCredentialRefresh({
    mode: 'issuer-signed',
    refreshId,
    signedCredential: updated,
    updateSummary: 'Final grades posted',
    idempotencyKey: 'final-grades', // retrying with the same key returns the same version
});

console.log(JSON.stringify({ version: result.version, notification: result.notification }));
