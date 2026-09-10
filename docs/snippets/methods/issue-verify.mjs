import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
const unsigned = learnCard.invoke.newCredential({
    type: 'achievement',
    did: learnCard.id.did('key'),
    subject: learnCard.id.did('key'),
    name: 'Methods Reference',
    achievementName: 'Verified a credential',
    description: 'Issued and verified an Open Badge.',
    criteriaNarrative: 'Run the methods example.',
});
const credential = await learnCard.invoke.issueCredential(unsigned);
const result = await learnCard.invoke.verifyCredential(credential);
assert.deepEqual(result.errors, []);
console.log('valid');

const tampered = structuredClone(credential);
tampered.credentialSubject.achievement.name = 'An achievement I did not earn';
const invalid = await learnCard.invoke.verifyCredential(tampered);
assert.ok(invalid.errors.length > 0);
console.log('invalid');
