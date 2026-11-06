import { expect, test } from 'bun:test';
import { createKeyedSerialQueue } from './keyedSerialQueue';

test('same-key members run serially while different keys remain independent', async () => {
    const run = createKeyedSerialQueue();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const order: string[] = [];
    const first = run('a', async () => {
        order.push('first');
        entered.resolve();
        await release.promise;
        order.push('released');
    });
    await entered.promise;
    const second = run('a', async () => {
        order.push('second');
    });
    await run('b', async () => {
        order.push('other');
    });
    expect(order).toEqual(['first', 'other']);
    release.resolve();
    await Promise.all([first, second]);
    expect(order).toEqual(['first', 'other', 'released', 'second']);
});

test('a rejected member cannot poison later work and rethrows the original', async () => {
    const run = createKeyedSerialQueue();
    const failure = new Error('synthetic failure');
    await expect(
        run('a', async () => {
            throw failure;
        })
    ).rejects.toBe(failure);
    expect(await run('a', async () => 42)).toBe(42);
});

test('cancelled queued members reject promptly without releasing successors early', async () => {
    const run = createKeyedSerialQueue();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const first = run('a', async () => {
        entered.resolve();
        await release.promise;
    });
    await entered.promise;
    const controller = new AbortController();
    const reason = new Error('cancelled');
    let cancelledRan = false,
        successorRan = false;
    const cancelled = run(
        'a',
        async () => {
            cancelledRan = true;
        },
        controller.signal
    );
    const rejected = cancelled.catch(error => error);
    const successor = run('a', async () => {
        successorRan = true;
    });
    controller.abort(reason);
    expect(await rejected).toBe(reason);
    expect(cancelledRan).toBe(false);
    expect(successorRan).toBe(false);
    release.resolve();
    await Promise.all([first, successor]);
    expect(cancelledRan).toBe(false);
    expect(successorRan).toBe(true);
    expect(await run('a', async () => 'clean')).toBe('clean');
});

test('an active cancellation does not admit a successor until the active callback settles', async () => {
    const run = createKeyedSerialQueue();
    const controller = new AbortController();
    const entered = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const first = run(
        'a',
        async () => {
            entered.resolve();
            await release.promise;
        },
        controller.signal
    );
    await entered.promise;
    let ran = false;
    const next = run('a', async () => {
        ran = true;
    });
    controller.abort(new Error('cancelled'));
    await first.catch(() => undefined);
    expect(ran).toBe(false);
    release.resolve();
    await next;
    expect(ran).toBe(true);
});

test('recursive admissions reject instead of deadlocking, including cross-key cycles', async () => {
    const run = createKeyedSerialQueue();
    await expect(run('a', () => run('a', async () => 1))).rejects.toThrow('Nested queue admission');
    await expect(run('a', () => run('b', () => run('a', async () => 1)))).rejects.toThrow(
        'Nested queue admission'
    );
    expect(await run('a', async () => 1)).toBe(1);
});
