import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const capacitor = vi.hoisted(() => ({ platform: 'web' }));
const haptics = vi.hoisted(() => ({ impact: vi.fn(() => Promise.resolve()) }));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: () => capacitor.platform,
        isNativePlatform: () => capacitor.platform !== 'web',
    },
}));
vi.mock('@capacitor/haptics', () => ({
    Haptics: { impact: haptics.impact },
    ImpactStyle: { Light: 'LIGHT' },
}));

import { AppToggle } from './AppToggle';

/** jsdom has no PointerEvent: a MouseEvent with the pointer fields the gesture reads. */
beforeAll(() => {
    if (typeof window.PointerEvent === 'function') return;
    class PointerEventPolyfill extends MouseEvent {
        pointerId: number;
        pointerType: string;
        constructor(type: string, init: PointerEventInit = {}) {
            super(type, init);
            this.pointerId = init.pointerId ?? 1;
            this.pointerType = init.pointerType ?? 'mouse';
        }
    }
    window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
});

beforeEach(() => {
    capacitor.platform = 'web';
    haptics.impact.mockClear();
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.dir = '';
});

const isChecked = (toggle: HTMLElement): boolean => toggle.getAttribute('aria-checked') === 'true';
const track = (toggle: HTMLElement): HTMLElement =>
    toggle.querySelector<HTMLElement>('.app-toggle-icon')!;

type Pointer = { pointerType?: string; pointerId?: number };

/** Ionic's gesture flow: down on the track, moves on the document, up on the document. */
const drag = (
    toggle: HTMLElement,
    points: Array<[number, number]>,
    { pointerType = 'mouse', pointerId = 1 }: Pointer = {},
    { release = true }: { release?: boolean } = {}
): void => {
    const [[x0, y0], ...rest] = points;
    const init = { bubbles: true, pointerType, pointerId };
    fireEvent(
        track(toggle),
        new PointerEvent('pointerdown', { ...init, clientX: x0, clientY: y0 })
    );
    for (const [x, y] of rest) {
        act(() => {
            document.dispatchEvent(
                new PointerEvent('pointermove', { ...init, clientX: x, clientY: y })
            );
        });
    }
    if (!release) return;
    const [xe, ye] = points[points.length - 1];
    act(() => {
        document.dispatchEvent(
            new PointerEvent('pointerup', { ...init, clientX: xe, clientY: ye })
        );
    });
};

const flushPromises = async (): Promise<void> => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
};

