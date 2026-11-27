import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppSpinner, getPausedFrame } from './AppSpinner';

const host = (container: HTMLElement): HTMLElement =>
    container.querySelector('.app-spinner') as HTMLElement;

const svgs = (container: HTMLElement): SVGSVGElement[] =>
    Array.from(container.querySelectorAll<SVGSVGElement>('.app-spinner > svg'));

const originalMatchMedia = window.matchMedia;

const mockReducedMotion = (matches: boolean): void => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
};

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
    window.matchMedia = originalMatchMedia;
});

describe('AppSpinner', () => {
    it('defaults to role="progressbar" in an inline span with the md circular spinner', () => {
        const { container } = render(<AppSpinner />);
        const el = host(container);

        expect(el.tagName).toBe('SPAN');
        expect(el.getAttribute('role')).toBe('progressbar');
        expect(el.className).toBe('app-spinner md spinner-circular');
        expect(el.style.animationDuration).toBe('1400ms');
        expect(el.getAttribute('aria-label')).toBeNull();

        const [svg] = svgs(container);
        expect(svgs(container)).toHaveLength(1);
        expect(svg.getAttribute('viewBox')).toBe('24 24 48 48');
        const circle = svg.querySelector('circle')!;
        expect(circle.getAttribute('transform')).toBe('translate(0,0)');
        expect(circle.getAttribute('cx')).toBe('48');
        expect(circle.getAttribute('cy')).toBe('48');
        expect(circle.getAttribute('r')).toBe('20');
        expect(circle.style.animationDuration).toBe('1400ms');
    });

    it('defaults to the lines spinner in ios mode', () => {
        document.documentElement.setAttribute('mode', 'ios');
        const { container } = render(<AppSpinner />);

        expect(host(container).className).toBe('app-spinner ios spinner-lines');
        expect(svgs(container)).toHaveLength(8);
    });

    it("keeps the caller's role and aria attributes", () => {
        render(<AppSpinner name="crescent" role="status" aria-label="Loading" />);
        const el = screen.getByRole('status', { name: 'Loading' });

        expect(el.classList.contains('spinner-crescent')).toBe(true);
    });

    it('passes aria-hidden, className and style through', () => {
        const { container } = render(
            <AppSpinner
                aria-hidden="true"
                className="w-4 h-4 text-grayscale-700"
                style={{ color: '#6366F1', '--spinner-duration': '6s' }}
            />
        );
        const el = host(container);

        expect(el.getAttribute('aria-hidden')).toBe('true');
        expect(el.className).toBe('w-4 h-4 text-grayscale-700 app-spinner md spinner-circular');
        expect(el.style.color).toBe('rgb(99, 102, 241)');
        expect(el.style.getPropertyValue('--spinner-duration')).toBe('6s');
    });

    it("adds Ionic's color classes for the color prop", () => {
        const { container } = render(<AppSpinner name="crescent" color="grayscale-900" />);

        expect(host(container).className).toBe(
            'app-spinner md spinner-crescent ion-color ion-color-grayscale-900'
        );
    });

    it('renders the crescent geometry with a 750ms duration', () => {
        const { container } = render(<AppSpinner name="crescent" />);
        const [svg] = svgs(container);
        const circle = svg.querySelector('circle')!;

        expect(svgs(container)).toHaveLength(1);
        expect(svg.getAttribute('viewBox')).toBe('0 0 64 64');
        expect(svg.style.animationDuration).toBe('750ms');
        expect(circle.getAttribute('transform')).toBe('translate(32,32)');
        expect(circle.getAttribute('r')).toBe('26');
        expect(host(container).style.animationDuration).toBe('');
    });

    it('renders the lines geometry: 8 rotated lines with staggered negative delays', () => {
        const { container } = render(<AppSpinner name="lines" />);
        const all = svgs(container);

        expect(all).toHaveLength(8);
        expect(all.map(svg => svg.style.transform)).toEqual([
            'rotate(180deg)',
            'rotate(225deg)',
            'rotate(270deg)',
            'rotate(315deg)',
            'rotate(0deg)',
            'rotate(45deg)',
            'rotate(90deg)',
            'rotate(135deg)',
        ]);
        expect(all.map(svg => svg.style.animationDelay)).toEqual([
            '-1000ms',
            '-875ms',
            '-750ms',
            '-625ms',
            '-500ms',
            '-375ms',
            '-250ms',
            '-125ms',
        ]);
        const line = all[0].querySelector('line')!;
        expect(line.getAttribute('transform')).toBe('translate(32,32)');
        expect(line.getAttribute('y1')).toBe('14');
        expect(line.getAttribute('y2')).toBe('26');
    });

    it('renders the dots geometry', () => {
        const { container } = render(<AppSpinner name="dots" />);
        const all = svgs(container);

        expect(all.map(svg => svg.style.left)).toEqual(['32%', '0%', '-32%']);
        expect(all.map(svg => svg.style.animationDelay)).toEqual(['0ms', '-110ms', '-220ms']);
        expect(all.map(svg => svg.style.animationDuration)).toEqual(['750ms', '750ms', '750ms']);
        expect(all[0].querySelector('circle')!.getAttribute('r')).toBe('6');
    });

    it('renders 12 lines for lines-sharp and 9 bubbles', () => {
        const sharp = render(<AppSpinner name="lines-sharp" />);
        expect(svgs(sharp.container)).toHaveLength(12);
        expect(svgs(sharp.container)[0].querySelector('line')!.getAttribute('y1')).toBe('17');
        sharp.unmount();

        const bubbles = render(<AppSpinner name="bubbles" />);
        expect(svgs(bubbles.container)).toHaveLength(9);
    });

    it('uses a custom duration above 10ms and ignores smaller ones', () => {
        const custom = render(<AppSpinner name="lines" duration={2000} />);
        expect(svgs(custom.container)[1].style.animationDuration).toBe('2000ms');
        expect(svgs(custom.container)[1].style.animationDelay).toBe('-1750ms');
        custom.unmount();

        const ignored = render(<AppSpinner name="lines" duration={5} />);
        expect(svgs(ignored.container)[1].style.animationDuration).toBe('1000ms');
    });

    it('animates without inline frame styles when not paused', () => {
        mockReducedMotion(false);
        const { container } = render(<AppSpinner name="lines" />);

        expect(host(container).classList.contains('spinner-paused')).toBe(false);
        expect(svgs(container)[1].style.opacity).toBe('');
    });

    it('pauses on its first frame under prefers-reduced-motion', () => {
        mockReducedMotion(true);
        const { container } = render(<AppSpinner name="lines" />);

        expect(host(container).classList.contains('spinner-paused')).toBe(true);
        expect(svgs(container).map(svg => svg.style.opacity)).toEqual([
            '1',
            '0.125',
            '0.25',
            '0.375',
            '0.5',
            '0.625',
            '0.75',
            '0.875',
        ]);
    });

    it('pauses with the paused prop and freezes the circular dash', () => {
        mockReducedMotion(false);
        const { container } = render(<AppSpinner paused />);
        const circle = container.querySelector('circle')!;

        expect(host(container).classList.contains('spinner-paused')).toBe(true);
        expect(circle.style.strokeDasharray).toBe('1px, 200px');
        expect(circle.style.strokeDashoffset).toBe('0px');
    });

    it('works when matchMedia is unavailable', () => {
        // @ts-expect-error simulate an environment without matchMedia
        window.matchMedia = undefined;
        const { container } = render(<AppSpinner name="crescent" />);

        expect(host(container).classList.contains('spinner-paused')).toBe(false);
    });
});

