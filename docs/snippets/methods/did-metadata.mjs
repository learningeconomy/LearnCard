import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');

// Advertise a service endpoint in your did:web document.
const serviceId = `docs-${randomUUID()}`;
await learnCard.invoke.addDidMetadata({
    '@context': ['https://www.w3.org/ns/did/v1'],
    service: [{ id: serviceId, type: 'LinkedDomains', serviceEndpoint: 'https://example.org' }],
});

const records = await learnCard.invoke.getMyDidMetadata();
const metadata = records.find(record => record.service?.some(s => s.id === serviceId));
assert.ok(metadata);
const { id } = metadata;
try {
    const fetched = await learnCard.invoke.getDidMetadata(id);
    assert.ok(fetched.service.some(s => s.id === serviceId));
    console.log('metadata: found');
} finally {
    assert.equal(await learnCard.invoke.deleteDidMetadata(id), true);
}
assert.equal(await learnCard.invoke.getDidMetadata(id), undefined);
console.log('deleted: true');
