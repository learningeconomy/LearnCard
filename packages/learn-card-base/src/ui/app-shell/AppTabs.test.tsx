import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppShellRouter, resetInAppHistory } from './AppShellRouter';
import { createTestHistory, TestRouter, type TestHistory } from '../../test-utils/testRouter';
import { AppTabs, AppTabBar, AppTabButton } from './AppTabs';
import { AppOutlet } from './AppOutlet';
import { AppSplitPane } from './AppSplitPane';
import { AppMenu } from './AppMenu';
import { AppMenuToggle } from './AppMenuToggle';
import { appMenuController } from './appMenuController';

const LINKS = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard' },
    { id: 'launchpad', path: '/launchpad', label: 'Apps' },
];

const Shell: React.FC<{ history: TestHistory; showBar?: boolean }> = ({
    history,
    showBar = true,
}) => (
    <TestRouter history={history}>
        <AppShellRouter>
            <AppSplitPane contentId="main">
                <AppMenu contentId="main" menuId="appSideMenu">
                    <p>Menu</p>
                </AppMenu>
                <div id="main">
                    <AppTabs className="nav-color">
                        <AppOutlet>
                            <div className="ion-page">page</div>
                        </AppOutlet>
                        {showBar ? (
                            <AppTabBar className="lc-footer-nav" style={{ paddingBottom: '15px' }}>
                                <AppTabButton
                                    tab="/"
                                    href="#"
                                    className="mobile-nav-hamburger-button"
                                    aria-label="Open menu"
                                >
                                    <AppMenuToggle menu="appSideMenu">
                                        <span data-testid="burger">≡</span>
                                    </AppMenuToggle>
                                </AppTabButton>
                                {LINKS.map(link => (
                                    <AppTabButton key={link.id} tab={link.id} href={link.path}>
                                        {React.createElement('ion-label', null, link.label)}
                                    </AppTabButton>
                                ))}
                            </AppTabBar>
                        ) : null}
                    </AppTabs>
                </div>
            </AppSplitPane>
        </AppShellRouter>
    </TestRouter>
);

const tab = (name: string): HTMLElement => screen.getByRole('tab', { name });
const url = (history: TestHistory): string =>
    `${history.location.pathname}${history.location.search}${history.location.hash}`;
const press = async (element: Element): Promise<void> => {
    await act(async () => {
        fireEvent.click(element);
    });
};

