// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { BoostGenericCard } from '../BoostGenericCard';

/**
 * LC-2066 regression guard.
 *
 * The thumbnail wrapper added for the revoked/suspended grayscale treatment
 * (#1366) sits directly inside the card's `<button>`. On iOS 18 WebKit a bare
 * block child of a <button> flex container is laid out shrink-to-fit (UA
 * `align-items: flex-start` per the HTML spec), so the badge — which sizes
 * itself with `width: 100%` — collapses to the width of its 116px circle and
 * the header artwork no longer runs under the absolutely-positioned options
 * ("...") button. iOS 26+/desktop engines compute `align-items: normal` and
 * stretch the wrapper, which masks the bug. The wrapper must therefore carry
 * its own explicit width. Verified by A/B on an iOS 18.1 simulator:
 * without width the wrapper measures 116px, with it 160px.
 */
describe('BoostGenericCard thumbnail wrapper', () => {
    const getThumbWrapper = (container: HTMLElement) => {
        const badge = container.querySelector('[data-testid="thumb-child"]');
        expect(badge).not.toBeNull();

        return badge!.parentElement as HTMLElement;
    };

    test('gives the custom thumbnail wrapper an explicit full width', () => {
        const { container } = render(
            <BoostGenericCard
                title="Camp Counselor"
                customThumbComponent={<div data-testid="thumb-child" style={{ width: '100%' }} />}
                optionsTriggerOnClick={() => {}}
            />
        );

        expect(getThumbWrapper(container).style.width).toBe('100%');
    });

    test('keeps the explicit width when the credential is revoked', () => {
        const { container } = render(
            <BoostGenericCard
                title="Camp Counselor"
                customThumbComponent={<div data-testid="thumb-child" style={{ width: '100%' }} />}
                optionsTriggerOnClick={() => {}}
                lifecycleStatus="revoked"
            />
        );

        const wrapper = getThumbWrapper(container);

        expect(wrapper.style.width).toBe('100%');
        // The grayscale treatment must survive alongside the width.
        expect(wrapper.style.filter).toContain('grayscale');
    });
});
