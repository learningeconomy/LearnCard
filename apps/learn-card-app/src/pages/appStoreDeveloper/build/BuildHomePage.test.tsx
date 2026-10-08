import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import BuildHomePage from './BuildHomePage';

vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonIcon: () => <span />,
    IonSpinner: () => <div>Loading</div>,
}));
vi.mock('../components/AppStoreHeader', () => ({ AppStoreHeader: () => null }));
vi.mock('../../../i18n/mDynamic', () => ({ mDynamic: (key: string) => key }));
vi.mock('../useDeveloperPortal', () => ({
    useDeveloperPortal: () => ({
        useMyApps: () => ({ data: [{ integrationId: 'app1' }], isLoading: false }),
    }),
}));
vi.mock('../DeveloperPortalContext', () => ({
    useDeveloperPortalContext: () => ({
        isLoadingIntegrations: false,
        integrations: [
            {
                id: 'p1',
                name: 'Badge Project',
                status: 'setup',
                guideType: 'issue-credentials',
                guideState: { currentStep: 1 },
                whitelistedDomains: [],
            },
            {
                id: 'app1',
                name: 'Live Quiz App',
                status: 'setup',
                guideType: 'embed-app',
                guideState: { currentStep: 0 },
                whitelistedDomains: [],
            },
        ],
    }),
}));

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/app-store/developer/build']}>
            <Route exact path="/app-store/developer/build" component={BuildHomePage} />
            <Route
                path="/app-store/developer/guides/:useCase"
                render={({ match }) => <div>Guide {match.params.useCase}</div>}
            />
            <Route
                path="/app-store/developer/integrations/:id/guides/:useCase"
                render={({ match }) => <div>Resume {match.params.id}</div>}
            />
        </MemoryRouter>
    );

describe('BuildHomePage', () => {
    it('keeps apps out of the guide list and points to the Apps tab', () => {
        renderPage();
        expect(screen.queryByText('Live Quiz App')).toBeNull();
        expect(screen.getByText('Your app is in the Apps tab')).toBeInTheDocument();
    });

    it('starts the AI app guide from the featured card', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Build an app with AI/ }));
        expect(screen.getByText('Guide embed-app')).toBeInTheDocument();
    });

    it('opens any guide without picking a project first', () => {
        renderPage();
        fireEvent.click(
            screen.getByRole('button', {
                name: /developerPortal.guides.useCases.embedClaim.subtitle/,
            })
        );
        expect(screen.getByText('Guide embed-claim')).toBeInTheDocument();
    });

    it('resumes a project where it left off', () => {
        renderPage();
        expect(screen.getByText(/Step 2/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Badge Project/ }));
        expect(screen.getByText('Resume p1')).toBeInTheDocument();
    });
});
