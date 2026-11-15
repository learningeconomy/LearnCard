import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loaded = vi.hoisted(() => {
    let resolve!: () => void;
    const promise = new Promise<void>(r => {
        resolve = r;
    });
    return { promise, resolve };
});
vi.mock('../../pages/dashboard/DashboardPageRoute', () => ({
    whenDashboardPageLoaded: () => loaded.promise,
}));
const marks = vi.hoisted(() => ({ steps: [] as string[] }));
vi.mock('../../helpers/dashboardPathMarks', () => ({
    markDashboardPath: (step: string) => marks.steps.push(step),
    FallbackMarker: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RoutesSuspenseFallback from './RoutesSuspenseFallback';

let renders = 0;
const CountRenders: React.FC = () => {
    renders += 1;
    return <span>loader</span>;
};

beforeEach(() => {
    vi.useFakeTimers();
    renders = 0;
    marks.steps = [];
});
afterEach(() => vi.useRealTimers());

describe('RoutesSuspenseFallback', () => {
    it('stays blank for 200 ms, re-renders once after the dashboard chunk loads, and shows the loader after 200 ms', async () => {
        const view = render(
            <RoutesSuspenseFallback>
                <CountRenders />
            </RoutesSuspenseFallback>
        );
        expect(view.queryByText('loader')).toBeNull();

        await act(async () => {
            loaded.resolve();
            await loaded.promise;
        });
        act(() => vi.advanceTimersByTime(0));
        expect(marks.steps).toEqual(['routes_fallback_nudge']);
        expect(view.queryByText('loader')).toBeNull();

        act(() => vi.advanceTimersByTime(200));
        expect(view.getByText('loader')).toBeTruthy();
        expect(marks.steps).toEqual(['routes_fallback_nudge', 'routes_fallback_timer']);
        expect(renders).toBe(1);
    });

    it('does nothing after unmounting', async () => {
        const view = render(
            <RoutesSuspenseFallback>
                <CountRenders />
            </RoutesSuspenseFallback>
        );
        view.unmount();
        await act(async () => {
            await loaded.promise;
        });
        act(() => vi.advanceTimersByTime(500));
        expect(marks.steps).toEqual([]);
    });
});
