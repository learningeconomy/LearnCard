import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as ionicons from 'ionicons/icons';
import { americanFootballOutline, arrowDownLeftBox, star } from 'ionicons/icons';

import { AppIcon } from './AppIcon';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const svgOf = (host: HTMLElement) => host.querySelector(':scope > svg');

/** Tag and attribute signature of an SVG tree, minus attributes with no rendering effect. */
const signature = (el: Element): string => {
    const attrs = Array.from(el.attributes)
        .filter(a => a.name !== 'xml:space' && a.name !== 'data-name')
        .map(a => `${a.name}=${a.value}`)
        .sort()
        .join(' ');
    return `<${el.localName} ${attrs}>${Array.from(el.children).map(signature).join('')}</>`;
};

describe('AppIcon', () => {
    it('is an inline img span holding the icon svg, like ion-icon', () => {
        render(<AppIcon icon={star} data-testid="icon" />);

        const host = screen.getByTestId('icon');
        expect(host.tagName).toBe('SPAN');
        expect(host).toHaveAttribute('role', 'img');
        expect(host).toHaveClass('app-icon');
        expect(svgOf(host)).toHaveAttribute('viewBox', '0 0 512 512');
        expect(svgOf(host)).toHaveClass('ionicon');
    });

    it('renders every ionicons export with the same svg tree ionicons would inject', () => {
        const icons = Object.entries(ionicons).filter(([, v]) => typeof v === 'string');
        expect(icons.length).toBeGreaterThan(1000);

        const { rerender } = render(<AppIcon icon={star} data-testid="icon" />);
        for (const [name, icon] of icons) {
            rerender(<AppIcon icon={icon} data-testid="icon" />);
            const expected = new DOMParser()
                .parseFromString(icon, 'text/html')
                .querySelector('svg') as Element;
            const actual = svgOf(screen.getByTestId('icon'));
            expect(actual, name).not.toBeNull();
            expect(signature(actual as Element), name).toBe(signature(expected));
        }
    });

    it('keeps ellipses, transforms and fill rules', () => {
        render(
            <>
                <AppIcon icon={americanFootballOutline} data-testid="ellipse" />
                <AppIcon icon={arrowDownLeftBox} data-testid="fill-rule" />
            </>
        );

        const ellipse = screen.getByTestId('ellipse').querySelector('ellipse');
        expect(ellipse).toHaveAttribute('transform');
        expect(
            screen.getByTestId('fill-rule').querySelector('[fill-rule="evenodd"]')
        ).not.toBeNull();
    });

    it("keeps a caller's role, aria and title attributes", () => {
        render(
            <>
                <AppIcon icon={star} aria-label="Passcode on" data-testid="labelled" />
                <AppIcon icon={star} role="presentation" data-testid="presentation" />
                <AppIcon icon={star} aria-hidden title="Destination" data-testid="hidden" />
            </>
        );

        expect(screen.getByRole('img', { name: 'Passcode on' })).toBe(
            screen.getByTestId('labelled')
        );
        expect(screen.getByTestId('presentation')).toHaveAttribute('role', 'presentation');
        // ion-icon rendered a bare `aria-hidden` as aria-hidden=""; a span writes "true".
        expect(screen.getByTestId('hidden')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByTestId('hidden')).toHaveAttribute('title', 'Destination');
    });

    it('maps color and size to the Ionic color and size classes', () => {
        render(
            <>
                <AppIcon icon={star} color="grayscale-800" className="mr-1" data-testid="color" />
                <AppIcon icon={star} size="large" slot="start" data-testid="size" />
            </>
        );

        expect(screen.getByTestId('color')).toHaveClass(
            'app-icon',
            'ion-color',
            'ion-color-grayscale-800',
            'mr-1'
        );
        expect(screen.getByTestId('size')).toHaveClass('app-icon-large');
        expect(screen.getByTestId('size')).toHaveAttribute('slot', 'start');
    });

    it('drops scripts, handlers, links and styles from a hostile data URL', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const hostile =
            "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' onload='alert(1)'>" +
            "<script>alert(1)</script><path d='M0 0h10' onclick='alert(1)' style='fill:red' />" +
            "<a href='javascript:alert(1)'><circle cx='1' cy='1' r='1' /></a>" +
            "<foreignObject><img src='x' onerror='alert(1)' /></foreignObject>" +
            "<image href='https://example.invalid/x.png' />" +
            "<rect width='10' height='10' fill='url(https://example.invalid/x)' /></svg>";

        render(<AppIcon icon={hostile} data-testid="icon" />);

        const host = screen.getByTestId('icon');
        expect(host.querySelectorAll('script, a, foreignObject, image, img')).toHaveLength(0);
        for (const el of Array.from(host.querySelectorAll('*'))) {
            for (const attr of Array.from(el.attributes)) {
                expect(attr.name).not.toMatch(/^on|^style$|href/);
                expect(attr.value).not.toMatch(/javascript:|url\(/);
            }
        }
        expect(host.querySelector('path')).toHaveAttribute('d', 'M0 0h10');
    });

    it('never fetches: other URL kinds render an empty icon with a dev warning', () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        render(
            <>
                <AppIcon icon="https://example.invalid/icon.svg" data-testid="remote" />
                <AppIcon icon="data:image/svg+xml;base64,PHN2Zy8+" data-testid="base64" />
            </>
        );

        expect(svgOf(screen.getByTestId('remote'))).toBeNull();
        expect(svgOf(screen.getByTestId('base64'))).toBeNull();
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledTimes(2);
    });
});
