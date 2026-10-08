import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MyAppsPage from './MyAppsPage';

const mocks = vi.hoisted(() => ({
    useMyApps: vi.fn(),
}));

vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonIcon: () => <span />,
    IonSpinner: () => <div>Loading</div>,
}));
vi.mock('../components/AppStoreHeader', () => ({ AppStoreHeader: () => null }));
vi.mock('../../../helpers/externalLinkHelpers', () => ({ openExternalLink: vi.fn() }));
vi.mock('./NewAppSheet', () => ({
    DEVELOPER_DOCS_URL: 'https://docs.example.com',
    NewAppSheet: ({ onListExisting }: { onListExisting: (type: string) => void }) => (
        <button type="button" onClick={() => onListExisting('DIRECT_LINK')}>
            Sheet: list a website
        </button>
    ),
}));
vi.mock('../DeveloperPortalContext', () => ({
    useDeveloperPortalContext: () => ({ integrations: [], isLoadingIntegrations: false }),
}));
vi.mock('../useDeveloperPortal', () => ({
    useDeveloperPortal: () => ({ useMyApps: mocks.useMyApps }),
}));

const renderPage = () =>
    render(
        <MemoryRouter initialEntries={['/app-store/developer']}>
            <Route exact path="/app-store/developer" component={MyAppsPage} />
            <Route
                path="/app-store/developer/apps/:listingId"
                render={({ match }) => <div>Status for {match.params.listingId}</div>}
            />
            <Route path="/app-store/developer/build" render={() => <div>Projects</div>} />
            <Route
                path="/app-store/developer/apps/new"
                render={({ location }) => <div>New listing {location.search}</div>}
            />
        </MemoryRouter>
    );

describe('MyAppsPage', () => {
    beforeEach(() => mocks.useMyApps.mockReset());

    it('opens an app status page from its card', () => {
        mocks.useMyApps.mockReturnValue({
            data: [
                {
                    integrationId: 'i1',
                    listing: {
                        listing_id: 'l1',
                        display_name: 'Quiz Quest',
                        tagline: 'Learn by playing',
                        full_description: 'Answer questions.',
                        icon_url: 'https://cdn.filestackcontent.com/icon',
                        app_listing_status: 'PENDING_REVIEW',
                        launch_type: 'EMBEDDED_IFRAME',
                        launch_config_json: '{}',
                    },
                },
            ],
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        });
        renderPage();

        expect(screen.getByText('In review')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /New App/ })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Quiz Quest/ }));
        expect(screen.getByText('Status for l1')).toBeInTheDocument();
    });

    it('invites a first app when there are none', () => {
        mocks.useMyApps.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        });
        renderPage();

        expect(screen.getByText('Build your first app')).toBeInTheDocument();
    });

    it('opens the new app choices from the empty state', () => {
        mocks.useMyApps.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        });
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));
        fireEvent.click(screen.getByRole('button', { name: 'Sheet: list a website' }));
        expect(screen.getByText('New listing ?type=DIRECT_LINK')).toBeInTheDocument();
    });
});
