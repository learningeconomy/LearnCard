import React, { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    AppContent,
    getContentScrollElement,
    setContentScrollY,
    type AppContentHandle,
    type AppContentScrollEvent,
} from './AppContent';
import { AppPage } from './AppPage';

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

const scrollArea = (content: HTMLElement): HTMLElement =>
    content.querySelector(':scope > .app-content-scroll') as HTMLElement;

/** jsdom has no layout: give an element fixed offset metrics. */
const setMetrics = (el: HTMLElement, metrics: Record<string, number>): void => {
    for (const [key, value] of Object.entries(metrics)) {
        Object.defineProperty(el, key, { configurable: true, get: () => value });
    }
};

describe('AppContent', () => {
    it('is the main landmark with a background layer and a scroll area around the children', () => {
        render(
            <AppContent className="ion-padding">
                <p>Body</p>
            </AppContent>
        );
        const content = screen.getByRole('main');

        expect(content).toHaveClass('app-content', 'md', 'content-ltr', 'ion-padding');
        expect(content.style.getPropertyValue('--offset-top')).toBe('0px');
        expect(content.style.getPropertyValue('--offset-bottom')).toBe('0px');
        expect(content.firstElementChild).toHaveClass('app-content-background');
        const scroll = scrollArea(content);
        expect(scroll).toHaveClass(
            'app-content-scroll',
            'ion-content-scroll-host',
            'app-content-scroll-y'
        );
        expect(scroll).not.toHaveClass('app-content-scroll-x');
        expect(scroll).toContainElement(screen.getByText('Body'));
    });

    it('is not a landmark inside a modal, menu, or popover, and sizes inside a popover', () => {
        render(
            <>
                <div className="app-modal-wrapper">
                    <AppContent data-testid="modal" />
                </div>
                <div className="app-menu">
                    <AppContent data-testid="app-menu" />
                </div>
                <div className="app-popover">
                    <AppContent data-testid="app-popover" />
                </div>
                {React.createElement('ion-menu', null, <AppContent data-testid="menu" />)}
            </>
        );

        expect(screen.getByTestId('modal')).not.toHaveAttribute('role');
        expect(screen.getByTestId('app-menu')).not.toHaveAttribute('role');
        expect(screen.getByTestId('app-popover')).not.toHaveAttribute('role');
        expect(screen.getByTestId('app-popover')).toHaveClass('app-content-sizing');
        expect(screen.getByTestId('menu')).not.toHaveAttribute('role');
        expect(screen.queryByRole('main')).toBeNull();
    });

    it('applies theme colors and custom properties like ion-content', () => {
        render(
            <AppContent
                color="grayscale-100"
                style={{ '--background': '#EFF0F5' }}
                scrollX
                scrollY={false}
            />
        );
        const content = screen.getByRole('main');

        expect(content).toHaveClass('ion-color', 'ion-color-grayscale-100');
        expect(content.style.getPropertyValue('--background')).toBe('#EFF0F5');
        expect(scrollArea(content)).toHaveClass('app-content-scroll-x');
        expect(scrollArea(content)).not.toHaveClass('app-content-scroll-y');
    });

    it('puts slot="fixed" children outside the scroll area and drops other slots', () => {
        const { rerender } = render(
            <AppContent>
                <div slot="fixed" data-testid="fab" />
                <div slot="end" data-testid="unslotted" />
                <p>Body</p>
            </AppContent>
        );
        const content = screen.getByRole('main');

        expect(content.lastElementChild).toBe(screen.getByTestId('fab'));
        expect(screen.queryByTestId('unslotted')).toBeNull();

        rerender(
            <AppContent fixedSlotPlacement="before">
                <div slot="fixed" data-testid="fab" />
                <p>Body</p>
            </AppContent>
        );
        expect(content.children[1]).toBe(screen.getByTestId('fab'));
    });

    it('turns on overscroll for iOS mode on iOS only', () => {
        document.documentElement.setAttribute('mode', 'ios');
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' });
        const { rerender } = render(<AppContent />);
        const content = screen.getByRole('main');

        expect(content).toHaveClass('ios', 'app-content-overscroll');
        expect(scrollArea(content)).toHaveClass('app-content-overscroll');

        rerender(<AppContent forceOverscroll={false} />);
        expect(content).not.toHaveClass('app-content-overscroll');
    });

    it('offsets a fullscreen content by the header and footer around it', () => {
        render(
            <AppPage data-testid="page">
                <div data-testid="header" />
                <AppContent fullscreen />
            </AppPage>
        );
        const page = screen.getByTestId('page');
        const content = screen.getByRole('main');
        setMetrics(page, { offsetHeight: 800 });
        setMetrics(content, { offsetTop: 56, offsetHeight: 700 });

        // Measured on window resize (after a 100ms debounce), as Ionic did.
        vi.useFakeTimers();
        setMetrics(content, { offsetParent: 1 } as never);
        act(() => {
            window.dispatchEvent(new Event('resize'));
            vi.advanceTimersByTime(100);
        });

        expect(content.style.getPropertyValue('--offset-top')).toBe('56px');
        expect(content.style.getPropertyValue('--offset-bottom')).toBe('44px');
    });

    it('scrolls through its handle', async () => {
        const ref = createRef<AppContentHandle>();
        render(<AppContent ref={ref} />);
        const scroll = scrollArea(screen.getByRole('main'));
        setMetrics(scroll, { scrollHeight: 1000, clientHeight: 400 });

        expect(ref.current?.element).toBe(screen.getByRole('main'));
        await expect(ref.current?.getScrollElement()).resolves.toBe(scroll);

        await ref.current?.scrollToBottom();
        expect(scroll.scrollTop).toBe(600);
        await ref.current?.scrollToPoint(10, 250);
        expect([scroll.scrollLeft, scroll.scrollTop]).toEqual([10, 250]);
        await ref.current?.scrollByPoint(0, 50, 0);
        expect(scroll.scrollTop).toBe(300);
        await ref.current?.scrollToTop();
        expect(scroll.scrollTop).toBe(0);
    });

    it('eases an animated scroll over the duration', async () => {
        let now = 0;
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
        const ref = createRef<AppContentHandle>();
        render(<AppContent ref={ref} />);
        const scroll = scrollArea(screen.getByRole('main'));

        const done = ref.current!.scrollToPoint(undefined, 400, 100);
        await new Promise(resolve => setTimeout(resolve, 0));
        const run = (t: number): void => {
            now = t;
            frames.splice(0).forEach(cb => cb(now));
        };
        run(1000);
        expect(scroll.scrollTop).toBe(0);
        run(1050);
        expect(scroll.scrollTop).toBe(350); // 1 - 0.5^3
        run(1100);
        expect(scroll.scrollTop).toBe(400);
        await expect(done).resolves.toBeUndefined();
    });

    it('emits scroll start, scroll (once per frame) and end only with scrollEvents', () => {
        vi.useFakeTimers();
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
        const onStart = vi.fn();
        const onScroll = vi.fn((event: AppContentScrollEvent) => ({ ...event.detail }));
        const onEnd = vi.fn();
        const onNativeScroll = vi.fn();
        const { rerender } = render(
            <AppContent
                onIonScrollStart={onStart}
                onIonScroll={onScroll}
                onIonScrollEnd={onEnd}
                onScroll={onNativeScroll}
            />
        );
        const scroll = scrollArea(screen.getByRole('main'));

        fireEvent.scroll(scroll);
        expect(onNativeScroll).toHaveBeenCalledTimes(1);
        expect(onStart).not.toHaveBeenCalled();
        expect(frames).toHaveLength(0);

        rerender(
            <AppContent
                scrollEvents
                onIonScrollStart={onStart}
                onIonScroll={onScroll}
                onIonScrollEnd={onEnd}
            />
        );
        scroll.scrollTop = 120;
        fireEvent.scroll(scroll);
        fireEvent.scroll(scroll);
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onStart.mock.calls[0][0].detail).toEqual({ isScrolling: true });
        expect(frames).toHaveLength(1);

        frames.splice(0).forEach(cb => cb(16));
        expect(onScroll).toHaveBeenCalledTimes(1);
        expect(onScroll.mock.results[0].value).toMatchObject({
            type: 'scroll',
            scrollTop: 120,
            currentY: 120,
            startY: 120,
            deltaY: 0,
            isScrolling: true,
        });
        expect(onScroll.mock.calls[0][0].target.getScrollElement).toBeTypeOf('function');

        // The watchdog ends the scroll 120ms after the last scroll event.
        act(() => vi.advanceTimersByTime(300));
        expect(onEnd).toHaveBeenCalledTimes(1);
        expect(onEnd.mock.calls[0][0].detail).toEqual({ isScrolling: false });
    });

    it('lets the sheet gesture turn vertical scrolling off and on', () => {
        render(<AppContent />);
        const content = screen.getByRole('main');

        act(() => setContentScrollY(content, false));
        expect(scrollArea(content)).not.toHaveClass('app-content-scroll-y');
        act(() => setContentScrollY(content, true));
        expect(scrollArea(content)).toHaveClass('app-content-scroll-y');
        expect(getContentScrollElement(content)).toBe(scrollArea(content));
    });
});

describe('AppPage', () => {
    it('renders the .ion-page box with the caller props', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <AppPage ref={ref} className="bg-white" id="p" data-testid="page">
                child
            </AppPage>
        );
        const page = screen.getByTestId('page');

        expect(page.className).toBe('bg-white ion-page');
        expect(page.id).toBe('p');
        expect(ref.current).toBe(page);
    });
});
