import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// initAppPlatform and getPlatforms keep module state (once per page, like Ionic), so each test
// loads a fresh copy.
const load = async () => {
    vi.resetModules();
    return import('./appPlatform');
};

const resetHtml = () => {
    const html = document.documentElement;
    html.removeAttribute('mode');
    html.className = '';
};

beforeEach(resetHtml);
afterEach(() => {
    resetHtml();
    window.history.replaceState(null, '', '/');
    vi.useRealTimers();
});

describe('initAppPlatform', () => {
    it('writes the md mode and plt-* classes for a desktop browser', async () => {
        const { initAppPlatform, getPlatforms, isPlatform } = await load();
        expect(initAppPlatform()).toBe('md');
        const html = document.documentElement;
        expect(html).toHaveAttribute('mode', 'md');
        expect(html).toHaveClass('md', 'plt-desktop');
        expect(getPlatforms()).toContain('desktop');
        expect(isPlatform('ios')).toBe(false);
    });

    it('prefers config mode, then ?ionic:mode=, then a pre-set <html mode>', async () => {
        document.documentElement.setAttribute('mode', 'md');
        window.history.replaceState(null, '', '/?ionic:mode=ios');
        expect((await load()).initAppPlatform({ mode: 'md' })).toBe('md');

        resetHtml();
        document.documentElement.setAttribute('mode', 'md');
        expect((await load()).initAppPlatform()).toBe('ios');

        resetHtml();
        window.history.replaceState(null, '', '/');
        document.documentElement.setAttribute('mode', 'ios');
        expect((await load()).initAppPlatform()).toBe('ios');
        expect(document.documentElement).toHaveClass('ios');
    });

    it('only initializes once', async () => {
        const { initAppPlatform } = await load();
        initAppPlatform({ mode: 'ios' });
        expect(initAppPlatform({ mode: 'md' })).toBe('ios');
        expect(document.documentElement).toHaveAttribute('mode', 'ios');
        expect(document.documentElement).not.toHaveClass('md');
    });

    it('marks keyboard-focused .ion-focusable elements with ion-focused, not pointer focus', async () => {
        (await load()).initAppPlatform();
        const button = Object.assign(document.createElement('button'), {
            className: 'ion-focusable',
        });
        document.body.appendChild(button);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
        button.focus();
        expect(button).toHaveClass('ion-focused');

        document.dispatchEvent(new MouseEvent('mousedown'));
        expect(button).not.toHaveClass('ion-focused');
        button.blur();
        button.focus();
        expect(button).not.toHaveClass('ion-focused');
        button.remove();
    });

    it('adds ion-activated to a pressed .ion-activatable and clears it on release', async () => {
        vi.useFakeTimers();
        (await load()).initAppPlatform();
        const button = Object.assign(document.createElement('button'), {
            className: 'ion-activatable',
        });
        document.body.appendChild(button);

        button.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        vi.advanceTimersByTime(200);
        expect(button).toHaveClass('ion-activated');

        document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
        vi.advanceTimersByTime(200);
        expect(button).not.toHaveClass('ion-activated');
        button.remove();
    });
});
