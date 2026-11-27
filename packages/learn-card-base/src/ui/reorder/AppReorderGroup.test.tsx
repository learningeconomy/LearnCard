import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppReorder } from './AppReorder';
import {
    AppReorderGroup,
    type AppReorderEndEvent,
    type AppReorderGroupProps,
} from './AppReorderGroup';

/**
 * jsdom has no layout: every item is ROW px tall, stacked from the group's top (GROUP_TOP), and the
 * group's box spans its items. Moves are applied on the next animation frame, as in Ionic.
 */
const ROW = 40;
const GROUP_TOP = 100;

const layout = () => {
    for (const group of document.querySelectorAll<HTMLElement>('.app-reorder-group')) {
        const items = [...group.children] as HTMLElement[];
        const top = group.dataset.top ? Number(group.dataset.top) : GROUP_TOP;
        items.forEach(item => {
            Object.defineProperty(item, 'offsetHeight', { configurable: true, value: ROW });
        });
        group.getBoundingClientRect = () =>
            ({ top, bottom: top + items.length * ROW, left: 0, right: 300 }) as DOMRect;
    }
};

const frame = () =>
    act(async () => {
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    });

const handleOf = (row: string) =>
    screen.getByText(row).closest('[data-row]')!.querySelector<HTMLElement>('.app-reorder')!;

const List: React.FC<
    Omit<AppReorderGroupProps, 'children'> & { rows?: string[]; onRowClick?: () => void }
> = ({ rows: initial = ['A', 'B', 'C', 'D'], onRowClick, onIonReorderEnd, ...props }) => {
    const [rows, setRows] = useState(initial);
    return (
        <AppReorderGroup
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            onIonReorderEnd={e => {
                onIonReorderEnd?.(e);
                const next = [...rows];
                const [moved] = next.splice(e.detail.from, 1);
                next.splice(e.detail.to, 0, moved);
                setRows(next);
                e.detail.complete();
            }}
        >
            {rows.map(row => (
                <div
                    key={row}
                    data-row
                    role="button"
                    tabIndex={0}
                    onClick={onRowClick}
                    onKeyDown={() => {}}
                >
                    <span>{row}</span>
                    <AppReorder>
                        <svg data-testid={`grip-${row}`} />
                    </AppReorder>
                </div>
            ))}
        </AppReorderGroup>
    );
};

const order = () =>
    [...document.querySelectorAll('[data-row] span')].map(s => s.textContent).join('');

beforeEach(() => {
    vi.useRealTimers();
});

afterEach(() => {
    cleanup();
});

