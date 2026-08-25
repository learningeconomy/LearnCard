import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
    relationship: {
        data: {
            pages: [
                {
                    connectedAt: undefined as string | undefined,
                    sentCount: 2,
                    receivedCount: 1,
                    records: [
                        {
                            uri: 'lc:credential:one',
                            to: 'janet',
                            from: 'me',
                            sent: '2026-08-01T00:00:00.000Z',
                            received: '2026-08-02T00:00:00.000Z',
                            direction: 'sent' as const,
                        },
                    ],
                    hasMore: false,
                },
            ],
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
    newModal: vi.fn(),
    closeModal: vi.fn(),
    presentToast: vi.fn(),
    presentAlert: vi.fn(),
    dismissAlert: vi.fn(),
    gate: vi.fn().mockResolvedValue({ prompted: false }),
}));

vi.mock('@capacitor/clipboard', () => ({
    Clipboard: { write: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ 'aria-label': ariaLabel }: { 'aria-label'?: string }) => (
        <span aria-label={ariaLabel} />
    ),
    IonSpinner: () => <span data-testid="spinner" />,
    useIonAlert: () => [mocks.presentAlert, mocks.dismissAlert],
}));

vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    ModalTypes: { FullScreen: 'full-screen' },
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    useGetContactRelationship: () => mocks.relationship,
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
    useToast: () => ({ presentToast: mocks.presentToast }),
}));

vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));

vi.mock('../../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: mocks.gate }),
}));

vi.mock('../../../components/learncard/LearnCardIdView', () => ({
    default: ({ user }: { user: { displayName: string } }) => (
        <div data-testid="identity-card">{user.displayName}</div>
    ),
}));

vi.mock('./ContactCredentialPreview', () => ({
    default: ({ record }: { record: { uri: string } }) => (
        <div data-testid="credential-preview">{record.uri}</div>
    ),
}));

vi.mock('./ContactCredentialHistoryModal', () => ({ default: () => null }));
vi.mock('./SendContactCredentialsModal', () => ({ default: () => null }));
vi.mock('../../../components/boost/boost-template/BoostTemplateSelector', () => ({
    default: () => null,
}));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));

import { AddressBookContactRelationshipView } from './AddressBookContactRelationshipView';

const contact = {
    profileId: 'janet',
    displayName: 'Janet Yoon',
    shortBio: '',
    bio: '',
    did: 'did:web:example:janet',
} as any;

const renderView = () =>
    render(
        <QueryClientProvider client={new QueryClient()}>
            <AddressBookContactRelationshipView contact={contact} />
        </QueryClientProvider>
    );

describe('AddressBookContactRelationshipView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.relationship.data.pages[0]!.connectedAt = undefined;
        mocks.relationship.data.pages[0]!.sentCount = 2;
        mocks.relationship.data.pages[0]!.receivedCount = 1;
        mocks.relationship.isLoading = false;
        mocks.relationship.isError = false;
    });

    it('shows the legacy connection fallback and accepted exchange totals', () => {
        renderView();

        expect(screen.getByText('Connected')).toBeTruthy();
        expect(screen.getByText('3 Credentials exchanged')).toBeTruthy();
        expect(screen.getByText('They sent 1, you sent 2')).toBeTruthy();
        expect(screen.getByTestId('credential-preview')).toBeTruthy();
    });

    it('formats a recorded connection month in the active locale', () => {
        mocks.relationship.data.pages[0]!.connectedAt = '2026-03-12T10:00:00.000Z';
        renderView();

        expect(screen.getByText('Connected since March 2026')).toBeTruthy();
    });

    it('opens the Boost and Send Credential flows for the selected contact', async () => {
        renderView();

        fireEvent.click(screen.getByRole('button', { name: 'Boost Janet Yoon' }));
        fireEvent.click(screen.getByRole('button', { name: 'Send Credential' }));

        await waitFor(() => expect(mocks.gate).toHaveBeenCalledTimes(2));
        expect(mocks.newModal).toHaveBeenCalledTimes(2);
    });

    it('keeps contact actions available when history fails', () => {
        mocks.relationship.isError = true;
        renderView();

        expect(screen.getByText("We couldn't load your shared credential history.")).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Boost Janet Yoon' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Send Credential' })).toBeTruthy();
    });
});
