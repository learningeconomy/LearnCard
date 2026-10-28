import type { QdrantClient } from '@qdrant/js-client-rest';

export const credentialPayloadIndexes = {
    did: 'keyword',
    uri: 'keyword',
    erased: 'bool',
} as const;

type IndexClient = Pick<QdrantClient, 'getCollection' | 'createPayloadIndex'>;

/** Only the initialization that created a collection may create its indexes. */
export async function prepareCredentialPayloadIndexes(
    client: IndexClient,
    collection: string,
    allowCreate: boolean
): Promise<void> {
    const required = Object.entries(credentialPayloadIndexes);
    const info = await client.getCollection(collection);
    const schema = info.payload_schema ?? {};
    // Check every existing field before performing any writes. Never replace an
    // index with a different type, weaken strict mode, or change stored points.
    for (const [field, type] of required) {
        if (schema[field] && schema[field].data_type !== type)
            throw new Error('Incompatible credential payload index schema');
    }
    const missing = required.filter(([field]) => !schema[field]);
    if (missing.length && !allowCreate)
        throw new Error('Credential payload indexes require operator repair');
    for (const [field_name, field_schema] of missing) {
        const result = await client.createPayloadIndex(collection, {
            field_name,
            field_schema,
            wait: true,
        });
        if (result.status !== 'completed')
            throw new Error('Credential payload index creation did not complete');
    }
    if (!missing.length) return;
    const verified = (await client.getCollection(collection)).payload_schema ?? {};
    for (const [field, type] of required) {
        if (verified[field]?.data_type !== type)
            throw new Error('Credential payload index verification failed');
    }
}
