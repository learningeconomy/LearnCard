import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LCNIntegration } from '@learncard/types';

import { GuideProjectPicker } from './GuideProjectPicker';

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
    update: vi.fn(),
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
}));
vi.mock('../../../i18n/mDynamic', () => ({ mDynamic: (key: string) => key }));
vi.mock('../useDeveloperPortal', () => ({
    useDeveloperPortal: () => ({
        useCreateIntegration: () => ({ mutateAsync: mocks.create }),
        useUpdateIntegration: () => ({ mutateAsync: mocks.update }),
    }),
}));

const renderPicker = (integrations: LCNIntegration[] = []) =>
    render(
        <MemoryRouter initialEntries={['/app-store/developer/guides/embed-claim']}>
            <Route exact path="/app-store/developer/guides/embed-claim">
                <GuideProjectPicker guideType="embed-claim" integrations={integrations} />
            </Route>
            <Route
                path="/app-store/developer/integrations/:id/guides/:useCase"
                render={({ match }) => (
                    <div>
                        Guide {match.params.useCase} in {match.params.id}
                    </div>
                )}
            />
        </MemoryRouter>
    );

describe('GuideProjectPicker', () => {
    beforeEach(() => {
        mocks.create.mockReset().mockResolvedValue('new-id');
        mocks.update.mockReset().mockResolvedValue(true);
    });

    it('creates a named project and opens the guide in it', async () => {
        renderPicker();

        fireEvent.change(screen.getByLabelText('Project name'), {
            target: { value: 'Summer Camp' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Start Guide' }));

        await waitFor(() =>
            expect(screen.getByText('Guide embed-claim in new-id')).toBeInTheDocument()
        );
        expect(mocks.create).toHaveBeenCalledWith('Summer Camp');
        expect(mocks.update).toHaveBeenCalledWith({
            id: 'new-id',
            updates: { guideType: 'embed-claim' },
        });
    });

    it('can reuse an empty project instead', async () => {
        renderPicker([
            {
                id: 'empty',
                name: 'Spare Project',
                status: 'setup',
                whitelistedDomains: [],
            } as LCNIntegration,
        ]);

        fireEvent.click(screen.getByRole('button', { name: /Spare Project/ }));

        await waitFor(() =>
            expect(screen.getByText('Guide embed-claim in empty')).toBeInTheDocument()
        );
        expect(mocks.create).not.toHaveBeenCalled();
    });
});
