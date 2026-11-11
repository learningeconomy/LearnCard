// @vitest-environment happy-dom

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({ wrapper: vi.fn() }));

vi.mock('learn-card-base', async () => {
    const metadata = await vi.importActual<
        typeof import('learn-card-base/types/boostAndCredentialMetadata')
    >('learn-card-base/types/boostAndCredentialMetadata');

    return {
        ...metadata,
        BoostPageViewMode: { Card: 'card', List: 'list' },
        BoostGenericCardWrapper: (props: { type?: string; categoryType?: string }) => {
            host.wrapper(props);
            return null;
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
}));
vi.mock('../boostCMS/BoostPreview/BoostPreview', () => ({ default: () => null }));
vi.mock('../boostCMS/BoostPreview/NonBoostPreview', () => ({ default: () => null }));
vi.mock('../boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadge', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getCredentialSubject: () => undefined,
    getUrlFromImage: () => '',
    getImageUrlFromCredential: () => '',
    getCredentialName: () => 'Health and Well-being Challenge',
    unwrapBoostCredential: (credential: unknown) => credential,
    isBoostCredential: () => false,
}));
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

import {
    CredentialCategoryEnum,
    categoryMetadata,
} from 'learn-card-base/types/boostAndCredentialMetadata';
import BoostEarnedCard, { BoostEarnedCardSkeleton } from './BoostEarnedCard';

const achievementSubtype = categoryMetadata[CredentialCategoryEnum.achievement].walletSubtype;

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: { id: 'did:example:scout' },
    name: 'Health and Well-being Challenge',
};

describe('BoostEarnedCard category fallback', () => {
    it.each(['Not A Category', undefined])(
        'renders with Achievement metadata when the category is %j',
        categoryType => {
            expect(() =>
                render(
                    <BoostEarnedCard
                        credential={credential as never}
                        defaultImg=""
                        categoryType={categoryType as never}
                    />
                )
            ).not.toThrow();

            expect(host.wrapper).toHaveBeenCalled();
            expect(
                host.wrapper.mock.calls.every(
                    ([props]) => props.categoryType === CredentialCategoryEnum.achievement
                )
            ).toBe(true);
        }
    );

    it.each(['Not A Category', undefined])(
        'renders the skeleton with Achievement metadata when the category is %j',
        categoryType => {
            expect(() =>
                render(<BoostEarnedCardSkeleton categoryType={categoryType as never} />)
            ).not.toThrow();

            expect(host.wrapper).toHaveBeenCalledWith(
                expect.objectContaining({ type: achievementSubtype })
            );
        }
    );
});
