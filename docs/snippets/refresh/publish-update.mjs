import { readFileSync } from 'node:fs';
import { initLearnCard } from '@learncard/init';

if (!process.env.SECURE_SEED) throw new Error('Set SECURE_SEED');

// Written by issue-refreshable.mjs.
const record = JSON.parse(readFileSync('refresh.json', 'utf8'));

const issuer = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });

// Rebuild the credential from your own claims plus the receipt: same id, issuer,
// subject, refreshService, and status descriptor as version 1; newer validFrom.
// The refresh terms' JSON-LD context is injected automatically at signing.
const updated = await issuer.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    id: record.credentialId,
    issuer: record.issuerDid,
    validFrom: new Date().toISOString(),
    name: 'Final Transcript',
    ...(record.credentialStatus ? { credentialStatus: record.credentialStatus } : {}),
    refreshService: record.refreshService,
    credentialSubject: {
        id: record.holderDid,
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
    refreshId: record.refreshId,
    signedCredential: updated,
    updateSummary: 'Final grades posted',
    idempotencyKey: 'final-grades', // retrying with the same key returns the same version
});

console.log(JSON.stringify({ version: result.version, notification: result.notification }));
