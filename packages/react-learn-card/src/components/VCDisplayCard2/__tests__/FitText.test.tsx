// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { MockInstance } from 'vitest';

import FitText from '../FitText';

let resizeObserverCallback: ResizeObserverCallback;
let clientWidth = 212;
let scrollWidth = 400;

const observe = vi.fn();
const disconnect = vi.fn();

class ResizeObserverMock {
    constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback;
    }

    observe = observe;
    disconnect = disconnect;
    unobserve = vi.fn();
}

describe('FitText', () => {
    let clientWidthSpy: MockInstance<[], number>;
    let scrollWidthSpy: MockInstance<[], number>;

    beforeEach(() => {
        clientWidth = 212;
        scrollWidth = 400;
        observe.mockClear();
        disconnect.mockClear();

        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        clientWidthSpy = vi
            .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
            .mockImplementation(() => clientWidth);
        scrollWidthSpy = vi
            .spyOn(HTMLElement.prototype, 'scrollWidth', 'get')
            .mockImplementation(() => scrollWidth);
    });

    afterEach(() => {
        clientWidthSpy.mockRestore();
        scrollWidthSpy.mockRestore();
        vi.unstubAllGlobals();
    });

    test('refits only when the observed width changes', () => {
        const { container, getByText } = render(
            <FitText text="A responsive ribbon title" width="100%" maxFontSize={100} />
        );

        const observedElement = container.firstElementChild as Element;

        resizeObserverCallback(
            [
                {
                    contentRect: { width: 200, height: 40 },
                    target: observedElement,
                } as ResizeObserverEntry,
            ],
            {} as ResizeObserver
        );
        const readsAfterFirstResize = scrollWidthSpy.mock.calls.length;

        resizeObserverCallback(
            [
                {
                    contentRect: { width: 200, height: 80 },
                    target: observedElement,
                } as ResizeObserverEntry,
            ],
            {} as ResizeObserver
        );

        expect(scrollWidthSpy).toHaveBeenCalledTimes(readsAfterFirstResize);

        clientWidth = 172;
        resizeObserverCallback(
            [
                {
                    contentRect: { width: 160, height: 80 },
                    target: observedElement,
                } as ResizeObserverEntry,
            ],
            {} as ResizeObserver
        );

        expect(scrollWidthSpy.mock.calls.length).toBeGreaterThan(readsAfterFirstResize);
        expect(getByText('A responsive ribbon title').style.fontSize).toBe('40px');
    });

    test('wraps only after reaching the minimum font size', () => {
        clientWidth = 112;
        scrollWidth = 1_200;

        const { getByText } = render(
            <FitText
                text="An exceptionally long ribbon title"
                width="100%"
                minFontSize={10}
                maxFontSize={100}
            />
        );
        const textElement = getByText('An exceptionally long ribbon title');

        expect(textElement.style.fontSize).toBe('10px');
        expect(textElement.style.whiteSpace).toBe('normal');
    });
});
