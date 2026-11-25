import React, { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The real lazyWithRetry is React.lazy plus stale-chunk retries; React.lazy is what matters here.
vi.mock('learn-card-base', () => ({
    lazyWithRetry: (factory: () => Promise<{ default: React.ComponentType }>) =>
        React.lazy(factory),
}));
vi.mock('../../helpers/dashboardPathMarks', () => ({ markDashboardPath: vi.fn() }));

const routesModule = vi.hoisted(() => ({ renders: 0 }));
vi.mock('../../Routes', () => ({
    Routes: () => {
        routesModule.renders += 1;
        return <span>routes</span>;
    },
}));

const fallback = <span>fallback</span>;

const load = async () => {
    vi.resetModules();
    return import('./RoutesOutlet');
};

beforeEach(() => {
    routesModule.renders = 0;
});

describe('RoutesOutlet', () => {
    it('mounts Routes without suspending once the module is preloaded', async () => {
        const { RoutesOutlet, preloadRoutes } = await load();
        await preloadRoutes();

        render(
            <Suspense fallback={fallback}>
                <RoutesOutlet />
            </Suspense>
        );

        // Synchronous first commit: no fallback, Routes already on screen.
        expect(screen.getByText('routes')).toBeTruthy();
        expect(screen.queryByText('fallback')).toBeNull();
    });

    it('falls back to the lazy path (suspending) when the module has not loaded yet', async () => {
        const { RoutesOutlet } = await load();

        render(
            <Suspense fallback={fallback}>
                <RoutesOutlet />
            </Suspense>
        );

        expect(screen.getByText('fallback')).toBeTruthy();
        expect(await screen.findByText('routes')).toBeTruthy();
    });

    it('keeps one element type per mount, so a preload landing mid-mount does not remount Routes', async () => {
        const { RoutesOutlet, preloadRoutes } = await load();
        const view = render(
            <Suspense fallback={fallback}>
                <RoutesOutlet />
            </Suspense>
        );
        expect(await screen.findByText('routes')).toBeTruthy();
        const node = screen.getByText('routes');

        await act(async () => {
            await preloadRoutes();
        });
        view.rerender(
            <Suspense fallback={fallback}>
                <RoutesOutlet />
            </Suspense>
        );

        // Same DOM node: the subtree was updated, not unmounted and remounted.
        expect(screen.getByText('routes')).toBe(node);
    });
});
