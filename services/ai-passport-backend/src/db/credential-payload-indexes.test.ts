import { expect, test } from 'bun:test';
import type { QdrantClient } from '@qdrant/js-client-rest';
import { prepareCredentialPayloadIndexes } from './credential-payload-indexes';

type Schema = Record<string, { data_type: string; points: number }>;
const full = (): Schema => ({
    did: { data_type: 'keyword', points: 0 },
    uri: { data_type: 'keyword', points: 0 },
    erased: { data_type: 'bool', points: 0 },
});
function fixture(initial: Schema = {}) {
    const schema = structuredClone(initial);
    const calls: unknown[] = [];
    let failField: string | undefined;
    let status = 'completed';
    let omitCreation = false;
    let readFailure = false;
    const client = {
        getCollection: async () => {
            if (readFailure) throw Error('synthetic read failure');
            return { payload_schema: structuredClone(schema) };
        },
        createPayloadIndex: async (
            name: string,
            request: { field_name: string; field_schema: string; wait: boolean }
        ) => {
            calls.push({ name, ...request });
            if (request.field_name === failField) throw Error('synthetic index failure');
            if (!omitCreation)
                schema[request.field_name] = {
                    data_type: request.field_schema,
                    points: 0,
                };
            return { status };
        },
    } as unknown as Pick<QdrantClient, 'getCollection' | 'createPayloadIndex'>;
    return {
        client,
        schema,
        calls,
        failOn: (field?: string) => {
            failField = field;
        },
        pending: () => {
            status = 'acknowledged';
        },
        omit: () => {
            omitCreation = true;
        },
        failRead: () => {
            readFailure = true;
        },
    };
}

test('owned new collection creates exactly three typed indexes and repeated calls are read-only', async () => {
    const f = fixture();
    await prepareCredentialPayloadIndexes(f.client, 'owned', true);
    expect(f.calls).toEqual([
        { name: 'owned', field_name: 'did', field_schema: 'keyword', wait: true },
        { name: 'owned', field_name: 'uri', field_schema: 'keyword', wait: true },
        { name: 'owned', field_name: 'erased', field_schema: 'bool', wait: true },
    ]);
    expect(f.schema).toEqual(full());
    await prepareCredentialPayloadIndexes(f.client, 'owned', true);
    await prepareCredentialPayloadIndexes(f.client, 'owned', false);
    expect(f.calls).toHaveLength(3);
});

test('pre-existing missing indexes require operator repair and cause no writes', async () => {
    for (const field of ['did', 'uri', 'erased']) {
        const indexes = full();
        delete indexes[field];
        const f = fixture(indexes);
        await expect(prepareCredentialPayloadIndexes(f.client, 'existing', false)).rejects.toThrow(
            'operator repair'
        );
        expect(f.calls).toHaveLength(0);
    }
});

test('wrong types fail before any writes even with absent earlier fields', async () => {
    for (const field of ['did', 'uri', 'erased']) {
        for (const allow of [true, false]) {
            const f = fixture({ [field]: { data_type: 'text', points: 0 } });
            await expect(prepareCredentialPayloadIndexes(f.client, 'owned', allow)).rejects.toThrow(
                'Incompatible'
            );
            expect(f.calls).toHaveLength(0);
        }
    }
});

test('owned partial creation retries only missing indexes after a failure', async () => {
    const f = fixture();
    f.failOn('uri');
    await expect(prepareCredentialPayloadIndexes(f.client, 'owned', true)).rejects.toThrow(
        'synthetic index failure'
    );
    expect(Object.keys(f.schema)).toEqual(['did']);
    f.failOn();
    await prepareCredentialPayloadIndexes(f.client, 'owned', true);
    expect(f.calls).toHaveLength(4);
    expect(f.schema).toEqual(full());
});

test('read failures, pending operations and missing postconditions remain fail-closed', async () => {
    const read = fixture();
    read.failRead();
    await expect(prepareCredentialPayloadIndexes(read.client, 'owned', true)).rejects.toThrow(
        'read failure'
    );
    expect(read.calls).toHaveLength(0);
    const pending = fixture();
    pending.pending();
    await expect(prepareCredentialPayloadIndexes(pending.client, 'owned', true)).rejects.toThrow(
        'did not complete'
    );
    expect(pending.calls).toHaveLength(1);
    const absent = fixture();
    absent.omit();
    await expect(prepareCredentialPayloadIndexes(absent.client, 'owned', true)).rejects.toThrow(
        'verification failed'
    );
});
