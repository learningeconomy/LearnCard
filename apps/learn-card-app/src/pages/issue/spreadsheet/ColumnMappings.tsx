import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    addOutline,
    checkmarkOutline,
    swapHorizontalOutline,
    chevronForwardOutline,
    arrowForwardOutline,
    documentTextOutline,
    linkOutline,
    calendarOutline,
    calculatorOutline,
} from 'ionicons/icons';
import * as m from '../../../paraglide/messages.js';
import {
    normalizeColumn,
    RESERVED_COLUMNS,
    type ColumnMapping,
    type MappingTarget,
    type ParsedSpreadsheet,
} from './types';
import { suggestMapping } from './columnMapping';
import { rosterCsvFieldNames } from './roster';
import { spreadsheetErrorMessage } from './messages';
import { SpreadsheetDialog, useSpreadsheetDialog } from './SpreadsheetDialog';
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
    'w-full min-w-0 bg-white text-grayscale-900 border border-grayscale-300 rounded-xl px-3 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
export interface ColumnMappingsProps {
    source: ParsedSpreadsheet;
    template: OBv3CredentialTemplate | null;
    mappings: ColumnMapping[];
    disabled: boolean;
    saveError?: string;
    onRemove: (variable: string) => void;
    onAdd: (
        columnId: string,
        target: MappingTarget,
        options: Pick<ColumnMapping, 'dateFormat' | 'numericFormat' | 'creditUnit'>
    ) => void;
}
const candidateColumns = ({ source, template, mappings }: ColumnMappingsProps) => {
    const active = template ? extractVariablesByType(template).dynamic : [];
    const exportedNames = rosterCsvFieldNames({ mappings }, active);
    return source.columns.filter(
        column =>
            column.index !== source.emailColumn &&
            column.id !== source.rowEvidenceColumn &&
            ![...RESERVED_COLUMNS].some(
                value => normalizeColumn(value) === normalizeColumn(column.label)
            ) &&
            !/^(name|recipientname|fullname|displayname|studentname|firstname|lastname|first|last)$/.test(
                normalizeColumn(column.label)
            ) &&
            !active.some(
                name =>
                    normalizeColumn(name) === normalizeColumn(column.label) ||
                    (source.rowEvidenceColumn !== undefined &&
                        normalizeColumn(exportedNames[name]!) === normalizeColumn(column.label))
            )
    );
};
const activeMapping = (props: ColumnMappingsProps, label: string): ColumnMapping | undefined => {
    const active = props.template ? extractVariablesByType(props.template).dynamic : [];
    return props.mappings.find(
        mapping =>
            normalizeColumn(mapping.label) === normalizeColumn(label) &&
            active.includes(mapping.variable)
    );
};
const fieldStyle = (target: MappingTarget): { icon: string; color: string } => {
    if (target === 'evidence')
        return { icon: linkOutline, color: 'bg-grayscale-100 text-grayscale-700' };
    if (target === 'awardedDate')
        return { icon: calendarOutline, color: 'bg-grayscale-100 text-grayscale-700' };
    if (target === 'description')
        return { icon: documentTextOutline, color: 'bg-grayscale-100 text-grayscale-700' };
    return { icon: calculatorOutline, color: 'bg-emerald-50 text-emerald-700' };
};

export const ColumnMappings: React.FC<ColumnMappingsProps> = props => {
    const columns = candidateColumns(props);
    const included = columns.filter(column => activeMapping(props, column.label)).length;
    const open = useSpreadsheetDialog(close => <ColumnMappingsEditor {...props} onClose={close} />);
    if (!columns.length) return null;
    return (
        <section className="space-y-4 rounded-[20px] border border-grayscale-200 bg-white p-5 font-poppins">
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <IonIcon icon={swapHorizontalOutline} className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-grayscale-900">
                        {m['issueFlow.sheet.columns']()}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                        {props.template
                            ? m['issueFlow.sheet.design.mappingHint']()
                            : m['issueFlow.sheet.pickTypeForColumns']()}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <span
                    className={`rounded-full px-3 py-2 text-xs font-medium ${included ? 'bg-emerald-50 text-emerald-700' : 'bg-grayscale-100 text-grayscale-700'}`}
                >
                    {m['issueFlow.sheet.design.mappingSummary']({
                        mapped: included,
                        total: columns.length,
                    })}
                </span>
                {columns
                    .filter(column => activeMapping(props, column.label))
                    .slice(0, 4)
                    .map(column => (
                        <span
                            key={column.id}
                            className="inline-flex max-w-full items-center gap-1 rounded-full bg-grayscale-100 px-3 py-2 text-xs text-grayscale-700"
                        >
                            <IonIcon icon={checkmarkOutline} aria-hidden="true" />
                            <span className="truncate">{column.label}</span>
                        </span>
                    ))}
            </div>
            <button
                type="button"
                onClick={open}
                className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-900 hover:bg-grayscale-10 transition-colors"
            >
                {m['issueFlow.sheet.design.mapColumns']()}
                <IonIcon
                    icon={chevronForwardOutline}
                    className="rtl:rotate-180"
                    aria-hidden="true"
                />
            </button>
        </section>
    );
};

