import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { Toggle } from 'learn-card-base';

import {
    createLearnCardAssistantSchedule,
    deleteLearnCardAssistantSchedule,
    fetchLearnCardAssistantSchedules,
    updateLearnCardAssistantSchedule,
    type CreateLearnCardAssistantScheduleInput,
    type LearnCardAssistantAuth,
    type LearnCardAssistantDayOfWeek,
    type LearnCardAssistantSchedule,
} from './learnCardAssistant.api';
import {
    formatLearnCardAssistantNextRun,
    getLearnCardAssistantBrowserTimezone,
    getLearnCardAssistantDaysSummary,
    getLearnCardAssistantTimezoneOptions,
    LEARNCARD_ASSISTANT_DAYS,
    LEARNCARD_ASSISTANT_DAY_LABELS,
} from './learnCardAssistant.helpers';

const MAX_SCHEDULES = 10;
const MORNING_BRIEFING_PLACEHOLDER =
    "Create a concise morning briefing with today's weather, Mariners updates, and important AI news. Remember what you've already covered so you don't repeat it.";

interface AssistantSchedulesCardProps {
    agentUrl: string;
    auth?: LearnCardAssistantAuth;
}

interface ScheduleDraft extends CreateLearnCardAssistantScheduleInput {
    enabled: boolean;
}

