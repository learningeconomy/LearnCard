import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createLink, track, getProfile } = vi.hoisted(() => ({
    createLink: vi.fn(),
    track: vi.fn(),
    getProfile: vi.fn(),
}));

vi.mock('learn-card-base', () => {
    return {
        BoostCategoryOptionsEnum: { id: 'ID', family: 'Family' },
        CredentialCategoryEnum: {},
        CredentialBadgeNew: () => null,
        ProfilePicture: () => null,
        getBoostMetadata: () => ({ IconComponent: () => null, title: 'Achievement' }),
        truncateWithEllipsis: (value: string) => value,
        useGetProfile: (...args: unknown[]) => getProfile(...args),
        useShareBoostMutation: () => useMutation({ mutationFn: createLink, retry: false }),
        ToastTypeEnum: { Error: 'error' },
        useToast: () => ({ presentToast: vi.fn() }),
        useTenantBaseUrl: () => 'http://localhost:3000',
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
    id: 'credential:test',
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
    beforeEach(() => {
        vi.clearAllMocks();
        getProfile.mockReturnValue({ data: undefined });
    });
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

    it('falls back to the credential id when no record URI is available', async () => {
        createLink.mockResolvedValue({ link: 'https://learncard.app/share-boost?uri=credential' });
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

        render(
            <QueryClientProvider client={client}>
                <ShareBoostLink boost={credential} categoryType={'Achievement' as never} />
            </QueryClientProvider>
        );

        await waitFor(() =>
            expect(createLink).toHaveBeenCalledWith(
                {
                    credential,
                    credentialUri: credential.id,
                    credentialId: credential.id,
                },
                expect.anything()
            )
        );
        client.clear();
    });

    it('does not create an index record without a credential URI', async () => {
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

        render(
            <QueryClientProvider client={client}>
                <ShareBoostLink
                    boost={{ ...credential, id: undefined }}
                    categoryType={'Achievement' as never}
                />
            </QueryClientProvider>
        );

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(createLink).not.toHaveBeenCalled();
        client.clear();
    });
    it('uses the environment-aware tenant origin for endorsement request links', async () => {
        createLink.mockResolvedValue({
            link: 'https://learncard.app/share-boost?uri=credential%3Atest&seed=seed&pin=1234',
        });
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

        render(
            <QueryClientProvider client={client}>
                <ShareBoostLink
                    boost={credential}
                    boostUri="credential:test"
                    categoryType={'Achievement' as never}
                    isEndorsementRequest
                />
            </QueryClientProvider>
        );

        expect(
            await screen.findByText(
                'http://localhost:3000/?uri=credential%3Atest&seed=seed&pin=1234&credentialId=credential%3Atest&endorsementRequest=true'
            )
        ).toBeInTheDocument();
        client.clear();
    });

    it.each([
        ['malformed', 'not-a-url'],
        ['incomplete', 'https://learncard.app/share-boost?uri=encrypted%3Apresentation&seed=seed'],
    ])('shows the retry surface for a %s endorsement link', async (_kind, invalidLink) => {
        createLink.mockResolvedValueOnce({ link: invalidLink }).mockResolvedValueOnce({
            link: 'https://learncard.app/share-boost?uri=encrypted%3Apresentation&seed=seed&pin=1234',
        });
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

        render(
            <QueryClientProvider client={client}>
                <ShareBoostLink
                    boost={credential}
                    boostUri="credential:test"
                    categoryType={'Achievement' as never}
                    isEndorsementRequest
                />
            </QueryClientProvider>
        );

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(screen.queryByRole('img', { name: /share.*qr code/i })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /try again/i }));

        expect(await screen.findByRole('img', { name: /share.*qr code/i })).toBeInTheDocument();
        expect(createLink).toHaveBeenCalledTimes(2);
        client.clear();
    });
    it('uses an explicit identity for an idless endorsement credential', async () => {
        const idlessCredential = {
            ...credential,
            id: undefined,
        };
        const credentialId = `urn:sha256:${'a'.repeat(64)}`;
        createLink.mockResolvedValue({
            link: 'https://learncard.app/share-boost?uri=encrypted%3Apresentation&seed=seed&pin=1234',
        });
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

        render(
            <QueryClientProvider client={client}>
                <ShareBoostLink
                    boost={idlessCredential}
                    boostUri="lc:credential:idless-record"
                    credentialId={credentialId}
                    categoryType={'Achievement' as never}
                    isEndorsementRequest
                />
            </QueryClientProvider>
        );

        expect(
            await screen.findByText(
                `http://localhost:3000/?uri=encrypted%3Apresentation&seed=seed&pin=1234&credentialId=${encodeURIComponent(
                    credentialId
                )}&endorsementRequest=true`
            )
        ).toBeInTheDocument();
        expect(createLink).toHaveBeenCalledWith(
            {
                credential: idlessCredential,
                credentialUri: 'lc:credential:idless-record',
                credentialId,
            },
            expect.anything()
        );
        client.clear();
    });

    it('omits an empty credential identity from legacy endorsement links', async () => {
        createLink.mockResolvedValue({
            link: 'https://learncard.app/share-boost?uri=encrypted%3Apresentation&seed=seed&pin=1234',
        });
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

        render(
            <QueryClientProvider client={client}>
                <ShareBoostLink
                    boost={{ ...credential, id: undefined }}
                    boostUri="lc:credential:legacy-record"
                    categoryType={'Achievement' as never}
                    isEndorsementRequest
                />
            </QueryClientProvider>
        );

        expect(
            await screen.findByText(
                'http://localhost:3000/?uri=encrypted%3Apresentation&seed=seed&pin=1234&endorsementRequest=true'
            )
        ).toBeInTheDocument();
        client.clear();
    });

    it('waits for explicit public-preview consent and updates social links after publishing', async () => {
        const privateLink = 'https://learncard.app/share-boost?uri=encrypted&seed=secret&pin=1234';
        const publicLink = `${privateLink}&preview=public-id`;
        const publishing = deferredLink();
        createLink
            .mockResolvedValueOnce({ link: privateLink })
            .mockReturnValueOnce(publishing.promise);
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        render(
            <QueryClientProvider client={client}>
                <ShareBoostLink boost={credential} categoryType={'Achievement' as never} />
            </QueryClientProvider>
        );
        const enable = await screen.findByRole('button', { name: 'Enable Public Preview' });
        await waitFor(() => expect(enable).toBeEnabled());
        expect(createLink.mock.calls[0][0]).not.toHaveProperty('publicPreview');
        const privatePost = new URL(
            screen.getByRole('link', { name: 'Post to LinkedIn' }).getAttribute('href')!
        );
        expect(privatePost.searchParams.get('url')).toBe(privateLink);
        expect(screen.getByText(/everything else stays encrypted/i)).toBeInTheDocument();

        fireEvent.click(enable);
        expect(await screen.findByRole('status', { name: '' })).toHaveTextContent(
            'Publishing preview...'
        );
        expect(screen.queryByRole('link', { name: 'Post to LinkedIn' })).not.toBeInTheDocument();
        await act(async () => publishing.resolve({ link: publicLink }));
        expect(await screen.findByText(/public preview enabled/i)).toBeInTheDocument();
        const post = new URL(
            screen.getByRole('link', { name: 'Post to LinkedIn' }).getAttribute('href')!
        );
        expect(post.searchParams.get('url')).toBe(publicLink);
        const certification = new URL(
            screen.getByRole('link', { name: 'Add to LinkedIn' }).getAttribute('href')!
        );
        expect(certification.searchParams.get('certId')).toBe(credential.id);
        expect(certification.searchParams.get('certUrl')).toBe(publicLink);
        client.clear();
    });

    it.each([
        'did:web:network.example:users:school',
        { id: 'did:web:network.example:users:school', name: 'Example school' },
    ])(
        'reads the LinkedIn organization from the credential issuer, including object issuers',
        async issuer => {
            createLink.mockResolvedValue({
                link: 'https://learncard.app/share-boost?uri=encrypted',
            });
            getProfile.mockImplementation((profileId?: string) => ({
                data:
                    profileId === 'school'
                        ? { displayName: 'Example school', linkedInOrganizationId: '12345' }
                        : { displayName: 'Learner', linkedInOrganizationId: '99999' },
            }));
            const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
            render(
                <QueryClientProvider client={client}>
                    <ShareBoostLink
                        boost={{ ...credential, issuer }}
                        categoryType={'Achievement' as never}
                    />
                </QueryClientProvider>
            );
            const add = await screen.findByRole('link', { name: 'Add to LinkedIn' });
            expect(new URL(add.getAttribute('href')!).searchParams.get('organizationId')).toBe(
                '12345'
            );
            client.clear();
        }
    );

    it('never uses the learner organization for an external issuer', async () => {
        createLink.mockResolvedValue({ link: 'https://learncard.app/share-boost?uri=encrypted' });
        getProfile.mockReturnValue({
            data: { displayName: 'Learner', linkedInOrganizationId: '99999' },
        });
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        render(
            <QueryClientProvider client={client}>
                <ShareBoostLink boost={credential} categoryType={'Achievement' as never} />
            </QueryClientProvider>
        );
        const add = await screen.findByRole('link', { name: 'Add to LinkedIn' });
        const url = new URL(add.getAttribute('href')!);
        expect(url.searchParams.has('organizationId')).toBe(false);
        expect(url.searchParams.get('organizationName')).toBe('Example school');
        client.clear();
    });

    it.each([
        ['lc:credential:record', 'lc:credential:record'],
        [undefined, null],
    ])(
        'does not publish a synthetic endorsement identity as the LinkedIn ID (%s)',
        async (boostUri, expectedId) => {
            createLink.mockResolvedValue({
                link: 'https://learncard.app/share-boost?uri=encrypted',
            });
            const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
            render(
                <QueryClientProvider client={client}>
                    <ShareBoostLink
                        boost={{ ...credential, id: undefined }}
                        credentialId="urn:sha256:endorsement-target"
                        boostUri={boostUri}
                        categoryType={'Achievement' as never}
                    />
                </QueryClientProvider>
            );
            const add = await screen.findByRole('link', { name: 'Add to LinkedIn' });
            expect(new URL(add.getAttribute('href')!).searchParams.get('certId')).toBe(expectedId);
            client.clear();
        }
    );

    it('keeps private sharing available without publishing an unresolved issuer placeholder', async () => {
        createLink.mockResolvedValue({ link: 'https://learncard.app/share-boost?uri=encrypted' });
        getProfile.mockReturnValue({ data: undefined, isLoading: false, isError: true });
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const props = {
            boost: { ...credential, issuer: 'did:web:network.example:users:school' },
            categoryType: 'Achievement' as never,
        };
        const view = render(
            <QueryClientProvider client={client}>
                <ShareBoostLink {...props} />
            </QueryClientProvider>
        );
        expect(await screen.findByRole('link', { name: 'Add to LinkedIn' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy Link' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Enable Public Preview' })).toBeDisabled();
        expect(screen.getByText(/issuer details are unavailable/i)).toBeInTheDocument();
        expect(createLink).toHaveBeenCalledOnce();

        getProfile.mockReturnValue({ data: { displayName: 'Resolved school' }, isLoading: false });
        view.rerender(
            <QueryClientProvider client={client}>
                <ShareBoostLink {...props} />
            </QueryClientProvider>
        );
        expect(screen.queryByText(/issuer details are unavailable/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enable Public Preview' })).toBeEnabled();
        client.clear();
    });

    it('waits for the issuer lookup before enabling LinkedIn so its organization ID is included', async () => {
        createLink.mockResolvedValue({ link: 'https://learncard.app/share-boost?uri=encrypted' });
        getProfile.mockReturnValue({ data: undefined, isLoading: true });
        const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
        const props = {
            boost: { ...credential, issuer: 'did:web:network.example:users:school' },
            categoryType: 'Achievement' as never,
        };
        const view = render(
            <QueryClientProvider client={client}>
                <ShareBoostLink {...props} />
            </QueryClientProvider>
        );
        expect(await screen.findByRole('button', { name: 'Copy Link' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Add to LinkedIn' })).toBeDisabled();
        expect(screen.queryByRole('link', { name: 'Add to LinkedIn' })).not.toBeInTheDocument();

        getProfile.mockReturnValue({
            data: { displayName: 'School', linkedInOrganizationId: '12345' },
            isLoading: false,
        });
        view.rerender(
            <QueryClientProvider client={client}>
                <ShareBoostLink {...props} />
            </QueryClientProvider>
        );
        const add = screen.getByRole('link', { name: 'Add to LinkedIn' });
        expect(new URL(add.getAttribute('href')!).searchParams.get('organizationId')).toBe('12345');
        client.clear();
    });
});
