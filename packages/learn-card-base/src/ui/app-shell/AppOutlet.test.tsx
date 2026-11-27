import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryHistory, type Location } from 'history';
import { Route, Switch, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppShellRouter } from './AppShellRouter';
import { AppOutlet, useViewWillEnter } from './AppOutlet';

const Page: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
    useViewWillEnter(onEnter);
    return <div className="ion-page">page</div>;
};

/** Mirrors Routes.tsx: the Switch can pin a background location under a modal route. */
const RoutesLike: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
    const location = useLocation<{ background?: Location }>();
    const background = location.state?.background;
    return (
        <Switch location={background || location}>
            <Route path="/wallet" render={() => <Page onEnter={onEnter} />} />
            <Route path="/other" render={() => <div>other</div>} />
        </Switch>
    );
};

describe('AppOutlet', () => {
    afterEach(() => cleanup());

    it('renders its children inside the router-outlet box', () => {
        const history = createMemoryHistory({ initialEntries: ['/wallet'] });
        const { container } = render(
            <AppShellRouter history={history}>
                <AppOutlet>
                    <div className="ion-page">child</div>
                </AppOutlet>
            </AppShellRouter>
        );

        expect(screen.getByText('child').parentElement).toHaveClass('app-router-outlet');
        expect(container.querySelector('.app-router-outlet > .ion-page')).not.toBeNull();
    });

    it('fires useViewWillEnter on mount and on pathname changes, like the Ionic outlet', () => {
        const history = createMemoryHistory({ initialEntries: ['/wallet'] });
        const onEnter = vi.fn();
        render(
            <AppShellRouter history={history}>
                <AppOutlet>
                    <RoutesLike onEnter={onEnter} />
                </AppOutlet>
            </AppShellRouter>
        );
        expect(onEnter).toHaveBeenCalledTimes(1);

        // Search-only change: Ionic compared pathnames only.
        act(() => history.push('/wallet?tab=earned'));
        expect(onEnter).toHaveBeenCalledTimes(1);

        // Modal route over the still-mounted background page.
        act(() => history.push('/modal', { background: history.location }));
        expect(screen.getByText('page')).toBeInTheDocument();
        expect(onEnter).toHaveBeenCalledTimes(2);

        // Leaving unmounts the page; nothing fires for it.
        act(() => history.push('/other'));
        expect(onEnter).toHaveBeenCalledTimes(2);

        // Re-entering mounts a fresh page.
        act(() => history.push('/wallet'));
        expect(onEnter).toHaveBeenCalledTimes(3);
    });

    it('never fires outside the outlet (e.g. a page rendered in an app modal)', () => {
        const history = createMemoryHistory({ initialEntries: ['/wallet'] });
        const onEnter = vi.fn();
        render(
            <AppShellRouter history={history}>
                <Page onEnter={onEnter} />
            </AppShellRouter>
        );

        act(() => history.push('/elsewhere'));
        expect(onEnter).not.toHaveBeenCalled();
    });
});
