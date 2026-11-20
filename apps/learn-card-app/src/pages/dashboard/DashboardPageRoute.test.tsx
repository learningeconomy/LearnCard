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
});