describe('AppTabs', () => {
    beforeEach(() => resetInAppHistory());
    afterEach(() => cleanup());

    it('renders Ionic’s tabs layout and tab semantics', () => {
        const history = createTestHistory({ initialEntries: ['/dashboard'] });
        const { container } = render(<Shell history={history} />);

        const page = container.querySelector('#main > .ion-page')!;
        expect(page).toHaveClass('nav-color');
        expect(
            page.querySelector(
                ':scope > .app-tabs.nav-color > .app-tabs-inner > .app-router-outlet'
            )
        ).not.toBeNull();
        expect(
            page.querySelector(':scope > .app-tabs > .app-tabs-inner + .app-tab-bar')
        ).not.toBeNull();
        expect(screen.getByRole('tablist')).toHaveClass('app-tab-bar', 'lc-footer-nav', 'md');
        expect(screen.getByRole('tablist')).toHaveStyle({ paddingBottom: '15px' });
        expect(tab('Dashboard')).toHaveAttribute('aria-selected', 'true');
        expect(tab('Dashboard').closest('.app-tab-button')).toHaveClass(
            'tab-selected',
            'tab-has-label-only'
        );
        expect(tab('Apps')).not.toHaveAttribute('aria-selected');
        expect(tab('Apps')).toHaveAttribute('href', '/launchpad');
    });

    it('navigates with history.push and remembers the last path inside each tab', async () => {
        const history = createTestHistory({ initialEntries: ['/dashboard'] });
        render(<Shell history={history} />);

        await press(tab('Apps'));
        expect(url(history)).toBe('/launchpad');
        expect(history.action).toBe('PUSH');
        expect(tab('Apps')).toHaveAttribute('aria-selected', 'true');

        await act(() => history.push('/launchpad/browse?q=1'));
        await press(tab('Dashboard'));
        expect(url(history)).toBe('/dashboard');

        expect(tab('Apps')).toHaveAttribute('href', '/launchpad/browse?q=1');
        await press(tab('Apps'));
        expect(url(history)).toBe('/launchpad/browse?q=1');
    });

    it('returns to the tab root when the active tab is tapped again', async () => {
        const history = createTestHistory({ initialEntries: ['/launchpad/browse'] });
        render(<Shell history={history} />);
        const length = history.entries.length;

        await press(tab('Apps'));
        expect(url(history)).toBe('/launchpad');
        expect(history.entries.length).toBe(length + 1);

        await press(tab('Apps'));
        expect(url(history)).toBe('/launchpad');
        expect(history.entries.length).toBe(length + 1);
    });

    it('keeps tab memory while the bar is hidden', async () => {
        const history = createTestHistory({ initialEntries: ['/launchpad'] });
        const { rerender } = render(<Shell history={history} />);
        await act(() => history.push('/launchpad/browse'));

        rerender(<Shell history={history} showBar={false} />);
        expect(screen.queryByRole('tablist')).toBeNull();
        await act(() => history.push('/dashboard'));
        rerender(<Shell history={history} />);

        await press(tab('Apps'));
        expect(url(history)).toBe('/launchpad/browse');
    });

    it('hamburger toggles the menu and, like IonTabButton href="#", pushes the bare pathname', async () => {
        const history = createTestHistory({ initialEntries: ['/launchpad?x=1#h'] });
        render(<Shell history={history} />);
        const length = history.entries.length;

        await press(screen.getByTestId('burger'));

        expect(appMenuController.getState().isOpen).toBe(true);
        expect(url(history)).toBe('/launchpad');
        expect(history.action).toBe('PUSH');
        expect(history.entries.length).toBe(length + 1);
        // #main is aria-hidden while the drawer is open.
        expect(screen.getByRole('tab', { name: 'Open menu', hidden: true })).not.toHaveAttribute(
            'aria-selected'
        );
    });

    it('selects on Space like ion-tab-button', async () => {
        const history = createTestHistory({ initialEntries: ['/dashboard'] });
        render(<Shell history={history} />);

        await act(async () => {
            fireEvent.keyUp(tab('Apps'), { key: ' ' });
        });
        expect(url(history)).toBe('/launchpad');
    });

    it('hides the bar while the native keyboard is open', async () => {
        const history = createTestHistory({ initialEntries: ['/dashboard'] });
        render(<Shell history={history} />);
        // Listeners attach after the (absent) Keyboard plugin's resize mode resolves.
        await act(async () => undefined);

        act(() => {
            window.dispatchEvent(new Event('keyboardWillShow'));
        });
        expect(screen.getByRole('tablist', { hidden: true })).toHaveClass('tab-bar-hidden');
        expect(screen.getByRole('tablist', { hidden: true })).toHaveAttribute(
            'aria-hidden',
            'true'
        );

        act(() => {
            window.dispatchEvent(new Event('keyboardWillHide'));
        });
        expect(screen.getByRole('tablist')).not.toHaveClass('tab-bar-hidden');
    });
});

describe('fullscreen content under the tab bar', () => {
    afterEach(cleanup);

    it('marks only fullscreen ion-content inside the outlet, like ion-tabs measured them', async () => {
        const history = createTestHistory({ initialEntries: ['/dashboard'] });
        const FullscreenContent: React.FC<{ fullscreen: boolean; id: string }> = ({
            fullscreen,
            id,
        }) => {
            const ref = React.useRef<HTMLElement>(null);
            React.useLayoutEffect(() => {
                if (ref.current)
                    (ref.current as HTMLElement & { fullscreen?: boolean }).fullscreen = fullscreen;
            }, [fullscreen]);
            return React.createElement('ion-content', { ref, 'data-testid': id });
        };

        render(
            <TestRouter history={history}>
                <AppShellRouter>
                    <AppTabs>
                        <AppOutlet>
                            <FullscreenContent fullscreen id="full" />
                            <FullscreenContent fullscreen={false} id="plain" />
                        </AppOutlet>
                    </AppTabs>
                </AppShellRouter>
            </TestRouter>
        );
        await act(async () => {
            await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        });

        // Children set `fullscreen` in their own layout effects, after the parent's first pass;
        // the mutation observer pass picks them up on the next frame when they're added later.
        // Here they mount with the parent, so re-trigger a mutation to exercise that path.
        await act(async () => {
            screen.getByTestId('plain').appendChild(document.createElement('span'));
            await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        });

        expect(screen.getByTestId('full').classList).toContain('app-tabs-fullscreen-content');
        expect(screen.getByTestId('plain').classList).not.toContain('app-tabs-fullscreen-content');
        const tabs = document.querySelector('[data-app-tabs]') as HTMLElement;
        expect(tabs.style.getPropertyValue('--app-tab-bar-offset')).toBe('0px');
    });
});
