import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createLink, track } = vi.hoisted(() => ({ createLink: vi.fn(), track: vi.fn() }));

vi.mock('learn-card-base', () => {
    return {
        BoostCategoryOptionsEnum: { id: 'ID', family: 'Family' },
        CredentialCategoryEnum: {},
        CredentialBadgeNew: () => null,
        ProfilePicture: () => null,
        getBoostMetadata: () => ({ IconComponent: () => null, title: 'Achievement' }),
        truncateWithEllipsis: (value: string) => value,
        useGetProfile: () => ({ data: undefined }),
        useShareBoostMutation: () => useMutation({ mutationFn: createLink, retry: false }),
        ToastTypeEnum: { Error: 'error' },
        useToast: () => ({ presentToast: vi.fn() }),
    };
});
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getCredentialName: () => 'Course completion',
    getCredentialSubject: (credential: { credentialSubject: object }) =>
        credential.credentialSubject,
    getImageUrlFromCredential: () => undefined,
    getIssuerNameNonBoost: () => 'Example school',
    getUrlFromImage: () => undefined,
    isBoostCredential: () => false,
    unwrapBoostCredential: (credential: object) => credential,
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({ getEmojiFromDidString: () => '' }));
vi.mock('learn-card-base/svgs/X', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/LeftArrow', () => ({ default: () => null }));
vi.mock('../../familyCMS/FamilyCrest/FamilyCrest', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    default: () => null,
}));
vi.mock('@analytics', () => ({
    AnalyticsEvents: { GENERATE_SHARE_LINK: 'generated', CREDENTIAL_QR_PRESENTED: 'qr-presented' },
    useAnalytics: () => ({ track }),
}));

import ShareBoostLink from './ShareBoostLink';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:school',
    credentialSubject: { id: 'did:example:learner' },
} as React.ComponentProps<typeof ShareBoostLink>['boost'];

const deferredLink = () => {
    let resolve!: (data: { link: string }) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<{ link: string }>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

describe('ShareBoostLink error recovery', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(cleanup);

    it.each([
        ['compact', true],
        ['full', false],
    ] as const)(
        'replaces failed %s sharing with retry and recovers to a QR code',
        async (_surface, compact) => {
            const first = deferredLink();
            const retry = deferredLink();
            createLink.mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise);
            const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
            render(
                <QueryClientProvider client={client}>
                    <ShareBoostLink
                        boost={credential}
                        categoryType={'Achievement' as never}
                        compact={compact}
                    />
                </QueryClientProvider>
            );
            await waitFor(() => expect(createLink).toHaveBeenCalledOnce());
            expect(screen.getByRole('status', { name: /generating link/i })).toBeInTheDocument();

            await act(async () =>
                first.reject(new Error('RDF canonicalization permutation limit exceeded'))
            );
            expect(await screen.findByRole('alert')).toBeInTheDocument();
            expect(
                screen.queryByRole('status', { name: /generating link/i })
            ).not.toBeInTheDocument();
            expect(screen.queryByText(/canonicalization|permutation/i)).not.toBeInTheDocument();
            expect(screen.queryByRole('img', { name: /share.*qr code/i })).not.toBeInTheDocument();
            if (!compact) {
                expect(
                    screen.queryByRole('button', { name: /copy link/i })
                ).not.toBeInTheDocument();
                expect(screen.getByRole('button', { name: /add to linkedin/i })).toBeDisabled();
            }

            fireEvent.click(screen.getByRole('button', { name: /try again/i }));
            await waitFor(() => expect(createLink).toHaveBeenCalledTimes(2));
            await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
            expect(screen.getByRole('status', { name: /generating link/i })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();

            await act(async () => retry.resolve({ link: 'https://example.test/share/credential' }));
            expect(await screen.findByRole('img', { name: /share.*qr code/i })).toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            expect(
                screen.queryByRole('status', { name: /generating link/i })
            ).not.toBeInTheDocument();
            if (!compact) {
                expect(screen.getByRole('button', { name: /copy link/i })).toBeEnabled();
                expect(screen.getByRole('link', { name: /add to linkedin/i })).toBeInTheDocument();
            }
            client.clear();
        }
    );
});
