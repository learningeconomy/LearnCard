import React from 'react';
import { within, act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import type { Campaign } from '@learncard/types';
import { CampaignValidator } from '@learncard/types';
import { CampaignRoutes } from './CampaignRoutes';
import { CampaignAudience } from './CampaignAudience';
import { CampaignStatsPanel } from './CampaignStats';
import { initialForm, validateForm } from './model';
import type { CampaignApi } from './types';
import { setInAppMessageOverride } from 'learn-card-base/in-app-messages/debugOverrideStore';
import { ModalsProvider } from 'learn-card-base/components/modals/ModalsContext';

vi.mock('learn-card-base/in-app-messages/debugOverrideStore', () => ({
    setInAppMessageOverride: vi.fn(),
}));
const stats = {
    audience: 17,
    notified: 4,
    emailed: 0,
    shown: 3,
    clicked: 2,
    dismissed: 1,
    converted: 0,
    enrolled: 0,
};
const campaign = (): Campaign => {
    const data = validateForm({
        ...initialForm(),
        id: 'test-campaign',
        name: 'Test campaign',
        notify: true,
        title: 'Test title',
        body: 'Test body',
    }).data!;
    return CampaignValidator.parse({
        ...data,
        message: { ...data.message, id: data.id },
        createdAt: '2026-10-29T00:00:00Z',
        updatedAt: '2026-10-29T00:00:00Z',
    });
};
const apiMock = () =>
    ({
        searchProfiles: vi.fn().mockResolvedValue([]),
        getProfile: vi.fn().mockResolvedValue(undefined),
        campaignsPreviewDispatch: vi.fn().mockResolvedValue({
            campaignId: 'test-campaign',
            recipientCount: 13,
            audienceCount: 17,
            alreadyNotifiedCount: 4,
            previewToken: 'a'.repeat(64),
        }),
        campaignsDispatch: vi.fn().mockResolvedValue({ dispatchId: 'test-dispatch' }),
        campaignsIsAdmin: vi.fn().mockResolvedValue(true),
        campaignsList: vi
            .fn<CampaignApi['campaignsList']>()
            .mockResolvedValue({ records: [campaign()], hasMore: false }),
        campaignsGet: vi.fn().mockResolvedValue(campaign()),
        campaignsCreate: vi.fn().mockResolvedValue(campaign()),
        campaignsUpdate: vi.fn().mockResolvedValue(campaign()),
        campaignsSetStatus: vi
            .fn()
            .mockImplementation(async (_id, status) => ({ ...campaign(), status })),
        campaignsSendTestToMe: vi.fn().mockResolvedValue(true),
        campaignsPreviewAudience: vi.fn().mockResolvedValue({ count: 4 }),
        campaignsAddAudience: vi.fn().mockResolvedValue({ count: 4 }),
        campaignsPageAudience: vi.fn().mockResolvedValue({ records: [], hasMore: false }),
        campaignsGetStats: vi.fn().mockResolvedValue(stats),
    }) satisfies CampaignApi;
const mount = (
    api: CampaignApi,
    path = '/admin/campaigns/test-campaign',
    element?: React.ReactNode,
    container?: HTMLElement
) => {
    const queries = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const history = createMemoryHistory({
        initialEntries: [path],
        getUserConfirmation: (_message, callback) => callback(false),
    });
    const view = render(
        <QueryClientProvider client={queries}>
            <Router history={history}>{element ?? <CampaignRoutes api={api} />}</Router>
        </QueryClientProvider>,
        { wrapper: ModalsProvider, ...(container ? { container } : {}) }
    );
    return { ...view, history, queries };
};
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
});

