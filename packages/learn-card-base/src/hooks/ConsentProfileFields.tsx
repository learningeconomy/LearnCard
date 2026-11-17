import React, { useEffect, useState } from 'react';
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
    saved?: { value: string; uri: string };
}

export const ConsentProfileFields = ({
    contract,
    review,
    onConfirm,
}: {
    contract: ConsentFlowContractDetails;
    review: FieldReview;
    onConfirm: (terms: ConsentFlowTerms) => void;
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
                        if (Object.keys(stored.data ?? {}).length !== 1)
                            return { ...answer, value };
                        return { ...answer, value, saved: { value, uri: stored.uri } };
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
    const inputClass =
        'w-full py-3 px-4 rounded-xl border border-grayscale-300 bg-white text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500';
    return (
        <form className="space-y-4" onSubmit={submit}>
            {answers.map(({ field, category, mode, required, value }) => (
                <fieldset key={category} disabled={saving} className="space-y-2">
                    <legend className="text-sm font-semibold text-grayscale-900">
                        {field?.label ?? t('profileFields.unavailable')}
                    </legend>
                    {field && (
                        <>
                            <select
                                aria-label={field.label + ' — ' + t('profileFields.permission')}
                                className={inputClass}
                                value={mode}
                                onChange={e =>
                                    update(category, { mode: e.target.value as Answer['mode'] })
                                }
                            >
                                {!required && <option value="off">{t('profileFields.off')}</option>}
                                <option value="once">{t('profileFields.once')}</option>
                                <option value="live">{t('profileFields.live')}</option>
                            </select>
                            {mode !== 'off' &&
                                (field.type === 'select' ? (
                                    <select
                                        aria-label={field.label}
                                        className={inputClass}
                                        required
                                        value={value}
                                        onChange={e => update(category, { value: e.target.value })}
                                    >
                                        <option value="">{t('profileFields.choose')}</option>
                                        {field.values.map(choice => (
                                            <option key={choice} value={choice}>
                                                {choice}
                                            </option>
                                        ))}
                                    </select>
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
                        </>
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
            <button
                type="submit"
                disabled={
                    loading ||
                    saving ||
                    !answers.length ||
                    answers.some(a => a.required && !a.field)
                }
                className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40"
            >
                {loading
                    ? t('profileFields.loading')
                    : saving
                      ? t('profileFields.saving')
                      : t('consentAudience.confirm')}
            </button>
        </form>
    );
};
