import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppSplitPane } from './AppSplitPane';
import { AppMenu } from './AppMenu';
import { AppMenuToggle } from './AppMenuToggle';
import { appMenuController } from './appMenuController';

const setPaneVisible = (visible: boolean): void => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: query === '(min-width: 992px)' ? visible : false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
};

const Shell: React.FC<{ withMenu?: boolean }> = ({ withMenu = true }) => (
    <AppSplitPane contentId="main" className="side-menu-split-pane-container-visible">
        {withMenu && (
            <AppMenu contentId="main" swipeGesture menuId="appSideMenu" disabled={false}>
                <AppMenuToggle autoHide={false}>
                    <button type="button">Menu link</button>
                </AppMenuToggle>
            </AppMenu>
        )}
        <div id="main" className="w-full">
            <AppMenuToggle menu="appSideMenu">
                <button type="button">Open menu</button>
            </AppMenuToggle>
        </div>
    </AppSplitPane>
);

const menuHost = (): HTMLElement => document.querySelector('[data-app-menu]') as HTMLElement;
const main = (): HTMLElement => document.getElementById('main') as HTMLElement;
const openButton = (): HTMLElement =>
    screen.getByRole('button', { name: 'Open menu', hidden: true });
const menuLink = (): HTMLElement => screen.getByRole('button', { name: 'Menu link', hidden: true });

/** Open/close settle after an (instant in jsdom) animation promise, so flush inside act. */
const settle = async (action: () => void): Promise<void> => {
    await act(async () => {
        action();
    });
};
const click = (element: Element): Promise<void> => settle(() => fireEvent.click(element));

describe('AppMenu', () => {
    beforeEach(() => setPaneVisible(false));
    afterEach(() => {
        cleanup();
        document.body.className = '';
    });

    it('opens from a toggle and marks the main content like ion-menu', async () => {
        render(<Shell />);

        expect(main()).toHaveClass('menu-content', 'menu-content-overlay', 'split-pane-main');
        expect(menuHost()).not.toHaveClass('show-menu');
        expect(menuHost()).toHaveAttribute('role', 'navigation');
        expect(menuHost()).toHaveAttribute('aria-label', 'menu');

        await click(openButton());

        expect(appMenuController.getState().isOpen).toBe(true);
        expect(menuHost()).toHaveClass('show-menu');
        expect(menuHost().querySelector('.app-menu-backdrop')).toHaveClass('show-backdrop');
        expect(main()).toHaveClass('menu-content-open');
        expect(main()).toHaveAttribute('aria-hidden', 'true');
        expect(document.body).toHaveClass('app-menu-no-scroll');
        expect(document.activeElement).toBe(menuHost());
    });

    it('toggles closed from a toggle inside the menu', async () => {
        render(<Shell />);
        await click(openButton());

        await click(menuLink());

        expect(appMenuController.getState().isOpen).toBe(false);
        expect(menuHost()).not.toHaveClass('show-menu');
        expect(main()).not.toHaveClass('menu-content-open');
        expect(main()).not.toHaveAttribute('aria-hidden');
        expect(document.body).not.toHaveClass('app-menu-no-scroll');
        // Ionic never removes the base content classes.
        expect(main()).toHaveClass('menu-content', 'menu-content-overlay');
    });

    it('closes on Escape', async () => {
        render(<Shell />);
        await click(openButton());

        await settle(() => fireEvent.keyDown(menuHost(), { key: 'Escape' }));

        expect(appMenuController.getState().isOpen).toBe(false);
    });

    it('closes on a backdrop click but not on a click inside the drawer', async () => {
        render(<Shell />);
        await click(openButton());

        await click(menuHost().querySelector('.app-menu-inner')!);
        expect(appMenuController.getState().isOpen).toBe(true);

        await click(menuHost().querySelector('.app-menu-backdrop')!);
        expect(appMenuController.getState().isOpen).toBe(false);
    });

    it('docks in the split pane, hides auto-hide toggles and ignores toggling', async () => {
        setPaneVisible(true);
        render(<Shell />);

        expect(document.querySelector('[data-app-split-pane]')).toHaveClass(
            'split-pane-visible',
            'split-pane-md'
        );
        expect(menuHost()).toHaveClass('menu-pane-visible', 'split-pane-side');

        const autoHide = openButton().parentElement as HTMLElement;
        expect(autoHide).toHaveClass('menu-toggle-hidden');
        expect(autoHide).toHaveAttribute('aria-hidden', 'true');

        await click(openButton());
        await click(menuLink());
        expect(appMenuController.getState().isOpen).toBe(false);
        expect(menuHost()).not.toHaveClass('show-menu');
    });

    it('shows auto-hide toggles only while a menu can be toggled', async () => {
        const { rerender } = render(<Shell withMenu={false} />);
        const toggle = (): HTMLElement => openButton().parentElement as HTMLElement;

        expect(toggle()).toHaveClass('menu-toggle-hidden');
        await click(openButton());
        expect(appMenuController.getState()).toMatchObject({ registered: false, isOpen: false });

        rerender(<Shell />);
        expect(toggle()).not.toHaveClass('menu-toggle-hidden');
        expect(toggle()).not.toHaveAttribute('aria-hidden');
    });

    it('closes and unregisters when unmounted while open', async () => {
        const { rerender } = render(<Shell />);
        await click(openButton());

        act(() => rerender(<Shell withMenu={false} />));

        expect(appMenuController.getState()).toMatchObject({ registered: false, isOpen: false });
        expect(main()).not.toHaveClass('menu-content-open');
        expect(document.body).not.toHaveClass('app-menu-no-scroll');
    });

    it('opens with an edge swipe and not with a swipe from the middle', async () => {
        render(<Shell />);

        await settle(() => {
            fireEvent.touchStart(document, { touches: [{ clientX: 200, clientY: 300 }] });
            fireEvent.touchMove(document, { touches: [{ clientX: 300, clientY: 300 }] });
            fireEvent.touchEnd(document, { changedTouches: [{ clientX: 300, clientY: 300 }] });
        });
        expect(appMenuController.getState().isOpen).toBe(false);

        await settle(() => {
            fireEvent.touchStart(document, { touches: [{ clientX: 10, clientY: 300 }] });
            fireEvent.touchMove(document, { touches: [{ clientX: 40, clientY: 302 }] });
            fireEvent.touchMove(document, { touches: [{ clientX: 220, clientY: 305 }] });
            fireEvent.touchEnd(document, { changedTouches: [{ clientX: 220, clientY: 305 }] });
        });
        expect(appMenuController.getState().isOpen).toBe(true);
    });
});
