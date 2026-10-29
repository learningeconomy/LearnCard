/**
 * The EducationOS MVP walkthrough (scenario/mvp-walkthrough.ts) on the in-process driver,
 * against a fresh test database. Run with `bun run test:scenario`; the per-step table is
 * printed as the run goes.
 */
import { describe, expect, it } from 'vitest';
import { createInProcessPort } from '../scenario/drivers/in-process/port';
import { newRunId, runMvpWalkthrough } from '../scenario/mvp-walkthrough';
import type { ScenarioPort } from '../scenario/port';

/** Slice 1 steps the in-process driver runs; every one must PASS or WARN. */
const SLICE_1 = [
    'F1',
    'F2',
    'S01',
    'S02',
    'S03',
    'S04',
    'S05',
    'S06',
    'S07',
    'S08',
    'S09',
    'N1',
    'S10',
    'S11',
    'S12',
    'N4',
    'S17',
];

describe('scenario: EducationOS MVP walkthrough (in-process)', () => {
    it('runs every slice-1 step without a FAIL', async () => {
        const runId = newRunId();
        let port: ScenarioPort | undefined;
        try {
            port = await createInProcessPort({ runId, keepLms: false });
            const summary = await runMvpWalkthrough({
                port,
                runId,
                options: { driver: 'in-process', json: false, keepLms: false },
            });
            const failures = summary.results
                .filter(result => result.status === 'FAIL' || result.status === 'BLOCKED')
                .map(result => `${result.id} ${result.status}: ${result.reason}`);
            expect(failures).toEqual([]);
            const byId = new Map(summary.results.map(result => [result.id, result.status]));
            const notPassed = SLICE_1.filter(id => {
                const status = byId.get(id);
                return status !== 'PASS' && status !== 'WARN';
            }).map(id => `${id} ${byId.get(id) ?? 'missing'}`);
            expect(notPassed).toEqual([]);
            expect(summary.exitCode).toBe(0);
        } finally {
            await port?.close();
        }
    });
});
