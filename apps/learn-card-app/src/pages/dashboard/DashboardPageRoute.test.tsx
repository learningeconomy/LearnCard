import React, { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrefetchChunkKey } from '../../helpers/prefetchChunk';

vi.mock('learn-card-base', async () => {
    const { lazyWithRetry } = await import('learn-card-base/helpers/lazyWithRetry');
    return { lazyWithRetry };
});
const marks = vi.hoisted(() => ({ steps: [] as string[] }));
vi.mock('../../helpers/dashboardPathMarks', () => ({
    markDashboardPath: (step: string) => marks.steps.push(step),
}));

const warm = vi.hoisted(() => ({
    prefetch: vi.fn(async (_key: PrefetchChunkKey): Promise<boolean> => true),
}));
vi.mock('../../helpers/prefetchChunk', () => ({
    prefetchChunk: (key: PrefetchChunkKey) => warm.prefetch(key),
}));

const page = vi.hoisted(() => ({ mounts: 0 }));
vi.mock('./DashboardPage', async () => {
    const { useEffect } = await import('react');
    const DashboardPage = () => {
        useEffect(() => {
            page.mounts += 1;
        }, []);
        return <span>dashboard</span>;
    };
    return { default: DashboardPage };
});

const fallback = <span>fallback</span>;
const load = async () => {
    vi.resetModules();
    return import('./DashboardPageRoute');
};
const renderRoute = (Route: React.FC) =>
    render(
        <Suspense fallback={fallback}>
            <Route />
        </Suspense>
    );

beforeEach(() => {
    page.mounts = 0;
    marks.steps = [];
    warm.prefetch.mockReset();
    warm.prefetch.mockResolvedValue(true);
});

describe('DashboardPageRoute', () => {
    it('mounts DashboardPage without suspending once its chunk is preloaded', async () => {
        const { DashboardPageRoute, preloadDashboardPage } = await load();
        await preloadDashboardPage();

        renderRoute(DashboardPageRoute);

        expect(screen.getByText('dashboard')).toBeTruthy();
        expect(screen.queryByText('fallback')).toBeNull();
        expect(marks.steps.filter(step => step !== 'page_route_render')).toEqual([
            'page_chunk_start',
            'page_chunk_loaded',
            'page_direct',
        ]);
        expect(marks.steps).toContain('page_route_render');
    });

    it('falls back to the lazy path (suspending) when the chunk has not loaded yet', async () => {
        const { DashboardPageRoute } = await load();

        renderRoute(DashboardPageRoute);

        expect(screen.getByText('fallback')).toBeTruthy();
        expect(await screen.findByText('dashboard')).toBeTruthy();
        // The suspended first attempt never committed, so the retry is a fresh mount.
        expect(page.mounts).toBe(1);
    });

    it('keeps one element type per mount, so a load landing mid-mount never remounts the page', async () => {
        const { DashboardPageRoute, preloadDashboardPage } = await load();
        const view = renderRoute(DashboardPageRoute);
        expect(await screen.findByText('dashboard')).toBeTruthy();

        await act(async () => {
            await preloadDashboardPage();
        });
        view.rerender(
            <Suspense fallback={fallback}>
                <DashboardPageRoute />
            </Suspense>
        );

        expect(screen.getByText('dashboard')).toBeTruthy();
        expect(page.mounts).toBe(1);
    });

    describe('warmDashboardPage', () => {
        it('fetch-warms only — does not import or prime page_direct on the next mount', async () => {
            warm.prefetch.mockResolvedValue(true);
            const { DashboardPageRoute, warmDashboardPage } = await load();

            await warmDashboardPage();

            expect(warm.prefetch).toHaveBeenCalledWith('dashboard');
            // Speculative warm must not import(); page_chunk_start stays quiet.
            expect(marks.steps).toEqual([]);

            renderRoute(DashboardPageRoute);

            // Still the lazy/Suspense path: warm alone does not set loadedDashboardPage.
            expect(screen.getByText('fallback')).toBeTruthy();
            expect(marks.steps).not.toContain('page_direct');
            expect(await screen.findByText('dashboard')).toBeTruthy();
        });

        it('page_directs after fetch warm plus confirmed-destination preload (boot / nav path)', async () => {
            warm.prefetch.mockResolvedValue(true);
            const { DashboardPageRoute, warmDashboardPage, preloadDashboardPage } = await load();

            await warmDashboardPage();
            // Confirmed destination (AppRouter under LoginLoadingPage, or ROUTE_PRELOAD): import now.
            await preloadDashboardPage();

            renderRoute(DashboardPageRoute);

            expect(screen.getByText('dashboard')).toBeTruthy();
            expect(screen.queryByText('fallback')).toBeNull();
            expect(marks.steps).toContain('page_direct');
            expect(marks.steps.filter(step => step !== 'page_route_render')).toEqual([
                'page_chunk_start',
                'page_chunk_loaded',
                'page_direct',
            ]);
        });

        it('does not import when the fetch warm fails, so a 503 cannot poison the module map', async () => {
            warm.prefetch.mockResolvedValue(false);
            const { DashboardPageRoute, warmDashboardPage } = await load();

            await warmDashboardPage();

            expect(warm.prefetch).toHaveBeenCalledWith('dashboard');
            // No import yet — page_chunk_start must not have run.
            expect(marks.steps).toEqual([]);

            renderRoute(DashboardPageRoute);

            // Still the lazy/Suspense path: warm did not prime loadedDashboardPage.
            expect(screen.getByText('fallback')).toBeTruthy();
            expect(marks.steps).not.toContain('page_direct');
            expect(await screen.findByText('dashboard')).toBeTruthy();
        });
    });
});
