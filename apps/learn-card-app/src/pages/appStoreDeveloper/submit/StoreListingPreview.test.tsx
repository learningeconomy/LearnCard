import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { StoreListingPreview } from './StoreListingPreview';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));

const renderPreview = ({
    name = 'Quiz Quest',
    tagline = 'Learn by playing',
    description = 'Answer questions and earn badges.',
    screenshots = [] as string[],
    highlights = [] as string[],
} = {}) =>
    render(
        <StoreListingPreview
            name={name}
            tagline={tagline}
            description={description}
            iconUrl="https://cdn.filestackcontent.com/icon"
            category=""
            ageRating=""
            screenshots={screenshots}
            highlights={highlights}
        />
    );

describe('StoreListingPreview', () => {
    it('shows what the developer typed', () => {
        renderPreview({
            screenshots: ['https://cdn.filestackcontent.com/shot', ''],
            highlights: ['Earn badges', '  '],
        });

        expect(screen.getByText('Quiz Quest')).toBeInTheDocument();
        expect(screen.getByText('Learn by playing')).toBeInTheDocument();
        expect(screen.getByText('Answer questions and earn badges.')).toBeInTheDocument();
        expect(screen.getByText('Earn badges')).toBeInTheDocument();
        expect(screen.getAllByAltText(/Screenshot/)).toHaveLength(1);
    });

    it('shows placeholders before anything is typed', () => {
        renderPreview({ name: '', tagline: '', description: '' });

        expect(screen.getByText('App Name')).toBeInTheDocument();
        expect(screen.getByText('Your description will appear here.')).toBeInTheDocument();
    });

    it('expands a long description', () => {
        renderPreview({ description: 'a'.repeat(300) });

        fireEvent.click(screen.getByRole('button', { name: 'More' }));
        expect(screen.getByRole('button', { name: 'Less' })).toBeInTheDocument();
    });
});
