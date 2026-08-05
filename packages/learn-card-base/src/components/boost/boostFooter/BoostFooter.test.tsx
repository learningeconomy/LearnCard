// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base/i18n', () => ({
    useT: () => (key: string) => key,
}));

vi.mock('learn-card-base/svgs/ReplyIcon', () => ({
    default: () => null,
}));

vi.mock('learn-card-base/svgs/ThreeDots', () => ({
    default: () => null,
}));

vi.mock('learn-card-base/svgs/X', () => ({
    default: () => null,
}));

vi.mock('learn-card-base/svgs/ExpandIcon', () => ({
    default: () => null,
}));

import BoostFooter from './BoostFooter';

describe('BoostFooter safe-area layout', () => {
    it('grows beyond its design height and keeps controls above the live bottom inset', () => {
        const { container } = render(<BoostFooter handleClaim={vi.fn()} />);
        const footer = container.querySelector('footer');

        expect(footer).not.toBeNull();
        expect(footer?.classList.contains('min-h-[85px]')).toBe(true);
        expect(footer?.classList.contains('h-[85px]')).toBe(false);
        expect(footer?.style.paddingBottom).toBe('calc(20px + var(--ion-safe-area-bottom, 0px))');
    });
});