describe('getPausedFrame', () => {
    it('samples spinner-dots on its linear segments', () => {
        expect(getPausedFrame('dots', 0, 750).svg).toEqual({
            transform: 'scale(1, 1)',
            opacity: 0.9,
        });
        // 110 / 750 = 0.146667 -> t = 0.293333 on 0% -> 50%
        expect(getPausedFrame('dots', -110, 750).svg).toEqual({
            transform: 'scale(0.824, 0.824)',
            opacity: 0.724,
        });
        // 220 / 750 = 0.293333 -> t = 0.586667
        expect(getPausedFrame('dots', -220, 750).svg).toEqual({
            transform: 'scale(0.648, 0.648)',
            opacity: 0.548,
        });
        // Second half: 600 / 750 = 0.8 -> t = 0.6 on 50% -> 100%
        expect(getPausedFrame('dots', -600, 750).svg).toEqual({
            transform: 'scale(0.76, 0.76)',
            opacity: 0.66,
        });
    });

    it('treats a full-cycle delay as the start of the next cycle', () => {
        expect(getPausedFrame('lines', -1000, 1000).svg).toEqual({ opacity: 1 });
    });

    it('freezes crescent at 0deg, scales bubbles and fades circles', () => {
        expect(getPausedFrame('crescent', 0, 750).svg).toEqual({ transform: 'rotate(0deg)' });
        expect(getPausedFrame('bubbles', -250, 1000).svg).toEqual({
            transform: 'scale(0.75, 0.75)',
        });
        expect(getPausedFrame('circles', -250, 1000).svg).toEqual({ opacity: 0.75 });
    });

    it('has no frame for unknown names', () => {
        expect(getPausedFrame('unknown', -100, 1000)).toEqual({ svg: {}, circle: {} });
    });
});
