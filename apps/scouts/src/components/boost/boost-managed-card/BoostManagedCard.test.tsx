// @vitest-environment happy-dom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setLocale } from '../../../paraglide/runtime.js';
import BoostManagedCard from './BoostManagedCard';

vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@learncard/react', () => ({
    BoostSmallCard: ({ customButtonComponent }: { customButtonComponent?: React.ReactNode }) => (
        <div>{customButtonComponent}</div>
    ),
}));

vi.mock('learn-card-base', () => ({
    BrandingEnum: { scoutPass: 'scoutPass' },
    BoostCategoryOptionsEnum: { socialBadge: 'Social Badge' },
    BoostPageViewMode: { Card: 'card' },
    CredentialCategoryEnum: { achievement: 'Achievement', socialBadge: 'Social Badge' },
    categoryMetadata: { Achievement: { walletSubtype: 'achievement' } },
    getBoostMetadata: () => ({
        color: 'sp-blue-dark-ocean',
        credentialType: 'Achievement',
    }),
    useGetBoostParents: () => ({ data: { records: [] } }),
    useGetBoostPermissions: () => ({ data: { canEdit: true, canEditChildren: false } }),
}));

vi.mock('../../../hooks/useManagedBoost', () => ({
    default: () => ({
        cred: {},
        boostVC: {
            credentialSubject: { achievement: { name: 'Patch Trading Pro' } },
        },
        isLive: false,
        isDraft: true,
        recipients: [],
        thumbImage: '',
        issueHistory: undefined,
        showSkeleton: false,
        recipientCount: 0,
        badgeThumbnail: '',
        recipientsLoading: false,
        handleEditOnClick: vi.fn(),
        handleIssueOnClick: vi.fn(),
        handleOptionsMenu: vi.fn(),
        presentManagedBoostModal: vi.fn(),
        handlePresentShortBoostModal: vi.fn(),
    }),
}));

vi.mock('../../boost/boostCMS/BoostPreview/BoostPreviewBody', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadge', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/BoostListItem', () => ({ default: () => null }));
vi.mock('learn-card-base/components/loaders/LoadingSpinner', () => ({
    LoadingSpinner: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons', () => ({
    BoostSkeleton: () => null,
    default: () => null,
}));

describe('BoostManagedCard', () => {
    afterEach(() => {
        cleanup();
        setLocale('en', { reload: false });
    });

    it('uses a compact French draft action label', () => {
        setLocale('fr', { reload: false });

        render(
            <BoostManagedCard
                boost={{ uri: 'urn:boost:draft', name: 'Patch Trading Pro' } as never}
                defaultImg=""
                categoryType="Social Badge"
            />
        );

        expect(screen.getByRole('button', { name: 'Modifier' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Modifier le brouillon' })).toBeNull();
    });

    it('gives translated draft actions room to grow inside the pill', () => {
        setLocale('fr', { reload: false });

        render(
            <BoostManagedCard
                boost={{ uri: 'urn:boost:draft', name: 'Patch Trading Pro' } as never}
                defaultImg=""
                categoryType="Social Badge"
            />
        );

        const editButton = screen.getByRole('button');

        expect(editButton.classList.contains('whitespace-nowrap')).toBe(true);
        expect(editButton.classList.contains('w-fit')).toBe(true);
        expect(editButton.classList.contains('min-w-[140px]')).toBe(true);
        expect(editButton.classList.contains('px-3')).toBe(true);
        expect(editButton.classList.contains('text-sm')).toBe(true);
        expect(editButton.classList.contains('leading-none')).toBe(true);
    });
});
