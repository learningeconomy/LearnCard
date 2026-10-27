import { expect, test } from 'bun:test';
import { classifyCoverage, sourceFingerprint } from './coverage-model';
import { createAdminPoller } from '../../admin-web/admin-polling';
test('exclusive records count five views once and retain rollback overlap separately', () => {
    const result = classifyCoverage(
        [
            { stable: true, novaViews: 5, openaiViews: 5 },
            { stable: true, novaViews: 0, openaiViews: 5 },
            { stable: true, novaViews: 4, openaiViews: 5 },
            { stable: true, novaViews: 0, openaiViews: 0 },
            { stable: false, novaViews: 5, openaiViews: 5 },
        ],
        true,
        500
    );
    expect(result.novaReady).toBe(1);
    expect(result.openaiOnly).toBe(1);
    expect(result.unresolved).toBe(3);
    expect(result.rollbackCopies).toBe(1);
    expect(result.novaReady + result.openaiOnly + result.unresolved).toBe(result.observedRecords);
    expect(result.totalRecords).toBeNull();
});
test('empty and bounded incomplete inventory never invents a full denominator', () => {
    expect(classifyCoverage([], true, 500)).toMatchObject({
        totalRecords: 0,
        observedRecords: 0,
        novaReady: 0,
    });
    expect(
        classifyCoverage([{ stable: true, novaViews: 5, openaiViews: 0 }], false, 500)
    ).toMatchObject({ totalRecords: null, complete: false });
});
test('source fingerprints detect version, consent, incarnation and ownership changes', () => {
    const source = {
        _id: 'a',
        did: 'did:web:a',
        uri: 'urn:1',
        embeddingEpoch: 'one',
        verification: { contentHash: 'h', consent: { revision: 'r' } },
    };
    for (const changed of [
        { ...source, embeddingEpoch: 'two' },
        { ...source, did: 'did:web:b' },
        {
            ...source,
            verification: { contentHash: 'other', consent: { revision: 'r' } },
        },
        {
            ...source,
            verification: { contentHash: 'h', consent: { revision: 'next' } },
        },
    ])
        expect(sourceFingerprint(changed)).not.toBe(sourceFingerprint(source));
});
test('poller coalesces requests and suppresses interrupted identity responses', async () => {
    let did: string | null = 'a',
        resolve!: (v: number) => void,
        signal!: AbortSignal,
        calls = 0;
    const values: number[] = [],
        errors: unknown[] = [];
    const poller = createAdminPoller({
        identity: () => did,
        read: s => {
            calls += 1;
            signal = s;
            return new Promise<number>(r => (resolve = r));
        },
        publish: v => values.push(v),
        clear: () => values.splice(0),
        error: e => errors.push(e),
        interval: 100000,
    });
    const first = poller.refresh();
    expect(poller.refresh()).toBe(first);
    expect(calls).toBe(1);
    did = 'b';
    poller.invalidate();
    expect(signal.aborted).toBe(true);
    resolve(1);
    await first;
    expect(values).toEqual([]);
    await new Promise(r => setTimeout(r, 5));
    expect(calls).toBe(2);
    resolve(2);
    await poller.refresh();
    expect(values).toEqual([2]);
    did = null;
    poller.invalidate();
    expect(values).toEqual([]);
    await poller.refresh();
    expect(calls).toBe(2);
    poller.stop();
    expect(errors).toEqual([]);
});
test('failed inventories and unmount do not publish late responses', async () => {
    const errors: unknown[] = [],
        values: number[] = [];
    let resolve!: (v: number) => void,
        calls = 0;
    const poller = createAdminPoller({
        identity: () => 'a',
        read: async () => {
            calls += 1;
            if (calls === 1) throw new Error('unavailable');
            return new Promise<number>(r => (resolve = r));
        },
        publish: v => values.push(v),
        clear: () => {},
        error: e => errors.push(e),
        interval: 100000,
    });
    await poller.refresh();
    expect(errors).toHaveLength(1);
    const pending = poller.refresh();
    poller.stop();
    resolve(1);
    await pending;
    expect(values).toEqual([]);
});
