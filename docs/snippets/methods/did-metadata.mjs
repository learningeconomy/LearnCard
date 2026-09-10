import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
const alias = `https://example.org/issuer/${randomUUID()}`;
await learnCard.invoke.addDidMetadata({ alsoKnownAs: [alias] });
const records = await learnCard.invoke.getMyDidMetadata();
const metadata = records.find(record => record.alsoKnownAs?.includes(alias));
assert.ok(metadata);
const { id } = metadata;
try {
    assert.ok((await learnCard.invoke.getDidMetadata(id)).alsoKnownAs.includes(alias));
    console.log('metadata: found');
} finally {
    assert.equal(await learnCard.invoke.deleteDidMetadata(id), true);
}
assert.equal(await learnCard.invoke.getDidMetadata(id), undefined);
console.log('deleted: true');
