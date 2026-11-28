import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppSkeletonText } from './AppSkeletonText';

const host = (container: HTMLElement): HTMLElement =>
    container.querySelector('.app-skeleton-text') as HTMLElement;

afterEach(cleanup);

describe('AppSkeletonText', () => {
    it('renders a static span with one non-breaking space by default', () => {
        const { container } = render(<AppSkeletonText />);
        const el = host(container);

        expect(el.tagName).toBe('SPAN');
        expect(el.className).toBe('app-skeleton-text');
        expect(el.textContent).toBe('\u00A0');
        expect(el.firstElementChild?.className).toBe('app-skeleton-text-space');
        expect(el.getAttribute('role')).toBeNull();
    });

    it('adds the animated class when animated', () => {
        const { container } = render(<AppSkeletonText animated />);

        expect(host(container).className).toBe('app-skeleton-text app-skeleton-text-animated');
    });

    it('keeps call-site classes, inline styles, custom properties and attributes', () => {
        const { container } = render(
            <AppSkeletonText
                animated={false}
                className="w-36 h-[15px]"
                style={{ width: '70%', borderRadius: 999, '--background-rgb': '0, 0, 255' }}
                data-testid="skeleton"
            />
        );
        const el = host(container);

        expect(el.className).toBe('w-36 h-[15px] app-skeleton-text');
        expect(el.style.width).toBe('70%');
        expect(el.style.borderRadius).toBe('999px');
        expect(el.style.getPropertyValue('--background-rgb')).toBe('0, 0, 255');
        expect(el.getAttribute('data-testid')).toBe('skeleton');
    });

    it('stays valid inside a paragraph', () => {
        const { container } = render(
            <p>
                <AppSkeletonText animated />
            </p>
        );

        expect(container.querySelector('p > span.app-skeleton-text')).not.toBeNull();
    });
});
