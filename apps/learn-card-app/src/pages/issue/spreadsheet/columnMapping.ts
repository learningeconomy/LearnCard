import { rosterCsvFieldNames } from './csvFields';
import {
    normalizeCredentialAwardDate,
    parseCredentialNumber,
    materializeCredentialFields,
} from '@learncard/helpers';
import { recipientKey } from '../components/recipientTypes';
import { getResultValidationError, writeResult, type ResultType } from '../components/resultField';
import {
    dynamicField,
    staticField,
    type OBv3CredentialTemplate,
    type TemplateFieldValue,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import {
    extractVariablesByType,
    labelToVariableName,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import {
    normalizeColumn,
    type ColumnMapping,
    type MappingTarget,
    type RosterDraft,
    type RowProblem,
    type SpreadsheetCell,
    type SpreadsheetColumn,
} from './types';
import { SpreadsheetError } from './parseSpreadsheet';
import { getOverlongTextVariables } from './longText';

export const suggestMapping = (
    column: SpreadsheetColumn,
    cells: SpreadsheetCell[]
): MappingTarget => {
    const label = normalizeColumn(column.label);
    if (
        /percent|percentage/.test(label) ||
        cells.some(cell => cell.percent || /%$/.test(cell.text.trim()))
    )
        return 'Percent';
    if (/gpa|gradepoint/.test(label)) return 'GradePointAverage';
    if (
        /grade/.test(label) &&
        cells.filter(cell => cell.text.trim()).every(cell => /^[a-f][+-]?$/i.test(cell.text.trim()))
    )
        return 'LetterGrade';
    if (/credit/.test(label)) return 'credits';
    if (/score|grade|points/.test(label)) return 'RawScore';
    if (/date|awarded|completed/.test(label) || cells.some(cell => cell.date)) return 'awardedDate';
    if (cells.some(cell => /^https?:\/\//.test(cell.text.trim()))) return 'evidence';
    return 'description'; // Hours need an explicit credit-unit choice.
};

const calendarDate = (value: string, format: ColumnMapping['dateFormat']): string => {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return normalizeCredentialAwardDate(value);
    if (format === 'iso') throw new Error('Ambiguous date');
    const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
    if (!match) throw new Error('Invalid date');
    const month = format === 'mdy' ? match[1] : match[2];
    const day = format === 'mdy' ? match[2] : match[1];
    return normalizeCredentialAwardDate(
        `${match[3]}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
    );
};

export const assertMappingFormat = (
    cell: SpreadsheetCell,
    mapping: Pick<ColumnMapping, 'target' | 'numericFormat'>
): void => {
    if (
        ['credits', 'Percent', 'RawScore', 'GradePointAverage'].includes(mapping.target) &&
        mapping.numericFormat === 'comma' &&
        typeof cell.value !== 'number' &&
        cell.text.includes('.')
    )
        throw new SpreadsheetError('format');
};

/** Preserve invalid text for inline correction rather than dropping its row. */
export const normalizeMappedCell = (cell: SpreadsheetCell, mapping: ColumnMapping): string => {
    // XLSX error cells store a numeric error code in value (e.g. 7 for
    // #DIV/0!). It is never a score/credit value, even if it passes range checks.
    if (cell.problem) return cell.text;
    try {
        if (mapping.target === 'evidence') return cell.text.trim();
        if (mapping.target === 'awardedDate')
            return calendarDate(cell.date ?? cell.text.trim(), mapping.dateFormat);
        if (['credits', 'Percent', 'RawScore', 'GradePointAverage'].includes(mapping.target)) {
            if (typeof cell.value === 'number')
                return String(
                    parseCredentialNumber(
                        cell.percent && mapping.target === 'Percent'
                            ? Number((cell.value * 100).toPrecision(15))
                            : cell.value
                    )
                );
            let value = cell.text.trim();
            if (mapping.target === 'Percent') value = value.replace(/%$/, '').trim();
            if (mapping.numericFormat === 'comma') {
                if (value.includes('.')) throw new Error('Ambiguous decimal');
                value = value.replace(',', '.');
            }
            return String(parseCredentialNumber(value));
        }
    } catch {
        return cell.text;
    }
    return cell.text;
};

export const mapSpreadsheetColumn = (
    template: OBv3CredentialTemplate,
    draft: RosterDraft,
    column: SpreadsheetColumn,
    target: MappingTarget,
    options: Pick<ColumnMapping, 'dateFormat' | 'numericFormat' | 'creditUnit'>
): { template: OBv3CredentialTemplate; draft: RosterDraft; variable: string } => {
    if (!draft.source || (template.schemaType && template.schemaType !== 'obv3'))
        throw new SpreadsheetError('mapping');
    if (
        draft.source.columns.filter(
            item => normalizeColumn(item.label) === normalizeColumn(column.label)
        ).length > 1 ||
        /\{\{|\}\}/.test(column.label + (options.creditUnit ?? ''))
    )
        throw new SpreadsheetError('mapping');
    const used = new Set([
        ...extractVariablesByType(template).dynamic,
        ...extractVariablesByType(template).system,
        ...(draft.reservedVariables ?? []),
        ...Object.keys(draft.source?.exportHeaders ?? {}),
        ...(draft.mappings ?? []).map(mapping => mapping.variable),
    ]);
    const prefix = `sheet_${labelToVariableName(column.label) || column.index + 1}`;
    let variable = prefix;
    for (let suffix = 2; used.has(variable); suffix++) variable = `${prefix}_${suffix}`;
    for (const row of draft.source.rows)
        assertMappingFormat(row.cells[column.id] ?? { text: '' }, {
            target,
            numericFormat: options.numericFormat,
        });
    const mapping: ColumnMapping = {
        ...options,
        columnId: column.id,
        label: column.label,
        variable,
        target,
    };
    let next = structuredClone(template);
    if (target === 'credits') {
        if (
            next.credentialSubject.creditsEarned?.value ||
            next.credentialSubject.creditsEarned?.isDynamic
        )
            throw new SpreadsheetError('mapping');
        if (/hours?/i.test(column.label) && !options.creditUnit?.trim())
            throw new SpreadsheetError('mapping');
        next.credentialSubject.creditsEarned = dynamicField(variable);
    } else if (target === 'awardedDate') {
        if (next.awardedDate?.value || next.awardedDate?.isDynamic)
            throw new SpreadsheetError('mapping');
        next.awardedDate = dynamicField(variable);
    } else if (target === 'evidence') {
        next.credentialSubject.evidence = [
            ...(next.credentialSubject.evidence ?? []),
            {
                id: crypto.randomUUID(),
                type: staticField('Evidence'),
                name: staticField(column.label),
                evidenceUrl: dynamicField(variable),
            },
        ];
    } else if (target !== 'description') {
        next = writeResult(
            next,
            {
                resultType: target as ResultType,
                value: dynamicField(variable),
                name: staticField(column.label),
            },
            next.credentialSubject.result?.length ?? 0
        );
    }
    if (target === 'description' || (target === 'credits' && options.creditUnit?.trim())) {
        const description = next.credentialSubject.achievement.description;
        const previous = description.isDynamic
            ? `{{${description.variableName}}}`
            : description.value;
        const unit = target === 'credits' ? ` (${options.creditUnit!.trim()})` : '';
        next.credentialSubject.achievement.description = staticField(
            [previous, `${column.label}${unit}: {{${variable}}}`].filter(Boolean).join('\n')
        );
    }
    const sourceRows = new Map(draft.source.rows.map(row => [row.exportedRowId ?? row.rowId, row]));
    const values = { ...draft.values };
    const formulaCells = { ...draft.formulaCells };
    for (const recipient of draft.recipients) {
        const key = recipientKey(recipient);
        const row = sourceRows.get(key);
        if (!row) continue;
        const cell = row.cells[column.id] ?? { text: '' };
        values[key] = { ...values[key], [variable]: normalizeMappedCell(cell, mapping) };
        if (cell.problem) formulaCells[key] = { ...formulaCells[key], [variable]: cell.text };
    }
    return {
        template: next,
        variable,
        draft: {
            ...draft,
            values,
            formulaCells,
            mappings: [...(draft.mappings ?? []), mapping],
            reservedVariables: [
                ...new Set([
                    ...(draft.reservedVariables ?? []),
                    ...(draft.mappings ?? []).map(item => item.variable),
                    ...Object.keys(draft.source.exportHeaders ?? {}),
                    variable,
                ]),
            ],
        },
    };
};

const fieldValue = (
    field: TemplateFieldValue | undefined,
    values: Record<string, string>
): string => (field?.isDynamic ? (values[field.variableName] ?? '') : (field?.value ?? ''));

/** Validate typed values and retain their variable names for field-level error feedback. */
export const credentialRowProblems = (
    template: OBv3CredentialTemplate,
    values: Record<string, string>,
    reportProblem?: (problem: RowProblem, variable: string) => void
): RowProblem[] => {
    const problems = new Set<RowProblem>();
    for (const variable of getOverlongTextVariables(template, values)) {
        problems.add('length');
        reportProblem?.('length', variable);
    }
    const report = (problem: RowProblem, field: TemplateFieldValue | undefined): void => {
        if (field?.isDynamic && !field.isSystem) reportProblem?.(problem, field.variableName);
    };
    for (const field of [
        template.credentialSubject.creditsEarned,
        template.credentialSubject.achievement.creditsAvailable,
    ]) {
        const value = fieldValue(field, values);
        if (value.trim()) {
            try {
                parseCredentialNumber(value);
            } catch {
                problems.add('number');
                report('number', field);
            }
        }
    }
    const awarded = fieldValue(template.awardedDate, values);
    if (awarded.trim()) {
        try {
            normalizeCredentialAwardDate(awarded);
        } catch {
            problems.add('date');
            report('date', template.awardedDate);
        }
    }
    for (const item of template.credentialSubject.evidence ?? []) {
        const raw = fieldValue(item.evidenceUrl, values);
        const url = raw.trim();
        if (url) {
            try {
                if (
                    /\s/.test(url) ||
                    (item.evidenceUrl?.isDynamic && raw !== url) ||
                    !['http:', 'https:', 'urn:'].includes(new URL(url).protocol)
                ) {
                    problems.add('evidence');
                    report('evidence', item.evidenceUrl);
                }
            } catch {
                problems.add('evidence');
                report('evidence', item.evidenceUrl);
            }
        }
    }
    for (
        let index = 0;
        index < Math.max(1, template.credentialSubject.result?.length ?? 0);
        index++
    ) {
        if (getResultValidationError(template, values, index, field => report('result', field)))
            problems.add('result');
    }
    return [...problems];
};

/** Keep unfinished drafts previewable; validation still blocks their issuance. */
export const materializePreview = (json: Record<string, unknown>): Record<string, unknown> => {
    try {
        return materializeCredentialFields(json);
    } catch {
        return json;
    }
};

/** Remove only the field created by a chip, keeping source cells and other mappings. */
export const removeSpreadsheetMapping = (
    template: OBv3CredentialTemplate,
    draft: RosterDraft,
    variable: string
): { template: OBv3CredentialTemplate; draft: RosterDraft } => {
    const mapping = draft.mappings?.find(item => item.variable === variable);
    if (!mapping) return { template, draft };
    const next = structuredClone(template);
    const subject = next.credentialSubject;
    if (subject.creditsEarned?.variableName === variable) delete subject.creditsEarned;
    if (next.awardedDate?.variableName === variable) delete next.awardedDate;
    subject.evidence = subject.evidence?.filter(
        item => item.evidenceUrl?.variableName !== variable
    );
    const removed =
        subject.result?.filter(
            item => item.value?.variableName === variable || item.status?.variableName === variable
        ) ?? [];
    subject.result = subject.result?.filter(item => !removed.includes(item));
    const removedIds = new Set(removed.map(item => item.resultDescription?.value));
    subject.achievement.resultDescription = subject.achievement.resultDescription?.filter(
        item =>
            !removedIds.has(item.id) ||
            subject.result?.some(result => result.resultDescription?.value === item.id)
    );
    const line = `${mapping.label}${mapping.target === 'credits' && mapping.creditUnit?.trim() ? ` (${mapping.creditUnit.trim()})` : ''}: {{${variable}}}`;
    subject.achievement.description.value = subject.achievement.description.value
        .split('\n')
        .filter(value => value !== line)
        .join('\n')
        .replaceAll(line, '')
        .replaceAll(`{{${variable}}}`, '');
    return {
        template: next,
        draft: {
            ...draft,
            mappings: draft.mappings?.filter(item => item.variable !== variable),
            reservedVariables: [...new Set([...(draft.reservedVariables ?? []), variable])],
        },
    };
};

/** Rebuild mappings on a new type without leaking values from the previous template. */
export const replaceSpreadsheetTemplate = (
    template: OBv3CredentialTemplate,
    draft: RosterDraft,
    preserveMappings: boolean,
    sourceVariables: string[] = []
): { template: OBv3CredentialTemplate; draft: RosterDraft } => {
    let next = {
        template,
        draft: {
            ...draft,
            mappings: [],
            values: {},
            formulaCells: {},
            reservedVariables: [
                ...new Set([
                    ...(draft.reservedVariables ?? []),
                    ...(draft.mappings ?? []).map(mapping => mapping.variable),
                    ...Object.keys(draft.source?.exportHeaders ?? {}),
                ]),
            ],
        } as RosterDraft,
    };
    if (!preserveMappings || (template.schemaType && template.schemaType !== 'obv3')) return next;
    const exportedNames = rosterCsvFieldNames(
        draft,
        sourceVariables.length ? sourceVariables : Object.keys(draft.source?.exportHeaders ?? {})
    );
    if (draft.source?.rowEvidenceColumn !== undefined) {
        next.draft.source = {
            ...draft.source,
            exportHeaders: { ...draft.source.exportHeaders, ...exportedNames },
        };
    }
    const rebuiltHeaders: Record<string, string> = {};
    for (const mapping of draft.mappings ?? []) {
        // Resolve by identity too for saved drafts written before source IDs were rebound.
        const label =
            draft.source?.rowEvidenceColumn !== undefined
                ? exportedNames[mapping.variable]!
                : mapping.label;
        const columns =
            draft.source?.columns.filter(
                item =>
                    item.id !== draft.source?.rowEvidenceColumn &&
                    normalizeColumn(item.label) === normalizeColumn(label)
            ) ?? [];
        const column = columns[0];
        if (columns.length > 1) throw new SpreadsheetError('mapping');
        if (!column) throw new SpreadsheetError('mappedColumnMissing');
        const mapped = mapSpreadsheetColumn(
            next.template,
            next.draft,
            { ...column, label: mapping.label },
            mapping.target,
            mapping
        );
        if (exportedNames[mapping.variable])
            rebuiltHeaders[mapped.variable] = exportedNames[mapping.variable]!;
        for (const row of draft.recipients) {
            const key = recipientKey(row);
            const value = draft.values[key]?.[mapping.variable];
            const formula = draft.formulaCells?.[key]?.[mapping.variable];
            if (formula !== undefined)
                mapped.draft.formulaCells = {
                    ...mapped.draft.formulaCells,
                    [key]: { ...mapped.draft.formulaCells?.[key], [mapped.variable]: formula },
                };
            if (value !== undefined)
                mapped.draft.values[key] = {
                    ...mapped.draft.values[key],
                    [mapped.variable]: value,
                };
        }
        next = mapped;
    }
    if (next.draft.source?.exportHeaders) {
        const mappedVariables = new Set((draft.mappings ?? []).map(mapping => mapping.variable));
        next.draft.source = {
            ...next.draft.source,
            exportHeaders: {
                ...Object.fromEntries(
                    Object.entries(next.draft.source.exportHeaders).filter(
                        ([name]) => !mappedVariables.has(name)
                    )
                ),
                ...rebuiltHeaders,
            },
        };
    }
    return next;
};
