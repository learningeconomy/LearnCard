import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { initLearnCard } from '@learncard/init';

if (!process.env.SECURE_SEED) throw new Error('Set SECURE_SEED');
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
const vc = await learnCard.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: learnCard.id.did('key'),
    validFrom: new Date().toISOString(),
    name: 'URI Example',
    credentialSubject: {
        id: learnCard.id.did('key'),
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'URI Example',
            description: 'Stored and resolved a credential.',
            criteria: { narrative: 'Run this example.' },
        },
    },
});
// upload is not encrypted: use only non-sensitive example data here.
const uri = await learnCard.store.LearnCloud.upload(vc);
const resolved = await learnCard.read.get(uri);
console.log('prefix:', uri.split(':').slice(0, 2).join(':') + ':');
console.log('equal:', isDeepStrictEqual(resolved, vc));
