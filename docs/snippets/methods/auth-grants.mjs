import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
const id = await learnCard.invoke.addAuthGrant({ name: 'Methods read-only', scope: 'boosts:read' });
try {
    const token = await learnCard.invoke.getAPITokenForAuthGrant(id);
    assert.ok(token.length > 0);
    console.log('token: created');
    const grant = await learnCard.invoke.getAuthGrant(id);
    assert.equal(grant.scope, 'boosts:read');
    console.log('scope: boosts:read');
} finally {
    await learnCard.invoke.revokeAuthGrant(id);
}
assert.equal((await learnCard.invoke.getAuthGrant(id)).status, 'revoked');
console.log('revoked: true');
