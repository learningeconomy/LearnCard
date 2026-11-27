import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppButtons } from '../controls/AppButtons';
import { AppTitle } from './AppTitle';
import { AppToolbar } from './AppToolbar';

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
});

const container = (toolbar: HTMLElement): HTMLElement =>
    toolbar.querySelector(':scope > .app-toolbar-container') as HTMLElement;

describe('AppToolbar', () => {
    it('renders the background layer and places children by slot, in ion-toolbar order', () => {
        render(
            <AppToolbar data-testid="toolbar">
                <AppButtons slot="end">
                    <span>end</span>
                </AppButtons>
                <AppTitle>Title</AppTitle>
                <span slot="primary">primary</span>
                <AppButtons slot="start">
                    <span>start</span>
                </AppButtons>
                <span slot="secondary">secondary</span>
            </AppToolbar>
        );
        const toolbar = screen.getByTestId('toolbar');

        expect(toolbar.firstElementChild).toHaveClass('app-toolbar-background');
        const parts = Array.from(container(toolbar).children).map(el =>
            el.classList.contains('app-toolbar-content') ? 'content' : el.textContent
        );
        expect(parts).toEqual(['start', 'secondary', 'content', 'primary', 'end']);
        expect(container(toolbar).querySelector('.app-toolbar-content')).toHaveTextContent('Title');
    });

    it('flattens fragments and drops children in a slot the toolbar does not have', () => {
        render(
            <AppToolbar data-testid="toolbar">
                <>
                    <span slot="start">a</span>
                    <span>b</span>
                </>
                <span slot="bottom">gone</span>
            </AppToolbar>
        );
        const toolbar = screen.getByTestId('toolbar');

        expect(container(toolbar).firstElementChild).toHaveTextContent('a');
        expect(toolbar.querySelector('.app-toolbar-content')).toHaveTextContent('b');
        expect(screen.queryByText('gone')).toBeNull();
    });

    it('follows the document mode and takes a mode override like Ionic', () => {
        document.documentElement.setAttribute('mode', 'ios');
        const { rerender } = render(<AppToolbar data-testid="toolbar" />);
        expect(screen.getByTestId('toolbar')).toHaveClass('app-toolbar', 'ios', 'app-toolbar-ios');
        expect(screen.getByTestId('toolbar').hasAttribute('mode')).toBe(false);

        document.documentElement.removeAttribute('mode');
        rerender(<AppToolbar data-testid="toolbar" mode="ios" />);
        expect(screen.getByTestId('toolbar')).toHaveClass('app-toolbar-ios');
        // Remaining Ionic descendants read the closest `mode` attribute.
        expect(screen.getByTestId('toolbar').getAttribute('mode')).toBe('ios');
    });

    it("takes the closest ancestor's mode, like Ionic's getIonMode(el)", () => {
        render(
            <div {...{ mode: 'ios' }}>
                <AppToolbar data-testid="toolbar">
                    <AppTitle data-testid="title">Title</AppTitle>
                </AppToolbar>
                <AppToolbar data-testid="md-toolbar" mode="md">
                    <AppTitle data-testid="md-title">Title</AppTitle>
                </AppToolbar>
            </div>
        );

        expect(screen.getByTestId('toolbar')).toHaveClass('app-toolbar-ios');
        expect(screen.getByTestId('title')).toHaveClass('app-title-ios');
        expect(screen.getByTestId('md-toolbar')).toHaveClass('app-toolbar-md');
        expect(screen.getByTestId('md-title')).toHaveClass('app-title-md');
    });

    it('maps color to the theme color classes, keeping call-site classes', () => {
        render(<AppToolbar data-testid="toolbar" color="grayscale-900" className="px-4" />);

        expect(screen.getByTestId('toolbar')).toHaveClass(
            'ion-color',
            'ion-color-grayscale-900',
            'px-4'
        );
    });

    it('marks a large title for the wrapping iOS layout', () => {
        render(
            <AppToolbar data-testid="toolbar">
                <AppTitle size="large">Large</AppTitle>
            </AppToolbar>
        );

        expect(screen.getByTestId('toolbar')).toHaveClass('app-toolbar-title-large');
    });
});

describe('AppTitle', () => {
    it('wraps its text in the truncating inner element, with size and color classes', () => {
        render(
            <AppTitle data-testid="title" size="small" color="primary" className="font-bold">
                Hello
            </AppTitle>
        );
        const title = screen.getByTestId('title');

        expect(title).toHaveClass('app-title', 'md', 'app-title-md', 'app-title-small');
        expect(title).toHaveClass('ion-color', 'ion-color-primary', 'font-bold');
        expect(title.firstElementChild).toHaveClass('app-title-inner');
        expect(title.firstElementChild).toHaveTextContent('Hello');
    });

    it('defaults to the default size', () => {
        render(<AppTitle data-testid="title">Hi</AppTitle>);
        expect(screen.getByTestId('title')).toHaveClass('app-title-default');
    });
});
