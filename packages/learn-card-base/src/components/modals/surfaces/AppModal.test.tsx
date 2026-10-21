// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppModal } from './AppModal';

// GenericErrorBoundary imports isLocalhost from the 'learn-card-base' barrel,
// which would pull in the whole SDK (web3auth et al.) in the test env. Mock the
// barrel to the single symbol the component tree actually reads.
vi.mock('learn-card-base', () => ({
    isLocalhost: false,
}));

describe('AppModal', () => {
    it('renders aside > dimmer + section with surface classes', () => {
        const { container } = render(
            <AppModal rootId="full-screen-modal" variant="fullscreen" open onDimmerClick={() => {}}>
                <p>content</p>
            </AppModal>
        );
        const aside = container.querySelector('aside#full-screen-modal')!;
        expect(aside.classList.contains('open')).toBe(true);
        const section = aside.querySelector(':scope > section')!;
        expect(section.classList.contains('lc-surface')).toBe(true);
        expect(section.classList.contains('lc-surface--fullscreen')).toBe(true);
        expect(aside.querySelector(':scope > button.full-screen-modal-dimmer')).not.toBeNull();
        // content is a DIRECT child of section — no wrapper divs
        expect(section.firstElementChild?.tagName).toBe('P');
    });

    it('puts the surface class on the aside for centered variants', () => {
        const { container } = render(
            <AppModal rootId="center-modal" variant="center" open onDimmerClick={() => {}}>
                <p>content</p>
            </AppModal>
        );
        const aside = container.querySelector('aside#center-modal')!;
        expect(aside.classList.contains('lc-overlay--center')).toBe(true);
        expect(aside.querySelector(':scope > section')!.classList.contains('lc-surface')).toBe(
            false
        );
    });

    it('honors hideDimmer, closed state, inset="none", and fullBleed', () => {
        const { container } = render(
            <AppModal
                rootId="right-modal"
                variant="right"
                open={false}
                hideDimmer
                inset="none"
                fullBleed
                onDimmerClick={() => {}}
            >
                <p>content</p>
            </AppModal>
        );
        const aside = container.querySelector('aside#right-modal')!;
        expect(aside.classList.contains('closed')).toBe(true);
        expect(aside.querySelector(':scope > button')).toBeNull();
        const section = aside.querySelector(':scope > section')!;
        expect(section.classList.contains('lc-surface--no-inset')).toBe(true);
        expect(section.classList.contains('lc-surface--full-bleed')).toBe(true);
    });

    it('renders header and footer slots as direct section children, in flow', () => {
        const { container } = render(
            <AppModal
                rootId="full-screen-modal"
                variant="fullscreen"
                open
                onDimmerClick={() => {}}
                header={<h1>H</h1>}
                footer={<nav>F</nav>}
            >
                <p>content</p>
            </AppModal>
        );
        const section = container.querySelector('section')!;
        const tags = [...section.children].map(el => el.tagName);
        expect(tags).toEqual(['H1', 'P', 'NAV']);
    });

    it('applies rootStyle to the aside root', () => {
        const { container } = render(
            <AppModal
                rootId="full-screen-modal"
                variant="fullscreen"
                open
                onDimmerClick={() => {}}
                rootStyle={{
                    backgroundImage: 'url(https://example.com/bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <p>content</p>
            </AppModal>
        );
        const aside = container.querySelector('aside#full-screen-modal')!;
        // jsdom normalizes url() serialization to include quotes
        expect(aside.style.backgroundImage).toBe('url("https://example.com/bg.jpg")');
        expect(aside.style.backgroundSize).toBe('cover');
        expect(aside.style.backgroundPosition).toBe('center');
    });

    it('renders afterSection as a SIBLING after the main section', () => {
        const { container } = render(
            <AppModal
                rootId="cancel-modal"
                variant="cancel"
                open
                onDimmerClick={() => {}}
                afterSection={<section className="close-card">Close</section>}
            >
                <p>content</p>
            </AppModal>
        );
        const aside = container.querySelector('aside#cancel-modal')!;
        const sections = aside.querySelectorAll(':scope > section');
        expect(sections.length).toBe(2);
        expect(sections[1].classList.contains('close-card')).toBe(true);
        // main section must NOT contain the after-section
        expect(sections[0].querySelector('section')).toBeNull();
    });
});
