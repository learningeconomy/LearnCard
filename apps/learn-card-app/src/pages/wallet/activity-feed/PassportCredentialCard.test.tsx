import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resolveSharedCredential: vi.fn() }));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    resolveSharedCredential: mocks.resolveSharedCredential,
    getCredentialName: (credential: { name?: string }) => credential.name ?? '',
}));

vi.mock('../../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: ({ titleOverride, loading }: { titleOverride?: string | null; loading?: boolean }) => (
        <div>{loading ? 'Loading endorsement title' : titleOverride}</div>
    ),
}));

import PassportCredentialCard, {
    type ActivityIndexRecord,
    resolveEndorsementTitle,
} from './PassportCredentialCard';

const renderCard = (record: ActivityIndexRecord) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <PassportCredentialCard record={record} />
        </QueryClientProvider>
    );
};

describe('PassportCredentialCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses the shared target credential name for legacy endorsement records', async () => {
        mocks.resolveSharedCredential.mockResolvedValue({ name: 'First Aid' });

        await expect(resolveEndorsementTitle('uri=lc%3Ashared&seed=seed&pin=1234')).resolves.toBe(
            'Endorsement of First Aid'
        );
    });

    it('returns null when the shared credential has no usable name', async () => {
        mocks.resolveSharedCredential.mockResolvedValue(undefined);

        await expect(resolveEndorsementTitle('uri=expired&seed=seed&pin=1234')).resolves.toBeNull();
    });

    it('shows a loading surface instead of the malformed credential title while resolving', () => {
        const { promise } = Promise.withResolvers<never>();
        mocks.resolveSharedCredential.mockReturnValue(promise);

        renderCard({
            uri: 'lc:endorsement:legacy',
            category: 'Endorsement',
            title: 'Endorsement of undefined',
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
});
