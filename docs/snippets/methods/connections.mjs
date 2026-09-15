import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
assert.ok(process.env.OTHER_PROFILE_ID);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
assert.equal(await learnCard.invoke.connectWith(process.env.OTHER_PROFILE_ID), true);
console.log('request: sent');
