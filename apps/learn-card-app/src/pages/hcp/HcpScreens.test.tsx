import React from 'react';
import { cleanup as cleanupScreen, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HcpEntry, HcpGrant } from 'learn-card-base/hcp/useHcp';

import ActivitySection from './ActivitySection';
import AppsSection from './AppsSection';
import HcpConnectPage from './HcpConnectPage';
import HcpPage from './HcpPage';
import MyInfoSection from './MyInfoSection';
import { DEFAULT_PURPOSE_CODE } from './consentLink';

const state = vi.hoisted(() => ({
    mutate: vi.fn(),
    grants: [] as unknown[],
    entries: [] as unknown[],
    events: [] as unknown[],
    truncated: false,
    changeFailed: false,
    loadFailed: false,
    refetch: vi.fn(),
    auth: { tag: 'ready', profile: { tag: 'present' } } as unknown,
    presentProfileSetup: vi.fn(),
    offer: undefined as unknown,
    offerPending: false,
    offerRefetch: vi.fn(),
    approve: vi.fn(),
    approvePending: false,
    approveFailed: false,
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
    useHcpContractOffer: () => ({
        isPending: state.offerPending,
        data: state.offer,
        refetch: state.offerRefetch,
    }),
    useHcpChange: () => ({ mutate: state.mutate, isPending: false, isError: state.changeFailed }),
    useHcpOAuthApprove: () => ({
        mutate: state.approve,
        isPending: state.approvePending,
        isSuccess: false,
        isError: state.approveFailed,
    }),
    useHcpGrants: () => ({
        isPending: false,
        isError: state.loadFailed,
        data: state.grants,
        refetch: state.refetch,
    }),
    useHcpActivity: () => ({
        isPending: false,
        isError: state.loadFailed,
        data: { pages: [{ events: state.events, nextCursor: null }] },
        hasNextPage: false,
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
    state.events = [];
    state.truncated = false;
    state.changeFailed = false;
    state.loadFailed = false;
    state.refetch.mockReset();
    state.auth = { tag: 'ready', profile: { tag: 'present' } };
    state.presentProfileSetup.mockReset();
    state.offer = undefined;
    state.offerPending = false;
    state.offerRefetch.mockReset();
    state.approve.mockReset();
    state.approvePending = false;
    state.approveFailed = false;
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
        expect(screen.getByText("It can only look. It can't change anything.")).toBeTruthy();
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
        expect(change.input).not.toHaveProperty('canWrite');
    });

    it('suggest=1 Allow grants write with canWrite false (LC-2423)', () => {
        renderAt(`${consentUrl}&suggest=1`);
        expect(
            screen.getByText(
                'It can look, and suggest additions. Nothing is saved until you accept.'
            )
        ).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
        const [change] = state.mutate.mock.calls[0];
        expect(change).toMatchObject({
            kind: 'allow',
            input: {
                client: { id: CLIENT, name: 'Demo Tutor' },
                access: [
                    {
                        actions: ['read', 'write'],
                        categories: ['goals_and_constraints', 'education_learner_profile'],
                        purposes: [{ code: DEFAULT_PURPOSE_CODE, description: 'Help you study' }],
                    },
                ],
                canWrite: false,
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

describe('HCP contract consent (LC-2421)', () => {
    const CONTRACT = 'lc:network:localhost%3A4324/trpc:contract:tutor';
    const offer = {
        contractUri: CONTRACT,
        version: 3,
        name: 'Demo Tutor',
        owner: { profileId: 'tutor-co', displayName: 'Tutor Co' },
        agents: [CLIENT],
        access: [
            {
                type: 'https://hcp.example/spec/authorization/context-access',
                actions: ['read'],
                categories: ['goals_and_constraints', 'education_learner_profile'],
                purposes: [{ code: 'https://purpose.example/tutoring', description: 'Tutoring' }],
            },
        ],
        duration: 'ongoing',
        expiresAt: null,
    };
    const contractUrl = `/hcp/connect?${new URLSearchParams({ contract: CONTRACT })}`;

    it("shows the contract's name and owner instead of the unverified warning", () => {
        state.offer = offer;
        renderAt(contractUrl);
        expect(screen.getByText('Demo Tutor would like to see some of your info')).toBeTruthy();
        expect(screen.getByText("Offered by Tutor Co's LearnCard account.")).toBeTruthy();
        expect(screen.queryByText(/can't confirm who made this link/)).toBeNull();
        expect(screen.getByText('Goals')).toBeTruthy();
        expect(screen.getByText('Tutoring')).toBeTruthy();
        expect(screen.getByText('Until you stop sharing')).toBeTruthy();
    });

    it('Allow grants under the contract version shown, with nothing self-asserted', () => {
        state.offer = offer;
        renderAt(contractUrl);
        fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
        const [change] = state.mutate.mock.calls[0];
        expect(change).toEqual({
            kind: 'allow',
            input: {
                client: { id: CLIENT },
                source: { type: 'consentflow', contractUri: CONTRACT, contractVersion: 3 },
            },
        });
    });

    it('waits for the contract, and refuses one it cannot resolve or an agent it does not name', () => {
        state.offerPending = true;
        const { unmount } = render(
            <MemoryRouter initialEntries={[contractUrl]}>
                <Route exact path="/hcp/connect" component={HcpConnectPage} />
            </MemoryRouter>
        );
        expect(screen.getByRole('status')).toBeTruthy();
        unmount();

        state.offerPending = false;
        renderAt(contractUrl);
        expect(screen.getByRole('alert').textContent).toContain("This link doesn't work");
        cleanupScreen();

        state.offer = offer;
        renderAt(`${contractUrl}&client=did:key:z6MkSomeoneElse`);
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

describe('HCP activity (LC-2422)', () => {
    const appEvent = (eventType: string, extra: Record<string, unknown>) => ({
        eventId: `urn:uuid:${eventType}`,
        eventType,
        timestamp: '2026-11-18T19:00:00.000Z',
        participants: {
            initiator: { role: 'context-client', id: CLIENT },
            authorizingPrincipal: { id: 'did:key:z6MkMe' },
            provider: { id: 'did:web:brain' },
        },
        entryId: null,
        categories: [],
        purpose: DEFAULT_PURPOSE_CODE,
        purposeDescription: null,
        grantId: 'grant-1',
        data: {},
        ...extra,
    });

    it("shows an app's read and refusal by the app's name", () => {
        state.grants = [{ grantId: 'grant-1', client: { id: CLIENT, name: 'Demo Tutor' } }];
        state.events = [
            appEvent('https://learncard.com/hcp/v1/events/read-denied', {
                data: { operation: 'query', grantStatus: 'active' },
            }),
            appEvent('context.read', {
                categories: ['goals_and_constraints', 'education_learner_profile'],
                disclosed: [{ entryId: 'urn:uuid:e1', version: 1 }],
            }),
        ];
        render(<ActivitySection />);
        expect(screen.getByText('Demo Tutor saw your Goals and Learning')).toBeTruthy();
        expect(
            screen.getByText("Demo Tutor asked for info it isn't allowed to see and got nothing")
        ).toBeTruthy();
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

    it('lets the person accept or dismiss an app suggestion (LC-2423)', () => {
        state.entries = [
            {
                ...entry('e1', 'goals_and_constraints', 'Practice fractions'),
                record: { version: 1, status: 'suggested' },
            },
        ];
        render(<MyInfoSection />);
        expect(screen.getByText(/Suggested by an app/)).toBeTruthy();
        expect(screen.queryByText('Not shared anymore')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
        expect(state.mutate).toHaveBeenNthCalledWith(1, { kind: 'accept', entryId: 'e1' });
        expect(state.mutate).toHaveBeenNthCalledWith(2, { kind: 'dismiss', entryId: 'e1' });
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

    it.each(['/hcp', consentUrl])(
        'does not turn a profile fetch failure into onboarding on %s',
        url => {
            state.auth = { tag: 'ready', profile: { tag: 'error' } };
            renderRoute(url);
            expect(screen.getByText('Something went wrong')).toBeTruthy();
            expect(screen.queryByText('Set up your profile first')).toBeNull();
            expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull();
        }
    );

    it('waits while the profile is loading', () => {
        state.auth = { tag: 'ready', profile: { tag: 'loading' } };
        renderRoute(consentUrl);
        expect(screen.getByRole('status')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull();
    });
});

/** An unsigned stand-in for the AS's ticket: the page only decodes it for display. */
const ticketFor = (claims: Record<string, unknown>) =>
    ['e30', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'sig'].join('.');
const OAUTH_DID = 'did:web:127.0.0.1%3A18767:hcp:oauth-clients:hcp_oauth_abc123';
const oauthClaims = {
    typ: 'hcp-oauth-request',
    request_id: 'r1',
    client_id: 'hcp_oauth_abc123',
    client_name: 'Claude Code',
    client_did: OAUTH_DID,
    scope: 'hcp:general_preferences:read hcp:general_preferences:write',
    exp: Math.floor(Date.now() / 1000) + 600,
};

describe('HCP OAuth sign-in (MCP host)', () => {
    it('shows the app name, its DID and the scopes it asked for', () => {
        renderAt(`/hcp/connect?oauth_request=${ticketFor(oauthClaims)}`);
        expect(screen.getByText('Claude Code would like to see some of your info')).toBeTruthy();
        expect(screen.getByText(OAUTH_DID)).toBeTruthy();
        expect(screen.getByText('hcp:general_preferences:read')).toBeTruthy();
        expect(screen.getByText('hcp:general_preferences:write')).toBeTruthy();
        expect(screen.getByText('Use your info in Claude Code')).toBeTruthy();
        expect(
            screen.getByText(
                'It can look, and suggest additions. Nothing is saved until you accept.'
            )
        ).toBeTruthy();
    });

    it('Allow approves the ticket, then hands the browser back to the AS', () => {
        const assign = vi.fn();
        const original = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...original, assign },
        });
        try {
            const ticket = ticketFor(oauthClaims);
            renderAt(`/hcp/connect?oauth_request=${ticket}`);
            fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
            expect(state.approve).toHaveBeenCalledTimes(1);
            const [input, callbacks] = state.approve.mock.calls[0];
            expect(input).toEqual({ ticket });
            expect(assign).not.toHaveBeenCalled();
            callbacks.onSuccess({
                completeUrl: 'http://as.test/oauth/consent/complete?assertion=a',
            });
            expect(assign).toHaveBeenCalledWith(
                'http://as.test/oauth/consent/complete?assertion=a'
            );
            expect(state.mutate).not.toHaveBeenCalled();
        } finally {
            Object.defineProperty(window, 'location', { configurable: true, value: original });
        }
    });

    it("Don't Allow goes to /hcp without approving", () => {
        const { location } = renderAt(`/hcp/connect?oauth_request=${ticketFor(oauthClaims)}`);
        fireEvent.click(screen.getByRole('button', { name: "Don't Allow" }));
        expect(state.approve).not.toHaveBeenCalled();
        expect(location()).toBe('/hcp');
    });

    it('shows the failure and stays retryable when approve fails', () => {
        state.approveFailed = true;
        renderAt(`/hcp/connect?oauth_request=${ticketFor(oauthClaims)}`);
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Allow' })).toBeTruthy();
    });

    it.each([
        ['an expired ticket', { ...oauthClaims, exp: Math.floor(Date.now() / 1000) - 1 }],
        ['a ticket of another kind', { ...oauthClaims, typ: 'hcp-consent' }],
        ['an unknown scope', { ...oauthClaims, scope: 'hcp:not_a_category:read' }],
    ])('shows the bad-link state for %s', (_label, claims) => {
        renderAt(`/hcp/connect?oauth_request=${ticketFor(claims)}`);
        expect(screen.getByText("This link doesn't work")).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull();
    });
});