describe('campaign composer', () => {
    it('starts quietly with an automatic ID and preserves it while editing', async () => {
        const api = apiMock();
        mount(api, '/admin/campaigns?create=1');
        const name = await screen.findByLabelText('Name');
        const id = screen.getByLabelText('Campaign ID') as HTMLInputElement;
        const generated = id.value;
        expect(generated).toMatch(/^campaign-[a-f0-9-]+$/);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        fireEvent.change(name, { target: { value: 'Welcome back' } });
        expect(id).toHaveValue(generated);
        fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
        await waitFor(() =>
            expect(api.campaignsCreate).toHaveBeenCalledWith(
                expect.objectContaining({ id: generated, name: 'Welcome back' })
            )
        );
    });
    it('replaces the create URL after saving and reloads the same campaign without another create', async () => {
        const api = apiMock();
        const save = deferred<Campaign>();
        api.campaignsCreate.mockReturnValue(save.promise);
        const view = mount(api, '/admin/campaigns?create=1');
        fireEvent.change(await screen.findByLabelText('Name'), {
            target: { value: 'Test campaign' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
        expect(view.history.location.search).toBe('?create=1');
        await act(async () => save.resolve(campaign()));
        // This history rejects navigation while Prompt is active, catching a save/blocker race.
        await waitFor(() =>
            expect(view.history.location.pathname).toBe('/admin/campaigns/test-campaign')
        );
        expect(view.history.action).toBe('REPLACE');
        expect(view.history.location.search).toBe('');
        const savedUrl = view.history.location.pathname;
        view.unmount();
        api.campaignsGet.mockClear();
        mount(api, savedUrl);
        expect(await screen.findByLabelText('Name')).toHaveValue('Test campaign');
        expect(screen.getByLabelText('Campaign ID')).toHaveValue('test-campaign');
        expect(screen.getByLabelText('Campaign ID')).toBeDisabled();
        expect(api.campaignsGet).toHaveBeenCalledWith('test-campaign');
        expect(api.campaignsCreate).toHaveBeenCalledTimes(1);
    });
    it('filters through the server instead of only filtering loaded pages', async () => {
        const api = apiMock();
        mount(api, '/admin/campaigns');
        fireEvent.click(await screen.findByRole('button', { name: 'Paused' }));
        await waitFor(() =>
            expect(api.campaignsList).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'paused', limit: 20 })
            )
        );
    });

    it('loads a saved campaign named new without confusing it with draft creation', async () => {
        const api = apiMock();
        api.campaignsGet.mockResolvedValue({ ...campaign(), id: 'new', name: 'Existing new ID' });
        mount(api, '/admin/campaigns/new');
        expect(await screen.findByLabelText('Campaign ID')).toHaveValue('new');
        expect(screen.getByLabelText('Campaign ID')).toBeDisabled();
        expect(api.campaignsGet).toHaveBeenCalledWith('new');
        expect(api.campaignsCreate).not.toHaveBeenCalled();
    });

    it('does not fetch protected data before admin access, and hides denied routes', async () => {
        const api = apiMock();
        const gate = deferred<boolean>();
        api.campaignsIsAdmin.mockReturnValue(gate.promise);
        mount(api);
        expect(screen.getByText('Checking access...')).toBeVisible();
        expect(api.campaignsGet).not.toHaveBeenCalled();
        await act(async () => gate.resolve(false));
        expect(await screen.findByText('Page not found')).toBeVisible();
        expect(api.campaignsGet).not.toHaveBeenCalled();
    });
    it('offers retry for access failures without fetching campaign data', async () => {
        const api = apiMock();
        api.campaignsIsAdmin.mockRejectedValueOnce(new Error('private error'));
        mount(api);
        expect(await screen.findByRole('alert')).not.toHaveTextContent('private error');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByLabelText('Name')).toHaveValue('Test campaign');
    });
    it('validates JSON, keeps ID immutable, previews locally and clears on navigation', async () => {
        const api = apiMock();
        const view = mount(api);
        expect(await screen.findByLabelText('Campaign ID')).toBeDisabled();
        fireEvent.click(
            within(screen.getByRole('tablist', { name: 'Message editing mode' })).getByRole('tab', {
                name: 'JSON',
            })
        );
        fireEvent.change(screen.getByLabelText('Message JSON'), { target: { value: '{' } });
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Preview message' })).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Message JSON'), {
            target: { value: JSON.stringify(campaign().message) },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Preview message' }));
        expect(setInAppMessageOverride).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'test-campaign' })
        );
        expect(api.campaignsSendTestToMe).not.toHaveBeenCalled();
        expect(api.campaignsSetStatus).not.toHaveBeenCalled();
        view.unmount();
        expect(setInAppMessageOverride).toHaveBeenLastCalledWith(null);
    });
    it('requires confirmation for caller-only tests, prevents duplicate clicks, and keeps full sends disabled', async () => {
        const api = apiMock();
        const send = deferred<boolean>();
        api.campaignsSendTestToMe.mockReturnValue(send.promise);
        mount(api);
        fireEvent.click(await screen.findByRole('button', { name: 'Send Test to Me' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(api.campaignsSendTestToMe).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Send Test to Me' }));
        const confirm = screen.getByRole('button', { name: 'Confirm test send' });
        fireEvent.click(confirm);
        fireEvent.click(confirm);
        expect(api.campaignsSendTestToMe).toHaveBeenCalledTimes(1);
        expect(api.campaignsSendTestToMe).toHaveBeenCalledWith('test-campaign');
        expect(screen.getByRole('button', { name: 'Send Notifications' })).toBeDisabled();
        await act(async () => send.resolve(true));
        expect(await screen.findByText(/Test notification sent/)).toBeVisible();
    });
    it('uses the existing admin endpoint for a draft in-app-only test', async () => {
        const api = apiMock();
        api.campaignsGet.mockResolvedValue({
            ...campaign(),
            channels: ['inApp'],
            notification: undefined,
        });
        mount(api);
        fireEvent.click(await screen.findByRole('button', { name: 'Send Test to Me' }));
        expect(
            screen.getByText(/Send a private test.*in-app message on your next visit/)
        ).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm test send' }));
        await waitFor(() =>
            expect(api.campaignsSendTestToMe).toHaveBeenCalledWith('test-campaign')
        );
        expect(await screen.findByText(/Your in-app test is waiting/)).toBeVisible();
        expect(setInAppMessageOverride).not.toHaveBeenCalledWith(
            expect.objectContaining({ id: 'test-campaign' })
        );
    });
    it('preserves API-authored email when saving other fields and identifies it before self-test', async () => {
        const api = apiMock();
        const emailCampaign = CampaignValidator.parse({
            ...campaign(),
            channels: ['inApp', 'notify', 'email'],
            email: { subject: 'News', title: 'News', body: 'Programs', ctaLabel: 'View' },
        });
        api.campaignsGet.mockResolvedValue(emailCampaign);
        api.campaignsUpdate.mockResolvedValue({ ...emailCampaign, name: 'Updated name' });
        mount(api);
        fireEvent.change(await screen.findByLabelText('Name'), {
            target: { value: 'Updated name' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
        await waitFor(() =>
            expect(api.campaignsUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    expectedUpdatedAt: emailCampaign.updatedAt,
                    updates: expect.objectContaining({ channels: ['inApp', 'notify', 'email'] }),
                })
            )
        );
        expect(api.campaignsUpdate.mock.calls[0]?.[0].updates).not.toHaveProperty('email');
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Send Test to Me' })).toBeEnabled()
        );
        fireEvent.click(screen.getByRole('button', { name: 'Send Test to Me' }));
        expect(screen.getByRole('group', { name: 'Confirm campaign action' })).toHaveTextContent(
            'email to your verified primary address'
        );
        expect(api.campaignsSendTestToMe).not.toHaveBeenCalled();
    });

    it('allows archived private tests and notification-only content without a JSON editor', async () => {
        const api = apiMock();
        api.campaignsGet.mockResolvedValue({
            ...campaign(),
            status: 'archived',
            channels: ['notify'],
            message: undefined,
        });
        mount(api);
        expect(await screen.findByRole('button', { name: 'Send Test to Me' })).toBeEnabled();
        expect(screen.queryByLabelText('Message JSON')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Notification title')).toHaveValue('Test title');
    });
    it('blocks saved actions and navigation while edits are unsaved, and explicitly clears optional fields', async () => {
        const api = apiMock();
        api.campaignsGet.mockResolvedValue({ ...campaign(), startsAt: '2026-11-01T00:00:00Z' });
        const view = mount(api);
        await screen.findByLabelText('Name');
        fireEvent.change(screen.getByLabelText('Starts at (local time, optional)'), {
            target: { value: '' },
        });
        fireEvent.click(screen.getByLabelText('Inbox / push notification'));
        expect(screen.getByRole('button', { name: 'Go Live' })).toBeDisabled();
        act(() => view.history.push('/admin/campaigns'));
        expect(view.history.location.pathname).toBe('/admin/campaigns/test-campaign');
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
        await waitFor(() =>
            expect(api.campaignsUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    updates: expect.objectContaining({
                        startsAt: null,
                        notification: null,
                        excludeMinors: true,
                        selfEnroll: false,
                    }),
                })
            )
        );
    });
    it('creates once, locks the saved ID, and never dispatches on go live', async () => {
        const api = apiMock();
        const view = mount(api, '/admin/campaigns?create=1');
        await screen.findByLabelText('Name');
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test campaign' } });
        fireEvent.change(screen.getByLabelText('Campaign ID'), {
            target: { value: 'test-campaign' },
        });
        const save = screen.getByRole('button', { name: 'Save Draft' });
        fireEvent.click(save);
        fireEvent.click(save);
        await waitFor(() => expect(screen.getByLabelText('Campaign ID')).toBeDisabled());
        await waitFor(() =>
            expect(view.history.location.pathname).toBe('/admin/campaigns/test-campaign')
        );
        expect(api.campaignsCreate).toHaveBeenCalledTimes(1);
        fireEvent.click(await screen.findByRole('button', { name: 'Go Live' }));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm live' }));
        await waitFor(() =>
            expect(api.campaignsSetStatus).toHaveBeenCalledWith('test-campaign', 'live')
        );
        expect(api.campaignsSendTestToMe).not.toHaveBeenCalled();
    });
    it.each(['pause', 'content'] as const)(
        'preserves unsaved edits when another editor changes %s before saving',
        async change => {
            const api = apiMock();
            let stored: Campaign = { ...campaign(), status: 'live' };
            const loadedRevision = stored.updatedAt;
            const advance = () => new Date(Date.parse(stored.updatedAt) + 1).toISOString();
            api.campaignsGet.mockImplementation(async () => ({ ...stored }));
            api.campaignsSetStatus.mockImplementation(async (_id, status) => {
                stored = { ...stored, status, updatedAt: advance() };
                return stored;
            });
            const update = vi
                .fn<CampaignApi['campaignsUpdate']>()
                .mockImplementation(async input => {
                    expect(input.updates).not.toHaveProperty('status');
                    if (input.expectedUpdatedAt !== stored.updatedAt) {
                        throw Object.assign(new Error('revision conflict'), {
                            data: { code: 'CONFLICT' },
                        });
                    }
                    stored = {
                        ...stored,
                        name: input.updates.name ?? stored.name,
                        updatedAt: advance(),
                    };
                    return stored;
                });
            api.campaignsUpdate = update;
            const first = mount(api);
            const editorA = within(first.container);
            await editorA.findByRole('textbox', { name: 'Name' });
            // Independent documents model two browser editors without duplicate form IDs.
            const frame = document.createElement('iframe');
            document.body.appendChild(frame);
            const second = mount(api, undefined, undefined, frame.contentDocument!.body);
            const editorB = within(second.container);
            await editorB.findByRole('textbox', { name: 'Name' });
            fireEvent.change(editorA.getByRole('textbox', { name: 'Name' }), {
                target: { value: 'Unsaved first editor' },
            });
            if (change === 'pause') {
                fireEvent.click(editorB.getByRole('button', { name: 'Pause' }));
                fireEvent.click(editorB.getByRole('button', { name: 'Confirm paused' }));
                await editorB.findByText('Campaign is paused.');
            } else {
                fireEvent.change(editorB.getByRole('textbox', { name: 'Name' }), {
                    target: { value: 'Second editor wins' },
                });
                fireEvent.click(editorB.getByRole('button', { name: 'Save changes' }));
                await editorB.findByText('Campaign saved.');
            }
            const winning = { ...stored };
            fireEvent.click(editorA.getByRole('button', { name: 'Save changes' }));
            expect(await editorA.findByRole('alert')).toHaveTextContent(
                'Campaign changed since you loaded it'
            );
            expect(editorA.getByRole('textbox', { name: 'Name' })).toHaveValue(
                'Unsaved first editor'
            );
            expect(editorA.getByText('Unsaved changes')).toBeVisible();
            expect(stored).toEqual(winning);
            expect(update).toHaveBeenLastCalledWith(
                expect.objectContaining({ expectedUpdatedAt: loadedRevision })
            );
            // Retrying never refreshes the token behind the user's back or overwrites the winner.
            fireEvent.click(editorA.getByRole('button', { name: 'Save changes' }));
            await editorA.findByRole('alert');
            expect(stored).toEqual(winning);
            expect(update).toHaveBeenLastCalledWith(
                expect.objectContaining({ expectedUpdatedAt: loadedRevision })
            );
            first.unmount();
            second.unmount();
            frame.remove();
            const reloaded = mount(api);
            const editor = within(reloaded.container);
            expect(await editor.findByRole('textbox', { name: 'Name' })).toHaveValue(winning.name);
            fireEvent.change(editor.getByRole('textbox', { name: 'Name' }), {
                target: { value: 'Reconciled edit' },
            });
            fireEvent.click(editor.getByRole('button', { name: 'Save changes' }));
            await editor.findByText('Campaign saved.');
            expect(update).toHaveBeenLastCalledWith(
                expect.objectContaining({ expectedUpdatedAt: winning.updatedAt })
            );
            expect(stored).toMatchObject({ name: 'Reconciled edit', status: winning.status });
        }
    );
    it('shows friendly mutation failures and allows retry', async () => {
        const api = apiMock();
        api.campaignsSetStatus.mockRejectedValueOnce(new Error('secret backend details'));
        mount(api);
        fireEvent.click(await screen.findByRole('button', { name: 'Archive' }));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm archived' }));
        expect(await screen.findByRole('alert')).not.toHaveTextContent('secret backend details');
        expect(screen.getByRole('button', { name: 'Archive' })).toBeEnabled();
    });
    it('lists membership and notified stats without email or eligible-send claims', async () => {
        const api = apiMock();
        mount(api, '/admin/campaigns');
        expect(await screen.findByRole('link', { name: 'Test campaign' })).toBeVisible();
        expect(screen.getByRole('columnheader', { name: 'Stored members' })).toBeVisible();
        expect(screen.getByRole('columnheader', { name: 'Notified (inbox)' })).toBeVisible();
    });
});

