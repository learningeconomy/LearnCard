import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppShellRouter } from './AppShellRouter';
import { createTestHistory, TestRouter } from '../../test-utils/testRouter';
import { AppOutlet, useViewWillEnter } from './AppOutlet';

const Page: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
    useViewWillEnter(onEnter);
    return <div className="ion-page">page</div>;
};

/** Mirrors Routes.tsx: the Switch can pin a background location under a modal route. */
const RoutesLike: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
    const location = useLocation();
    const background = location.state?.background;
    return (
        <Routes location={background || location}>
            <Route path="/wallet" element={<Page onEnter={onEnter} />} />
            <Route path="/other" element={<div>other</div>} />
        </Routes>
    );
};

describe('AppOutlet', () => {
    afterEach(() => cleanup());

    it('renders its children inside the router-outlet box', () => {
        const history = createTestHistory({ initialEntries: ['/wallet'] });
        const { container } = render(
            <TestRouter history={history}>
                <AppShellRouter>
                    <AppOutlet>
                        <div className="ion-page">child</div>
                    </AppOutlet>
                </AppShellRouter>
            </TestRouter>
        );

        expect(screen.getByText('child').parentElement).toHaveClass('app-router-outlet');
        expect(container.querySelector('.app-router-outlet > .ion-page')).not.toBeNull();
    });

    it('fires useViewWillEnter on mount and on pathname changes, like the Ionic outlet', async () => {
        const history = createTestHistory({ initialEntries: ['/wallet'] });
        const onEnter = vi.fn();
        render(
            <TestRouter history={history}>
                <AppShellRouter>
                    <AppOutlet>
                        <RoutesLike onEnter={onEnter} />
                    </AppOutlet>
                </AppShellRouter>
            </TestRouter>
        );
        expect(onEnter).toHaveBeenCalledTimes(1);

        // Search-only change: Ionic compared pathnames only.
        await act(() => history.push('/wallet?tab=earned'));
        expect(onEnter).toHaveBeenCalledTimes(1);

        // Modal route over the still-mounted background page.
        await act(() => history.push('/modal', { background: history.location }));
        expect(screen.getByText('page')).toBeInTheDocument();
        expect(onEnter).toHaveBeenCalledTimes(2);

        // Leaving unmounts the page; nothing fires for it.
        await act(() => history.push('/other'));
        expect(onEnter).toHaveBeenCalledTimes(2);

        // Re-entering mounts a fresh page.
        await act(() => history.push('/wallet'));
        expect(onEnter).toHaveBeenCalledTimes(3);
    });

    it('never fires outside the outlet (e.g. a page rendered in an app modal)', async () => {
        const history = createTestHistory({ initialEntries: ['/wallet'] });
        const onEnter = vi.fn();
        render(
            <TestRouter history={history}>
                <AppShellRouter>
                    <Page onEnter={onEnter} />
                </AppShellRouter>
            </TestRouter>
        );

        await act(() => history.push('/elsewhere'));
        expect(onEnter).not.toHaveBeenCalled();
    });
});
