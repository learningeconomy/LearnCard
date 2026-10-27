import { expect, test } from 'bun:test';

import { runWithConcurrency } from './runWithConcurrency';

test('keeps at most `concurrency` tasks in flight and preserves order', async () => {
    let active = 0;
    let peak = 0;
    const tasks = Array.from({ length: 10 }, (_, index) => async () => {
        active += 1;
        peak = Math.max(peak, active);
        await Bun.sleep(2);
        active -= 1;
        return index;
    });

    expect(await runWithConcurrency(tasks, 4)).toEqual([...Array(10).keys()]);
    expect(peak).toBe(4);
    expect(await runWithConcurrency([], 4)).toEqual([]);
});

test('stops starting tasks after the first failure', async () => {
    const started: number[] = [];
    const tasks = Array.from({ length: 6 }, (_, index) => async () => {
        started.push(index);
        await Bun.sleep(1);
        if (index === 1) throw new Error('synthetic');
        return index;
    });

    await expect(runWithConcurrency(tasks, 2)).rejects.toThrow('synthetic');
    expect(started.length).toBeLessThan(6);
});
