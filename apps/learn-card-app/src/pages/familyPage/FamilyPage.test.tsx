import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { newModalMock, replaceMock } = vi.hoisted(() => ({
    newModalMock: vi.fn(),
    replaceMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ replace: replaceMock }),
}));

vi.mock('react-error-boundary', () => ({
    ErrorBoundary: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@ionic/react', () => ({
    IonContent: ({ children }: React.PropsWithChildren) => <main>{children}</main>,
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('learn-card-base/stores/credentialSearchStore', () => ({
    default: { set: { reset: vi.fn() } },
}));

vi.mock('learn-card-base/svgs/Plus', () => ({ default: () => null }));

vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: { family: 'family' },
    BoostPageViewMode: { Card: 'card' },
    CredentialCategoryEnum: { family: 'family' },
    CredentialListTabEnum: { Earned: 'earned', Managed: 'managed' },
    EarnedAndManagedTabs: () => null,
    ModalTypes: { FullScreen: 'full-screen' },
    lazyWithRetry: () => () => null,
    switchedProfileStore: { use: { isSwitchedProfile: () => false } },
    useCountBoosts: () => ({ data: 0 }),
    useGetCredentialCount: () => ({ data: 0, isLoading: false }),
    useGetCredentialList: () => ({
        data: { pages: [{ records: [] }] },
        isLoading: false,
        isFetching: false,
    }),
    useGetPaginatedManagedBoosts: () => ({
        data: { pages: [{ records: [] }] },
        isLoading: false,
        isFetching: false,
    }),
    useIsCurrentUserLCNUser: () => ({ data: undefined }),
    useModal: () => ({ newModal: newModalMock, closeModal: vi.fn() }),
    usePathQuery: () => new URLSearchParams('boostUri=urn%3Atest&showPreview=true'),
}));

vi.mock('../../paraglide/messages.js', () => ({
    m: new Proxy({}, { get: () => () => '' }),
}));

vi.mock('../../components/main-subheader/MainSubHeader.types', () => ({
    SubheaderContentType: { Family: { iconColor: '', textColor: '' } },
    SubheaderTypeEnum: { Family: 'Family' },
}));

vi.mock('../../components/main-header/MainHeader', () => ({
    default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('../../components/boost/boost-managed-card/BoostManagedList', () => ({
    default: () => null,
}));
vi.mock('../../components/boost/boost-earned-card/BoostEarnedList', () => ({
    default: () => null,
}));
vi.mock('../../components/familyCMS/FamilyBoostPreview/FamilyBoostPreviewWrapper', () => ({
    default: () => null,
}));
vi.mock('../../components/generic/GenericErrorBoundary', () => ({
    default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../components/boost/hooks/useBoostModal', () => ({
    default: () => ({ handlePresentBoostModal: vi.fn() }),
}));
vi.mock('../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: vi.fn() }),
}));
vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({
        getThemedCategoryColors: () => ({
            backgroundSecondaryColor: 'white',
            backgroundPrimaryColor: 'white',
            headerTextColor: 'text-white',
        }),
    }),
}));

import FamilyPage from './FamilyPage';

describe('FamilyPage shared preview query', () => {
    it('consumes the query params as soon as it opens the preview', async () => {
        render(<FamilyPage />);

        await waitFor(() => expect(newModalMock).toHaveBeenCalledOnce());
        expect(replaceMock).toHaveBeenCalledWith('/families');
    });
});
