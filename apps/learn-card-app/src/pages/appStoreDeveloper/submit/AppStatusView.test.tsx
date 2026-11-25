import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AppStoreListing } from '@learncard/types';

import { AppStatusView } from './AppStatusView';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('../../issue/components/Confetti', () => ({
    Confetti: () => <div data-testid="confetti" />,
}));

const listing: AppStoreListing = {
    listing_id: 'l1',
    display_name: 'Quiz Quest',
    tagline: 'Learn by playing',
    full_description: 'Answer questions.',
    icon_url: 'https://cdn.filestackcontent.com/icon',
    app_listing_status: 'PENDING_REVIEW',
    launch_type: 'EMBEDDED_IFRAME',
    launch_config_json: '{}',
    submitted_at: '2026-10-08T12:00:00.000Z',
};

const renderView = (
    mode: React.ComponentProps<typeof AppStatusView>['mode'],
    { celebrate = false, hasNewAppChanges = false } = {}
) => {
    const handlers = {
        onMakeChanges: vi.fn(),
        onEdit: vi.fn(),
        onViewInStore: vi.fn(),
        onOpenDashboard: vi.fn(),
    };
    render(
        <AppStatusView
            listing={listing}
            mode={mode}
            celebrate={celebrate}
            hasNewAppChanges={hasNewAppChanges}
            isWorking={false}
            shareUrl="https://learncard.app/app-store/developer/apps/l1"
            onMakeChanges={handlers.onMakeChanges}
            onEdit={handlers.onEdit}
            onViewInStore={handlers.onViewInStore}
            onOpenDashboard={handlers.onOpenDashboard}
        />
    );
    return handlers;
};

describe('AppStatusView', () => {
    it('shows where an app in review is, step by step', () => {
        renderView('in-review');

        expect(screen.getByText('Quiz Quest is in review')).toBeInTheDocument();
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('In review')).toBeInTheDocument();
        expect(screen.getByText('Live in the store')).toBeInTheDocument();
    });

    it('asks before taking an app out of review', () => {
        const { onMakeChanges } = renderView('in-review');

        fireEvent.click(screen.getByRole('button', { name: /Make Changes/ }));
        expect(onMakeChanges).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /Withdraw and Edit/ }));
        expect(onMakeChanges).toHaveBeenCalledTimes(1);
    });

    it('celebrates a fresh submission', () => {
        renderView('in-review', { celebrate: true });
        expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });

    it('lets a live app be viewed in the store or edited', () => {
        const { onEdit, onViewInStore } = renderView('live');

        expect(screen.getByText('Quiz Quest is live')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /View in Store/ }));
        fireEvent.click(screen.getByRole('button', { name: /Edit Listing/ }));
        expect(onViewInStore).toHaveBeenCalled();
        expect(onEdit).toHaveBeenCalled();
    });

    it('points a live app with new capabilities toward an update', () => {
        const { onEdit } = renderView('live', { hasNewAppChanges: true });

        fireEvent.click(screen.getByRole('button', { name: 'Review' }));
        expect(onEdit).toHaveBeenCalled();
    });

    it('opens the app dashboard', () => {
        const { onOpenDashboard } = renderView('in-review');

        fireEvent.click(screen.getByRole('button', { name: 'Open App Dashboard' }));
        expect(onOpenDashboard).toHaveBeenCalled();
    });
});
