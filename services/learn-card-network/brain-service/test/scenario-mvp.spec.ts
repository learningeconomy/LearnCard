/**
 * The EducationOS MVP walkthrough (scenario/mvp-walkthrough.ts) on the in-process driver,
 * against a fresh test database. Run with `bun run test:scenario`; the per-step table is
 * printed as the run goes.
 */
import { describe, expect, it } from 'vitest';
import { createInProcessPort } from '../scenario/drivers/in-process/port';
import { newRunId, runMvpWalkthrough } from '../scenario/mvp-walkthrough';
import type { ScenarioPort } from '../scenario/port';

/** Steps the in-process driver runs; every one must PASS or WARN. */
const MUST_PASS = [
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
    'S13',
    'S14',
    'S15',
    'N2',
    'S16',
    'N3',
    'N4',
    'N5',
    'N6',
    'S17',
];

/** Observations (owner decision 2026-10-29): reported, never a failure. */
const OBSERVED = ['O1'];

describe('scenario: EducationOS MVP walkthrough (in-process)', () => {
    it('runs every step without a FAIL', async () => {
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
            const notPassed = MUST_PASS.filter(id => {
                const status = byId.get(id);
                return status !== 'PASS' && status !== 'WARN';
            }).map(id => `${id} ${byId.get(id) ?? 'missing'}`);
            expect(notPassed).toEqual([]);
            const notObserved = OBSERVED.filter(id => byId.get(id) !== 'OBSERVED').map(
                id => `${id} ${byId.get(id) ?? 'missing'}`
            );
            expect(notObserved).toEqual([]);
            expect(summary.exitCode).toBe(0);
        } finally {
            await port?.close();
        }
    });
});
