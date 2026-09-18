import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    locale: 'en',
    resolveSharedCredential: vi.fn(),
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    resolveSharedCredential: mocks.resolveSharedCredential,
    getCredentialName: (credential: { name?: string }) => credential.name ?? '',
}));

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { socialBadge: 'Social Badge' },
    categoryMetadata: { 'Social Badge': { defaultImageSrc: 'social-badge.svg' } },
}));

vi.mock(
    '../../../paraglide/messages.js',
    async (importOriginal: () => Promise<Record<string, unknown>>) => ({
        ...(await importOriginal()),
        'endorsement.activity.title': ({ name }: { name: string }) =>
            `${mocks.locale === 'es' ? 'Respaldo de' : 'Endorsement of'} ${name}`,
        'endorsement.fullview.endorsement': () => 'Endorsement',
    })
);

vi.mock('../../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: ({
        titleOverride,
        loading,
        displayIssuerAsSubject,
    }: {
        titleOverride?: string | null;
        loading?: boolean;
        displayIssuerAsSubject?: boolean;
    }) => (
        <div>
            {loading ? 'Loading endorsement title' : titleOverride}
            <span>{displayIssuerAsSubject ? 'Signed issuer subject' : 'Credential subject'}</span>
        </div>
    ),
}));

import PassportCredentialCard, {
    type ActivityIndexRecord,
    resolveEndorsementTargetName,
} from './PassportCredentialCard';

const renderCard = (record: ActivityIndexRecord) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(<PassportCredentialCard record={record} />, {
        wrapper: ({ children }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
    });
};

describe('PassportCredentialCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.locale = 'en';
    });

    it('uses the shared target credential name for legacy endorsement records', async () => {
        mocks.resolveSharedCredential.mockResolvedValue({ name: 'First Aid' });
        await expect(
            resolveEndorsementTargetName('uri=lc%3Ashared&seed=seed&pin=1234')
        ).resolves.toBe('First Aid');
    });

    it('returns null when the shared credential has no usable name', async () => {
        mocks.resolveSharedCredential.mockResolvedValue(undefined);
        await expect(
            resolveEndorsementTargetName('uri=expired&seed=seed&pin=1234')
        ).resolves.toBeNull();
    });

    it('reformats a resolved target name when the locale changes', async () => {
        const record = {
            uri: 'lc:endorsement:legacy',
            category: 'Endorsement',
            title: 'Endorsement of undefined',
            sharedUri: 'uri=lc%3Ashared&seed=seed&pin=1234',
        } as ActivityIndexRecord;
        mocks.resolveSharedCredential.mockResolvedValue({ name: 'First Aid' });
        const { rerender } = renderCard(record);

        expect(await screen.findByText('Endorsement of First Aid')).toBeInTheDocument();

        mocks.locale = 'es';
        rerender(<PassportCredentialCard record={record} />);

        expect(screen.getByText('Respaldo de First Aid')).toBeInTheDocument();
        expect(mocks.resolveSharedCredential).toHaveBeenCalledOnce();
    });

    it('shows a loading surface instead of the malformed credential title while resolving', () => {
        const { promise } = Promise.withResolvers<never>();
        mocks.resolveSharedCredential.mockReturnValue(promise);

        renderCard({
            uri: 'lc:endorsement:legacy',
            category: 'Endorsement',
            title: ' Endorsement of undefined ',
            sharedUri: 'uri=lc%3Ashared&seed=seed&pin=1234',
        });

        expect(screen.getByText('Loading endorsement title')).toBeInTheDocument();
        expect(screen.queryByText('Endorsement of undefined')).not.toBeInTheDocument();
    });

    it('uses a generic title when a legacy record has no shared link', () => {
        renderCard({
            uri: 'lc:endorsement:legacy',
            category: 'Endorsement',
            title: 'Endorsement of undefined',
        });

        expect(screen.getByText('Endorsement')).toBeInTheDocument();
        expect(mocks.resolveSharedCredential).not.toHaveBeenCalled();
    });

    it('preserves valid titles that happen to contain the word undefined', () => {
        renderCard({
            uri: 'lc:endorsement:accepted',
            category: 'Endorsement',
            title: 'Endorsement of undefined behavior',
        });

        expect(screen.getByText('Endorsement of undefined behavior')).toBeInTheDocument();
        expect(mocks.resolveSharedCredential).not.toHaveBeenCalled();
    });

    it('uses the signed issuer as the display subject for endorsement credentials', () => {
        renderCard({
            uri: 'lc:endorsement:accepted',
            category: 'Endorsement',
            title: 'Endorsement of First Aid',
        });

        expect(screen.getByText('Signed issuer subject')).toBeInTheDocument();
    });
});
