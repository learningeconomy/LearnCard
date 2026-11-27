import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppItem } from './AppItem';
import { AppLabel } from './AppLabel';
import { AppList } from './AppList';

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
});

describe('AppList', () => {
    it('is a list whose items are listitems, like ion-list / ion-item', () => {
        render(
            <AppList>
                <AppItem>One</AppItem>
                <AppItem>Two</AppItem>
            </AppList>
        );

        expect(screen.getByRole('list').tagName).toBe('DIV');
        expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([
            'One',
            'Two',
        ]);
    });

    it("keeps a caller's role and aria-label", () => {
        render(
            <AppList role="navigation" aria-label="Primary navigation">
                <a href="#home">Home</a>
            </AppList>
        );

        expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeTruthy();
        expect(screen.queryByRole('list')).toBeNull();
    });

    it('carries mode, lines, inset and caller classes', () => {
        document.documentElement.setAttribute('mode', 'ios');
        render(<AppList lines="none" inset className="py-4" data-testid="list" />);

        expect(screen.getByTestId('list').className).toBe(
            'app-list app-list-ios app-list-inset app-list-lines-none py-4'
        );
    });
});

describe('AppItem', () => {
    it('is not a listitem outside a list', () => {
        render(<AppItem data-testid="item">Solo</AppItem>);

        expect(screen.getByTestId('item').getAttribute('role')).toBeNull();
    });

    it('renders a plain row, not a button, by default', () => {
        render(<AppItem>Row</AppItem>);

        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders a native type="button" row when `button` is set and runs onClick', () => {
        const onClick = vi.fn();
        render(
            <AppItem button onClick={onClick}>
                Pick me
            </AppItem>
        );
        const button = screen.getByRole('button', { name: 'Pick me' });

        fireEvent.click(button);

        expect(button.getAttribute('type')).toBe('button');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('runs onClick for a non-button row too', () => {
        const onClick = vi.fn();
        render(
            <AppItem onClick={onClick} data-testid="item">
                Row
            </AppItem>
        );

        fireEvent.click(screen.getByText('Row'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disables the native button and marks the host like ion-item', () => {
        render(
            <AppItem button disabled data-testid="item">
                Busy
            </AppItem>
        );
        const item = screen.getByTestId('item');

        expect((screen.getByRole('button', { name: 'Busy' }) as HTMLButtonElement).disabled).toBe(
            true
        );
        expect(item.getAttribute('aria-disabled')).toBe('true');
        expect(item.classList.contains('app-item-disabled')).toBe(true);
    });

    it('defaults lines from the item, else the list', () => {
        render(
            <AppList lines="none">
                <AppItem data-testid="default">Default</AppItem>
                <AppItem data-testid="full" lines="full">
                    Full
                </AppItem>
            </AppList>
        );

        expect(screen.getByTestId('default').classList.contains('app-item-lines-default')).toBe(
            true
        );
        expect(screen.getByTestId('full').classList.contains('app-item-lines-full')).toBe(true);
    });

    it('shows the detail chevron on ios button rows only, unless `detail` says otherwise', () => {
        document.documentElement.setAttribute('mode', 'ios');
        const { container } = render(
            <>
                <AppItem button>ios button</AppItem>
                <AppItem button detail={false}>
                    no detail
                </AppItem>
                <AppItem>plain</AppItem>
                <AppItem detail mode="md">
                    md forced
                </AppItem>
            </>
        );
        const icons = [...container.querySelectorAll('.app-item-detail-icon')];

        expect(icons.map(icon => icon.closest('.app-item')?.textContent)).toEqual([
            'ios button',
            'md forced',
        ]);
        expect(icons.every(icon => icon.getAttribute('aria-hidden') === 'true')).toBe(true);
    });

    it('adds the md ripple to button rows only', () => {
        const { container } = render(
            <>
                <AppItem button mode="md">
                    md
                </AppItem>
                <AppItem button mode="ios">
                    ios
                </AppItem>
                <AppItem mode="md">plain</AppItem>
            </>
        );

        expect(
            [...container.querySelectorAll('.app-ripple-effect')].map(
                ripple => ripple.closest('.app-item')?.textContent
            )
        ).toEqual(['md']);
    });

    it('passes custom properties through style and forwards ref to the host', () => {
        const ref = React.createRef<HTMLDivElement>();
        render(
            <AppItem ref={ref} style={{ '--border-color': 'transparent' }} data-testid="item">
                Row
            </AppItem>
        );

        expect(ref.current).toBe(screen.getByTestId('item'));
        expect(ref.current?.style.getPropertyValue('--border-color')).toBe('transparent');
    });
});

describe('AppLabel', () => {
    it('renders an inline span with the mode, caller classes and title', () => {
        render(
            <AppLabel className="w-full" title="More info">
                Scope
            </AppLabel>
        );
        const label = screen.getByTitle('More info');

        expect(label.tagName).toBe('SPAN');
        expect(label.className).toBe('app-label app-label-md w-full');
        expect(label.textContent).toBe('Scope');
    });

    it('follows the document mode unless one is passed', () => {
        document.documentElement.setAttribute('mode', 'ios');
        render(
            <>
                <AppLabel>Document</AppLabel>
                <AppLabel mode="md">Pinned</AppLabel>
            </>
        );

        expect(screen.getByText('Document').classList.contains('app-label-ios')).toBe(true);
        expect(screen.getByText('Pinned').classList.contains('app-label-md')).toBe(true);
    });
});
