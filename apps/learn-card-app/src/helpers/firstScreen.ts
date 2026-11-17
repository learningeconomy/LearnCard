/**
 * "The first screen has painted" signal, for optional work (route-chunk prefetch) that should not
 * compete with the landing screen for bandwidth. On a slow link the idle route prefetch otherwise
 * starts as soon as auth restores and downloads ~100 chunks alongside the wallet's WASM and the
 * dashboard chunk, which the first dashboard paint is waiting on.
 *
 * DashboardPage marks it after its first commit. Work that waits on it also starts `timeoutMs` after
 * it asked, so other landing routes (deep links, login) still get it.
 */
let resolvePainted: () => void = () => {};
const painted = new Promise<void>(resolve => {
    resolvePainted = resolve;
});

export const markFirstScreenPainted = (): void => resolvePainted();

export const afterFirstScreen = (timeoutMs = 10_000): Promise<void> =>
    Promise.race([painted, new Promise<void>(resolve => setTimeout(resolve, timeoutMs))]);
