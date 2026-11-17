/**
 * "The first screen has painted" signal, for optional startup work that should not compete with it for the
 * network or main thread. The app marks it after the dashboard commits; work that waits on it also starts
 * after `timeoutMs` so other landing routes (login, deep links) still get it.
 */
let resolvePainted: () => void = () => {};
const painted = new Promise<void>(resolve => {
    resolvePainted = resolve;
});

export const markFirstScreenPainted = (): void => resolvePainted();

export const afterFirstScreen = (timeoutMs = 5000): Promise<void> =>
    Promise.race([painted, new Promise<void>(resolve => setTimeout(resolve, timeoutMs))]);
