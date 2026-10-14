import { spreadsheetErrorMessage } from './messages';
import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { addOutline, checkmarkOutline } from 'ionicons/icons';
import * as m from '../../../paraglide/messages.js';
import {
    normalizeColumn,
    RESERVED_COLUMNS,
    type ColumnMapping,
    type MappingTarget,
    type ParsedSpreadsheet,
} from './types';
import { suggestMapping } from './columnMapping';
import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { extractVariablesByType } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';

const TARGETS: MappingTarget[] = [
    'description',
    'Percent',
    'RawScore',
    'LetterGrade',
    'GradePointAverage',
    'credits',
    'evidence',
    'awardedDate',
];
const INPUT =
    'w-full bg-white text-grayscale-900 border border-grayscale-300 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500';

export const ColumnMappings: React.FC<{
    source: ParsedSpreadsheet;
    template: OBv3CredentialTemplate | null;
    mappings: ColumnMapping[];
    disabled: boolean;
    onRemove: (variable: string) => void;
    onAdd: (
        columnId: string,
        target: MappingTarget,
        options: Pick<ColumnMapping, 'dateFormat' | 'numericFormat' | 'creditUnit'>
    ) => void;
}> = ({ source, template, mappings, disabled, onAdd, onRemove }) => {
    const [choices, setChoices] = useState<Record<string, Partial<ColumnMapping>>>({});
    const [error, setError] = useState('');
    const active = template ? extractVariablesByType(template).dynamic : [];
    const columns = source.columns.filter(
        column =>
            column.index !== source.emailColumn &&
            ![...RESERVED_COLUMNS].some(
                value => normalizeColumn(value) === normalizeColumn(column.label)
            ) &&
            !/^(name|recipientname|fullname|displayname|studentname|firstname|lastname|first|last|evidence|evidencelink|portfolio|portfoliolink)$/.test(
                normalizeColumn(column.label)
            ) &&
            !active.some(name => normalizeColumn(name) === normalizeColumn(column.label))
    );
    if (!columns.length) return null;
    const choose = (columnId: string, patch: Partial<ColumnMapping>): void =>
        setChoices(previous => ({ ...previous, [columnId]: { ...previous[columnId], ...patch } }));
    return (
        <section className="font-poppins bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-4">
            <h3 className="text-base font-semibold text-grayscale-900">
                {m['issueFlow.sheet.columns']()}
            </h3>
            <p className="text-sm text-grayscale-600">
                {template
                    ? m['issueFlow.sheet.columnsHint']()
                    : m['issueFlow.sheet.pickTypeForColumns']()}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {columns.map(column => {
                    const selected = mappings.find(
                        mapping =>
                            normalizeColumn(mapping.label) === normalizeColumn(column.label) &&
                            active.includes(mapping.variable)
                    );
                    const target =
                        choices[column.id]?.target ??
                        suggestMapping(
                            column,
                            source.rows
                                .slice(0, 200)
                                .map(row => row.cells[column.id] ?? { text: '' })
                        );
                    const creditUnit = choices[column.id]?.creditUnit ?? '';
                    const needsUnit = target === 'credits' && /hours?/i.test(column.label);
                    return (
                        <div
                            key={`${source.source.name}:${column.id}`}
                            className="border border-grayscale-200 rounded-2xl p-3 space-y-2"
                        >
                            <button
                                type="button"
                                disabled={
                                    disabled ||
                                    !template ||
                                    (template.schemaType && template.schemaType !== 'obv3') ||
                                    (needsUnit && !selected && !creditUnit.trim())
                                }
                                className="flex items-center gap-1.5 py-2 px-3 rounded-[20px] bg-grayscale-100 text-grayscale-900 text-sm font-medium hover:bg-grayscale-200 disabled:opacity-50"
                                aria-pressed={Boolean(selected)}
                                onClick={() => {
                                    try {
                                        if (selected) {
                                            onRemove(selected.variable);
                                            setError('');
                                            return;
                                        }
                                        onAdd(column.id, target, {
                                            dateFormat: choices[column.id]?.dateFormat ?? 'iso',
                                            numericFormat:
                                                choices[column.id]?.numericFormat ?? 'dot',
                                            creditUnit,
                                        });
                                        setError('');
                                    } catch (reason) {
                                        setError(spreadsheetErrorMessage(reason));
                                    }
                                }}
                            >
                                <IonIcon icon={selected ? checkmarkOutline : addOutline} />
                                {column.label}
                            </button>
                            {!selected && (
                                <>
                                    <select
                                        aria-label={m['issueFlow.sheet.mappingFor']({
                                            name: column.label,
                                        })}
                                        value={target}
                                        disabled={disabled || !template}
                                        onChange={event =>
                                            choose(column.id, {
                                                target: event.target.value as MappingTarget,
                                            })
                                        }
                                        className={INPUT}
                                    >
                                        {TARGETS.map(value => (
                                            <option key={value} value={value}>
                                                {m[`issueFlow.sheet.target.${value}`]()}
                                            </option>
                                        ))}
                                    </select>
                                    {[
                                        'credits',
                                        'Percent',
                                        'RawScore',
                                        'GradePointAverage',
                                    ].includes(target) && (
                                        <label className="block text-xs text-grayscale-700">
                                            {m['issueFlow.sheet.numberFormat']()}
                                            <select
                                                className={`${INPUT} mt-1`}
                                                value={choices[column.id]?.numericFormat ?? 'dot'}
                                                onChange={event =>
                                                    choose(column.id, {
                                                        numericFormat: event.target
                                                            .value as ColumnMapping['numericFormat'],
                                                    })
                                                }
                                            >
                                                <option value="dot">1.5</option>
                                                <option value="comma">1,5</option>
                                            </select>
                                        </label>
                                    )}
                                    {target === 'credits' && (
                                        <label className="block text-xs text-grayscale-700">
                                            {m['issueFlow.sheet.creditUnit']()}
                                            <input
                                                className={`${INPUT} mt-1 placeholder:text-grayscale-400`}
                                                value={creditUnit}
                                                onChange={event =>
                                                    choose(column.id, {
                                                        creditUnit: event.target.value,
                                                    })
                                                }
                                                placeholder={m[
                                                    'issueFlow.sheet.creditUnitExample'
                                                ]()}
                                            />
                                            {needsUnit && (
                                                <span className="block mt-1 text-grayscale-500">
                                                    {m['issueFlow.sheet.hoursHint']()}
                                                </span>
                                            )}
                                        </label>
                                    )}
                                    {target === 'awardedDate' && (
                                        <label className="block text-xs text-grayscale-700">
                                            {m['issueFlow.sheet.dateFormat']()}
                                            <select
                                                className={`${INPUT} mt-1`}
                                                value={choices[column.id]?.dateFormat ?? 'iso'}
                                                onChange={event =>
                                                    choose(column.id, {
                                                        dateFormat: event.target
                                                            .value as ColumnMapping['dateFormat'],
                                                    })
                                                }
                                            >
                                                <option value="iso">
                                                    {m['issueFlow.sheet.dateIso']()}
                                                </option>
                                                <option value="dmy">
                                                    {m['issueFlow.sheet.dateDmy']()}
                                                </option>
                                                <option value="mdy">
                                                    {m['issueFlow.sheet.dateMdy']()}
                                                </option>
                                            </select>
                                        </label>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            {error && (
                <p role="alert" className="p-3 bg-red-50 rounded-2xl text-sm text-red-700">
                    {error}
                </p>
            )}
        </section>
    );
};
