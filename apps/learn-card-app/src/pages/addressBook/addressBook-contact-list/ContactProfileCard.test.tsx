import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { LCNProfile } from '@learncard/types';

type BubblesProps = { uris?: readonly string[]; owner?: { profileId: string } };

vi.mock('learn-card-base', () => ({ UserProfilePicture: () => null }));
vi.mock('../../../config/brandingAssets', () => ({
    useTenantBrandingAssets: () => ({ brandMark: '/logo.png' }),
    DEFAULT_BRAND_MARK: '/logo.png',
}));
vi.mock('../../../components/featured-credentials/FeaturedCredentialBubbles', () => ({
    default: ({ uris, owner }: BubblesProps) => (
        <div
            data-testid="featured-credentials"
            data-uris={JSON.stringify(uris ?? null)}
            data-owner={owner?.profileId}
        />
    ),
}));

import ContactProfileCard from './ContactProfileCard';

const contact = {
    profileId: 'ada',
    displayName: 'Ada Learner',
    did: 'did:example:ada',
    image: '',
    shortBio: '',
    bio: '',
    highlightedCredentials: ['lc:boost:stale'],
} as LCNProfile;

afterEach(cleanup);

describe('ContactProfileCard featured credentials', () => {
    it('shows the contact record selection next to their name by default', () => {
        render(<ContactProfileCard contact={contact} />);

        const bubbles = screen.getByTestId('featured-credentials');
        expect(bubbles.getAttribute('data-uris')).toBe(JSON.stringify(['lc:boost:stale']));
        expect(bubbles.getAttribute('data-owner')).toBe('ada');
        expect(screen.getByRole('heading', { name: 'Ada Learner' })).toBeTruthy();
    });

    it('prefers the freshly resolved public selection, even when it is now empty', () => {
        const { rerender } = render(
            <ContactProfileCard contact={contact} featuredCredentialUris={['lc:boost:fresh']} />
        );
        expect(screen.getByTestId('featured-credentials').getAttribute('data-uris')).toBe(
            JSON.stringify(['lc:boost:fresh'])
        );

        rerender(<ContactProfileCard contact={contact} featuredCredentialUris={[]} />);
        expect(screen.getByTestId('featured-credentials').getAttribute('data-uris')).toBe('[]');
    });
});
