import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createMemoryHistory, type MemoryHistory } from 'history';
import { afterEach, describe, expect, it } from 'vitest';

import { AppShellRouter } from '../../components/app-shell/AppShellRouter';
import { DevCliBackButton } from './DevCliBackButton';

const renderAt = (history: MemoryHistory) =>
    render(
        <AppShellRouter history={history}>
            <DevCliBackButton defaultHref="/launchpad" className="cli-back-btn" />
        </AppShellRouter>
    );

const clickBack = async (container: HTMLElement): Promise<void> => {
    const button = container.querySelector('ion-back-button');
    expect(button).not.toBeNull();
    await act(async () => {
        fireEvent.click(button!);
    });
};

describe('DevCliBackButton', () => {
    const startHref = window.location.href;
    afterEach(() => {
        cleanup();
        // The IonBackButton fallback would hard-navigate; it must never run.
        expect(window.location.href).toBe(startHref);
    });

    it('goes back when the CLI was opened from an in-app page', async () => {
        const history = createMemoryHistory({ initialEntries: ['/dashboard'] });
        const { container } = renderAt(history);
        act(() => history.push('/cli'));
        const length = history.length;

        await clickBack(container);

        expect(history.location.pathname).toBe('/dashboard');
        expect(history.action).toBe('POP');
        expect(history.length).toBe(length);
    });

    it('replaces with defaultHref on a cold load of /cli', async () => {
        const history = createMemoryHistory({ initialEntries: ['/cli'] });
        const { container } = renderAt(history);

        await clickBack(container);

        expect(history.location.pathname).toBe('/launchpad');
        expect(history.action).toBe('REPLACE');
        expect(history.length).toBe(1);
    });

    it('returns to the pushing page when /cli replaced an intermediate entry', async () => {
        const history = createMemoryHistory({ initialEntries: ['/launchpad'] });
        const { container } = renderAt(history);
        act(() => history.push('/apps/dev?x=1'));
        act(() => history.replace('/cli'));

        await clickBack(container);

        expect(history.location.pathname).toBe('/launchpad');
        expect(history.action).toBe('REPLACE');
    });

    it('keeps the IonBackButton look (always shown with defaultHref)', () => {
        const history = createMemoryHistory({ initialEntries: ['/cli'] });
        const { container } = renderAt(history);

        const button = container.querySelector('ion-back-button');
        expect(button).toHaveClass('cli-back-btn');
        expect(button).toHaveAttribute('default-href', '/launchpad');
    });
});
