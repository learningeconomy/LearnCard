import React, { useEffect, useId, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';
import type { CampaignApi } from './types';
import { Busy, Field, Notice, buttonClass, inputClass, primaryClass } from './ui';

type VisibleMember = Awaited<ReturnType<CampaignApi['searchProfiles']>>[number];
type Member = VisibleMember & { did: string };
const canSelect = (member: VisibleMember): member is Member =>
    'did' in member && typeof member.did === 'string' && member.did.startsWith('did:');
const normalize = (text: string): string =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
interface Props {
    api: Pick<CampaignApi, 'searchProfiles' | 'getProfile'>;
    disabled: boolean;
    busyAction?: 'preview' | 'add';
    onPreview: (dids: string[]) => void;
    onAdd: (dids: string[]) => void;
}
const SEARCH_LIMIT = 50;

export const CampaignMemberSearch: React.FC<Props> = ({
    api,
    disabled,
    busyAction,
    onPreview,
    onAdd,
}) => {
    const id = useId();
    const [query, setQuery] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [selected, setSelected] = useState<Member[]>([]);
    const [result, setResult] = useState<{
        query: string;
        members: Member[];
        error?: boolean;
        loading?: boolean;
        limited?: boolean;
        unavailable?: boolean;
    }>();
    const term = query.trim();
    useEffect(() => {
        let active = true;
        if (disabled || term.length < 2) {
            setResult(undefined);
            return;
        }
        setResult({ query: term, members: [], loading: true });
        const timer = setTimeout(() => {
            // Keep the authenticated viewer context: the current endpoint's includeSelf flag
            // also clears that context. Merge the SDK's cached own profile instead.
            void Promise.all([
                api.searchProfiles(term, {
                    limit: SEARCH_LIMIT,
                    includeSelf: false,
                    includeServiceProfiles: true,
                    includeConnectionStatus: false,
                }),
                api.getProfile(),
            ])
                .then(([matches, self]) => {
                    const members = [...matches];
                    if (
                        self &&
                        [self.displayName, self.profileId].some(value =>
                            normalize(value).includes(normalize(term))
                        )
                    )
                        members.unshift(self);
                    if (active)
                        setResult({
                            query: term,
                            members: [
                                ...new Map(
                                    members.filter(canSelect).map(member => [member.did, member])
                                ).values(),
                            ],
                            limited: matches.length === SEARCH_LIMIT,
                            unavailable: members.some(member => !canSelect(member)),
                        });
                })
                .catch(() => {
                    if (active) setResult({ query: term, members: [], error: true });
                });
        }, 300);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [api, term, disabled, attempt]);
    const current = result?.query === term ? result : undefined;
    const searching = !disabled && term.length >= 2 && (!current || current.loading);
    const toggle = (member: Member): void =>
        setSelected(previous =>
            previous.some(item => item.did === member.did)
                ? previous.filter(item => item.did !== member.did)
                : previous.length < 1000
                  ? [...previous, member]
                  : previous
        );
    return (
        <fieldset
            disabled={disabled}
            className="flex min-w-0 flex-col gap-4 rounded-2xl border border-grayscale-200 p-5 md:col-span-2"
        >
            <div className="flex items-center gap-3">
                <IonIcon
                    icon={peopleOutline}
                    className="text-xl text-emerald-700"
                    aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-grayscale-900">Find network members</h3>
            </div>
            <p className="text-xs leading-relaxed text-grayscale-600">
                Search public profiles across the network, including your own account. Existing
                visibility and blocking rules apply.
            </p>
            <Field label="Search network members" htmlFor={id}>
                <input
                    id={id}
                    type="search"
                    className={inputClass}
                    value={query}
                    placeholder="Search by name or username"
                    onChange={event => setQuery(event.target.value)}
                    autoComplete="off"
                />
            </Field>
            <div role="status" className="text-xs text-grayscale-600">
                {searching ? (
                    <Busy>Searching members...</Busy>
                ) : term.length < 2 ? (
                    'Enter at least 2 characters.'
                ) : current && !current.error ? (
                    `${current.members.length} matching ${current.members.length === 1 ? 'profile' : 'profiles'}`
                ) : null}
            </div>
            {current?.error && (
                <Notice error>
                    <p>Members could not be loaded. Check your connection and try again.</p>
                    <button
                        type="button"
                        className={buttonClass}
                        onClick={() => setAttempt(value => value + 1)}
                    >
                        Retry member search
                    </button>
                </Notice>
            )}
            {!searching && current && !current.error && current.members.length === 0 && (
                <p className="text-sm text-grayscale-600">
                    No members found. Try a different name or username.
                </p>
            )}
            {!searching && Boolean(current?.members.length) && (
                <ul
                    aria-label="Network search results"
                    className="max-h-72 overflow-y-auto divide-y divide-grayscale-200 rounded-2xl border border-grayscale-200"
                >
                    {current!.members.map(member => {
                        const checked = selected.some(item => item.did === member.did);
                        return (
                            <li key={member.did}>
                                <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-grayscale-10">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 shrink-0 accent-emerald-600"
                                        checked={checked}
                                        disabled={
                                            !member.did.startsWith('did:') ||
                                            (!checked && selected.length >= 1000)
                                        }
                                        onChange={() => toggle(member)}
                                        aria-label={`Select ${member.displayName || member.profileId} (@${member.profileId})`}
                                    />
                                    <span className="min-w-0">
                                        <span className="block break-words text-sm font-medium text-grayscale-900">
                                            {member.displayName || member.profileId}
                                        </span>
                                        <span className="block break-all text-xs text-grayscale-600">
                                            @{member.profileId}
                                        </span>
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            )}
            {current?.limited && (
                <p className="text-xs text-grayscale-600">
                    Showing the first 50 matches. Refine your search to find more members.
                </p>
            )}
            {current?.unavailable && (
                <p className="text-xs text-grayscale-600">
                    Some profiles cannot be selected with your current access.
                </p>
            )}
            {selected.length > 0 && (
                <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-grayscale-700">
                        {selected.length} selected · selections stay as you search
                    </p>
                    <ul
                        aria-label="Selected network members"
                        className="flex max-h-48 flex-wrap gap-2 overflow-y-auto"
                    >
                        {selected.map(member => (
                            <li key={member.did} className="max-w-full">
                                <button
                                    type="button"
                                    className={`${buttonClass} max-w-full !py-2 break-all text-left`}
                                    aria-label={`Remove ${member.displayName || member.profileId} (@${member.profileId})`}
                                    onClick={() => toggle(member)}
                                >
                                    {member.displayName || member.profileId} · Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        className={`${buttonClass} self-start`}
                        onClick={() => setSelected([])}
                    >
                        Clear selection
                    </button>
                </div>
            )}
            <p className="text-xs leading-relaxed text-grayscale-600">
                Preview checks campaign eligibility. Selecting a profile does not add it to the
                audience.
            </p>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    className={buttonClass}
                    disabled={!selected.length || disabled}
                    onClick={() => onPreview(selected.map(member => member.did))}
                >
                    {busyAction === 'preview' ? (
                        <Busy>Checking selected members...</Busy>
                    ) : (
                        'Preview selected members'
                    )}
                </button>
                <button
                    type="button"
                    className={primaryClass}
                    disabled={!selected.length || disabled}
                    onClick={() => onAdd(selected.map(member => member.did))}
                >
                    {busyAction === 'add' ? (
                        <Busy>Adding selected members...</Busy>
                    ) : (
                        'Add selected members'
                    )}
                </button>
            </div>
        </fieldset>
    );
};
