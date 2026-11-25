import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ListingDetailsFields, StandOutSection } from './ListingEditor';
import { EMPTY_LISTING_DETAILS } from './listingForm';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('../components/ImageUpload', () => ({
    ImageUpload: () => <div />,
    ScreenshotUpload: ({ index }: { index: number }) => <div>Screenshot slot {index + 1}</div>,
}));

describe('ListingDetailsFields', () => {
    it('reports description edits and adds screenshot slots', () => {
        const onChange = vi.fn();
        render(<ListingDetailsFields details={EMPTY_LISTING_DETAILS} onChange={onChange} />);

        fireEvent.change(screen.getByPlaceholderText(/What does your app do/), {
            target: { value: 'Answer questions.' },
        });
        expect(onChange).toHaveBeenCalledWith({ description: 'Answer questions.' });

        fireEvent.click(screen.getByRole('button', { name: 'Add screenshot' }));
        expect(onChange).toHaveBeenCalledWith({ screenshots: [''] });
    });
});

describe('StandOutSection', () => {
    it('stays collapsed until opened', () => {
        render(<StandOutSection details={EMPTY_LISTING_DETAILS} onChange={vi.fn()} />);

        expect(screen.queryByText('Contact email')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: /Make it stand out/ }));
        expect(screen.getByText('Contact email')).toBeInTheDocument();
    });

    it('opens itself to show a malformed link', () => {
        render(
            <StandOutSection
                details={{ ...EMPTY_LISTING_DETAILS, privacyPolicyUrl: 'privacy page' }}
                onChange={vi.fn()}
            />
        );

        expect(
            screen.getByText('Enter a full link, like https://myapp.com/privacy.')
        ).toBeInTheDocument();
    });

    it('opens itself to show an invalid contact email', () => {
        render(
            <StandOutSection
                details={{ ...EMPTY_LISTING_DETAILS, contactEmail: 'nope' }}
                onChange={vi.fn()}
            />
        );

        expect(screen.getByText('Enter an email like support@myapp.com.')).toBeInTheDocument();
    });
});
