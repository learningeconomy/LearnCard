import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronDownOutline } from 'ionicons/icons';
import {
    VERIFIABLE_DATA_FIELD_PREFIX,
    type ConsentFlowContractDetails,
    type ConsentFlowTerms,
} from '@learncard/types';
import {
    resolveProfileField,
    validProfileAnswer,
    type ProfileField,
} from '../config/profileFields';
import { useTenantConfig } from '../config/TenantConfigProvider';
import { useT } from '../i18n';
import type { BespokeLearnCard } from '../types/learn-card';
import { getVerifiableData, saveVerifiableData } from './useVerifiableData';

export interface FieldReview {
    wallet: BespokeLearnCard;
    terms: ConsentFlowTerms;
}
interface Answer {
    category: string;
    field?: ProfileField;
    required: boolean;
    mode: 'once' | 'live' | 'off';
    value: string;
    custom?: boolean;
    saved?: { value: string; uri: string };
}

const inputClass =
    'block min-h-12 w-full min-w-0 rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

const ProfileSelect = (props: React.ComponentPropsWithoutRef<'select'>) => (
    <div className="relative min-w-0">
        <select {...props} className={`${inputClass} appearance-none pe-11`} />
        <IonIcon
            icon={chevronDownOutline}
            aria-hidden="true"
            className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-grayscale-700"
        />
    </div>
);

const ProfileAnswerSelect = ({
    field,
    value,
    custom,
    onChange,
}: {
    field: Extract<ProfileField, { type: 'select' }>;
    value: string;
    custom?: boolean;
    onChange: (answer: Pick<Answer, 'value' | 'custom'>) => void;
}) => {
    const t = useT();
    const hasCustomOption = field.values.some(choice => typeof choice !== 'string');
    const presetValue = (choice: string) => (hasCustomOption ? `preset:${choice}` : choice);

    return (
        <>
            <ProfileSelect
                aria-label={field.label}
                required
                value={custom ? 'custom' : value && presetValue(value)}
                onChange={event => {
                    const selection = event.target.value;
                    if (hasCustomOption && selection === 'custom') {
                        onChange({ custom: true, value: '' });
                        return;
                    }
                    onChange({
                        custom: false,
                        value: hasCustomOption ? selection.replace(/^preset:/, '') : selection,
                    });
                }}
            >
                <option value="">{t('profileFields.choose')}</option>
                {field.values.map(choice =>
                    typeof choice === 'string' ? (
                        <option key={`preset:${choice}`} value={presetValue(choice)}>
                            {choice}
                        </option>
                    ) : (
                        <option key="custom" value="custom">
                            {t('profileFields.selfDescribe')}
                        </option>
                    )
                )}
            </ProfileSelect>
            {custom && (
                <input
                    aria-label={field.label + ' — ' + t('profileFields.selfDescribe')}
                    placeholder={t('profileFields.enterAnswer')}
                    className={inputClass}
                    required
                    maxLength={512}
                    type="text"
                    value={value}
                    onChange={event => onChange({ value: event.target.value })}
                />
            )}
        </>
    );
};