describe('AppReorderGroup', () => {
    it('is disabled by default, as ion-reorder-group, and gets reorder-enabled when enabled', () => {
        const { rerender, container } = render(<List mode="md" />);
        const group = container.querySelector('.app-reorder-group')!;
        expect(group.className).toBe('app-reorder-group md');

        rerender(<List mode="md" disabled={false} />);
        expect(group.className).toBe('app-reorder-group md reorder-enabled');
    });

    it('drags an item by its handle with the mouse and reports from / to', async () => {
        const onStart = vi.fn();
        const onMove = vi.fn();
        const onEnd = vi.fn();
        const onItemReorder = vi.fn();
        const { container } = render(
            <List
                disabled={false}
                onIonReorderStart={onStart}
                onIonReorderMove={onMove}
                onIonReorderEnd={onEnd}
                onIonItemReorder={onItemReorder}
            />
        );
        layout();
        const group = container.querySelector('.app-reorder-group')!;
        const itemA = screen.getByText('A').closest<HTMLElement>('[data-row]')!;

        // Press the middle of A (y 120), then drag to the middle of C (y 200).
        const down = fireEvent.mouseDown(screen.getByTestId('grip-A'), {
            clientX: 10,
            clientY: 120,
        });
        expect(down).toBe(false); // preventDefault: no focus change or text selection
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(itemA.classList.contains('reorder-selected')).toBe(true);
        await frame();
        expect(group.classList.contains('reorder-list-active')).toBe(true);

        fireEvent.mouseMove(document, { clientX: 10, clientY: 200 });
        await frame();
        expect(itemA.style.transform).toBe('translateY(80px)');
        // B and C slide up by A's height.
        const items = [...group.children] as HTMLElement[];
        expect(items.map(i => i.style.transform)).toEqual([
            'translateY(80px)',
            'translateY(-40px)',
            'translateY(-40px)',
            '',
        ]);
        expect(onMove).toHaveBeenLastCalledWith(
            expect.objectContaining({ detail: { from: 0, to: 2 } })
        );

        fireEvent.mouseUp(document, { clientX: 10, clientY: 200 });
        expect(onEnd).toHaveBeenCalledTimes(1);
        expect(onEnd.mock.calls[0][0].detail).toMatchObject({ from: 0, to: 2 });
        expect(onItemReorder).toHaveBeenCalledTimes(1);
        expect(order()).toBe('BCAD');
        expect(itemA.classList.contains('reorder-selected')).toBe(false);
        await frame();
        expect(items.map(i => i.style.transform)).toEqual(['', '', '', '']);
        expect(group.classList.contains('reorder-list-active')).toBe(false);
    });

    it('clamps the item to the group and completes in place when dropped where it started', async () => {
        const onEnd = vi.fn();
        const onItemReorder = vi.fn();
        render(<List disabled={false} onIonReorderEnd={onEnd} onIonItemReorder={onItemReorder} />);
        layout();
        const itemB = screen.getByText('B').closest<HTMLElement>('[data-row]')!;

        fireEvent.mouseDown(screen.getByTestId('grip-B'), { clientX: 10, clientY: 160 });
        fireEvent.mouseMove(document, { clientX: 10, clientY: 900 });
        await frame();
        // Clamped to the group's bottom (260): 260 - 160.
        expect(itemB.style.transform).toBe('translateY(100px)');
        fireEvent.mouseMove(document, { clientX: 10, clientY: 150 });
        await frame();
        fireEvent.mouseUp(document);

        expect(onEnd.mock.calls[0][0].detail).toMatchObject({ from: 1, to: 1 });
        expect(onItemReorder).not.toHaveBeenCalled();
        expect(order()).toBe('ABCD');
        expect(itemB.classList.contains('reorder-selected')).toBe(false);
    });

    it('only starts from a handle, and not while disabled', () => {
        const onStart = vi.fn();
        const { rerender } = render(<List disabled={false} onIonReorderStart={onStart} />);
        layout();
        fireEvent.mouseDown(screen.getByText('A'), { clientX: 10, clientY: 120 });
        expect(onStart).not.toHaveBeenCalled();

        rerender(<List disabled onIonReorderStart={onStart} />);
        fireEvent.mouseDown(screen.getByTestId('grip-A'), { clientX: 10, clientY: 120 });
        fireEvent.mouseUp(document);
        expect(onStart).not.toHaveBeenCalled();
    });

    it('ends the drag when it is disabled mid-drag', () => {
        const onEnd = vi.fn();
        const { rerender } = render(<List disabled={false} onIonReorderEnd={onEnd} />);
        layout();
        fireEvent.mouseDown(screen.getByTestId('grip-A'), { clientX: 10, clientY: 120 });
        rerender(<List disabled onIonReorderEnd={onEnd} />);
        expect(onEnd).toHaveBeenCalledTimes(1);
        expect(onEnd.mock.calls[0][0].detail).toMatchObject({ from: 0, to: 0 });
    });

    it('drags with touch and ignores the emulated mouse events that follow', async () => {
        const onStart = vi.fn();
        const onEnd = vi.fn();
        render(<List disabled={false} onIonReorderStart={onStart} onIonReorderEnd={onEnd} />);
        layout();
        const grip = screen.getByTestId('grip-D');
        const touch = (y: number) => [{ clientX: 10, clientY: y, identifier: 1, target: grip }];

        fireEvent.touchStart(grip, { touches: touch(240), changedTouches: touch(240) });
        fireEvent.touchMove(grip, { touches: touch(130), changedTouches: touch(130) });
        await frame();
        fireEvent.touchEnd(grip, { touches: [], changedTouches: touch(130) });
        expect(onEnd.mock.calls[0][0].detail).toMatchObject({ from: 3, to: 0 });
        expect(order()).toBe('DABC');

        fireEvent.mouseDown(handleOf('B'), { clientX: 10, clientY: 160 });
        fireEvent.mouseUp(document);
        expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('auto-scrolls the closest scrolling ancestor near its edges', async () => {
        const { container } = render(
            <div data-testid="scroller" style={{ overflowY: 'auto' }}>
                <List disabled={false} />
            </div>
        );
        layout();
        const scroller = screen.getByTestId('scroller');
        scroller.getBoundingClientRect = () => ({ top: 0, bottom: 300 }) as DOMRect;
        let scrollTop = 0;
        Object.defineProperty(scroller, 'scrollTop', { configurable: true, get: () => scrollTop });
        scroller.scrollBy = ((_x: number, y: number) => {
            scrollTop += y;
        }) as Element['scrollBy'];

        fireEvent.mouseDown(screen.getByTestId('grip-A'), { clientX: 10, clientY: 120 });
        // Within 60px of the bottom: 10px per move.
        fireEvent.mouseMove(document, { clientX: 10, clientY: 290 });
        await frame();
        fireEvent.mouseMove(document, { clientX: 10, clientY: 291 });
        await frame();
        expect(scrollTop).toBe(20);
        // The item follows the content: clamped to the group's bottom (260) moved up by 20px of scroll.
        const itemA = container.querySelector<HTMLElement>('.reorder-selected')!;
        expect(itemA.style.transform).toBe('translateY(140px)');
        fireEvent.mouseUp(document);
    });

    it('keeps a nested group isolated: its handles only move its own items', async () => {
        const outerEnd = vi.fn();
        const innerEnd = vi.fn();
        render(
            <AppReorderGroup disabled={false} onIonReorderEnd={outerEnd}>
                <div data-testid="outer-1">
                    <AppReorderGroup disabled={false} onIonReorderEnd={innerEnd}>
                        <div>
                            x
                            <AppReorder>
                                <svg data-testid="inner-grip-1" />
                            </AppReorder>
                        </div>
                        <div>
                            y<AppReorder />
                        </div>
                    </AppReorderGroup>
                    <AppReorder>
                        <svg data-testid="outer-grip-1" />
                    </AppReorder>
                </div>
                <div data-testid="outer-2">z</div>
            </AppReorderGroup>
        );
        const [outer, inner] = document.querySelectorAll<HTMLElement>('.app-reorder-group');
        inner.dataset.top = '100';
        layout();

        fireEvent.mouseDown(screen.getByTestId('inner-grip-1'), { clientX: 10, clientY: 110 });
        await frame();
        expect(inner.classList.contains('reorder-list-active')).toBe(true);
        expect(outer.classList.contains('reorder-list-active')).toBe(false);
        expect(screen.getByTestId('outer-1').classList.contains('reorder-selected')).toBe(false);
        fireEvent.mouseMove(document, { clientX: 10, clientY: 400 });
        await frame();
        fireEvent.mouseUp(document);
        expect(innerEnd.mock.calls[0][0].detail).toMatchObject({ from: 0, to: 1 });
        expect(outerEnd).not.toHaveBeenCalled();

        fireEvent.mouseDown(screen.getByTestId('outer-grip-1'), { clientX: 10, clientY: 110 });
        expect(screen.getByTestId('outer-1').classList.contains('reorder-selected')).toBe(true);
        fireEvent.mouseUp(document);
        expect(outerEnd).toHaveBeenCalledTimes(1);
    });

    const Plain: React.FC<{ onEnd: (e: AppReorderEndEvent) => void }> = ({ onEnd }) => (
        <AppReorderGroup disabled={false} onIonReorderEnd={onEnd}>
            {['a', 'b', 'c'].map(r => (
                <div key={r}>
                    {r}
                    <AppReorder>
                        <svg data-testid={`g-${r}`} />
                    </AppReorder>
                </div>
            ))}
        </AppReorderGroup>
    );
    const dragAToEnd = async () => {
        layout();
        fireEvent.mouseDown(screen.getByTestId('g-a'), { clientX: 0, clientY: 110 });
        fireEvent.mouseMove(document, { clientX: 0, clientY: 190 });
        await frame();
        fireEvent.mouseUp(document);
        await frame();
    };

    it('complete() moves the node itself when the app does not re-render, as Ionic did', async () => {
        const { container } = render(<Plain onEnd={e => e.detail.complete()} />);
        await dragAToEnd();
        expect(container.querySelector('.app-reorder-group')!.textContent).toBe('bca');
    });

    it('complete(list) returns the list reordered, and complete(false) puts the item back', async () => {
        let result: unknown;
        const first = render(<Plain onEnd={e => (result = e.detail.complete(['a', 'b', 'c']))} />);
        await dragAToEnd();
        expect(result).toEqual(['b', 'c', 'a']);
        expect(first.container.querySelector('.app-reorder-group')!.textContent).toBe('abc');
        first.unmount();

        const second = render(<Plain onEnd={e => e.detail.complete(false)} />);
        await dragAToEnd();
        const group = second.container.querySelector('.app-reorder-group')!;
        expect(group.textContent).toBe('abc');
        expect([...group.children].map(c => (c as HTMLElement).style.transform)).toEqual([
            '',
            '',
            '',
        ]);
    });
});

describe('AppReorder', () => {
    it('swallows clicks in an enabled group but lets them through when the group is disabled', () => {
        const onRowClick = vi.fn();
        const { rerender } = render(<List disabled={false} onRowClick={onRowClick} />);
        fireEvent.click(screen.getByTestId('grip-A'));
        expect(onRowClick).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('A'));
        expect(onRowClick).toHaveBeenCalledTimes(1);

        rerender(<List disabled onRowClick={onRowClick} />);
        fireEvent.click(screen.getByTestId('grip-A'));
        expect(onRowClick).toHaveBeenCalledTimes(2);
    });

    it("shows Ionic's mode icon without children, hidden from assistive tech", () => {
        const { container } = render(
            <>
                <AppReorder mode="ios" />
                <AppReorder mode="md" />
            </>
        );
        const [ios, md] = container.querySelectorAll('.app-reorder');
        expect(ios.className).toBe('app-reorder ios');
        expect(ios.querySelector('.app-reorder-icon')?.getAttribute('aria-hidden')).toBe('true');
        expect(ios.innerHTML).not.toBe(md.innerHTML);
        expect(ios.getAttribute('tabindex')).toBeNull();
    });
});
