// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import type { LCR } from 'learn-card-base/types/credential-records';

/**
 * CREDENTIAL_REFRESHED notification card tests (LC-2117/LC-2135/LC-2136 Task 14).
 *
 * The card renders only the server's generic translated copy — never subject data
 * from the notification payload. Tapping it locates the wallet index record via the
 * encrypted refresh metadata (the managed refreshId inside `refresh.serviceId`),
 * forces a targeted refresh bypassing the staleness guard, and opens the newest
 * current URI on success. On failure the existing current credential still opens
 * alongside friendly connection copy.
 */

const modalHost = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
}));

const toastHost = vi.hoisted(() => ({
    presentToast: vi.fn(),
}));

const walletHost = vi.hoisted(() => ({
    indexGet: vi.fn(),
    readGet: vi.fn(),
}));

const refreshHost = vi.hoisted(() => ({
    forceRefresh: vi.fn(),
}));

vi.mock('@sentry/react', () => ({
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// The learn-card-base barrel pulls the web3auth stack and cannot load under jsdom;
// stub the exact surface the card consumes.
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        accommodation: 'Accommodation',
        accomplishment: 'Accomplishment',
        achievement: 'Achievement',
        family: 'Family',
        id: 'ID',
        learningHistory: 'Learning History',
        membership: 'Membership',
        skill: 'Skill',
        socialBadge: 'Social Badge',
        workHistory: 'Work History',
    },
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    useModal: () => ({ newModal: modalHost.newModal, closeModal: modalHost.closeModal }),
    ModalTypes: { FullScreen: 'FullScreen' },
    useWallet: () => ({
        initWallet: async () => ({
            index: { LearnCloud: { get: walletHost.indexGet } },
            read: { get: walletHost.readGet },
        }),
    }),
    useToast: () => ({ presentToast: toastHost.presentToast }),
    ToastTypeEnum: { Success: 'success', Error: 'error' },
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (vc: unknown) => vc,
}));

vi.mock('learn-card-base/svgs/Checkmark', () => ({
    default: (props: Record<string, unknown>) => <svg data-testid="checkmark-icon" {...props} />,
}));

vi.mock('../../boost/claim-boost-card/BoostClaimCard', () => ({
    default: (_props: Record<string, unknown>) => null,
}));

vi.mock('../../credential-refresh-listener/CredentialRefreshListener', () => ({
    useForceRefreshLearnCloudCredential: () => ({ forceRefresh: refreshHost.forceRefresh }),
}));

vi.mock('../../../paraglide/messages.js', () => ({
    'alerts.viewCredential': () => 'View Credential',
    'alerts.unableToLoad': () => 'Unable to load notification',
    'alerts.updated': () => 'Updated',
    'alerts.credentialUpdated': () => 'Credential updated',
    'alerts.checkingForUpdate': () => 'Checking for updates…',
    'alerts.updateCheckFailed': () => 'Connection issue. Please check your internet and try again.',
    'alerts.updatedCredentialUnavailable': () =>
        "This credential isn't available yet. Please try again later.",
}));

import NotificationCredentialRefreshedCard from './NotificationCredentialRefreshedCard';

const REFRESH_ID = 'b7f1c2e4d3a4f5a6b7c8d9e0f1a2b3c4';

const makeNotification = (
    // `null` explicitly means "no metadata at all" (malformed payload)
    metadata: Record<string, unknown> | null = {
        refreshId: REFRESH_ID,
        version: 2,
        routeKey: 'route-key',
        deliveryKey: 'delivery-key',
    }
): NotificationType =>
    ({
        _id: 'notification-1',
        type: 'CREDENTIAL_REFRESHED',
        read: false,
        archived: false,
        from: { did: 'did:key:issuer', profileId: 'issuer', displayName: 'Issuer University' },
        to: { did: 'did:key:holder', profileId: 'holder' },
        message: {
            title: 'Credential updated',
            body: 'Issuer University updated one of your credentials.',
        },
        data: metadata === null ? {} : { metadata },
        sent: '2026-09-02T12:00:00.000Z',
    } as unknown as NotificationType);

