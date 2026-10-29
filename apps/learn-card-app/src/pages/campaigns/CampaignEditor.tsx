import React, { useEffect, useState } from 'react';
import { Link, Prompt } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { setInAppMessageOverride } from 'learn-card-base/in-app-messages/debugOverrideStore';
import type { Campaign, CampaignStatus } from '@learncard/types';
import type { CampaignApi, CampaignForm } from './types';
import { campaignToForm, initialForm, previewMessage, validateForm } from './model';
import { CampaignAudience } from './CampaignAudience';
import { CampaignStatsPanel } from './CampaignStats';
import { useCampaignAction } from './useCampaignAction';
import {
    Busy,
    DeferredFeatures,
    Field,
    Notice,
    buttonClass,
    inputClass,
    panelClass,
    primaryClass,
} from './ui';

const EditorForm: React.FC<{ api: CampaignApi; campaign?: Campaign }> = ({ api, campaign }) => {
    const [saved, setSaved] = useState(campaign);
    const [form, setForm] = useState(() => (campaign ? campaignToForm(campaign) : initialForm()));
    const [baseline, setBaseline] = useState(() => JSON.stringify(form));
    const [audienceBusy, setAudienceBusy] = useState(false);
    const [confirmation, setConfirmation] = useState<CampaignStatus | 'test'>();
    const action = useCampaignAction();
    const queries = useQueryClient();
    const dirty = JSON.stringify(form) !== baseline;
    const busy = Boolean(action.busy) || audienceBusy;
    const validation = validateForm(form, saved?.status);
    const preview = previewMessage(form);
    useEffect(() => () => setInAppMessageOverride(null), []);
    useEffect(() => {
        if (!dirty && !busy) return;
        const beforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', beforeUnload);
        return () => window.removeEventListener('beforeunload', beforeUnload);
    }, [dirty, busy]);
    const set = <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) =>
        setForm(current => ({ ...current, [key]: value }));
    const accept = (next: Campaign) => {
        setSaved(next);
        const nextForm = campaignToForm(next);
        setForm(nextForm);
        setBaseline(JSON.stringify(nextForm));
        queries.setQueryData(['campaign', next.id], next);
        void queries.invalidateQueries({ queryKey: ['campaign-list'] });
        void queries.invalidateQueries({ queryKey: ['campaign-stats', next.id] });
    };
    const save = () =>
        void action.run('Saving campaign...', async () => {
            if (!validation.data) return;
            const { id, ...definition } = validation.data;
            const result = saved
                ? await api.campaignsUpdate({
                      campaignId: saved.id,
                      updates: {
                          ...definition,
                          notification: definition.notification ?? null,
                          startsAt: definition.startsAt ?? null,
                          endsAt: definition.endsAt ?? null,
                      },
                  })
                : await api.campaignsCreate({ ...validation.data, status: 'draft' });
            accept(result);
            action.setSuccess('Campaign saved.');
            // Creation stays in-place so the route blocker never races the successful save.
        });
    const confirmedAction = () => {
        if (!saved || !confirmation) return;
        const selected = confirmation;
        setConfirmation(undefined);
        void action.run(
            selected === 'test' ? 'Sending test to your account...' : 'Updating campaign status...',
            async () => {
                if (selected === 'test') {
                    const sent = await api.campaignsSendTestToMe(saved.id);
                    if (!sent) throw new Error('Test was not acknowledged');
                    action.setSuccess(
                        'Test notification sent to your signed-in account. Audience stats are unchanged.'
                    );
                } else {
                    accept(await api.campaignsSetStatus(saved.id, selected));
                    action.setSuccess(`Campaign is ${selected}.`);
                }
            }
        );
    };
    const archived = saved?.status === 'archived';
    const transitionLocked = busy || dirty || !saved || Boolean(validation.errors.length);
    return (
        <div className="space-y-5">
            <Prompt
                when={dirty || busy}
                message={
                    busy
                        ? 'A request is running. Leaving stops remaining batches, but the current request may still complete. Leave?'
                        : 'Discard unsaved campaign changes?'
                }
            />
            <div className="flex flex-wrap gap-3 justify-between items-center">
                <Link to="/admin/campaigns" className={buttonClass}>
                    Back to campaigns
                </Link>
                <span className="text-sm">{saved?.status ?? 'New draft'}</span>
            </div>
            <h1 className="text-xl font-semibold">{saved ? 'Edit campaign' : 'Create campaign'}</h1>
            {saved && (
                <p className="text-xs text-grayscale-600">
                    Saved URL:{' '}
                    <Link
                        className="underline"
                        to={`/admin/campaigns/${encodeURIComponent(saved.id)}`}
                    >
                        /admin/campaigns/{saved.id}
                    </Link>
                </p>
            )}
            {action.error && <Notice error>{action.error}</Notice>}
            {action.success && <Notice>{action.success}</Notice>}
            <section className={panelClass}>
                <h2 className="text-xl font-semibold">Definition</h2>
                <fieldset disabled={busy || archived} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Campaign ID" htmlFor="campaign-id">
                            <input
                                id="campaign-id"
                                className={inputClass}
                                value={form.id}
                                disabled={Boolean(saved)}
                                onChange={e => set('id', e.target.value)}
                                autoComplete="off"
                            />
                            <p className="text-xs text-grayscale-600">
                                3–64 lowercase letters, numbers or hyphens. Cannot change after
                                creation.
                            </p>
                        </Field>
                        <Field label="Name" htmlFor="campaign-name">
                            <input
                                id="campaign-name"
                                className={inputClass}
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                            />
                        </Field>
                    </div>
                    <fieldset className="flex flex-wrap gap-4">
                        <legend className="text-xs font-medium mb-2">Channels</legend>
                        <label className="flex gap-2">
                            <input
                                type="checkbox"
                                checked={form.inApp}
                                onChange={e => set('inApp', e.target.checked)}
                            />
                            In-app message
                        </label>
                        <label className="flex gap-2">
                            <input
                                type="checkbox"
                                checked={form.notify}
                                onChange={e => set('notify', e.target.checked)}
                            />
                            Inbox / push notification
                        </label>
                    </fieldset>
                    {form.notify && (
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Notification title" htmlFor="notification-title">
                                <input
                                    id="notification-title"
                                    className={inputClass}
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                />
                            </Field>
                            <Field label="Notification body" htmlFor="notification-body">
                                <textarea
                                    id="notification-body"
                                    className={inputClass}
                                    value={form.body}
                                    onChange={e => set('body', e.target.value)}
                                />
                            </Field>
                        </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Starts at (local time, optional)" htmlFor="campaign-start">
                            <input
                                id="campaign-start"
                                type="datetime-local"
                                className={inputClass}
                                value={form.startsAt}
                                onChange={e => set('startsAt', e.target.value)}
                            />
                        </Field>
                        <Field label="Ends at (local time, optional)" htmlFor="campaign-end">
                            <input
                                id="campaign-end"
                                type="datetime-local"
                                className={inputClass}
                                value={form.endsAt}
                                onChange={e => set('endsAt', e.target.value)}
                            />
                        </Field>
                    </div>
                    <label className="flex gap-2">
                        <input
                            type="checkbox"
                            checked={form.excludeMinors}
                            onChange={e => set('excludeMinors', e.target.checked)}
                        />
                        Exclude minors
                    </label>
                    <p className="text-xs text-grayscale-600">
                        Uses the server’s existing age and date-of-birth policy.
                    </p>
                    <label className="flex gap-2">
                        <input
                            type="checkbox"
                            checked={form.selfEnroll}
                            onChange={e => set('selfEnroll', e.target.checked)}
                        />
                        Allow self-enrollment
                    </label>
                    <Field label="Message JSON" htmlFor="campaign-json">
                        <textarea
                            id="campaign-json"
                            spellCheck={false}
                            rows={14}
                            className={`${inputClass} font-mono`}
                            value={form.messageJson}
                            onChange={e => set('messageJson', e.target.value)}
                            aria-describedby="campaign-validation"
                        />
                    </Field>
                </fieldset>
                <div id="campaign-validation" aria-live="polite">
                    {validation.errors.length > 0 ? (
                        <Notice error>
                            <ul>
                                {validation.errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        </Notice>
                    ) : (
                        <p className="text-sm text-emerald-700">Campaign definition is valid.</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        className={buttonClass}
                        disabled={!preview?.success || busy}
                        onClick={() => {
                            if (preview?.success) setInAppMessageOverride(preview.data);
                        }}
                    >
                        Preview message
                    </button>
                    <button
                        type="button"
                        className={buttonClass}
                        onClick={() => setInAppMessageOverride(null)}
                    >
                        Close preview
                    </button>
                    <button
                        type="button"
                        className={primaryClass}
                        disabled={
                            !validation.data || busy || archived || (Boolean(saved) && !dirty)
                        }
                        onClick={save}
                    >
                        {action.busy === 'Saving campaign...' ? (
                            <Busy>{action.busy}</Busy>
                        ) : saved ? (
                            'Save changes'
                        ) : (
                            'Save Draft'
                        )}
                    </button>
                </div>
                <p className="text-xs text-grayscale-600">
                    Preview uses the real message renderer without recording engagement or
                    dispatching notifications. Message actions remain interactive. Close preview
                    before continuing.
                </p>
            </section>
            {saved && (
                <>
                    <section className={panelClass}>
                        <h2 className="text-xl font-semibold">Lifecycle & testing</h2>
                        <p className="text-sm text-grayscale-600">
                            Go Live makes in-app content available within its schedule. It does not
                            dispatch notifications. Save changes before testing or changing status.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                className={buttonClass}
                                disabled={
                                    transitionLocked ||
                                    archived ||
                                    !saved.channels.includes('notify')
                                }
                                onClick={() => setConfirmation('test')}
                            >
                                Send Test to Me
                            </button>
                            {saved.status !== 'live' && (
                                <button
                                    type="button"
                                    className={buttonClass}
                                    disabled={transitionLocked || archived}
                                    onClick={() => setConfirmation('live')}
                                >
                                    Go Live
                                </button>
                            )}
                            {saved.status === 'live' && (
                                <button
                                    type="button"
                                    className={buttonClass}
                                    disabled={transitionLocked}
                                    onClick={() => setConfirmation('paused')}
                                >
                                    Pause
                                </button>
                            )}
                            <button
                                type="button"
                                className={buttonClass}
                                disabled={transitionLocked || archived}
                                onClick={() => setConfirmation('archived')}
                            >
                                Archive
                            </button>
                        </div>
                        {action.busy && (
                            <div role="status">
                                <Busy>{action.busy}</Busy>
                            </div>
                        )}
                        {confirmation && (
                            <div
                                className="p-4 border border-grayscale-300 rounded-2xl space-y-3"
                                role="group"
                                aria-label="Confirm campaign action"
                            >
                                <p>
                                    {confirmation === 'test'
                                        ? 'Send the saved notification to your signed-in admin account only?'
                                        : confirmation === 'live'
                                          ? 'Make this campaign live? Eligible members may see its in-app message.'
                                          : confirmation === 'archived'
                                            ? 'Archive this campaign and stop future delivery? Existing notifications remain.'
                                            : 'Pause future campaign delivery?'}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        autoFocus
                                        type="button"
                                        className={primaryClass}
                                        disabled={transitionLocked}
                                        onClick={confirmedAction}
                                    >
                                        Confirm{' '}
                                        {confirmation === 'test' ? 'test send' : confirmation}
                                    </button>
                                    <button
                                        type="button"
                                        className={buttonClass}
                                        onClick={() => setConfirmation(undefined)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                    <CampaignStatsPanel api={api} id={saved.id} />
                    <CampaignAudience
                        api={api}
                        id={saved.id}
                        disabled={Boolean(action.busy) || dirty || archived}
                        onBusy={setAudienceBusy}
                    />
                </>
            )}
            <DeferredFeatures />
        </div>
    );
};

export const CampaignEditor: React.FC<{ api: CampaignApi; id?: string }> = ({ api, id }) => {
    const query = useQuery({
        queryKey: ['campaign', id ?? null],
        queryFn: () => {
            if (!id) throw new Error('Missing campaign ID');
            return api.campaignsGet(id);
        },
        enabled: Boolean(id),
        retry: false,
    });
    if (!id) return <EditorForm api={api} />;
    if (query.isPending) return <Busy>Loading campaign...</Busy>;
    if (query.isError)
        return (
            <div className="space-y-4">
                <Notice error>
                    This campaign could not be opened. It may be unavailable, or your connection
                    needs attention.
                </Notice>
                <button
                    type="button"
                    className={buttonClass}
                    disabled={query.isFetching}
                    onClick={() => void query.refetch()}
                >
                    {query.isFetching ? <Busy>Loading campaign...</Busy> : 'Try again'}
                </button>
                <Link className={buttonClass} to="/admin/campaigns">
                    Back to campaigns
                </Link>
            </div>
        );
    return <EditorForm api={api} campaign={query.data} />;
};
