import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppCol, getColStyle } from './AppCol';
import { AppGrid } from './AppGrid';
import { AppRow } from './AppRow';

const WIDTHS = { Xs: 0, Sm: 576, Md: 768, Lg: 992, Xl: 1200 };
let viewport = 390;

/** matchMedia for `(min-width: Npx)` queries against a settable viewport width. */
const installMatchMedia = () => {
    vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
            matches: viewport >= Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0),
            media: query,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
        }))
    );
};

const resizeTo = (width: number) => {
    viewport = width;
    act(() => {
        window.dispatchEvent(new Event('resize'));
    });
};

const pct = (n: number | string) =>
    `calc(calc(${n} / var(--app-grid-columns, var(--ion-grid-columns, 12))) * 100%)`;

beforeEach(() => {
    viewport = 390;
    installMatchMedia();
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.dir = '';
});

describe('AppGrid / AppRow', () => {
    it('are divs with the grid and row classes, keeping caller props', () => {
        const onClick = vi.fn();
        render(
            <AppGrid className="bg-white" data-testid="grid" style={{ height: '100%' }}>
                <AppRow role="button" onClick={onClick} className="w-full">
                    Row
                </AppRow>
            </AppGrid>
        );

        const grid = screen.getByTestId('grid');
        expect(grid.tagName).toBe('DIV');
        expect(grid).toHaveClass('app-grid', 'bg-white');
        expect(grid).not.toHaveClass('app-grid-fixed');
        expect(grid).toHaveStyle({ height: '100%' });
        fireEvent.click(screen.getByRole('button', { name: 'Row' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button')).toHaveClass('app-row', 'w-full');
    });

    it('marks a fixed grid', () => {
        render(<AppGrid fixed data-testid="grid" />);
        expect(screen.getByTestId('grid')).toHaveClass('app-grid', 'app-grid-fixed');
    });

    it('forwards refs to the div', () => {
        const ref = React.createRef<HTMLDivElement>();
        render(<AppRow ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
});

describe('AppCol', () => {
    it('grows with no inline size by default', () => {
        render(<AppCol data-testid="col" className="p-0" />);
        const col = screen.getByTestId('col');
        expect(col).toHaveClass('app-col', 'p-0');
        expect(col.getAttribute('style')).toBeNull();
    });

    it('sizes with inline flex / width / max-width, like ion-col', () => {
        render(<AppCol size="6" data-testid="col" />);
        const { style } = screen.getByTestId('col');
        expect(style.flex).toBe(`0 0 ${pct(6)}`);
        expect(style.width).toBe(pct(6));
        expect(style.maxWidth).toBe(pct(6));
    });

    it('uses the largest matching breakpoint and follows window resizes', () => {
        render(<AppCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg={6} data-testid="col" />);
        const col = screen.getByTestId('col');
        expect(col.style.width).toBe(pct(12));
        resizeTo(WIDTHS.Sm);
        expect(col.style.width).toBe(pct(10));
        resizeTo(WIDTHS.Md);
        expect(col.style.width).toBe(pct(8));
        resizeTo(1280);
        expect(col.style.width).toBe(pct(6));
    });

    it('supports auto size and keeps unset breakpoints on the smaller value', () => {
        viewport = 1280;
        render(<AppCol size="12" sizeMd="auto" data-testid="col" />);
        const { style } = screen.getByTestId('col');
        expect(style.flex).toBe('0 0 auto');
        expect(style.width).toBe('auto');
    });

    it('offsets, pushes and pulls, swapping sides in RTL', () => {
        expect(getColStyle({ offset: '2', push: 3, pull: '9' }, 1, false)).toEqual({
            marginLeft: pct(2),
            left: pct(3),
            right: pct(9),
        });
        expect(getColStyle({ offset: '2', push: 3, pull: '9' }, 1, true)).toEqual({
            marginRight: pct(2),
            right: pct(3),
            left: pct(9),
        });
    });

    it('lets its column styles win over the caller style, as ion-col did', () => {
        document.dir = 'rtl';
        render(
            <AppCol size="4" offset="1" style={{ width: '10px', color: 'red' }} data-testid="col" />
        );
        const { style } = screen.getByTestId('col');
        expect(style.width).toBe(pct(4));
        expect(style.marginRight).toBe(pct(1));
        expect(style.color).toBe('red');
    });

    it('does not pass column props to the DOM', () => {
        render(<AppCol size="6" sizeMd="4" offsetLg="2" data-testid="col" />);
        const col = screen.getByTestId('col');
        expect(col.getAttributeNames().sort()).toEqual(['class', 'data-testid', 'style']);
    });

    it('applies only unprefixed props without matchMedia, as Ionic did', () => {
        vi.stubGlobal('matchMedia', undefined);
        render(<AppCol size="6" sizeXs="12" data-testid="col" />);
        expect(screen.getByTestId('col').style.width).toBe(pct(6));
    });
});
