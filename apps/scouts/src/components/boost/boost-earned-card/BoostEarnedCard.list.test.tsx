// @vitest-environment happy-dom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// List mode renders through the real BoostGenericCardWrapper -> BoostListItem path. Only leaf
// dependencies (Ionic, hooks, stores, icons) are stubbed; the wrapper and list row are not.
const real = vi.hoisted(() => ({
    Wrapper: undefined as undefined | React.ComponentType<Record<string, unknown>>,
}));

vi.mock('learn-card-base', async () => {
    const metadata = await vi.importActual<
        typeof import('learn-card-base/types/boostAndCredentialMetadata')
    >('learn-card-base/types/boostAndCredentialMetadata');

    return {
        ...metadata,
        BoostPageViewMode: { Card: 'card', List: 'list' },
        BoostGenericCardWrapper: (props: Record<string, unknown>) => {
            const Wrapper = real.Wrapper!;
            return <Wrapper {...props} />;
        },
        resetIonicModalBackground: vi.fn(),
        setIonicModalBackground: vi.fn(),
        useGetResolvedCredential: () => ({ data: undefined, isFetching: false, isLoading: false }),
        useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
        useGetVCInfo: () => ({ loading: false }),
        useGetBoostParents: () => ({ data: { records: [] } }),
        ModalTypes: { FullScreen: 'FullScreen' },
    };
});

vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonRow: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
    ),
}));
vi.mock('@learncard/react', () => ({
    BoostGenericCard: () => null,
    isDid: () => false,
    formatDidDisplayName: (did: string) => did,
    getLifecycleTreatment: () => ({ isInactive: false, mediaStyle: undefined, pillBg: undefined }),
}));
vi.mock('learn-card-base/components/earned-and-managed-tabs/EarnedAndManagedTabs', () => ({
    BoostPageViewMode: { Card: 'card', List: 'list' },
}));
vi.mock('learn-card-base/hooks/useGetIssuerName', () => ({ default: () => 'Troop 7' }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    default: () => null,
    getInfoFromCredential: () => ({ createdAt: 'October 16 2026' }),
}));
vi.mock('learn-card-base/components/CredentialBadge/BadgeThumbnailImg', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/CredentialBadge/CredentialMediaBadge', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadge', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/helpers/display.helpers', () => ({
    DisplayTypeEnum: { Media: 'media' },
    getAttachmentTypeIcon: () => ({ AttachmentIcon: () => null, title: '' }),
    getDisplayIcon: () => () => null,
}));
vi.mock('learn-card-base/components/boost/boost', () => ({
    BoostMediaOptionsEnum: { photo: 'photo' },
}));
vi.mock('learn-card-base/stores/newCredsStore', () => ({
    newCredsStore: { use: { newCreds: () => ({}) } },
}));
vi.mock('learn-card-base/svgs/DotIcon', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/ThreeDots', () => ({ default: () => null }));
vi.mock('learn-card-base/i18n', () => ({
    useI18nLocale: () => 'en',
    useT: () => (key: string) => key,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons', () => ({
    default: () => null,
    BoostSkeleton: () => null,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getCredentialSubject: () => undefined,
    getUrlFromImage: () => '',
    getImageUrlFromCredential: () => '',
    getCredentialName: () => 'Health and Well-being Challenge',
    unwrapBoostCredential: (credential: unknown) => credential,
    isBoostCredential: () => false,
    getAchievementType: () => undefined,
    getAchievementTypeDisplayText: () => '',
    getIssuer: () => 'did:example:issuer',
    getIssuanceDate: () => '2026-10-16T00:00:00.000Z',
}));
vi.mock('../boostCMS/BoostPreview/BoostPreview', () => ({ default: () => null }));
vi.mock('../boostCMS/BoostPreview/NonBoostPreview', () => ({ default: () => null }));
vi.mock('../boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../hooks/useBoostMenu', () => ({
    default: () => ({ handlePresentBoostMenuModal: vi.fn() }),
    BoostMenuType: { earned: 'earned' },
}));
vi.mock('../../../hooks/useHighlightedCredentials', () => ({
    useHighlightedCredentials: () => ({ credentials: [] }),
}));
vi.mock('../../../helpers/troop.helpers', () => ({
    getRoleFromCred: () => undefined,
    getScoutsNounForRole: () => undefined,
}));

import { BoostGenericCardWrapper } from 'learn-card-base/components/wrappers/BoostGenericCardWrapper';
import BoostEarnedCard, { BoostEarnedCardSkeleton } from './BoostEarnedCard';

real.Wrapper = BoostGenericCardWrapper as unknown as React.ComponentType<Record<string, unknown>>;

const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:scout' },
    name: 'Health and Well-being Challenge',
};

const categories = ['Not A Category', undefined];

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('BoostEarnedCard list view category fallback', () => {
    it.each(categories)('renders the list row when the category is %j', categoryType => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <BoostEarnedCard
                credential={credential as never}
                defaultImg=""
                categoryType={categoryType as never}
                boostPageViewMode="list"
            />
        );

        expect(screen.queryByText('Something went wrong')).toBeNull();
        expect(screen.getByText('Health and Well-being Challenge')).toBeTruthy();
    });

    it.each(categories)('renders the loading list row when the category is %j', categoryType => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <BoostEarnedCard
                credential={credential as never}
                defaultImg=""
                categoryType={categoryType as never}
                boostPageViewMode="list"
                loading
            />
        );

        expect(screen.queryByText('Something went wrong')).toBeNull();
        expect(screen.getByTestId('boost-list-item-loading')).toBeTruthy();
    });

    it.each(categories)('renders the list skeleton when the category is %j', categoryType => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <BoostEarnedCardSkeleton
                categoryType={categoryType as never}
                boostPageViewMode="list"
            />
        );

        expect(screen.queryByText('Something went wrong')).toBeNull();
        expect(screen.getByTestId('boost-list-item-loading')).toBeTruthy();
    });
});