describe('audience batches', () => {
    it('previews email fields without adding, then sends the same normalized source on add', async () => {
        const api = apiMock();
        mount(
            api,
            '/admin/campaigns/test-campaign',
            <CampaignAudience api={api} id="test-campaign" disabled={false} onBusy={() => {}} />
        );
        fireEvent.change(screen.getByLabelText('Email addresses'), {
            target: { value: ' First@EXAMPLE.com;first@example.com,second@example.com' },
        });
        expect(api.campaignsAddAudience).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Preview source audience' }));
        await screen.findByText(/eligible matches processed in preview/);
        const input = {
            campaignId: 'test-campaign',
            source: { type: 'emails', emails: ['first@example.com', 'second@example.com'] },
        };
        expect(api.campaignsPreviewAudience).toHaveBeenCalledWith(input);
        expect(api.campaignsAddAudience).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Add source audience' }));
        await waitFor(() => expect(api.campaignsAddAudience).toHaveBeenCalledWith(input));
        await screen.findByText(/existing members may be included/);
        fireEvent.change(screen.getByLabelText('Email addresses'), {
            target: { value: 'invalid' },
        });
        expect(screen.getByRole('button', { name: 'Add source audience' })).toBeDisabled();
    });
    it('adds only explicitly selected network members through the existing audience endpoint', async () => {
        const api = apiMock();
        api.searchProfiles.mockResolvedValue([
            { did: 'did:key:member', profileId: 'member', displayName: 'A network member' },
        ]);
        mount(
            api,
            '/admin/campaigns/test-campaign',
            <CampaignAudience api={api} id="test-campaign" disabled={false} onBusy={() => {}} />
        );
        fireEvent.change(screen.getByLabelText('Search network members'), {
            target: { value: 'member' },
        });
        fireEvent.click(
            await screen.findByRole('checkbox', { name: 'Select A network member (@member)' })
        );
        expect(api.campaignsAddAudience).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Add selected members' }));
        expect(screen.getByText('Adding selected members...')).toBeInTheDocument();
        await waitFor(() =>
            expect(api.campaignsAddAudience).toHaveBeenCalledWith({
                campaignId: 'test-campaign',
                source: { type: 'dids', dids: ['did:key:member'] },
            })
        );
        await screen.findByText(/existing members may be included/);
    });
    it('stops after the in-flight batch, preserves progress, and never labels matches as additions', async () => {
        const api = apiMock();
        const batch = deferred<{ count: number }>();
        api.campaignsAddAudience.mockReturnValue(batch.promise);
        mount(
            api,
            '/admin/campaigns/test-campaign',
            <CampaignAudience api={api} id="test-campaign" disabled={false} onBusy={() => {}} />
        );
        const file = new File([''], 'audience.csv');
        Object.defineProperty(file, 'text', {
            value: async () =>
                'did\n' + Array.from({ length: 10_000 }, (_, i) => `did:key:${i}`).join('\n'),
        });
        fireEvent.change(screen.getByLabelText('Audience CSV (did column or single column)'), {
            target: { files: [file] },
        });
        await screen.findByText(/10,000 unique identifiers/);
        fireEvent.click(screen.getByRole('button', { name: 'Add CSV audience' }));
        expect(api.campaignsAddAudience).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Stop after current request' }));
        await act(async () => batch.resolve({ count: 800 }));
        expect(
            await screen.findByText(/Stopped after the current request.*800 eligible matches/)
        ).toBeVisible();
        expect(api.campaignsAddAudience).toHaveBeenCalledTimes(1);
        expect(api.campaignsAddAudience.mock.calls[0][0].source).toMatchObject({
            type: 'dids',
            dids: expect.any(Array),
        });
    });
    it('previews boosts without adding and honors include-pending', async () => {
        const api = apiMock();
        mount(
            api,
            '/admin/campaigns/test-campaign',
            <CampaignAudience api={api} id="test-campaign" disabled={false} onBusy={() => {}} />
        );
        fireEvent.change(screen.getByLabelText('Boost URI'), { target: { value: 'lc:boost:one' } });
        fireEvent.click(screen.getByLabelText('Include pending boost recipients'));
        fireEvent.click(screen.getByRole('button', { name: 'Preview boost audience' }));
        await screen.findByText(/4 eligible matches processed in preview/);
        expect(api.campaignsPreviewAudience).toHaveBeenCalledWith({
            campaignId: 'test-campaign',
            source: { type: 'boostRecipients', boostUri: 'lc:boost:one', includePending: true },
        });
        expect(api.campaignsAddAudience).not.toHaveBeenCalled();
    });
});

describe('stats refresh', () => {
    it('polls at 30 seconds and stops on unmount', async () => {
        vi.useFakeTimers();
        const api = apiMock();
        const view = mount(
            api,
            '/admin/campaigns/test-campaign',
            <CampaignStatsPanel api={api} id="test-campaign" />
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(api.campaignsGetStats).toHaveBeenCalledTimes(1);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(29_999);
        });
        expect(api.campaignsGetStats).toHaveBeenCalledTimes(1);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1);
        });
        expect(api.campaignsGetStats).toHaveBeenCalledTimes(2);
        view.unmount();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(60_000);
        });
        expect(api.campaignsGetStats).toHaveBeenCalledTimes(2);
    });
});
