import { expect, test } from 'bun:test';
import { settleAll } from './settleAll';

test('preserves concurrent tuple results and input order', async () => {
    const first = Promise.withResolvers<number>();
    const second = Promise.withResolvers<string>();
    const pending = settleAll([first.promise, second.promise] as const);
    second.resolve('second');
    first.resolve(1);
    expect(await pending).toEqual([1, 'second']);
});

test('drains siblings and preserves first temporal rejection rather than input order', async () => {
    const first = Promise.withResolvers<never>();
    const second = Promise.withResolvers<never>();
    const error = new Error('synthetic first rejection');
    let settled = false;
    const pending = settleAll([first.promise, second.promise]);
    const completed = pending.catch(() => {
        settled = true;
    });
    second.reject(error);
    await Bun.sleep(1);
    expect(settled).toBe(false);
    first.reject(new Error('synthetic later rejection'));
    await completed;
    await expect(pending).rejects.toBe(error);
});

test('preserves non-Error rejection and waits for cancellation cleanup', async () => {
    const sibling = Promise.withResolvers<void>();
    const pending = settleAll([Promise.reject(undefined), sibling.promise]);
    let settled = false;
    const completed = pending.catch(() => {
        settled = true;
    });
    await Bun.sleep(1);
    expect(settled).toBe(false);
    sibling.reject(new DOMException('synthetic cancellation', 'AbortError'));
    await completed;
    await expect(pending).rejects.toBeUndefined();
});
