import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
assert.ok(process.env.OTHER_PROFILE_ID);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
const templateUri = await learnCard.invoke.createBoost(
    learnCard.invoke.newCredential({ type: 'achievement' }),
    { name: 'Methods Template', status: 'DRAFT' }
);
assert.equal((await learnCard.invoke.getBoost(templateUri)).status, 'DRAFT');
console.log('draft: true');
await learnCard.invoke.updateBoost(templateUri, { status: 'LIVE' });
assert.equal((await learnCard.invoke.getBoost(templateUri)).status, 'LIVE');
console.log('live: true');
await learnCard.invoke.send({
    type: 'boost',
    recipient: process.env.OTHER_PROFILE_ID,
    templateUri,
});
const recipients = await learnCard.invoke.getPaginatedBoostRecipients(
    templateUri,
    20,
    undefined,
    true
);
assert.ok(recipients.records.some(record => record.to.profileId === process.env.OTHER_PROFILE_ID));
console.log('recipient: found');
