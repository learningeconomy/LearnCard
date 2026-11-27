import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { AppToolbar } from './AppToolbar';

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
    vi.unstubAllGlobals();
});

describe('AppHeader', () => {
    it('is the banner landmark with ion-header classes', () => {
        render(
            <AppHeader className="ion-no-border">
                <AppToolbar />
            </AppHeader>
        );
        const header = screen.getByRole('banner');

        expect(header).toHaveClass(
            'app-header',
            'md',
            'app-header-md',
            'app-header-collapse-none',
            'ion-no-border'
        );
    });

    it('drops the landmark inside a side menu', () => {
        render(
            <div className="app-menu">
                <AppHeader data-testid="header" />
            </div>
        );

        expect(screen.getByTestId('header').getAttribute('role')).toBe('none');
    });

    it('renders the blur layer only for a translucent iOS header', () => {
        document.documentElement.setAttribute('mode', 'ios');
        const { rerender } = render(<AppHeader translucent />);
        const header = screen.getByRole('banner');

        expect(header).toHaveClass('app-header-translucent', 'app-header-translucent-ios');
        expect(header.firstElementChild).toHaveClass('app-header-background');

        rerender(<AppHeader translucent mode="md" />);
        expect(header.querySelector('.app-header-background')).toBeNull();
    });

    it('fades the toolbar background with the content scroll (collapse="fade", iOS)', async () => {
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        });
        render(
            <div className="ion-page">
                <AppHeader collapse="fade" mode="ios" />
                <div className="ion-content-scroll-host" data-testid="scroll" />
            </div>
        );
        const header = screen.getByRole('banner');
        const scroll = screen.getByTestId('scroll');
        await act(async () => undefined);

        expect(header.style.getPropertyValue('--opacity-scale')).toBe('0');
        scroll.scrollTop = 5;
        act(() => {
            scroll.dispatchEvent(new Event('scroll'));
        });
        expect(header.style.getPropertyValue('--opacity-scale')).toBe('0.5');
    });
});

describe('AppFooter', () => {
    it('is the contentinfo landmark, marked for the keyboard focus manager', () => {
        render(<AppFooter className="bg-white" />);
        const footer = screen.getByRole('contentinfo');

        expect(footer).toHaveClass('app-footer', 'md', 'app-footer-md', 'bg-white');
        expect(footer).toHaveClass('app-footer-toolbar-padding');
        expect(footer.hasAttribute('data-app-footer')).toBe(true);
        expect(footer.hasAttribute('data-keyboard-footer')).toBe(true);
    });

    it('drops the bottom inset padding while the native keyboard is up', async () => {
        vi.stubGlobal('Capacitor', {
            isPluginAvailable: () => true,
            Plugins: { Keyboard: { getResizeMode: async () => ({ mode: 'none' }) } },
        });
        render(<AppFooter />);
        const footer = screen.getByRole('contentinfo');
        await act(async () => undefined);

        act(() => {
            window.dispatchEvent(new Event('keyboardWillShow'));
        });
        expect(footer).not.toHaveClass('app-footer-toolbar-padding');

        act(() => {
            window.dispatchEvent(new Event('keyboardWillHide'));
        });
        expect(footer).toHaveClass('app-footer-toolbar-padding');
    });

    it('keeps a className a caller wrote directly, as on the ion-footer element', async () => {
        render(<AppFooter />);
        const footer = screen.getByRole('contentinfo');
        await act(async () => undefined);

        footer.className = 'hidden';
        act(() => {
            window.dispatchEvent(new Event('keyboardWillShow'));
        });

        expect(footer.className).toBe('hidden');
    });
});
