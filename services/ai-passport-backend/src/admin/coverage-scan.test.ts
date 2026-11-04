import { expect, test } from 'bun:test';
import {
    CoverageScan,
    type CoverageEntry,
    type CoverageChange,
    type CoverageScanStorage,
} from './coverage-scan';
function fixture(count: number) {
    const row = (i: number): CoverageEntry => ({
        id: String(i).padStart(6, '0'),
        sourceRef: `ref-${i}`,
        novaViews: 0,
        openaiViews: 5,
        stable: true,
    });
    const records = new Map(
        Array.from({ length: count }, (_, i) => {
            const r = row(i + 1);
            return [r.id, r];
        })
    );
    const events: CoverageChange[] = [];
    let maxPage = 0;
    const storage: CoverageScanStorage = {
        highWater: async () => [...records.keys()].sort().at(-1) ?? '',
        page: async (cursor, high, limit) => {
            const rows = [...records.values()]
                .filter(r => r.id > cursor && r.id <= high)
                .sort((a, b) => a.id.localeCompare(b.id))
                .slice(0, limit);
            maxPage = Math.max(maxPage, rows.length);
            const next = rows.at(-1)?.id ?? cursor;
            return {
                rows,
                cursor: next,
                done: rows.length < limit || next === high,
                scanned: rows.length,
            };
        },
        byIds: async ids => ids.flatMap(id => (records.has(id) ? [{ ...records.get(id)! }] : [])),
        changes: async limit => ({
            events: events.splice(0, limit),
            drained: events.length <= limit,
        }),
    };
    return {
        records,
        events,
        row,
        scan: new CoverageScan(storage, 100),
        maxPage: () => maxPage,
    };
}
test('resumes across more than 500 records and reflects progress beyond page one', async () => {
    const f = fixture(650);
    let result = await f.scan.step();
    expect(result.complete).toBe(false);
    expect(result.rows).toHaveLength(100);
    for (let i = 0; i < 6; i += 1) result = await f.scan.step();
    expect(result.complete).toBe(true);
    expect(result.rows).toHaveLength(650);
    const changed = { ...f.row(620), novaViews: 5 };
    f.records.set(changed.id, changed);
    f.events.push({ id: changed.id });
    result = await f.scan.step();
    expect(result.complete).toBe(true);
    expect(result.rows.filter(r => r.novaViews === 5)).toHaveLength(1);
    expect(result.rows).toHaveLength(650);
    expect(f.maxPage()).toBeLessThanOrEqual(100);
});
test('insertions behind the cursor, updates and deletions are reconciled once', async () => {
    const f = fixture(650);
    await f.scan.step();
    const newRow = { ...f.row(50), id: '000050a', sourceRef: 'new' };
    f.records.set(newRow.id, newRow);
    f.events.push({ id: newRow.id });
    f.records.delete('000020');
    f.events.push({ id: '000020', deleted: true });
    f.records.set('000010', { ...f.row(10), novaViews: 4 });
    f.events.push({ id: '000010' });
    let result = await f.scan.step();
    expect(result.complete).toBe(false);
    for (let i = 0; i < 12 && !result.complete; i += 1) result = await f.scan.step();
    expect(result.complete).toBe(true);
    expect(result.rows).toHaveLength(650);
    expect(result.rows.filter(r => r.novaViews === 4)).toHaveLength(1);
});
test('change backlog and unstable source observations never certify completion', async () => {
    const f = fixture(1);
    f.records.set('000001', { ...f.row(1), stable: false });
    let result = await f.scan.step();
    expect(result.complete).toBe(false);
    f.records.set('000001', { ...f.row(1), novaViews: 5 });
    result = await f.scan.step();
    expect(result.complete).toBe(true);
    f.events.push({ id: '000001' });
    result = await f.scan.step();
    expect(result.rows).toHaveLength(1);
    f.events.push({ reset: true });
    await expect(f.scan.step()).rejects.toThrow('invalidated');
});
