import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryHistory, type MemoryHistory } from 'history';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppShellRouter } from '../app-shell/AppShellRouter';
import { AppBackButton } from './AppBackButton';
import { AppToolbar } from './AppToolbar';

const renderAt = (history: MemoryHistory) =>
    render(
        <AppShellRouter history={history}>
            <AppBackButton defaultHref="/launchpad" className="cli-back-btn" />
        </AppShellRouter>
    );

const clickBack = async (): Promise<void> => {
    await act(async () => {
        fireEvent.click(screen.getByRole('button'));
    });
};

describe('AppBackButton', () => {
    const startHref = window.location.href;
    afterEach(() => {
        cleanup();
        document.documentElement.removeAttribute('mode');
        // IonBackButton's fallback without IonReactRouter hard-navigated; that must never run.
        expect(window.location.href).toBe(startHref);
    });

    it('goes back when the page was opened from an in-app page', async () => {
        const history = createMemoryHistory({ initialEntries: ['/dashboard'] });
        renderAt(history);
        act(() => history.push('/cli'));
        const length = history.length;

        await clickBack();

        expect(history.location.pathname).toBe('/dashboard');
        expect(history.action).toBe('POP');
        expect(history.length).toBe(length);
    });

    it('replaces with defaultHref on a cold load', async () => {
        const history = createMemoryHistory({ initialEntries: ['/cli'] });
        renderAt(history);

        await clickBack();

        expect(history.location.pathname).toBe('/launchpad');
        expect(history.action).toBe('REPLACE');
        expect(history.length).toBe(1);
    });

    it('returns to the pushing page when the page replaced an intermediate entry', async () => {
        const history = createMemoryHistory({ initialEntries: ['/launchpad'] });
        renderAt(history);
        act(() => history.push('/apps/dev?x=1'));
        act(() => history.replace('/cli'));

        await clickBack();

        expect(history.location.pathname).toBe('/launchpad');
        expect(history.action).toBe('REPLACE');
    });

    it('is shown with a defaultHref and keeps call-site classes on the host', () => {
        renderAt(createMemoryHistory({ initialEntries: ['/cli'] }));
        const host = screen.getByRole('button').parentElement as HTMLElement;

        expect(host).toHaveClass('app-back-button', 'app-show-back-button', 'cli-back-btn');
    });

    it('is hidden without a defaultHref, like ion-back-button', () => {
        render(<AppBackButton />);
        const host = screen.getByRole('button', { hidden: true }).parentElement as HTMLElement;

        expect(host).not.toHaveClass('app-show-back-button');
    });

    it('is icon-only in md, labelled "back"', () => {
        render(<AppBackButton defaultHref="/" onClick={() => undefined} />);
        const button = screen.getByRole('button', { name: 'back' });

        expect(button.parentElement).toHaveClass(
            'app-back-button-md',
            'app-back-button-has-icon-only'
        );
        expect(button.querySelector('.app-icon')).not.toBeNull();
        expect(button.querySelector('.app-back-button-text')).toBeNull();
        expect(button.querySelector('.app-ripple-effect')).not.toBeNull();
    });

    it('shows the "Back" label in iOS mode, without a ripple', () => {
        document.documentElement.setAttribute('mode', 'ios');
        render(<AppBackButton defaultHref="/" onClick={() => undefined} />);
        const button = screen.getByRole('button', { name: 'Back' });

        expect(button.querySelector('.app-back-button-text')).toHaveTextContent('Back');
        expect(button.querySelector('.app-ripple-effect')).toBeNull();
    });

    it('prefers an explicit aria-label and text', () => {
        render(
            <AppBackButton
                defaultHref="/"
                text="Home"
                aria-label="Go home"
                onClick={() => undefined}
            />
        );

        expect(screen.getByRole('button', { name: 'Go home' })).toHaveTextContent('Home');
    });

    it('uses an onClick prop instead of navigating', () => {
        const onClick = vi.fn();
        render(<AppBackButton defaultHref="/elsewhere" onClick={onClick} />);

        fireEvent.click(screen.getByRole('button'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('knows when it sits in a toolbar, and in a colored one', () => {
        render(
            <AppToolbar color="primary">
                <AppBackButton defaultHref="/" onClick={() => undefined} />
            </AppToolbar>
        );
        const host = screen.getByRole('button').parentElement as HTMLElement;

        expect(host).toHaveClass('app-in-toolbar', 'app-in-toolbar-color');
    });

    it('disables the native button', () => {
        render(<AppBackButton defaultHref="/" disabled onClick={() => undefined} />);
        const button = screen.getByRole('button');

        expect(button).toBeDisabled();
        expect(button.parentElement).toHaveClass('app-back-button-disabled');
    });
});
