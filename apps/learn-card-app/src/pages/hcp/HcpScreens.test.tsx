import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HcpEntry, HcpGrant } from 'learn-card-base/hcp/useHcp';

import AppsSection from './AppsSection';
import HcpConnectPage from './HcpConnectPage';
import HcpPage from './HcpPage';
import MyInfoSection from './MyInfoSection';
import { DEFAULT_PURPOSE_CODE } from './consentLink';

const state = vi.hoisted(() => ({
    mutate: vi.fn(),
    grants: [] as unknown[],
    entries: [] as unknown[],
    truncated: false,
    changeFailed: false,
    loadFailed: false,
    refetch: vi.fn(),
    auth: { tag: 'ready', profile: { tag: 'present' } } as unknown,
    presentProfileSetup: vi.fn(),
}));

vi.mock('learn-card-base', async () => {
    const real = await vi.importActual<typeof import('learn-card-base/auth-status/authStatus')>(
        'learn-card-base/auth-status/authStatus'
    );
    return {
        shouldPromptProfileOnboarding: real.shouldPromptProfileOnboarding,
        useAuthStatus: () => state.auth,
        useGetProfile: () => ({ refetch: vi.fn() }),
    };
});

vi.mock('../../components/network-prompts/hooks/useJoinLCNetworkModal', () => ({
    default: () => ({ handlePresentJoinNetworkModal: state.presentProfileSetup }),
}));

vi.mock('learn-card-base/hcp/useHcp', () => ({
    useHcpChange: () => ({ mutate: state.mutate, isPending: false, isError: state.changeFailed }),
    useHcpGrants: () => ({
        isPending: false,
        isError: state.loadFailed,
        data: state.grants,
        refetch: state.refetch,
    }),
    useHcpEntries: () => ({
        isPending: false,
        isError: state.loadFailed,
        data: {
            subject: { id: 'did:key:z6MkMe' },
            entries: state.entries,
            truncated: state.truncated,
        },
        refetch: state.refetch,
    }),
}));

const CLIENT = 'did:key:z6MkDemoTutor';
const consentUrl = `/hcp/connect?${new URLSearchParams({
    client: CLIENT,
    name: 'Demo Tutor',
    categories: 'goals_and_constraints,education_learner_profile',
    purpose: 'Help you study',
})}`;

const renderAt = (url: string) => {
    let current = '';
    render(
        <MemoryRouter initialEntries={[url]}>
            <Route exact path="/hcp/connect" component={HcpConnectPage} />
            <Route
                path="*"
                render={({ location }) => {
                    current = location.pathname + location.search;
                    return null;
                }}
            />
        </MemoryRouter>
    );
    return { location: () => current };
};

beforeEach(() => {
    state.mutate.mockReset();
    state.grants = [];
    state.entries = [];
    state.truncated = false;
    state.changeFailed = false;
    state.loadFailed = false;
    state.refetch.mockReset();
    state.auth = { tag: 'ready', profile: { tag: 'present' } };
    state.presentProfileSetup.mockReset();
});

describe('HCP consent screen', () => {
    it('shows a plain summary of a valid request', () => {
        renderAt(consentUrl);
        expect(screen.getByText('Demo Tutor would like to see some of your info')).toBeTruthy();
        expect(screen.getByText('Goals')).toBeTruthy();
        expect(screen.getByText('Learning')).toBeTruthy();
        expect(screen.getByText('Help you study')).toBeTruthy();
        expect(screen.getByText('1 hour')).toBeTruthy();
        expect(screen.queryByText(/did:|grant|scope/i)).toBeNull();
    });

    it('Allow creates a read-only grant for exactly what was asked', () => {
        renderAt(consentUrl);
        fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
        expect(state.mutate).toHaveBeenCalledTimes(1);
        const [change] = state.mutate.mock.calls[0];
        expect(change).toMatchObject({
            kind: 'allow',
            input: {
                client: { id: CLIENT, name: 'Demo Tutor' },
                access: [
                    {
                        actions: ['read'],
                        categories: ['goals_and_constraints', 'education_learner_profile'],
                        purposes: [{ code: DEFAULT_PURPOSE_CODE, description: 'Help you study' }],
                    },
                ],
                grantType: 'temporary',
            },
        });
    });

    it("Don't allow changes nothing", () => {
        const view = renderAt(consentUrl);
        fireEvent.click(screen.getByRole('button', { name: "Don't Allow" }));
        expect(state.mutate).not.toHaveBeenCalled();
        expect(view.location()).toBe('/hcp');
    });

    it('explains a bad link without offering Allow', () => {
        renderAt('/hcp/connect?client=nope&name=X&categories=goals_and_constraints&purpose=Y');
        expect(screen.getByRole('alert').textContent).toContain("This link doesn't work");
        expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull();
    });
});

