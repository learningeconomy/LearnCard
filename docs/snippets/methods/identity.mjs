import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(learnCard.id.did('key').startsWith('did:key:'));
const { kty, crv } = learnCard.id.keypair();
assert.equal(kty, 'OKP');
assert.equal(crv, 'Ed25519');
console.log('did: did:key');
console.log(`keypair: ${kty} ${crv}`);