const makeRecord = (overrides: Record<string, unknown> = {}): LCR =>
    ({
        id: 'rec-1',
        uri: 'lc:cloud:current',
        category: 'Achievement',
        refresh: {
            serviceId: `https://network.example.com/refresh/${REFRESH_ID}`,
            serviceType: '1EdTechCredentialRefresh',
            credentialId: 'urn:uuid:credential-1',
            managedVersion: 1,
            history: [],
        },
        ...overrides,
    } as unknown as LCR);

const makeVc = (id = 'urn:uuid:credential-1') => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    id,
    issuer: 'did:key:issuer',
    validFrom: '2026-09-01T00:00:00.000Z',
    credentialSubject: { id: 'did:key:holder' },
});

const renderCard = (notification: NotificationType, onRead = vi.fn()) =>
    render(<NotificationCredentialRefreshedCard notification={notification} onRead={onRead} />);

const tapCard = async () => {
    fireEvent.click(screen.getByTestId('notification-credential-refreshed'));
    await act(async () => {
        await Promise.resolve();
    });
};

/** The React element handed to the modal host, once the credential detail opens */
const openedModalElement = (): React.ReactElement => {
    expect(modalHost.newModal).toHaveBeenCalledTimes(1);

    return modalHost.newModal.mock.calls[0][0] as React.ReactElement;
};

describe('NotificationCredentialRefreshedCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        walletHost.indexGet.mockResolvedValue([makeRecord()]);
        walletHost.readGet.mockResolvedValue(makeVc());
        refreshHost.forceRefresh.mockResolvedValue({
            status: 'updated',
            record: { ...makeRecord(), uri: 'lc:cloud:newest' },
            uri: 'lc:cloud:newest',
            previousUri: 'lc:cloud:current',
        });
    });

    afterEach(() => cleanup());

    it('renders the generic server copy and never subject data from the payload', () => {
        const notification = makeNotification({
            refreshId: REFRESH_ID,
            version: 2,
            routeKey: 'route-key',
            deliveryKey: 'delivery-key',
            // Adversarial: a buggy or malicious payload must not surface subject data.
            credentialSubject: { name: 'Alice Example' },
            credentialTitle: 'Secret Credential Title',
        });

        renderCard(notification);

        expect(
            screen.getByText('Issuer University updated one of your credentials.')
        ).toBeInTheDocument();
        expect(screen.queryByText(/Alice Example/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Secret Credential Title/)).not.toBeInTheDocument();
        expect(screen.queryByText(new RegExp(REFRESH_ID))).not.toBeInTheDocument();
        expect(screen.queryByText(/delivery-key/)).not.toBeInTheDocument();
    });

    it('marks the notification read, force-refreshes the located record, and opens the newest URI', async () => {
        const onRead = vi.fn();

        renderCard(makeNotification(), onRead);
        await tapCard();

        await waitFor(() => expect(refreshHost.forceRefresh).toHaveBeenCalledTimes(1));

        const [record] = refreshHost.forceRefresh.mock.calls[0];

        expect(record).toEqual(expect.objectContaining({ id: 'rec-1', uri: 'lc:cloud:current' }));
        expect(onRead).toHaveBeenCalledTimes(1);

        await waitFor(() => expect(modalHost.newModal).toHaveBeenCalledTimes(1));

        // The newest current URI from the refresh result is what opens — not the URI
        // the record held before the forced refresh.
        expect(openedModalElement().props.credentialUri).toBe('lc:cloud:newest');
    });

    it('locates the record by the refreshId inside its encrypted refresh metadata', async () => {
        const unrelated = makeRecord({
            id: 'rec-other',
            refresh: {
                serviceId: 'https://network.example.com/refresh/some-other-refresh',
                serviceType: '1EdTechCredentialRefresh',
                credentialId: 'urn:uuid:other',
                history: [],
            },
        });

        walletHost.indexGet.mockResolvedValue([unrelated, makeRecord()]);

        renderCard(makeNotification());
        await tapCard();

        await waitFor(() => expect(refreshHost.forceRefresh).toHaveBeenCalledTimes(1));

        const [record] = refreshHost.forceRefresh.mock.calls[0];

        expect(record.id).toBe('rec-1');
    });

    it('discovers the record lazily when refresh metadata has not been written yet', async () => {
        const undiscovered = makeRecord({ id: 'rec-lazy', refresh: undefined });

        walletHost.indexGet.mockResolvedValue([undiscovered]);
        walletHost.readGet.mockResolvedValue({
            ...makeVc(),
            refreshService: {
                id: `https://network.example.com/refresh/${REFRESH_ID}`,
                type: '1EdTechCredentialRefresh',
            },
        });

        renderCard(makeNotification());
        await tapCard();

        await waitFor(() => expect(refreshHost.forceRefresh).toHaveBeenCalledTimes(1));

        const [record] = refreshHost.forceRefresh.mock.calls[0];

        expect(record.id).toBe('rec-lazy');
    });

    it('opens the current URI when the credential is already up to date', async () => {
        refreshHost.forceRefresh.mockResolvedValue({
            status: 'unchanged',
            record: makeRecord(),
        });

        renderCard(makeNotification());
        await tapCard();

        await waitFor(() => expect(modalHost.newModal).toHaveBeenCalledTimes(1));

        expect(openedModalElement().props.credentialUri).toBe('lc:cloud:current');
        expect(toastHost.presentToast).not.toHaveBeenCalled();
    });

    it('opens the existing current URI with friendly feedback when the refresh fails', async () => {
        refreshHost.forceRefresh.mockResolvedValue({
            status: 'failed',
            code: 'UNAVAILABLE',
            retryable: true,
        });

        renderCard(makeNotification());
        await tapCard();

        await waitFor(() => expect(modalHost.newModal).toHaveBeenCalledTimes(1));

        expect(openedModalElement().props.credentialUri).toBe('lc:cloud:current');
        expect(toastHost.presentToast).toHaveBeenCalledWith(
            'Connection issue. Please check your internet and try again.',
            expect.objectContaining({ type: 'error' })
        );
    });

    it('shows friendly feedback and opens nothing when no local record matches', async () => {
        walletHost.indexGet.mockResolvedValue([]);

        renderCard(makeNotification());
        await tapCard();

        await waitFor(() =>
            expect(toastHost.presentToast).toHaveBeenCalledWith(
                "This credential isn't available yet. Please try again later.",
                expect.objectContaining({ type: 'error' })
            )
        );

        expect(refreshHost.forceRefresh).not.toHaveBeenCalled();
        expect(modalHost.newModal).not.toHaveBeenCalled();
    });

    it('falls back safely when the notification metadata is missing or malformed', async () => {
        renderCard(makeNotification(null));
        await tapCard();

        await waitFor(() =>
            expect(toastHost.presentToast).toHaveBeenCalledWith(
                "This credential isn't available yet. Please try again later.",
                expect.objectContaining({ type: 'error' })
            )
        );

        expect(refreshHost.forceRefresh).not.toHaveBeenCalled();
        expect(modalHost.newModal).not.toHaveBeenCalled();
    });

    it('shows a friendly connection error when wallet access fails unexpectedly', async () => {
        walletHost.indexGet.mockRejectedValue(new Error('offline'));

        renderCard(makeNotification());
        await tapCard();

        await waitFor(() =>
            expect(toastHost.presentToast).toHaveBeenCalledWith(
                'Connection issue. Please check your internet and try again.',
                expect.objectContaining({ type: 'error' })
            )
        );

        expect(modalHost.newModal).not.toHaveBeenCalled();
    });

    it('shows a contextual loading state while the forced refresh is in flight', async () => {
        let resolveRefresh: ((value: unknown) => void) | undefined;

        refreshHost.forceRefresh.mockReturnValue(
            new Promise(resolve => {
                resolveRefresh = resolve;
            })
        );

        renderCard(makeNotification());
        await tapCard();

        await waitFor(() => expect(screen.getByText('Checking for updates…')).toBeInTheDocument());

        expect(modalHost.newModal).not.toHaveBeenCalled();

        await act(async () => {
            resolveRefresh?.({ status: 'unchanged', record: makeRecord() });
        });

        await waitFor(() => expect(modalHost.newModal).toHaveBeenCalledTimes(1));
        expect(screen.queryByText('Checking for updates…')).not.toBeInTheDocument();
    });
});
