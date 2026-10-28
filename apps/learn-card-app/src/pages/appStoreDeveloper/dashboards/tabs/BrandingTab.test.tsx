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
import * as m from '../../../../paraglide/messages.js';

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
        const field = screen.getByLabelText(m['credentialShare.linkedInOrgId']());
        expect(field).toHaveValue('12345');

        profile.mockReturnValue({
            profileId: 'issuer',
            displayName: 'Issuer',
            linkedInOrganizationId: '12345',
        });
        rerender(<BrandingTab branding={{ ...branding, linkedInOrganizationId: undefined }} />);
        expect(field).toHaveValue('');

        fireEvent.change(field, { target: { value: 'company-page' } });
        expect(screen.getByRole('alert')).toBeVisible();
        expect(
            screen.getByRole('button', {
                name: m['developerPortal.dashboards.tabs.branding.saveChanges'](),
            })
        ).toBeDisabled();
        fireEvent.change(field, { target: { value: '' } });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: m['developerPortal.dashboards.tabs.branding.saveChanges'](),
            })
        ).toBeEnabled();
    });
});
