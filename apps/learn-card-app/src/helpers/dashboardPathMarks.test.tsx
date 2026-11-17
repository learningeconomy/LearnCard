import React, { Suspense } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const debug = vi.hoisted(() => ({ enabled: true }));
vi.mock('../config/environment', () => ({ isDebugEnvironmentEnabled: () => debug.enabled }));

import {
    DASHBOARD_PATH_MARK_PREFIX,
    FallbackMarker,
    markDashboardPath,
    resetDashboardPathMarks,
} from './dashboardPathMarks';

const marks = () =>
    performance
        .getEntriesByType('mark')
        .map(entry => entry.name)
        .filter(name => name.startsWith(DASHBOARD_PATH_MARK_PREFIX))
        .map(name => name.slice(DASHBOARD_PATH_MARK_PREFIX.length));

beforeEach(() => {
    debug.enabled = true;
    resetDashboardPathMarks();
    performance.clearMarks();
});
afterEach(() => performance.clearMarks());

describe('markDashboardPath', () => {
    it('marks a step once by default and every time when asked', () => {
        markDashboardPath('routes_render');
        markDashboardPath('routes_render');
        markDashboardPath('root_fallback_shown', true);
        markDashboardPath('root_fallback_shown', true);
        expect(marks()).toEqual(['routes_render', 'root_fallback_shown', 'root_fallback_shown']);
    });

    it('does nothing outside debug environments', () => {
        debug.enabled = false;
        markDashboardPath('routes_render');
        render(
            <FallbackMarker boundary="root">
                <span>x</span>
            </FallbackMarker>
        );
        expect(marks()).toEqual([]);
    });
});

describe('FallbackMarker', () => {
    it('renders its children unchanged and marks when a Suspense fallback shows and hides', async () => {
        let resolve!: () => void;
        const ready = new Promise<void>(r => {
            resolve = r;
        });
        const Lazy = React.lazy(() => ready.then(() => ({ default: () => <span>content</span> })));
        const view = render(
            <Suspense
                fallback={
                    <FallbackMarker boundary="routes">
                        <span>loading</span>
                    </FallbackMarker>
                }
            >
                <Lazy />
            </Suspense>
        );
        expect(view.getByText('loading')).toBeTruthy();
        expect(marks()).toEqual(['routes_fallback_shown']);

        await act(async () => {
            resolve();
            await ready;
        });
        expect(await view.findByText('content')).toBeTruthy();
        expect(marks()).toEqual(['routes_fallback_shown', 'routes_fallback_hidden']);
    });
});
