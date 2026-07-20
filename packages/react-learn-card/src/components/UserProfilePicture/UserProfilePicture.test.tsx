// @vitest-environment jsdom

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import UserProfilePicture from './UserProfilePicture';

describe('UserProfilePicture broken-image fallback', () => {
    test('renders the img when a src is provided', () => {
        const { container } = render(
            <UserProfilePicture user={{ image: 'https://example.com/a.png', name: 'Ada' }} />
        );
        expect(container.querySelector('img')).not.toBeNull();
    });

    test('falls back to initial avatar when the image fails to load', () => {
        const { container } = render(
            <UserProfilePicture user={{ image: 'https://example.com/broken.png', name: 'Ada' }} />
        );

        const img = container.querySelector('img');
        expect(img).not.toBeNull();

        fireEvent.error(img!);

        expect(container.querySelector('img')).toBeNull();
        expect(container.textContent).toContain('A');
    });

    test('falls back to fingerprint icon on error when variant is fingerprint', () => {
        const { container } = render(
            <UserProfilePicture
                user={{ image: 'https://example.com/broken.png', name: '' }}
                avatarFallbackVariant="fingerprint"
            />
        );

        fireEvent.error(container.querySelector('img')!);

        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('svg')).not.toBeNull();
    });
});
