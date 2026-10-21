import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrandingConfig } from '../types';

const { profile } = vi.hoisted(() => ({ profile: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useGetCurrentLCNUser: () => ({ currentLCNUser: profile(), refetch: vi.fn() }),
    useWallet: () => ({ initWallet: vi.fn() }),
    useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
    getLogger: () => ({ error: vi.fn() }),
}));
vi.mock('learn-card-base/hooks/useToast', () => ({
    useToast: () => ({ presentToast: vi.fn() }),
    ToastTypeEnum: { Success: 'success', Error: 'error' },
}));

import { BrandingTab } from './BrandingTab';

afterEach(cleanup);

describe('issuer LinkedIn branding setting', () => {
    it('uses loaded branding over an older profile cache, including a removed setting', () => {
        profile.mockReturnValue({ profileId: 'issuer', displayName: 'Issuer' });
        const branding: BrandingConfig = {
            displayName: 'Issuer',
            image: '',
            shortBio: '',
            bio: '',
            display: {},
            linkedInOrganizationId: '12345',
        };
        const { rerender } = render(<BrandingTab branding={branding} />);
        const field = screen.getByLabelText('LinkedIn organization ID (optional)');
        expect(field).toHaveValue('12345');

        profile.mockReturnValue({
            profileId: 'issuer',
            displayName: 'Issuer',
            linkedInOrganizationId: '12345',
        });
        rerender(<BrandingTab branding={{ ...branding, linkedInOrganizationId: undefined }} />);
        expect(field).toHaveValue('');

        fireEvent.change(field, { target: { value: 'company-page' } });
        expect(screen.getByRole('alert')).toHaveTextContent('Enter digits only.');
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
        fireEvent.change(field, { target: { value: '' } });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    });
});
