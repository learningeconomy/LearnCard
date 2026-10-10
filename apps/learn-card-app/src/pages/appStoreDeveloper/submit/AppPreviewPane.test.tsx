import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppPreviewPane } from './AppPreviewPane';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('../../launchPad/EmbedIframeModal', () => ({
    EmbedIframeModal: ({ embedUrl }: { embedUrl: string }) => <div>Running {embedUrl}</div>,
}));

const renderPane = (liveAddress: string | null = 'https://quiz.app') =>
    render(
        <AppPreviewPane
            listingId="l1"
            appName="Quiz"
            runsInside={liveAddress !== null}
            liveAddress={liveAddress}
            launchConfig={{ url: liveAddress ?? undefined }}
            storePreview={<div>Store card</div>}
        />
    );

describe('AppPreviewPane', () => {
    beforeEach(() => localStorage.clear());

    it('runs the live address by default', () => {
        renderPane();
        expect(screen.getByText('Store card')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try your app' }));
        expect(screen.getByText('quiz.app')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Start/ }));
        expect(screen.getByText('Running https://quiz.app')).toBeInTheDocument();
    });

    it('switches to a test address and back without touching the listing', () => {
        renderPane();
        fireEvent.click(screen.getByRole('button', { name: 'Try your app' }));
        fireEvent.click(screen.getByRole('button', { name: /Start/ }));

        fireEvent.click(screen.getByRole('button', { name: 'Use a test address' }));
        fireEvent.change(screen.getByLabelText('Test address'), {
            target: { value: 'http://localhost:5173' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Use' }));

        expect(screen.getByText('Test address · localhost:5173')).toBeInTheDocument();
        expect(screen.getByText('Running http://localhost:5173')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Use live address' }));
        expect(screen.getByText('Running https://quiz.app')).toBeInTheDocument();
    });

    it('only offers the store preview for apps that open elsewhere', () => {
        renderPane(null);
        expect(screen.queryByRole('button', { name: 'Try your app' })).toBeNull();
    });
});
