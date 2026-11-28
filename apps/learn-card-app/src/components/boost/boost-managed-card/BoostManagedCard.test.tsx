import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Boost, VC } from '@learncard/types';
import { createTestHistory, TestRouter } from 'learn-card-base/test-utils/testRouter';

const mocks = vi.hoisted(() => ({ credential: {} as VC }));
vi.mock('../hooks/useBoost', () => ({ default: () => ({}) }));
vi.mock('apps/learn-card-app/src/hooks/useManagedBoost', () => ({
    default: () => ({
        cred: mocks.credential,
        boostVC: mocks.credential,
        recipients: [],
        showSkeleton: false,
    }),
}));
vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@learncard/react', () => ({
    BoostSmallCard: ({ title }: { title: string }) => <h3>{title}</h3>,
}));
vi.mock('learn-card-base', () => ({
    BoostPageViewMode: { Card: 'card', List: 'list' },
    CredentialCategoryEnum: {},
    BoostCategoryOptionsEnum: {},
    getCategoryMetadata: () => ({}),
    useModal: () => ({}),
    ModalTypes: { FullScreen: 'fullscreen' },
}));
vi.mock('learn-card-base/components/boost/BoostListItem', () => ({
    default: ({ title, managedBoost }: { title: string; managedBoost: boolean }) => (
        <h3 data-managed={managedBoost}>{title}</h3>
    ),
}));
vi.mock('../../familyCMS/FamilyCard/FamilyCard', () => ({ default: () => null }));
vi.mock('./helpers/CustomManagedBoostButton', () => ({ default: () => null }));
vi.mock('../../boost/boostCMS/BoostPreview/BoostPreviewBody', () => ({ default: () => null }));
vi.mock('../boost-earned-card/helpers/CustomBoostTitleDisplay', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadgeNew', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton', () => ({
    default: () => null,
}));
vi.mock('apps/learn-card-app/src/helpers/uiHelpers', () => ({ closeAll: vi.fn() }));
vi.mock('../boostLoader/BoostLoader', () => ({ BoostIssuanceLoading: () => null }));

import BoostManagedCard from './BoostManagedCard';

const categories = [
    'Social Badge',
    'Work History',
    'Learning History',
    'Accommodation',
    'Accomplishment',
    'Achievement',
    'Qualifications',
    'ID',
] as const;

const renderCard = (ui: React.ReactElement) => {
    const history = createTestHistory();
    const wrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
        <TestRouter history={history}>{children}</TestRouter>
    );
    return render(ui, { wrapper });
};

beforeEach(() => {
    mocks.credential = {
        type: ['VerifiableCredential'],
        credentialSubject: { achievement: { name: 'Animated Short' } },
    } as VC;
});

describe('managed list titles', () => {
    it.each(categories)('preserves tile naming for %s', category => {
        const props = {
            boost: { name: 'Animated Short' } as Boost,
            defaultImg: '',
            categoryType: category,
        };
        const { rerender } = renderCard(<BoostManagedCard {...props} />);
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
        rerender(<BoostManagedCard {...props} boostPageViewMode="list" />);
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
        expect(screen.getByRole('heading').getAttribute('data-managed')).toBe('true');
    });

    it('preserves the achievement-name fallback without a boost name', () => {
        renderCard(
            <BoostManagedCard
                boost={{} as Boost}
                defaultImg=""
                categoryType="Achievement"
                boostPageViewMode="list"
            />
        );
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
    });

    it('uses the CLR course title in managed lists', () => {
        mocks.credential = {
            type: ['VerifiableCredential', 'ClrCredential'],
            name: 'School Academic Record',
            credentialSubject: {
                verifiableCredential: [
                    {
                        type: ['VerifiableCredential', 'AchievementCredential'],
                        credentialSubject: {
                            achievement: {
                                id: 'course:animation',
                                achievementType: 'Course',
                                name: 'Animation 101',
                            },
                        },
                    },
                ],
            },
        } as VC;
        renderCard(
            <BoostManagedCard
                boost={{ name: 'School Academic Record' } as Boost}
                defaultImg=""
                categoryType="Learning History"
                boostPageViewMode="list"
            />
        );
        expect(screen.getByRole('heading').textContent).toBe('Animation 101');
    });
});
