import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const assets = vi.hoisted(() => ({ textLogoDark: '/branding/logo.svg' }));
const themeMocks = vi.hoisted(() => ({ getThemedCategoryIcons: vi.fn() }));
vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: '/home' }),
    useHistory: () => ({ push: vi.fn() }),
}));
vi.mock('../config/brandingAssets', () => ({ useTenantBrandingAssets: () => assets }));
vi.mock('../theme/hooks/useTheme', () => ({
    default: () => ({
        getThemedCategoryColors: () => ({}),
        getThemedCategoryIcons: themeMocks.getThemedCategoryIcons,
    }),
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

const ColorfulBadgeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg data-testid="colorful-badge-icon" className={className} />
);

const FormalBadgeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg data-testid="formal-badge-icon" className={className} />
);

beforeEach(() => {
    assets.textLogoDark = '/branding/logo.svg';
    themeMocks.getThemedCategoryIcons.mockReset();
    themeMocks.getThemedCategoryIcons.mockReturnValue({ Icon: ColorfulBadgeIcon });
});
afterEach(cleanup);

describe('asset rendering', () => {
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

    it('uses the active themed category icon instead of a legacy image', () => {
        const { container, rerender } = render(
            <CategoryDescriptorModal
                category={CredentialCategoryEnum.socialBadge}
                handleCloseModal={vi.fn()}
            />
        );

        expect(container.querySelector('img')).toBeNull();
        expect(themeMocks.getThemedCategoryIcons).toHaveBeenCalledWith(
            CredentialCategoryEnum.socialBadge
        );
        expect(screen.getByTestId('colorful-badge-icon')).toHaveAttribute(
            'class',
            'w-[100px] h-[100px]'
        );

        themeMocks.getThemedCategoryIcons.mockReturnValue({ Icon: FormalBadgeIcon });
        rerender(
            <CategoryDescriptorModal
                category={CredentialCategoryEnum.socialBadge}
                handleCloseModal={vi.fn()}
            />
        );

        expect(screen.queryByTestId('colorful-badge-icon')).toBeNull();
        expect(screen.getByTestId('formal-badge-icon')).toBeVisible();
    });
});
