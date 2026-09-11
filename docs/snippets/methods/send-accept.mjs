import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
assert.ok(process.env.OTHER_PROFILE_ID);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
const recipient = await learnCard.invoke.getProfile(process.env.OTHER_PROFILE_ID);
assert.ok(recipient);
const credential = await learnCard.invoke.issueCredential(
    learnCard.invoke.newCredential({ type: 'achievement', subject: recipient.did })
);
const sent = await learnCard.invoke.send({
    type: 'boost',
    recipient: recipient.profileId,
    signedCredential: credential,
});
assert.ok(sent.credentialUri);
const records = await learnCard.invoke.getSentCredentials(recipient.profileId);
assert.ok(records.some(record => record.uri === sent.credentialUri));
console.log('sent: true');
