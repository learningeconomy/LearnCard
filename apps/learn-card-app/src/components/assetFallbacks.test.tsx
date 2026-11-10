import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const assets = vi.hoisted(() => ({ textLogoDark: '/branding/logo.svg' }));
vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: '/home' }),
    useHistory: () => ({ push: vi.fn() }),
}));
vi.mock('../config/brandingAssets', () => ({ useTenantBrandingAssets: () => assets }));
vi.mock('../theme/hooks/useTheme', () => ({
    default: () => ({ getThemedCategoryColors: () => ({}) }),
}));
vi.mock('../stores/headerScrollStore', () => ({
    default: { use: { scrolled: () => false } },
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useTenantConfig: () => ({ branding: {} }),
}));
vi.mock('learn-card-base/config/brandingHelpers', () => ({ getHeaderText: () => 'LearnCard' }));
vi.mock('learn-card-base/components/headerBranding/headerBrandingHelpers', () => ({
    BrandingEnum: { learncard: 'learncard' },
    getHeaderBrandingColor: () => 'text-grayscale-900',
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { socialBadge: 'Social Badge', achievement: 'Achievement' },
    categoryMetadata: {
        'Social Badge': {
            title: 'Badges',
            defaultImageSrc: '/badge.png',
            IconWithShape: () => <svg data-testid="category-fallback" />,
        },
        Achievement: {
            title: 'Achievements',
            defaultImageSrc: '/achievement.png',
            IconWithShape: () => <svg data-testid="category-fallback" />,
        },
    },
}));
vi.mock('../layout/ModalLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./category-descriptor/CategoryDescriptor', () => ({ default: () => null }));

import { CredentialCategoryEnum } from 'learn-card-base';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import HeaderBranding from './headerBranding/HeaderBranding';
import CategoryDescriptorModal from './category-descriptor/CategoryDescriptorModal';

beforeEach(() => {
    assets.textLogoDark = '/branding/logo.svg';
});
afterEach(cleanup);

describe('asset load failures', () => {
    it('keeps header navigation readable after a logo failure and tries a changed URL', () => {
        const { rerender } = render(<HeaderBranding branding={BrandingEnum.learncard} />);
        fireEvent.error(screen.getByRole('img', { name: 'LearnCard' }));
        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByRole('button', { name: 'LearnCard' })).toBeVisible();

        assets.textLogoDark = '/branding/replacement.svg';
        rerender(<HeaderBranding branding={BrandingEnum.learncard} />);
        expect(screen.getByRole('img', { name: 'LearnCard' })).toHaveAttribute(
            'src',
            '/branding/replacement.svg'
        );
    });

    it('uses the category icon on image failure without suppressing another category image', () => {
        const { container, rerender } = render(
            <CategoryDescriptorModal
                category={CredentialCategoryEnum.socialBadge}
                handleCloseModal={vi.fn()}
            />
        );
        fireEvent.error(container.querySelector('img')!);
        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByTestId('category-fallback')).toBeVisible();

        rerender(
            <CategoryDescriptorModal
                category={CredentialCategoryEnum.achievement}
                handleCloseModal={vi.fn()}
            />
        );
        expect(container.querySelector('img')).toHaveAttribute('src', '/achievement.png');
        expect(screen.queryByTestId('category-fallback')).toBeNull();
    });
});