const AssistantSchedulesCard: React.FC<AssistantSchedulesCardProps> = ({ agentUrl, auth }) => {
    const queryClient = useQueryClient();
    const queryKey = ['learncard-assistant-schedules', auth?.did, agentUrl];
    const browserTimezone = useMemo(getLearnCardAssistantBrowserTimezone, []);
    const timezoneOptions = useMemo(
        () => getLearnCardAssistantTimezoneOptions(browserTimezone),
        [browserTimezone]
    );
    const [editingId, setEditingId] = useState<string | undefined>();
    const [draft, setDraft] = useState<ScheduleDraft | undefined>();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | undefined>();
    const [actionError, setActionError] = useState('');
    const {
        data: schedules = [],
        isLoading,
        error: queryError,
    } = useQuery<LearnCardAssistantSchedule[]>({
        queryKey,
        queryFn: () => fetchLearnCardAssistantSchedules(agentUrl, auth!),
        enabled: Boolean(auth),
    });
    const saveMutation = useMutation({
        mutationFn: async (scheduleDraft: ScheduleDraft) => {
            if (!auth) throw new Error('Sign in with a network profile to save schedules.');

            return editingId
                ? updateLearnCardAssistantSchedule(agentUrl, auth, editingId, scheduleDraft)
                : createLearnCardAssistantSchedule(agentUrl, auth, scheduleDraft);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey });
            setEditingId(undefined);
            setDraft(undefined);
            setActionError('');
        },
        onError: error => {
            setActionError(
                error instanceof Error ? error.message : 'Could not save assistant schedule.'
            );
        },
    });
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!auth) throw new Error('Sign in with a network profile to delete schedules.');

            await deleteLearnCardAssistantSchedule(agentUrl, auth, id);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey });
            setDeleteConfirmationId(undefined);
            setActionError('');
        },
        onError: error => {
            setActionError(
                error instanceof Error ? error.message : 'Could not delete assistant schedule.'
            );
        },
    });
    const displayedError =
        actionError ||
        (queryError instanceof Error
            ? queryError.message
            : queryError
            ? 'Could not load schedules.'
            : '');
    const startAdding = (): void => {
        setEditingId(undefined);
        setDeleteConfirmationId(undefined);
        setActionError('');
        setDraft({
            name: '',
            prompt: '',
            enabled: true,
            timeOfDay: '07:30',
            daysOfWeek: [...LEARNCARD_ASSISTANT_DAYS],
            timezone: browserTimezone,
        });
    };
    const startEditing = (schedule: LearnCardAssistantSchedule): void => {
        setEditingId(schedule.id);
        setDeleteConfirmationId(undefined);
        setActionError('');
        setDraft({
            name: schedule.name,
            prompt: schedule.prompt,
            enabled: schedule.enabled,
            timeOfDay: schedule.timeOfDay,
            daysOfWeek: [...schedule.daysOfWeek],
            timezone: schedule.timezone,
        });
    };
    const toggleDay = (day: LearnCardAssistantDayOfWeek): void => {
        if (!draft) return;

        const selected = draft.daysOfWeek.includes(day);
        if (selected && draft.daysOfWeek.length === 1) return;

        setDraft({
            ...draft,
            daysOfWeek: selected
                ? draft.daysOfWeek.filter(selectedDay => selectedDay !== day)
                : [...draft.daysOfWeek, day].sort((a, b) => a - b),
        });
    };
    const cancelEditing = (): void => {
        setEditingId(undefined);
        setDraft(undefined);
        setActionError('');
    };

    return (
        <section className="bg-white border border-grayscale-200 rounded-[20px] p-6 shadow-bottom-2-4 space-y-5 font-poppins">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">Schedules</h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        Choose when your assistant should complete recurring tasks.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={startAdding}
                    disabled={!auth || schedules.length >= MAX_SCHEDULES || Boolean(draft)}
                    className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Add Schedule
                </button>
            </div>

            {schedules.length >= MAX_SCHEDULES && (
                <p className="text-xs text-grayscale-500">You can create up to 10 schedules.</p>
            )}

            {displayedError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-400 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-red-700 leading-relaxed">{displayedError}</span>
                </div>
            )}

            {draft && (
                <form
                    className="border border-grayscale-200 rounded-[20px] p-5 space-y-4"
                    onSubmit={event => {
                        event.preventDefault();
                        saveMutation.mutate(draft);
                    }}
                >
                    <div>
                        <label
                            htmlFor="assistant-schedule-name"
                            className="block text-xs font-medium text-grayscale-700 mb-1.5"
                        >
                            Schedule name
                        </label>
                        <input
                            id="assistant-schedule-name"
                            type="text"
                            value={draft.name}
                            maxLength={60}
                            onChange={event => setDraft({ ...draft, name: event.target.value })}
                            placeholder="Morning briefing"
                            required
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="assistant-schedule-prompt"
                            className="block text-xs font-medium text-grayscale-700 mb-1.5"
                        >
                            Task instructions
                        </label>
                        <textarea
                            id="assistant-schedule-prompt"
                            value={draft.prompt}
                            maxLength={4_000}
                            rows={4}
                            onChange={event => setDraft({ ...draft, prompt: event.target.value })}
                            placeholder={MORNING_BRIEFING_PLACEHOLDER}
                            required
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-y"
                        />
                        <p className="text-xs text-grayscale-400 mt-1.5">
                            Describe the task itself. Your Assistant Profile controls tone and
                            style.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="assistant-schedule-time"
                                className="block text-xs font-medium text-grayscale-700 mb-1.5"
                            >
                                Local time
                            </label>
                            <input
                                id="assistant-schedule-time"
                                type="time"
                                value={draft.timeOfDay}
                                onChange={event =>
                                    setDraft({ ...draft, timeOfDay: event.target.value })
                                }
                                required
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="assistant-schedule-timezone"
                                className="block text-xs font-medium text-grayscale-700 mb-1.5"
                            >
                                Timezone
                            </label>
                            <select
                                id="assistant-schedule-timezone"
                                value={draft.timezone}
                                onChange={event =>
                                    setDraft({ ...draft, timezone: event.target.value })
                                }
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            >
                                {timezoneOptions.map(timezone => (
                                    <option key={timezone} value={timezone}>
                                        {timezone}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <fieldset>
                        <legend className="text-xs font-medium text-grayscale-700 mb-2">
                            Days
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {LEARNCARD_ASSISTANT_DAYS.map(day => {
                                const selected = draft.daysOfWeek.includes(day);

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => toggleDay(day)}
                                        className={`py-2.5 px-3 rounded-full font-medium text-sm transition-colors ${
                                            selected
                                                ? 'bg-grayscale-900 text-white'
                                                : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                        }`}
                                    >
                                        {LEARNCARD_ASSISTANT_DAY_LABELS[day].short}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <Toggle
                        checked={draft.enabled}
                        onChange={enabled => setDraft({ ...draft, enabled })}
                        label="Enabled"
                        labelPosition="left"
                    />

                    <div className="flex flex-wrap justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={saveMutation.isPending}
                            className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                saveMutation.isPending ||
                                !draft.name.trim() ||
                                !draft.prompt.trim() ||
                                draft.daysOfWeek.length === 0
                            }
                            className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {saveMutation.isPending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving schedule...
                                </span>
                            ) : editingId ? (
                                'Save Schedule'
                            ) : (
                                'Create Schedule'
                            )}
                        </button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {[0, 1].map(index => (
                        <div key={index} className="h-28 rounded-[20px] bg-grayscale-100" />
                    ))}
                </div>
            ) : schedules.length === 0 && !draft ? (
                <div className="rounded-[20px] bg-grayscale-10 border border-grayscale-200 p-5 text-center">
                    <p className="text-sm font-medium text-grayscale-900">No schedules yet</p>
                    <p className="text-xs text-grayscale-500 mt-1">
                        Add a schedule when you want your assistant to work automatically.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {schedules.map(schedule => (
                        <article
                            key={schedule.id}
                            className="border border-grayscale-200 rounded-[20px] p-5 space-y-3"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold text-grayscale-900 break-words">
                                            {schedule.name}
                                        </h3>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                schedule.enabled
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-grayscale-100 text-grayscale-600'
                                            }`}
                                        >
                                            {schedule.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                                        {getLearnCardAssistantDaysSummary(schedule.daysOfWeek)} at{' '}
                                        {schedule.timeOfDay} · {schedule.timezone}
                                    </p>
                                    <p className="text-xs text-grayscale-500 mt-1">
                                        {formatLearnCardAssistantNextRun(
                                            schedule.nextRunAt,
                                            schedule.timezone
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => startEditing(schedule)}
                                    disabled={Boolean(draft) || deleteMutation.isPending}
                                    className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Edit
                                </button>
                            </div>

                            <p className="text-sm text-grayscale-600 leading-relaxed break-words">
                                {schedule.prompt}
                            </p>

                            {deleteConfirmationId === schedule.id ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                    <p className="text-xs text-red-700">
                                        Delete this schedule permanently?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteConfirmationId(undefined)}
                                            disabled={deleteMutation.isPending}
                                            className="py-2.5 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteMutation.mutate(schedule.id)}
                                            disabled={deleteMutation.isPending}
                                            className="py-2.5 px-3 rounded-[20px] bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {deleteMutation.isPending ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Deleting...
                                                </span>
                                            ) : (
                                                'Delete Schedule'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirmationId(schedule.id)}
                                    disabled={Boolean(draft)}
                                    className="text-sm text-red-700 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Delete
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};

export default AssistantSchedulesCard;
