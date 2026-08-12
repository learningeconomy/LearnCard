// @vitest-environment jsdom

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import BadgeThumbnailImg from './BadgeThumbnailImg';

describe('BadgeThumbnailImg (react-learn-card) broken-image fallback', () => {
    test('renders the image when a valid src is provided', () => {
        const { container, queryByTestId } = render(
            <BadgeThumbnailImg src="https://example.com/badge.png" />
        );

        const img = container.querySelector('img');
        expect(img).not.toBeNull();
        expect(img?.className).toContain('bg-white');
        expect(queryByTestId('badge-thumbnail-placeholder')).toBeNull();
    });

    test('shows the placeholder glyph when the image fails to load (404)', () => {
        const { container, queryByTestId } = render(
            <BadgeThumbnailImg src="https://example.com/broken.png" />
        );

        fireEvent.error(container.querySelector('img')!);

        expect(container.querySelector('img')).toBeNull();
        expect(queryByTestId('badge-thumbnail-placeholder')).not.toBeNull();
    });

    test('shows the placeholder glyph immediately when src is empty', () => {
        const { queryByTestId } = render(<BadgeThumbnailImg src="" />);

        expect(queryByTestId('badge-thumbnail-placeholder')).not.toBeNull();
    });

    test('applies a custom placeholder color class', () => {
        const { queryByTestId } = render(
            <BadgeThumbnailImg src="" placeholderClassName="text-white" />
        );

        expect(queryByTestId('badge-thumbnail-placeholder')?.getAttribute('class')).toContain(
            'text-white'
        );
    });
});
