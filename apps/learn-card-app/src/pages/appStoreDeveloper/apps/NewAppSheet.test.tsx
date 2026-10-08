import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NewAppSheet } from './NewAppSheet';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('learn-card-base', () => ({
    Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderSheet = () => {
    const handlers = {
        onClose: vi.fn(),
        onBuildApp: vi.fn(),
        onListExisting: vi.fn(),
        onOpenDocs: vi.fn(),
    };
    render(
        <NewAppSheet
            onClose={handlers.onClose}
            onBuildApp={handlers.onBuildApp}
            onListExisting={handlers.onListExisting}
            onOpenDocs={handlers.onOpenDocs}
        />
    );
    return handlers;
};

describe('NewAppSheet', () => {
    it('leads with building an app', () => {
        const { onBuildApp } = renderSheet();
        fireEvent.click(screen.getByRole('button', { name: /Build an app/ }));
        expect(onBuildApp).toHaveBeenCalled();
    });

    it('lists every other app type in plain words', () => {
        const { onListExisting } = renderSheet();
        fireEvent.click(screen.getByRole('button', { name: /List something you already have/ }));

        expect(screen.getByText('Opens in a new tab')).toBeInTheDocument();
        expect(screen.getByText('Runs on a server')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /AI tutor/ }));
        expect(onListExisting).toHaveBeenCalledWith('AI_TUTOR');
    });

    it('goes back from the app types', () => {
        renderSheet();
        fireEvent.click(screen.getByRole('button', { name: /List something you already have/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(screen.getByText('Where are you starting from?')).toBeInTheDocument();
    });

    it('links to the docs and closes', () => {
        const { onOpenDocs, onClose } = renderSheet();
        fireEvent.click(screen.getByRole('button', { name: /Read the developer docs/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onOpenDocs).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});
