import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({
        getThemedCategory: () => ({
            icons: { Icon: () => <svg data-testid="category-icon" /> },
            colors: { primaryColor: 'pink-300' },
        }),
    }),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
    getImageUrlFromCredential: (credential: VC) => credential.image,
}));
import { ShareCredentialThumbnail } from './ShareCredentialThumbnail';

afterEach(cleanup);
describe('share credential thumbnails', () => {
    it('shows the original image without sending a referrer, plus a category cue', () => {
        const credential = { image: 'https://example.test/badge.png' } as VC;
        const { container } = render(<ShareCredentialThumbnail credential={credential} />);
        expect(container.querySelector('img')).toHaveAttribute('src', credential.image);
        expect(container.querySelector('img')).toHaveAttribute('referrerpolicy', 'no-referrer');
        expect(screen.getByTestId('category-icon')).toBeTruthy();
        expect(credential.image).toBe('https://example.test/badge.png');
    });
    it('falls back to a category icon after image failure and retries a new image', () => {
        const { container, rerender } = render(
            <ShareCredentialThumbnail credential={{ image: 'https://example.test/broken' } as VC} />
        );
        fireEvent.error(container.querySelector('img')!);
        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByTestId('category-icon')).toBeTruthy();
        rerender(
            <ShareCredentialThumbnail credential={{ image: 'https://example.test/new' } as VC} />
        );
        expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.test/new');
    });
});
