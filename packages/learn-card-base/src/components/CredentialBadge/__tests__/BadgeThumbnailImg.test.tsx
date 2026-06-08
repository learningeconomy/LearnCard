// @vitest-environment jsdom

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import BadgeThumbnailImg from '../BadgeThumbnailImg';

describe('BadgeThumbnailImg broken-image fallback', () => {
    test('renders the badge image when a valid src is provided', () => {
        const { container, queryByTestId } = render(
            <BadgeThumbnailImg src="https://example.com/badge.png" />
        );

        const img = container.querySelector('img');
        expect(img).not.toBeNull();
        expect(img?.getAttribute('alt')).toBe('badge thumbnail');
        // White backing so transparent logos don't pick up the badge ring color.
        expect(img?.className).toContain('bg-white');
        expect(queryByTestId('badge-thumbnail-placeholder')).toBeNull();
    });

    test('shows the placeholder glyph when the image fails to load (404)', () => {
        const { container, queryByTestId } = render(
            <BadgeThumbnailImg src="https://example.com/broken.png" />
        );

        const img = container.querySelector('img');
        expect(img).not.toBeNull();

        fireEvent.error(img!);

        expect(container.querySelector('img')).toBeNull();
        expect(queryByTestId('badge-thumbnail-placeholder')).not.toBeNull();
    });

    test('shows the placeholder glyph immediately when src is empty', () => {
        const { container, queryByTestId } = render(<BadgeThumbnailImg src="" />);

        expect(container.querySelector('img')).toBeNull();
        expect(queryByTestId('badge-thumbnail-placeholder')).not.toBeNull();
    });
});