describe('AppToggle', () => {
    it('renders role="switch" with aria-checked, the aria-label name and a tab stop', () => {
        render(<AppToggle checked aria-label="Show email" title="Hint" />);
        const toggle = screen.getByRole('switch', { name: 'Show email' });

        expect(isChecked(toggle)).toBe(true);
        expect(toggle.getAttribute('tabindex')).toBe('0');
        expect(toggle.hasAttribute('aria-disabled')).toBe(false);
        expect(toggle.getAttribute('title')).toBe('Hint');
        expect(toggle.classList.contains('app-toggle-checked')).toBe(true);
    });

    it('follows the document mode unless pinned, and maps color to the app palette classes', () => {
        document.documentElement.setAttribute('mode', 'ios');
        const { rerender } = render(<AppToggle aria-label="t" />);
        expect(screen.getByRole('switch').classList.contains('ios')).toBe(true);
        document.documentElement.removeAttribute('mode');

        rerender(<AppToggle aria-label="t" mode="md" color="indigo-700" className="ds-toggle" />);
        const toggle = screen.getByRole('switch');
        expect(toggle.className).toBe(
            'app-toggle md app-toggle-ltr app-color app-color-indigo-700 ds-toggle'
        );
    });

    it('keeps ion-toggle\'s hidden form input in sync: `value` when checked, "" otherwise', () => {
        const { container } = render(<AppToggle name="share" aria-label="Share" />);
        const aux = container.querySelector<HTMLInputElement>('input.aux-input')!;

        expect(aux.type).toBe('hidden');
        expect(aux.name).toBe('share');
        expect(aux.value).toBe('');
        expect(screen.queryByRole('checkbox')).toBeNull();

        fireEvent.click(screen.getByRole('switch'));
        expect(aux.value).toBe('on');
    });

    it('generates a name for the hidden input when none is given', () => {
        const { container } = render(<AppToggle />);
        expect(container.querySelector<HTMLInputElement>('input.aux-input')?.name).toMatch(
            /^app-tg-/
        );
    });

    it('toggles on click, emitting onCheckedChange before onClick, with the click default prevented', () => {
        const calls: string[] = [];
        render(
            <AppToggle
                onCheckedChange={checked => calls.push(`change:${checked}`)}
                onClick={event => calls.push(`click:${event.defaultPrevented}`)}
            />
        );
        const toggle = screen.getByRole('switch');

        fireEvent.click(toggle);
        expect(isChecked(toggle)).toBe(true);
        fireEvent.click(track(toggle));
        expect(isChecked(toggle)).toBe(false);

        expect(calls).toEqual(['change:true', 'click:true', 'change:false', 'click:true']);
    });

    it('toggles on Space without calling onClick (prevents scrolling), and ignores Enter', () => {
        const onClick = vi.fn();
        const onCheckedChange = vi.fn();
        render(<AppToggle onClick={onClick} onCheckedChange={onCheckedChange} />);
        const toggle = screen.getByRole('switch');

        expect(fireEvent.keyDown(toggle, { key: ' ' })).toBe(false);
        expect(isChecked(toggle)).toBe(true);
        expect(onCheckedChange).toHaveBeenCalledWith(true);

        expect(fireEvent.keyDown(toggle, { key: 'Enter' })).toBe(true);
        expect(isChecked(toggle)).toBe(true);
        expect(onCheckedChange).toHaveBeenCalledTimes(1);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('when disabled: no tab stop, aria-disabled, and neither click, Space nor drag reacts', () => {
        const onClick = vi.fn();
        const onCheckedChange = vi.fn();
        render(<AppToggle disabled onClick={onClick} onCheckedChange={onCheckedChange} />);
        const toggle = screen.getByRole('switch');

        expect(toggle.hasAttribute('tabindex')).toBe(false);
        expect(toggle.getAttribute('aria-disabled')).toBe('true');
        expect(toggle.classList.contains('app-toggle-disabled')).toBe(true);

        fireEvent.click(toggle);
        fireEvent.keyDown(toggle, { key: ' ' });
        drag(toggle, [
            [0, 0],
            [10, 0],
            [30, 0],
        ]);

        expect(isChecked(toggle)).toBe(false);
        expect(onCheckedChange).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('applies checked prop changes and never emits onCheckedChange for them', () => {
        const onCheckedChange = vi.fn();
        const { rerender } = render(
            <AppToggle checked={false} onCheckedChange={onCheckedChange} />
        );

        rerender(<AppToggle checked onCheckedChange={onCheckedChange} />);

        expect(isChecked(screen.getByRole('switch'))).toBe(true);
        expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('keeps a Space-toggled state until the parent re-renders, then re-applies checked (onClick sites)', () => {
        let forceParentRender = (): void => undefined;
        const Parent: React.FC = () => {
            const [, setTick] = useState(0);
            forceParentRender = () => setTick(tick => tick + 1);
            return <AppToggle checked onClick={() => undefined} />;
        };
        render(<Parent />);
        const toggle = screen.getByRole('switch');

        fireEvent.keyDown(toggle, { key: ' ' });
        expect(isChecked(toggle)).toBe(false);

        act(() => forceParentRender());
        expect(isChecked(toggle)).toBe(true);
    });

    it('stays uncontrolled without a checked prop (MyDataSettings), even across parent renders', () => {
        let forceParentRender = (): void => undefined;
        const Parent: React.FC = () => {
            const [, setTick] = useState(0);
            forceParentRender = () => setTick(tick => tick + 1);
            return <AppToggle mode="ios" color="emerald-700" />;
        };
        render(<Parent />);
        const toggle = screen.getByRole('switch');

        expect(isChecked(toggle)).toBe(false);
        fireEvent.click(toggle);
        act(() => forceParentRender());
        expect(isChecked(toggle)).toBe(true);
    });

    it('keeps the inverted BoostShareableCode wiring consistent: onClick flips the parent, checked follows', () => {
        const Parent: React.FC = () => {
            const [claimLimitToggle, setClaimLimitToggle] = useState(false);
            return (
                <>
                    <AppToggle
                        onClick={() => setClaimLimitToggle(!claimLimitToggle)}
                        checked={!claimLimitToggle}
                    />
                    <output>{String(claimLimitToggle)}</output>
                </>
            );
        };
        const { container } = render(<Parent />);
        const toggle = screen.getByRole('switch');

        expect(isChecked(toggle)).toBe(true);
        fireEvent.click(toggle);
        expect(isChecked(toggle)).toBe(false);
        expect(container.querySelector('output')?.textContent).toBe('true');
    });

    it('does not respond to a wrapping <label> click (the hidden input is not labelable)', () => {
        const onClick = vi.fn();
        render(
            // eslint-disable-next-line jsx-a11y/label-has-associated-control -- test: a label wrapping the toggle
            <label>
                <span>Text</span>
                <AppToggle onClick={onClick} />
            </label>
        );
        const toggle = screen.getByRole('switch');

        fireEvent.click(screen.getByText('Text'));
        expect(isChecked(toggle)).toBe(false);
        expect(onClick).not.toHaveBeenCalled();

        fireEvent.click(toggle);
        expect(isChecked(toggle)).toBe(true);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    describe('drag (ion-toggle gesture)', () => {
        it('captures after 5px of horizontal movement, widens the handle, and flips past +10px', () => {
            const onCheckedChange = vi.fn();
            render(<AppToggle mode="ios" onCheckedChange={onCheckedChange} />);
            const toggle = screen.getByRole('switch');

            drag(
                toggle,
                [
                    [0, 0],
                    [4, 0],
                ],
                {},
                { release: false }
            );
            expect(toggle.classList.contains('app-toggle-activated')).toBe(false);

            act(() => {
                document.dispatchEvent(
                    new PointerEvent('pointermove', { bubbles: true, clientX: 6, pointerId: 1 })
                );
            });
            expect(toggle.classList.contains('app-toggle-activated')).toBe(true);

            // deltaX is measured from the capture point (6): 16 is +10, not past it.
            act(() => {
                document.dispatchEvent(
                    new PointerEvent('pointermove', { bubbles: true, clientX: 16, pointerId: 1 })
                );
            });
            expect(isChecked(toggle)).toBe(false);

            act(() => {
                document.dispatchEvent(
                    new PointerEvent('pointermove', { bubbles: true, clientX: 17, pointerId: 1 })
                );
            });
            expect(isChecked(toggle)).toBe(true);
            expect(onCheckedChange).toHaveBeenCalledWith(true);

            act(() => {
                document.dispatchEvent(
                    new PointerEvent('pointerup', { bubbles: true, clientX: 17, pointerId: 1 })
                );
            });
            expect(toggle.classList.contains('app-toggle-activated')).toBe(false);
            expect(onCheckedChange).toHaveBeenCalledTimes(1);
        });

        it('flips once per direction: right does nothing when checked, left past -10px unchecks', () => {
            const onCheckedChange = vi.fn();
            render(<AppToggle checked onCheckedChange={onCheckedChange} />);
            const toggle = screen.getByRole('switch');

            drag(toggle, [
                [10, 0],
                [20, 0],
                [60, 0],
            ]);
            expect(isChecked(toggle)).toBe(true);

            drag(toggle, [
                [60, 0],
                [50, 0],
                [39, 0],
                [0, 0],
            ]);
            expect(isChecked(toggle)).toBe(false);
            expect(onCheckedChange.mock.calls).toEqual([[false]]);
        });

        it('matches the captured Ionic facts: a mouse drag ends in a click that does not toggle but still calls onClick', () => {
            vi.useFakeTimers({ toFake: ['Date'] });
            const calls: string[] = [];
            render(
                <AppToggle
                    onCheckedChange={checked => calls.push(`change:${checked}`)}
                    onClick={() => calls.push('click')}
                />
            );
            const toggle = screen.getByRole('switch');

            // fixture drag 1 (left to right), then the browser's click on mouseup
            drag(toggle, [
                [10, 0],
                [16, 0],
                [30, 0],
            ]);
            fireEvent.click(toggle);
            expect(isChecked(toggle)).toBe(true);

            // fixture drag 2 (right to left)
            drag(toggle, [
                [30, 0],
                [24, 0],
                [5, 0],
            ]);
            fireEvent.click(toggle);
            expect(isChecked(toggle)).toBe(false);
            expect(calls).toEqual(['change:true', 'click', 'change:false', 'click']);

            // 300ms later a click toggles again
            vi.advanceTimersByTime(301);
            fireEvent.click(toggle);
            expect(isChecked(toggle)).toBe(true);
        });

        it('swallows the click after a touch drag (Ionic preventDefault-ed touchend)', () => {
            const onClick = vi.fn();
            render(<AppToggle onClick={onClick} />);
            const toggle = screen.getByRole('switch');

            drag(
                toggle,
                [
                    [0, 0],
                    [6, 0],
                    [20, 0],
                ],
                { pointerType: 'touch' }
            );
            fireEvent.click(toggle);

            expect(isChecked(toggle)).toBe(true);
            expect(onClick).not.toHaveBeenCalled();
        });

        it('lets a mostly vertical move go (page scroll): no capture, and a mouse click still toggles', () => {
            render(<AppToggle />);
            const toggle = screen.getByRole('switch');

            drag(toggle, [
                [0, 0],
                [3, 8],
                [40, 8],
            ]);
            expect(toggle.classList.contains('app-toggle-activated')).toBe(false);
            expect(isChecked(toggle)).toBe(false);

            fireEvent.click(toggle);
            expect(isChecked(toggle)).toBe(true);
        });

        it('ends the gesture on pointercancel and when disabled mid-drag', () => {
            const { rerender } = render(<AppToggle />);
            const toggle = screen.getByRole('switch');

            drag(
                toggle,
                [
                    [0, 0],
                    [8, 0],
                ],
                {},
                { release: false }
            );
            expect(toggle.classList.contains('app-toggle-activated')).toBe(true);
            act(() => {
                document.dispatchEvent(
                    new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 })
                );
            });
            expect(toggle.classList.contains('app-toggle-activated')).toBe(false);

            drag(
                toggle,
                [
                    [0, 0],
                    [8, 0],
                ],
                {},
                { release: false }
            );
            rerender(<AppToggle disabled />);
            expect(toggle.classList.contains('app-toggle-activated')).toBe(false);
            act(() => {
                document.dispatchEvent(
                    new PointerEvent('pointermove', { bubbles: true, clientX: 40, pointerId: 1 })
                );
            });
            expect(isChecked(toggle)).toBe(false);
        });

        it('mirrors the direction in RTL documents', () => {
            document.dir = 'rtl';
            render(<AppToggle />);
            const toggle = screen.getByRole('switch');
            expect(toggle.classList.contains('app-toggle-rtl')).toBe(true);

            drag(toggle, [
                [40, 0],
                [34, 0],
                [10, 0],
            ]);
            expect(isChecked(toggle)).toBe(true);
        });
    });

    describe('haptics', () => {
        it('never loads the plugin on the web', async () => {
            render(<AppToggle />);
            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);
            drag(toggle, [
                [0, 0],
                [6, 0],
                [30, 0],
            ]);
            await flushPromises();
            expect(haptics.impact).not.toHaveBeenCalled();
        });

        it('fires a light impact on tap on native iOS only, and on drag flips on any native platform', async () => {
            capacitor.platform = 'ios';
            const { unmount } = render(<AppToggle />);
            fireEvent.click(screen.getByRole('switch'));
            await flushPromises();
            expect(haptics.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
            unmount();

            haptics.impact.mockClear();
            capacitor.platform = 'android';
            render(<AppToggle />);
            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);
            await flushPromises();
            expect(haptics.impact).not.toHaveBeenCalled();

            // checked after the tap, so a leftward drag flips it
            drag(toggle, [
                [30, 0],
                [24, 0],
                [0, 0],
            ]);
            await flushPromises();
            expect(isChecked(toggle)).toBe(false);
            expect(haptics.impact).toHaveBeenCalledTimes(1);
        });
    });
});
