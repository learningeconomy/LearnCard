import type { NavigateFunction, NavigateOptions, To } from 'react-router';

type HistoryMock = {
    push?: (to: To, state?: unknown) => unknown;
    replace?: (to: To, state?: unknown) => unknown;
    goBack?: () => unknown;
    go?: (delta: number) => unknown;
};

/**
 * A `useNavigate` mock that forwards to history-shaped spies, so a test can keep asserting push
 * versus replace: `navigate(to)` calls `push(to)`, `navigate(to, { replace: true })` calls
 * `replace(to)`, and `navigate(-1)` calls `goBack()`. `state` is passed as the second argument
 * only when set.
 */
export const navigateFromHistory = (history: HistoryMock): NavigateFunction =>
    ((to: To | number, options?: NavigateOptions) => {
        if (typeof to === 'number')
            return to === -1 && history.goBack ? history.goBack() : history.go?.(to);
        const method = options?.replace ? history.replace : history.push;
        return options?.state === undefined ? method?.(to) : method?.(to, options.state);
    }) as NavigateFunction;
