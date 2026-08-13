// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./BoostFooter', () => ({
    default: ({ claimBtnText }: { claimBtnText?: string }) => (
        <footer>{claimBtnText ?? 'Footer'}</footer>
    ),
}));

import BoostFooterLayout from './BoostFooterLayout';

describe('BoostFooterLayout', () => {
    it('keeps content and the safe-area footer in separate layout rows', () => {
        const { container } = render(
            <BoostFooterLayout footerProps={{ claimBtnText: 'Accept' }}>
                <div>Credential</div>
            </BoostFooterLayout>
        );

        const layout = container.firstElementChild;
        const content = screen.getByText('Credential').parentElement;
        const footerRow = screen.getByText('Accept').parentElement;

        expect(layout?.classList.contains('flex-col')).toBe(true);
        expect(layout?.classList.contains('flex-1')).toBe(true);
        expect(content?.classList.contains('flex-1')).toBe(true);
        expect(content?.classList.contains('overflow-y-auto')).toBe(true);
        expect(footerRow?.classList.contains('shrink-0')).toBe(true);
        expect(footerRow?.classList.contains('absolute')).toBe(false);
    });

    it('uses the full content height when footer props are omitted', () => {
        const { container } = render(
            <BoostFooterLayout>
                <div>Full screen</div>
            </BoostFooterLayout>
        );

        expect(container.querySelector('footer')).toBeNull();
    });

    it('lets nested Ionic content own scrolling without competing overflow styles', () => {
        const { container } = render(
            <BoostFooterLayout contentOwnsScroll>
                <div>Nested scroller</div>
            </BoostFooterLayout>
        );
        const content = screen.getByText('Nested scroller').parentElement;

        expect(content?.classList.contains('overflow-hidden')).toBe(true);
        expect(content?.classList.contains('overflow-y-auto')).toBe(false);
        expect(container.querySelector('footer')).toBeNull();
    });
});
