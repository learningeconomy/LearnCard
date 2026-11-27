import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppRoot } from './AppRoot';

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
});

describe('AppRoot', () => {
    it('renders the .app-root page box in the document mode', () => {
        document.documentElement.setAttribute('mode', 'ios');
        render(
            <AppRoot className="extra">
                <p>Page</p>
            </AppRoot>
        );
        const root = screen.getByText('Page').parentElement!;
        expect(root).toHaveClass('app-root', 'ion-page', 'ios', 'extra');
        expect(document.querySelector('.app-root')).toBe(root);
    });
});
