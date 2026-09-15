import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
const credential = await learnCard.invoke.issueCredential(
    learnCard.invoke.newCredential({ type: 'achievement' })
);
const uri = await learnCard.store.LearnCloud.uploadEncrypted(credential);
const id = randomUUID();
await learnCard.index.LearnCloud.add({ id, uri });
try {
    const records = await learnCard.index.LearnCloud.get({ id });
    assert.ok(records.some(record => record.uri === uri));
    console.log('indexed: true');
    assert.deepEqual(await learnCard.read.get(uri), credential);
    console.log('equal: true');
} finally {
    await learnCard.index.LearnCloud.remove(id);
}