export const ColumnMappingsEditor: React.FC<
    ColumnMappingsProps & { onClose: () => void }
> = props => {
    const { source, template, disabled, onAdd, onRemove } = props;
    const [choices, setChoices] = useState<Record<string, Partial<ColumnMapping>>>({});
    const [error, setError] = useState('');
    const columns = candidateColumns(props);
    const included = columns.filter(column => activeMapping(props, column.label)).length;
    const editable =
        !disabled && Boolean(template) && (!template?.schemaType || template.schemaType === 'obv3');
    const choose = (columnId: string, patch: Partial<ColumnMapping>): void =>
        setChoices(previous => ({ ...previous, [columnId]: { ...previous[columnId], ...patch } }));
    return (
        <SpreadsheetDialog
            title={m['issueFlow.sheet.design.mapColumns']()}
            subtitle={source.source.name}
            icon={swapHorizontalOutline}
            onClose={props.onClose}
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-grayscale-600">
                        {m['issueFlow.sheet.design.mappingSummary']({
                            mapped: included,
                            total: columns.length,
                        })}
                    </span>
                    <button
                        type="button"
                        onClick={props.onClose}
                        className="rounded-[20px] bg-grayscale-900 px-5 py-3 text-sm font-medium text-white"
                    >
                        {m['common.done']()}
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <p className="text-sm leading-relaxed text-grayscale-600">
                    {template
                        ? m['issueFlow.sheet.design.mappingHint']()
                        : m['issueFlow.sheet.pickTypeForColumns']()}
                </p>
                {(error || props.saveError) && (
                    <p
                        role="alert"
                        className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error || props.saveError}
                    </p>
                )}
                {template?.schemaType && template.schemaType !== 'obv3' ? (
                    <p className="rounded-2xl bg-grayscale-100 p-3 text-sm text-grayscale-700">
                        {m['issueFlow.sheet.design.openBadgesOnly']()}
                    </p>
                ) : disabled ? (
                    <p className="rounded-2xl bg-grayscale-100 p-3 text-sm text-grayscale-700">
                        {m['issueFlow.sheet.design.columnsReadOnly']()}
                    </p>
                ) : null}
                <div className="space-y-3">
                    {columns.map(column => {
                        const selected = activeMapping(props, column.label);
                        const target =
                            selected?.target ??
                            choices[column.id]?.target ??
                            suggestMapping(
                                column,
                                source.rows
                                    .slice(0, 200)
                                    .map(row => row.cells[column.id] ?? { text: '' })
                            );
                        const creditUnit = choices[column.id]?.creditUnit ?? '';
                        const needsUnit = target === 'credits' && /hours?/i.test(column.label);
                        const style = fieldStyle(target);
                        const examples = source.rows
                            .slice(0, 200)
                            .map(row => row.cells[column.id]?.text)
                            .filter(Boolean)
                            .map(value => (value!.length > 64 ? `${value!.slice(0, 64)}…` : value))
                            .slice(0, 3)
                            .join(' · ');
                        const hasFormat = [
                            'credits',
                            'Percent',
                            'RawScore',
                            'GradePointAverage',
                            'awardedDate',
                        ].includes(target);
                        return (
                            <section
                                key={`${source.source.name}:${column.id}`}
                                aria-label={column.label}
                                className={`rounded-2xl border p-4 sm:p-5 ${selected ? 'border-emerald-200 bg-emerald-50/40' : 'border-grayscale-200 bg-white'}`}
                            >
                                <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_24px_minmax(0,1.1fr)_auto]">
                                    <div className="min-w-0">
                                        <p className="mb-2 text-xs font-medium text-grayscale-500">
                                            {m['issueFlow.sheet.design.sourceColumn']()}
                                        </p>
                                        <h3 className="break-words text-sm font-semibold text-grayscale-900">
                                            {column.label}
                                        </h3>
                                        <p
                                            className="mt-2 truncate text-xs text-grayscale-600"
                                            title={examples}
                                        >
                                            {m['issueFlow.sheet.design.sample']({
                                                value: examples || '—',
                                            })}
                                        </p>
                                    </div>
                                    <IonIcon
                                        icon={arrowForwardOutline}
                                        className="mt-8 hidden text-grayscale-400 sm:block rtl:rotate-180"
                                        aria-hidden="true"
                                    />
                                    <div className="min-w-0">
                                        <p className="mb-2 text-xs font-medium text-grayscale-500">
                                            {m['issueFlow.sheet.design.credentialField']()}
                                        </p>
                                        {selected ? (
                                            <span
                                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium ${style.color}`}
                                            >
                                                <IonIcon icon={style.icon} aria-hidden="true" />
                                                {m[`issueFlow.sheet.target.${target}`]()}
                                            </span>
                                        ) : (
                                            <select
                                                aria-label={m['issueFlow.sheet.mappingFor']({
                                                    name: column.label,
                                                })}
                                                value={target}
                                                disabled={!editable}
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
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        disabled={
                                            !editable ||
                                            (needsUnit && !selected && !creditUnit.trim())
                                        }
                                        aria-label={
                                            selected
                                                ? m['issueFlow.sheet.design.removeColumn']({
                                                      name: column.label,
                                                  })
                                                : m['issueFlow.sheet.design.includeColumn']({
                                                      name: column.label,
                                                  })
                                        }
                                        aria-pressed={Boolean(selected)}
                                        className={`inline-flex items-center justify-center gap-1.5 rounded-[20px] px-4 py-3 text-sm font-medium sm:mt-6 disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-grayscale-900 text-white hover:opacity-90'}`}
                                        onClick={() => {
                                            try {
                                                if (selected) onRemove(selected.variable);
                                                else
                                                    onAdd(column.id, target, {
                                                        dateFormat:
                                                            choices[column.id]?.dateFormat ?? 'iso',
                                                        numericFormat:
                                                            choices[column.id]?.numericFormat ??
                                                            'dot',
                                                        creditUnit,
                                                    });
                                                setError('');
                                            } catch (reason) {
                                                setError(spreadsheetErrorMessage(reason));
                                            }
                                        }}
                                    >
                                        <IonIcon
                                            icon={selected ? checkmarkOutline : addOutline}
                                            aria-hidden="true"
                                        />
                                        {selected
                                            ? m['issueFlow.sheet.design.included']()
                                            : m['issueFlow.sheet.design.include']()}
                                    </button>
                                </div>
                                {!selected && hasFormat && (
                                    <details
                                        className="mt-4 border-t border-grayscale-100 pt-3"
                                        open={needsUnit || undefined}
                                    >
                                        <summary className="cursor-pointer py-2 text-xs font-medium text-grayscale-700">
                                            {m['issueFlow.sheet.design.formatOptions']()}
                                        </summary>
                                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                            {[
                                                'credits',
                                                'Percent',
                                                'RawScore',
                                                'GradePointAverage',
                                            ].includes(target) && (
                                                <label className="block text-xs font-medium text-grayscale-700">
                                                    {m['issueFlow.sheet.numberFormat']()}
                                                    <select
                                                        className={`${INPUT} mt-1.5`}
                                                        disabled={!editable}
                                                        value={
                                                            choices[column.id]?.numericFormat ??
                                                            'dot'
                                                        }
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
                                                <label className="block text-xs font-medium text-grayscale-700">
                                                    {m['issueFlow.sheet.creditUnit']()}
                                                    <input
                                                        className={`${INPUT} mt-1.5 placeholder:text-grayscale-400`}
                                                        disabled={!editable}
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
                                                        <span className="mt-1.5 block font-normal leading-relaxed text-grayscale-500">
                                                            {m['issueFlow.sheet.hoursHint']()}
                                                        </span>
                                                    )}
                                                </label>
                                            )}
                                            {target === 'awardedDate' && (
                                                <label className="block text-xs font-medium text-grayscale-700">
                                                    {m['issueFlow.sheet.dateFormat']()}
                                                    <select
                                                        className={`${INPUT} mt-1.5`}
                                                        disabled={!editable}
                                                        value={
                                                            choices[column.id]?.dateFormat ?? 'iso'
                                                        }
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
                                        </div>
                                    </details>
                                )}
                            </section>
                        );
                    })}
                </div>
            </div>
        </SpreadsheetDialog>
    );
};