describe('HCP apps with access', () => {
    const grant = {
        grantId: 'grant-1',
        client: { id: CLIENT, name: 'Demo Tutor' },
        access: [
            {
                type: 'https://hcp.example/spec/authorization/context-access',
                actions: ['read'],
                categories: ['goals_and_constraints'],
                purposes: [{ code: DEFAULT_PURPOSE_CODE, description: 'Help you study' }],
            },
        ],
        expiresAt: null,
        status: 'active',
    } as unknown as HcpGrant;

    it('shows the empty state', () => {
        render(<AppsSection />);
        expect(screen.getByText('No apps can see your info')).toBeTruthy();
    });

    it('stops sharing only after a one-line confirm', () => {
        state.grants = [grant];
        render(<AppsSection />);
        expect(screen.getByText('Can see: Goals')).toBeTruthy();
        expect(screen.getByText('Why: Help you study')).toBeTruthy();
        expect(screen.getByText('Until you stop sharing')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));
        expect(state.mutate).not.toHaveBeenCalled();
        expect(screen.getByText(/Stop sharing with Demo Tutor\?/)).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));
        expect(state.mutate).toHaveBeenCalledWith({ kind: 'revoke', grantId: 'grant-1' });
    });
});

describe('HCP my info', () => {
    const entry = (id: string, category: string, value: unknown) =>
        ({
            id,
            content: { profile: 'https://hcp.example/spec/profiles/general-context/2.0', value },
            classification: { categories: [category] },
            record: { version: 1, status: 'active' },
        }) as unknown as HcpEntry;

    it('groups entries under plain topic names', () => {
        state.entries = [
            entry('e1', 'goals_and_constraints', 'Finish algebra'),
            entry('e2', 'general_preferences', 'Short examples'),
        ];
        render(<MyInfoSection />);
        const groups = screen
            .getAllByRole('region')
            .map(region => region.getAttribute('aria-label'));
        expect(groups).toEqual(['Preferences', 'Goals']);
        expect(screen.getByText('Finish algebra')).toBeTruthy();
    });

    it('shows the empty state and the list cap', () => {
        state.truncated = true;
        render(<MyInfoSection />);
        expect(screen.getByText('Nothing here yet')).toBeTruthy();
        expect(screen.getByText('Showing your first 500 items.')).toBeTruthy();
    });

    it('offers a retry when loading fails', () => {
        state.loadFailed = true;
        render(<MyInfoSection />);
        fireEvent.click(screen.getByRole('button', { name: /try again/i }));
        expect(state.refetch).toHaveBeenCalled();
    });

    it('does not offer to edit structured info as text', () => {
        state.entries = [entry('e1', 'work_context', { role: 'Teacher' })];
        render(<MyInfoSection />);
        expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy();
    });

    it('removes only after a confirm, and keeps the confirm open on failure', () => {
        state.entries = [entry('e1', 'goals_and_constraints', 'Finish algebra')];
        state.changeFailed = true;
        render(<MyInfoSection />);
        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        expect(state.mutate).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        expect(state.mutate).toHaveBeenCalledWith(
            { kind: 'remove', entryId: 'e1' },
            expect.objectContaining({ onSuccess: expect.any(Function) })
        );
        expect(screen.getByRole('alert').textContent).toContain("Couldn't remove that");
    });
});

describe('HCP without a LearnCard profile', () => {
    const renderRoute = (url: string) =>
        render(
            <MemoryRouter initialEntries={[url]}>
                <Route exact path="/hcp" component={HcpPage} />
                <Route exact path="/hcp/connect" component={HcpConnectPage} />
            </MemoryRouter>
        );

    beforeEach(() => {
        state.auth = { tag: 'ready', profile: { tag: 'absent' } };
        state.loadFailed = true; // what the HCP calls would do without a profile
    });

    it('asks for profile setup on /hcp instead of the error', () => {
        renderRoute('/hcp');
        expect(screen.getByText('Set up your profile first')).toBeTruthy();
        expect(screen.queryByText('Something went wrong')).toBeNull();
        expect(screen.queryByRole('tablist')).toBeNull();
    });

    it('opens the existing profile setup from its one button', () => {
        renderRoute('/hcp');
        fireEvent.click(screen.getByRole('button', { name: 'Set up profile' }));
        expect(state.presentProfileSetup).toHaveBeenCalledWith(expect.any(Function));
    });

    it('asks for profile setup on a consent link, with no Allow', () => {
        renderRoute(consentUrl);
        expect(screen.getByText('Set up your profile first')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull();
        expect(screen.queryByText(/would like to see/)).toBeNull();
    });

    it('still shows the error state for a real failure', () => {
        state.auth = { tag: 'ready', profile: { tag: 'present' } };
        renderRoute('/hcp');
        expect(screen.getByText('Something went wrong')).toBeTruthy();
        expect(screen.queryByText('Set up your profile first')).toBeNull();
    });

    it('waits while the profile is loading', () => {
        state.auth = { tag: 'ready', profile: { tag: 'loading' } };
        renderRoute(consentUrl);
        expect(screen.getByRole('status')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull();
    });
});
