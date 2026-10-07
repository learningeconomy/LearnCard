// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useManagedBoost } from './useManagedBoost';

const { closeModal, push } = vi.hoisted(() => ({
    closeModal: vi.fn(),
    push: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push }),
}));

vi.mock('learn-card-base', () => ({
    BoostUserTypeEnum: { someone: 'someone' },
    BrandingEnum: {},
    CredentialBadge: () => null,
    CredentialCategory: {},
    CredentialCategoryEnum: { meritBadge: 'Merit Badge' },
    ModalTypes: { FullScreen: 'FullScreen' },
    ProfilePicture: () => null,
    UserProfilePicture: () => null,
    resetIonicModalBackground: vi.fn(),
    setIonicModalBackground: vi.fn(),
    useCountBoostRecipients: () => ({ data: 0 }),
    useCurrentUser: () => ({}),
    useGetBoostRecipients: () => ({ data: [], isLoading: false }),
    useGetProfile: () => ({ data: undefined, isLoading: false }),
    useModal: () => ({ closeModal, newModal: vi.fn() }),
    useResolveBoost: () => ({ data: undefined, isFetching: false, isLoading: false }),
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getImageUrlFromCredential: () => undefined,
    unwrapBoostCredential: () => undefined,
}));

vi.mock('../components/boost/hooks/useBoostMenu', () => ({
    BoostMenuType: { managed: 'managed' },
    default: () => ({ handlePresentBoostMenuModal: vi.fn() }),
}));

vi.mock('../components/boost/hooks/useShortBoost', () => ({
    default: () => ({ handlePresentShortBoostModal: vi.fn() }),
}));

vi.mock('../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../i18n/formatters', () => ({
    formatLocaleDate: vi.fn(),
    formatLocaleTime: vi.fn(),
}));
vi.mock('../components/boost/boostCMS/BoostPreview/BoostPreview', () => ({
    default: () => null,
}));
vi.mock('../components/boost/boostCMS/BoostPreview/BoostPreviewBody', () => ({
    default: () => null,
}));
vi.mock('../components/boost/boostCMS/BoostPreview/BoostPreviewFooter', () => ({
    default: () => null,
}));
vi.mock('../components/boost/boostCMS/UpdateBoostCMS', () => ({ default: () => null }));
vi.mock('@ionic/react', () => ({ IonItem: () => null, IonList: () => null }));

const ManagedBoostHarness: React.FC = () => {
    const { handleEditOnClick } = useManagedBoost(
        {
            uri: 'urn:boost:draft',
            category: 'Social Badge',
            type: 'ext:Adventurer',
            status: 'DRAFT',
        } as never,
        {
            boostVC: {} as never,
            categoryType: 'Social Badge' as never,
            overrideCustomize: true,
        }
    );

    return <button onClick={handleEditOnClick}>Edit draft</button>;
};

describe('useManagedBoost draft navigation', () => {
    beforeEach(() => {
        closeModal.mockClear();
        push.mockClear();
    });

    afterEach(cleanup);

    it('keeps the achievement type and customization override in separate query parameters', () => {
        render(<ManagedBoostHarness />);

        fireEvent.click(screen.getByRole('button', { name: 'Edit draft' }));

        const destination = push.mock.calls[0]?.[0] as string;
        const query = new URLSearchParams(destination.split('?')[1]);

        expect(query.get('boostSubCategoryType')).toBe('ext:Adventurer');
        expect(query.get('overrideCustomize')).toBe('true');
    });
});
