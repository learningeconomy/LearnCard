import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeycloakSignInOverlay } from './KeycloakSignInOverlay';

vi.mock('learn-card-base', () => ({
    useBrandingConfig: () => ({
        name: 'Test Brand',
        brandMarkUrl: '/test-logo.png',
    }),
}));

describe('KeycloakSignInOverlay', () => {
    it('renders signing-in phase correctly', () => {
        render(<KeycloakSignInOverlay phase="signing-in" />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('Signing you in…')).toBeInTheDocument();
        expect(screen.getByText('This only takes a moment.')).toBeInTheDocument();
        expect(screen.getByAltText('Test Brand')).toHaveAttribute('src', '/test-logo.png');
    });

    it('renders setting-up phase correctly', () => {
        render(<KeycloakSignInOverlay phase="setting-up" />);

        expect(screen.getByText('Setting up your account…')).toBeInTheDocument();
    });

    it('has reduced motion classes', () => {
        const { container } = render(<KeycloakSignInOverlay phase="signing-in" />);

        const spinner = container.querySelector('.motion-reduce\\:animate-pulse');
        expect(spinner).toBeInTheDocument();
    });
});