export const ConsentProfileFields = ({
    contract,
    review,
    onConfirm,
    onCancel,
}: {
    contract: ConsentFlowContractDetails;
    review: FieldReview;
    onConfirm: (terms: ConsentFlowTerms) => void;
    onCancel: () => void;
}) => {
    const config = useTenantConfig();
    const t = useT();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        const load = async (): Promise<Answer[]> =>
            Promise.all(
                Object.entries(contract.contract.read.credentials.categories)
                    .filter(([key]) => key.startsWith(VERIFIABLE_DATA_FIELD_PREFIX))
                    .map(async ([category, { required }]): Promise<Answer> => {
                        const field = resolveProfileField(
                            category,
                            config.tenantId,
                            config.verifiableDataSchemas ?? {}
                        );
                        const grant = review.terms.read.credentials.categories[category];
                        const mode =
                            !field || (!required && !grant?.sharing)
                                ? 'off'
                                : grant?.shareAll
                                  ? 'live'
                                  : 'once';
                        const answer: Answer = { category, field, required, mode, value: '' };
                        if (!field) return answer;
                        const stored = await getVerifiableData<Record<string, unknown>>(
                            review.wallet,
                            category
                        );
                        const key = category.split(':').at(-1)!;
                        const value = stored.data?.[key];
                        if (!stored.uri || !validProfileAnswer(field, value)) return answer;
                        const age = Date.now() - Date.parse(stored.issuanceDate ?? '');
                        if (field.maxAgeDays && !(age >= 0 && age <= field.maxAgeDays * 86400000))
                            return answer;
                        const storedAnswer = {
                            ...answer,
                            value,
                            custom: field.type === 'select' && !field.values.includes(value),
                        };
                        if (Object.keys(stored.data ?? {}).length !== 1) return storedAnswer;
                        return { ...storedAnswer, saved: { value, uri: stored.uri } };
                    })
            );
        void load()
            .then(rows => {
                if (active) setAnswers(rows);
            })
            .catch(() => {
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [contract, review, config, attempt]);
    const update = (category: string, patch: Partial<Answer>) =>
        setAnswers(rows =>
            rows.map(row => (row.category === category ? { ...row, ...patch } : row))
        );
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (loading || saving || !answers.length) return;
        setSaving(true);
        setError(false);
        try {
            const terms = structuredClone(review.terms);
            for (const answer of answers) {
                const { field, category, mode, value } = answer;
                const enabled = mode !== 'off';
                if (
                    (answer.required && !enabled) ||
                    (enabled && (!field || !validProfileAnswer(field, value)))
                ) {
                    throw new Error('Invalid requested field');
                }
                const shared: string[] = [];
                if (enabled && field) {
                    const uri =
                        answer.saved?.value === value
                            ? answer.saved.uri
                            : await saveVerifiableData(
                                  review.wallet,
                                  category,
                                  { [category.split(':').at(-1)!]: value },
                                  { category, name: field.label }
                              );
                    shared.push(uri);
                    terms.read.credentials.sharing = true;
                }
                terms.read.credentials.categories[category] = {
                    ...terms.read.credentials.categories[category],
                    sharing: enabled,
                    shareAll: mode === 'live',
                    shared,
                };
            }
            onConfirm(terms);
        } catch {
            setError(true);
        } finally {
            setSaving(false);
        }
    };
    return (
        <form className="flex flex-col gap-5" onSubmit={submit}>
            {answers.map(({ field, category, mode, required, value, custom }) => (
                <fieldset key={category} disabled={saving} className="min-w-0">
                    <legend className="mb-2 text-sm font-semibold text-grayscale-900">
                        {field?.label ?? t('profileFields.unavailable')}
                    </legend>
                    {field && (
                        <div className="grid gap-2.5">
                            <ProfileSelect
                                aria-label={field.label + ' — ' + t('profileFields.permission')}
                                value={mode}
                                onChange={e =>
                                    update(category, { mode: e.target.value as Answer['mode'] })
                                }
                            >
                                {!required && <option value="off">{t('profileFields.off')}</option>}
                                <option value="once">{t('profileFields.once')}</option>
                                <option value="live">{t('profileFields.live')}</option>
                            </ProfileSelect>
                            {mode !== 'off' &&
                                (field.type === 'select' ? (
                                    <ProfileAnswerSelect
                                        field={field}
                                        value={value}
                                        custom={custom}
                                        onChange={answer => update(category, answer)}
                                    />
                                ) : (
                                    <input
                                        aria-label={field.label}
                                        className={inputClass}
                                        required
                                        maxLength={512}
                                        type={field.type}
                                        value={value}
                                        onChange={e => update(category, { value: e.target.value })}
                                    />
                                ))}
                        </div>
                    )}
                </fieldset>
            ))}
            {error && (
                <p role="alert" className="text-sm text-red-700">
                    {t('profileFields.error')}
                </p>
            )}
            {error && !answers.length && (
                <button
                    type="button"
                    onClick={() => {
                        setLoading(true);
                        setError(false);
                        setAttempt(n => n + 1);
                    }}
                >
                    {t('profileFields.retry')}
                </button>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3 border-t border-solid border-grayscale-200 pt-5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-[20px] border border-solid border-grayscale-300 px-3 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10"
                >
                    {t('consentAudience.cancel')}
                </button>
                <button
                    type="submit"
                    disabled={
                        loading ||
                        saving ||
                        !answers.length ||
                        answers.some(a => a.required && !a.field)
                    }
                    className="flex items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-3 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {(loading || saving) && (
                        <span
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                        />
                    )}
                    {loading
                        ? t('profileFields.loading')
                        : saving
                          ? t('profileFields.saving')
                          : t('consentAudience.confirm')}
                </button>
            </div>
        </form>
    );
};
