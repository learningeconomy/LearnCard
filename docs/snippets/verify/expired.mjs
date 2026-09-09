import { randomBytes, randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

const issuer = await initLearnCard({ seed: randomBytes(32).toString('hex') });
// Sign with past dates; editing validUntil after signing would also break the proof.
const credential = await issuer.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: issuer.id.did(),
    validFrom: '2020-01-01T00:00:00Z',
    validUntil: '2020-01-02T00:00:00Z',
    name: 'Verification Complete',
    credentialSubject: {
        id: issuer.id.did(),
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Verification Complete',
            description: 'Verified a signed credential with LearnCard.',
            criteria: { narrative: 'Ran the verification tutorial.' },
        },
    },
});

const verifier = await initLearnCard();
const result = await verifier.invoke.verifyCredential(credential);
console.log(result.errors.length ? `Invalid: ${result.errors.join('; ')}` : `Valid: ${result.checks.join(', ')}`);
console.log(JSON.stringify(result, null, 2));
