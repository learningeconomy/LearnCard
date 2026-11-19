import React, { Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', async () => {
    const { lazyWithRetry } = await import('learn-card-base/helpers/lazyWithRetry');
    return { lazyWithRetry };
});
const marks = vi.hoisted(() => ({ steps: [] as string[] }));
vi.mock('../../helpers/dashboardPathMarks', () => ({
    markDashboardPath: (step: string) => marks.steps.push(step),
}));

const warm = vi.hoisted(() => ({
    prefetch: vi.fn(async (): Promise<boolean> => true),
}));
vi.mock('../../helpers/prefetchChunk', () => ({
    prefetchChunk: (...args: unknown[]) => warm.prefetch(...args),
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
        it('imports after a successful fetch warm so page_direct fires on the next mount (LC-2415)', async () => {
            warm.prefetch.mockResolvedValue(true);
            const { DashboardPageRoute, warmDashboardPage } = await load();

            await warmDashboardPage();

            expect(warm.prefetch).toHaveBeenCalledWith('dashboard');
            renderRoute(DashboardPageRoute);

            expect(screen.getByText('dashboard')).toBeTruthy();
            expect(screen.queryByText('fallback')).toBeNull();
            // Measured: cold-boot-style mount after a successful warm hits page_direct.
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
