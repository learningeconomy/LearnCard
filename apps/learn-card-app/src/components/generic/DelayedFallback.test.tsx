import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DelayedFallback from './DelayedFallback';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('DelayedFallback', () => {
    it('shows nothing until the delay elapses, then calls onShow once and shows its children', () => {
        const onShow = vi.fn();
        const view = render(
            <DelayedFallback delayMs={200} onShow={onShow}>
                <span>loading</span>
            </DelayedFallback>
        );
        act(() => vi.advanceTimersByTime(199));
        expect(view.queryByText('loading')).toBeNull();
        expect(onShow).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(1));
        expect(view.getByText('loading')).toBeTruthy();
        expect(onShow).toHaveBeenCalledTimes(1);
    });

    it('never calls onShow when unmounted before the delay', () => {
        const onShow = vi.fn();
        const view = render(
            <DelayedFallback delayMs={200} onShow={onShow}>
                <span>loading</span>
            </DelayedFallback>
        );
        view.unmount();
        act(() => vi.advanceTimersByTime(500));
        expect(onShow).not.toHaveBeenCalled();
    });
});
