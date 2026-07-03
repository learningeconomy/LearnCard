import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const push = vi.fn();
const replace = vi.fn();
let mockLocation = { search: '' };

vi.mock('react-router-dom', async orig => {
    const actual = (await orig()) as any;
    return { ...actual, useHistory: () => ({ push, replace }), useLocation: () => mockLocation };
});

vi.mock('../../components/main-header/MainHeader', () => ({ default: () => null }));
vi.mock('../../components/main-header/ProfileAlertsIsland', () => ({ default: () => null }));
vi.mock('../launchPad/AppStoreDetailModal', () => ({ default: () => null }));
vi.mock('./useMoreApps', () => ({
    default: () => ({ apps: [], isSuggested: true, isLoading: false }),
}));
vi.mock('./useOpenBoostTemplateSelector', () => ({ default: () => vi.fn() }));
vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    ModalTypes: { Cancel: 'Cancel', Right: 'Right', Center: 'Center', FullScreen: 'FullScreen' },
    useDeviceTypeByWidth: () => ({ isMobile: false }),
}));

import MyAppsLanding from './MyAppsLanding';

const renderPage = () =>
    render(
        <MemoryRouter>
            <MyAppsLanding />
        </MemoryRouter>
    );

describe('MyAppsLanding', () => {
    beforeEach(() => {
        push.mockClear();
        replace.mockClear();
        mockLocation = { search: '' };
    });

    it('renders both section headings and the 8 LearnCard shortcuts', () => {
        renderPage();
        expect(screen.getByText('LearnCard Apps')).toBeTruthy();
        expect(screen.getByText('More Apps')).toBeTruthy();
        expect(screen.getByLabelText('Skill Insights')).toBeTruthy();
        expect(screen.getByLabelText('Boost a Friend')).toBeTruthy();
    });

    it('redirects deep-link params to the browse view, preserving the query', () => {
        mockLocation = { search: '?uri=spark%3A%2F%2Fx&foo=1' };
        renderPage();
        expect(replace).toHaveBeenCalledWith(
            expect.stringContaining('/launchpad/browse?uri=spark%3A%2F%2Fx&foo=1')
        );
    });
});
