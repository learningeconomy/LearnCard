import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    arrowBackOutline,
    chatbubbleEllipsesOutline,
    notificationsOutline,
    codeSlashOutline,
    eyeOutline,
    paperPlaneOutline,
} from 'ionicons/icons';
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
    CampaignMark,
    SectionHeading,
    StatusPill,
    Toggle,
    textButtonClass,
    DeferredFeatures,
    Field,
    Notice,
    buttonClass,
    inputClass,
    panelClass,
    primaryClass,
} from './ui';

const EditorForm: React.FC<{ api: CampaignApi; campaign?: Campaign }> = ({ api, campaign }) => {
    const [edited, setEdited] = useState<Set<keyof CampaignForm>>(() => new Set());
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
    const set = <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]): void => {
        setForm(current => ({ ...current, [key]: value }));
        setEdited(current => new Set(current).add(key));
    };
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
                          message: definition.message ?? null,
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
                        saved.channels.includes('notify')
                            ? `Test notification sent to your signed-in account.${saved.channels.includes('inApp') ? ' Your in-app test is waiting for your next visit.' : ''} Audience stats are unchanged.`
                            : 'Your in-app test is waiting for your next visit. Audience stats are unchanged.'
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
    const visibleErrors = validation.errors.filter(error => {
        const path = error.split(':')[0];
        const field = path.startsWith('message')
            ? 'messageJson'
            : path === 'notification.title'
              ? 'title'
              : path === 'notification.body'
                ? 'body'
                : path === 'channels'
                  ? 'inApp'
                  : path;
        return (
            edited.has(field as keyof CampaignForm) || (path === 'channels' && edited.has('notify'))
        );
    });
    return (
        <div className="space-y-7">
            <Prompt
                when={dirty || busy}
                message={
                    busy
                        ? 'A request is running. Leaving stops remaining batches, but the current request may still complete. Leave?'
                        : 'Discard unsaved campaign changes?'
                }
            />
            <header className="space-y-5">
                <Link
                    to="/admin/campaigns"
                    className="inline-flex items-center gap-2 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    <IonIcon icon={arrowBackOutline} aria-hidden="true" /> Back to campaigns
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <CampaignMark />
                        <div className="min-w-0">
                            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-grayscale-600">
                                Campaign studio
                            </p>
                            <h1
                                aria-label={saved ? 'Edit campaign' : 'Create campaign'}
                                className="text-2xl font-semibold tracking-tight text-grayscale-900 break-words"
                            >
                                {saved?.name ?? 'Create campaign'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-grayscale-600">
                            {dirty
                                ? 'Unsaved changes'
                                : saved
                                  ? 'All changes saved'
                                  : 'Start with a draft'}
                        </span>
                        <StatusPill status={saved?.status ?? 'draft'} />
                    </div>
                </div>
            </header>
            {action.error && <Notice error>{action.error}</Notice>}
            {action.success && <Notice>{action.success}</Notice>}
            <div className="grid items-start gap-6 min-[1200px]:grid-cols-[minmax(0,1fr)_340px] min-[1440px]:grid-cols-[minmax(0,1fr)_380px]">
                <div className="min-w-0 space-y-5">
                    <section className={panelClass}>
                        <SectionHeading
                            step="01"
                            title="Campaign details"
                            description="Give your campaign a name and choose one or both channels."
                        />
                        <fieldset disabled={busy || archived} className="min-w-0 space-y-5">
                            <Field label="Name" htmlFor="campaign-name">
                                <input
                                    id="campaign-name"
                                    className={inputClass}
                                    placeholder="e.g. Your next chapter"
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                />
                            </Field>
                            <fieldset className="pb-5">
                                <legend className="mb-2 text-xs font-medium text-grayscale-700">
                                    Channels
                                </legend>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {(
                                        [
                                            [
                                                'inApp',
                                                'In-app message',
                                                'Show a message inside the app.',
                                                chatbubbleEllipsesOutline,
                                            ],
                                            [
                                                'notify',
                                                'Inbox / push notification',
                                                'Send to the inbox and attempt push.',
                                                notificationsOutline,
                                            ],
                                        ] as const
                                    ).map(([key, label, description, icon]) => (
                                        <label
                                            key={key}
                                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${form[key] ? 'border-emerald-600 bg-emerald-50' : 'border-grayscale-200 bg-white hover:bg-grayscale-10'}`}
                                        >
                                            <IonIcon
                                                icon={icon}
                                                aria-hidden="true"
                                                className={`mt-0.5 shrink-0 text-xl ${form[key] ? 'text-emerald-700' : 'text-grayscale-600'}`}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-medium">
                                                    {label}
                                                </span>
                                                <span className="mt-1 block text-xs leading-relaxed text-grayscale-600">
                                                    {description}
                                                </span>
                                            </span>
                                            <input
                                                type="checkbox"
                                                aria-label={label}
                                                className="mt-1 h-4 w-4 shrink-0 accent-emerald-600 focus-visible:outline-emerald-600"
                                                checked={form[key]}
                                                onChange={e => set(key, e.target.checked)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <details className="border-t border-grayscale-200 pt-4">
                                <summary className="cursor-pointer text-xs font-medium text-grayscale-600">
                                    Advanced settings · Campaign ID
                                </summary>
                                <div className="mt-4 space-y-2">
                                    <Field label="Campaign ID" htmlFor="campaign-id">
                                        <input
                                            id="campaign-id"
                                            className={`${inputClass} font-[family-name:ui-monospace,SFMono-Regular,Menlo,monospace]`}
                                            value={form.id}
                                            disabled={Boolean(saved)}
                                            onChange={e => set('id', e.target.value)}
                                            autoComplete="off"
                                        />
                                    </Field>
                                    <p className="text-xs leading-relaxed text-grayscale-600">
                                        Generated for you. Use 3–64 lowercase letters, numbers or
                                        hyphens; locked after saving.
                                    </p>
                                    {saved && (
                                        <Link
                                            className="block break-all text-xs text-grayscale-600 underline underline-offset-4"
                                            to={`/admin/campaigns/${encodeURIComponent(saved.id)}`}
                                        >
                                            /admin/campaigns/{saved.id}
                                        </Link>
                                    )}
                                </div>
                            </details>
                        </fieldset>
                    </section>
                    <section className={panelClass}>
                        <SectionHeading
                            step="02"
                            title="Message"
                            description="Add content for each selected channel."
                        />
                        <fieldset disabled={busy || archived} className="min-w-0 space-y-5">
                            {form.inApp && (
                                <div className="overflow-hidden rounded-2xl border border-grayscale-200">
                                    <div className="flex items-center justify-between gap-3 border-b border-grayscale-200 bg-grayscale-100 px-4 py-3">
                                        <label
                                            htmlFor="campaign-json"
                                            className="flex items-center gap-2 text-xs font-medium text-grayscale-700"
                                        >
                                            <IonIcon icon={codeSlashOutline} aria-hidden="true" />
                                            Message JSON
                                        </label>
                                        <span
                                            className={`text-xs ${preview?.success ? 'text-emerald-700' : 'text-grayscale-600'}`}
                                        >
                                            {preview?.success ? 'Valid message' : 'Check your JSON'}
                                        </span>
                                    </div>
                                    <textarea
                                        id="campaign-json"
                                        spellCheck={false}
                                        rows={12}
                                        className="block w-full resize-y bg-white p-4 font-[family-name:ui-monospace,SFMono-Regular,Menlo,monospace] text-sm leading-relaxed text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                                        value={form.messageJson}
                                        onChange={e => set('messageJson', e.target.value)}
                                        aria-describedby="campaign-validation"
                                    />
                                </div>
                            )}
                            {form.notify && (
                                <div className="space-y-4 border-t border-grayscale-200 pt-5">
                                    <div>
                                        <h3 className="text-sm font-semibold">Notification copy</h3>
                                        <p className="mt-1 text-xs text-grayscale-600">
                                            The title and body people receive in their inbox and
                                            push notification.
                                        </p>
                                    </div>
                                    <Field label="Notification title" htmlFor="notification-title">
                                        <input
                                            id="notification-title"
                                            className={inputClass}
                                            placeholder="Give people a reason to open"
                                            value={form.title}
                                            onChange={e => set('title', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Notification body" htmlFor="notification-body">
                                        <textarea
                                            id="notification-body"
                                            rows={3}
                                            className={inputClass}
                                            placeholder="Keep it short and useful."
                                            value={form.body}
                                            onChange={e => set('body', e.target.value)}
                                        />
                                    </Field>
                                </div>
                            )}
                        </fieldset>
                    </section>
                    <section className={panelClass}>
                        <SectionHeading
                            step="03"
                            title="Schedule & eligibility"
                            description="Choose when the campaign is available and who can take part."
                        />
                        <fieldset disabled={busy || archived} className="min-w-0 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Starts at (local time, optional)"
                                    htmlFor="campaign-start"
                                >
                                    <input
                                        id="campaign-start"
                                        type="datetime-local"
                                        className={inputClass}
                                        value={form.startsAt}
                                        onChange={e => set('startsAt', e.target.value)}
                                    />
                                </Field>
                                <Field
                                    label="Ends at (local time, optional)"
                                    htmlFor="campaign-end"
                                >
                                    <input
                                        id="campaign-end"
                                        type="datetime-local"
                                        className={inputClass}
                                        value={form.endsAt}
                                        onChange={e => set('endsAt', e.target.value)}
                                    />
                                </Field>
                            </div>
                            <div className="divide-y divide-grayscale-200 border-t border-grayscale-200">
                                <Toggle
                                    label="Exclude minors"
                                    description="Apply the account age eligibility policy."
                                    checked={form.excludeMinors}
                                    onChange={value => set('excludeMinors', value)}
                                />
                                <Toggle
                                    label="Allow self-enrollment"
                                    description="Let eligible people join when their device matches the message rules."
                                    checked={form.selfEnroll}
                                    onChange={value => set('selfEnroll', value)}
                                />
                            </div>
                        </fieldset>
                    </section>
                    <div id="campaign-validation" aria-live="polite">
                        {visibleErrors.length > 0 && (
                            <Notice error>
                                <ul className="space-y-1">
                                    {visibleErrors.map((error, i) => (
                                        <li key={i}>{error}</li>
                                    ))}
                                </ul>
                            </Notice>
                        )}
                    </div>
                </div>
                <aside className="min-w-0 space-y-5 min-[1200px]:sticky min-[1200px]:top-6">
                    <section className="overflow-hidden rounded-[20px] border border-grayscale-200 bg-white">
                        <div className="bg-grayscale-100 p-6">
                            <div className="mb-5 flex items-center justify-between text-xs text-grayscale-600">
                                <span className="font-medium uppercase tracking-widest">
                                    Message overview
                                </span>
                                <IonIcon icon={eyeOutline} className="text-lg" aria-hidden="true" />
                            </div>
                            <div className="space-y-3 rounded-2xl border border-grayscale-200 bg-white p-5 shadow-sm">
                                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                    {form.inApp
                                        ? preview?.success
                                            ? preview.data.presentation
                                            : 'Message'
                                        : 'Inbox / push'}
                                </span>
                                <p className="break-words text-lg font-semibold leading-snug">
                                    {form.inApp
                                        ? preview?.success
                                            ? preview.data.title
                                            : 'Your message preview'
                                        : form.title || 'Your notification title'}
                                </p>
                                <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-grayscale-600 line-clamp-4">
                                    {!form.inApp
                                        ? form.body || 'Add a notification body.'
                                        : preview?.success
                                          ? preview.data.body ||
                                            'Add a body to tell your audience more.'
                                          : 'Fix the message JSON to open a preview.'}
                                </p>
                            </div>
                        </div>
                        {form.inApp && (
                            <div className="space-y-3 p-5">
                                <button
                                    type="button"
                                    className={`${buttonClass} w-full`}
                                    disabled={!preview?.success || busy}
                                    onClick={() => {
                                        if (preview?.success) setInAppMessageOverride(preview.data);
                                    }}
                                >
                                    <IonIcon icon={eyeOutline} aria-hidden="true" />
                                    Preview message
                                </button>
                                <button
                                    type="button"
                                    className={`${textButtonClass} w-full !py-1.5`}
                                    onClick={() => setInAppMessageOverride(null)}
                                >
                                    Close preview
                                </button>
                                <p className="text-center text-xs leading-relaxed text-grayscale-600">
                                    Opens the real message. Buttons remain interactive; preview
                                    activity is not counted.
                                </p>
                            </div>
                        )}
                    </section>
                    <section className={panelClass}>
                        <SectionHeading
                            title={saved ? 'Manage campaign' : 'Save your draft'}
                            description={
                                saved
                                    ? 'Save edits before testing or changing status.'
                                    : 'Save first to add an audience and send yourself a test.'
                            }
                        />
                        <button
                            type="button"
                            className={`${primaryClass} w-full`}
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
                        {!validation.data && !archived && (
                            <p className="text-xs leading-relaxed text-grayscale-600">
                                Complete the campaign name, selected channels and message to save.
                            </p>
                        )}
                        {saved && (
                            <>
                                <div className="flex flex-col gap-4 border-t border-grayscale-200 pt-4">
                                    <button
                                        type="button"
                                        className={`${buttonClass} w-full`}
                                        disabled={transitionLocked}
                                        onClick={() => setConfirmation('test')}
                                    >
                                        <IonIcon icon={paperPlaneOutline} aria-hidden="true" />
                                        Send Test to Me
                                    </button>
                                    <p className="text-xs leading-relaxed text-grayscale-600">
                                        {saved.channels.includes('inApp')
                                            ? 'Your in-app test appears when you next return to the app outside this editor.'
                                            : 'The test notification goes only to your signed-in account.'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {saved.status !== 'live' ? (
                                            <button
                                                type="button"
                                                className={`${buttonClass} flex-1`}
                                                disabled={transitionLocked || archived}
                                                onClick={() => setConfirmation('live')}
                                            >
                                                Go Live
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={`${buttonClass} flex-1`}
                                                disabled={transitionLocked}
                                                onClick={() => setConfirmation('paused')}
                                            >
                                                Pause
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={textButtonClass}
                                            disabled={transitionLocked || archived}
                                            onClick={() => setConfirmation('archived')}
                                        >
                                            Archive
                                        </button>
                                    </div>
                                    <p className="text-xs leading-relaxed text-grayscale-600">
                                        Going live makes in-app messages available within their
                                        schedule. Notifications are sent separately.
                                    </p>
                                </div>
                                {action.busy && (
                                    <div role="status" className="text-sm text-grayscale-600">
                                        <Busy>{action.busy}</Busy>
                                    </div>
                                )}
                                {confirmation && (
                                    <div
                                        className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                                        role="group"
                                        aria-label="Confirm campaign action"
                                    >
                                        <p className="text-sm leading-relaxed">
                                            {confirmation === 'test'
                                                ? `Send a private test to your account via ${saved.channels.map(channel => (channel === 'inApp' ? 'in-app message on your next visit' : 'inbox / push notification')).join(' and ')}?`
                                                : confirmation === 'live'
                                                  ? 'Make this campaign live? Eligible members may see its in-app message.'
                                                  : confirmation === 'archived'
                                                    ? 'Archive this campaign and stop future delivery? Existing notifications remain.'
                                                    : 'Pause future campaign delivery?'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                autoFocus
                                                type="button"
                                                className={primaryClass}
                                                disabled={transitionLocked}
                                                onClick={confirmedAction}
                                            >
                                                Confirm{' '}
                                                {confirmation === 'test'
                                                    ? 'test send'
                                                    : confirmation}
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
                                <DeferredFeatures />
                            </>
                        )}
                    </section>
                </aside>
            </div>
            {saved && (
                <>
                    <CampaignStatsPanel api={api} id={saved.id} />
                    <CampaignAudience
                        api={api}
                        id={saved.id}
                        disabled={Boolean(action.busy) || dirty || archived}
                        onBusy={setAudienceBusy}
                    />
                </>
            )}
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
