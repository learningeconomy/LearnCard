import { normalizeMappedCell, assertMappingFormat } from './columnMapping';
import Papa from 'papaparse';
import { recipientKey, recipientDisplayName, type Recipient } from '../components/recipientTypes';
import { isValidRosterEmail, SpreadsheetError } from './parseSpreadsheet';
import {
    RESERVED_COLUMNS,
    EXPORT_RUN_COLUMN,
    EXPORT_ROW_COLUMN,
    EXPORT_EXAMPLE_COLUMN,
    EXPORT_ENCODING_COLUMN,
    normalizeColumn,
    normalizeEmail,
    type ParsedSpreadsheet,
    type RowProblem,
    type RosterProblemField,
    type RosterDraft,
} from './types';

export type ColumnScopes = Record<string, 'shared' | 'perRecipient'>;

// Versioned CSV cells escape both formula prefixes and literal apostrophes.
// One leading apostrophe is transport encoding; a literal one becomes two.
const CSV_ENCODING = 'apostrophe-v1';
const encodeCsvValue = (value: string): string =>
    /^[=+\-@\t\r']/.test(value) ? `'${value}` : value;
const decodeCsvValue = (value: string): string =>
    /^'[=+\-@\t\r']/.test(value) ? value.slice(1) : value;
const decodeLegacyCsvValue = (value: string, original?: string): string =>
    original !== undefined && /^[=+\-@\t\r]/.test(original) && value === `'${original}`
        ? original
        : value;

export const effectiveRowValues = (
    recipient: Recipient,
    variables: string[],
    scopes: ColumnScopes,
    shared: Record<string, string>,
    perRow: RosterDraft['values']
): Record<string, string> =>
    Object.fromEntries(
        variables.map(name => [
            name,
            scopes[name] === 'perRecipient'
                ? (perRow[recipientKey(recipient)]?.[name] ?? '')
                : (shared[name] ?? ''),
        ])
    );

/** Keep aggregate send blockers and optionally report each affected input for inline correction. */
export const getRowProblems = (
    recipients: Recipient[],
    variables: string[],
    scopes: ColumnScopes,
    shared: Record<string, string>,
    perRow: RosterDraft['values'],
    evidence: Record<string, string>,
    formulaCells: RosterDraft['formulaCells'] = {},
    reportProblem?: (rowId: string, problem: RowProblem, field: RosterProblemField) => void
): Record<string, RowProblem[]> => {
    const counts = new Map<string, number>();
    for (const recipient of recipients) {
        const identity =
            recipient.kind === 'email'
                ? `email:${normalizeEmail(recipient.email)}`
                : `profile:${recipient.profileId}`;
        counts.set(identity, (counts.get(identity) ?? 0) + 1);
    }
    return Object.fromEntries(
        recipients.map(recipient => {
            const key = recipientKey(recipient);
            const problems: RowProblem[] = [];
            const identity =
                recipient.kind === 'email'
                    ? `email:${normalizeEmail(recipient.email)}`
                    : `profile:${recipient.profileId}`;
            if (recipient.kind === 'email' && !isValidRosterEmail(recipient.email)) {
                problems.push('email');
                reportProblem?.(key, 'email', 'recipient');
            }
            if ((counts.get(identity) ?? 0) > 1) {
                problems.push('duplicate');
                reportProblem?.(key, 'duplicate', 'recipient');
            }
            const values = effectiveRowValues(recipient, variables, scopes, shared, perRow);
            const missing = Object.entries(values).filter(([, value]) => !value.trim());
            if (missing.length) problems.push('required');
            for (const [variable] of missing) reportProblem?.(key, 'required', { variable });
            if (evidence[key]?.trim()) {
                try {
                    const url = new URL(evidence[key]!.trim());
                    if (
                        /\s/.test(evidence[key]!.trim()) ||
                        !['http:', 'https:'].includes(url.protocol) ||
                        !url.hostname
                    ) {
                        problems.push('evidence');
                        reportProblem?.(key, 'evidence', 'evidence');
                    }
                } catch {
                    problems.push('evidence');
                    reportProblem?.(key, 'evidence', 'evidence');
                }
            }
            let formula = false;
            for (const [name, raw] of Object.entries(formulaCells[key] ?? {})) {
                if (
                    name === 'Evidence'
                        ? evidence[key] === raw
                        : name === 'Recipient Email'
                          ? recipient.kind === 'email' && recipient.email === raw
                          : variables.includes(name) &&
                            scopes[name] === 'perRecipient' &&
                            values[name] === raw
                ) {
                    formula = true;
                    reportProblem?.(
                        key,
                        'formula',
                        name === 'Evidence'
                            ? 'evidence'
                            : name === 'Recipient Email'
                              ? 'recipient'
                              : { variable: name }
                    );
                }
            }
            if (formula) problems.push('formula');
            return [key, problems];
        })
    );
};

/** Keep mapped headers distinct from the recipient/evidence/recovery CSV columns. */
export const rosterCsvFieldNames = (
    draft: Pick<RosterDraft, 'mappings'>,
    variables: string[]
): Record<string, string> => {
    const used = new Set(
        ['Recipient Email', 'Recipient Name', 'Evidence', ...RESERVED_COLUMNS].map(normalizeColumn)
    );
    return Object.fromEntries(
        variables.map(name => {
            const base = draft.mappings?.find(mapping => mapping.variable === name)?.label ?? name;
            let label = base;
            for (let suffix = 2; used.has(normalizeColumn(label)); suffix++)
                label = `${base} [${suffix}]`;
            used.add(normalizeColumn(label));
            return [name, label];
        })
    );
};

/** Exported identities are accepted only within the saved run; email is a fallback. */
export const mergeSpreadsheet = (
    draft: RosterDraft,
    sheet: ParsedSpreadsheet,
    variables: string[]
): { draft: RosterDraft; mapped: string[] } => {
    if (sheet.emailColumn === undefined) throw new SpreadsheetError('emailColumn');
    // Only verified same-run exports restore the table's standalone Evidence cell.
    // Source Evidence/Portfolio columns remain independent, explicit mappings.
    const canonical = sheet.rows.some(row => row.exportedRunId === draft.id && row.exportedRowId);
    const evidenceColumn = canonical
        ? sheet.columns.find(column => normalizeColumn(column.label) === 'evidence')
        : undefined;
    const exportedNames = rosterCsvFieldNames(draft, variables);
    const matches = Object.fromEntries(
        variables.map(name => {
            const binding = draft.mappings?.find(mapping => mapping.variable === name);
            const columns = sheet.columns.filter(
                column =>
                    column.id !== evidenceColumn?.id &&
                    (canonical
                        ? normalizeColumn(column.label) === normalizeColumn(exportedNames[name]!)
                        : normalizeColumn(column.label) === normalizeColumn(name) ||
                          (binding &&
                              normalizeColumn(column.label) === normalizeColumn(binding.label)))
            );

            if (columns.length > 1) throw new SpreadsheetError('mapping');
            return [name, columns[0]];
        })
    );
    const mapped = variables.filter(name => matches[name]);
    const values = { ...draft.values };
    const evidence = { ...draft.evidence };
    const formulaCells = { ...draft.formulaCells };
    const recipients = [...draft.recipients];
    const assigned = new Set<string>();
    const sourceRows: ParsedSpreadsheet['rows'] = [];
    const encodingColumn = sheet.columns.find(column => column.label === EXPORT_ENCODING_COLUMN);
    const decodedRows = new WeakSet<ParsedSpreadsheet['rows'][number]>();
    // The versioned codec applies to every row from this run, including copied
    // rows added without an identity. Legacy addresses need an exact saved match.
    const rows = sheet.rows.map(row => {
        if (row.exportedRunId !== draft.id) return row;
        const existing = row.exportedRowId
            ? draft.recipients.find(recipient => recipientKey(recipient) === row.exportedRowId)
            : undefined;
        if (encodingColumn && row.cells[encodingColumn.id]?.text === CSV_ENCODING) {
            const decoded = {
                ...row,
                email: decodeCsvValue(row.email),
                displayName: decodeCsvValue(row.displayName),
                cells: Object.fromEntries(
                    Object.entries(row.cells).map(([id, cell]) => {
                        const text = id === encodingColumn.id ? '' : decodeCsvValue(cell.text);
                        return [
                            id,
                            {
                                ...cell,
                                text,
                                ...(typeof cell.value === 'string'
                                    ? { value: decodeCsvValue(cell.value) }
                                    : {}),
                            },
                        ];
                    })
                ),
            };
            decodedRows.add(decoded);
            return decoded;
        }
        if (!existing) return row;
        return {
            ...row,
            email:
                existing.kind === 'email'
                    ? decodeLegacyCsvValue(row.email, normalizeEmail(existing.email))
                    : row.email,
        };
    });
    const incomingCounts = new Map<string, number>();
    for (const row of rows) incomingCounts.set(row.email, (incomingCounts.get(row.email) ?? 0) + 1);
    for (const row of rows) {
        if (row.example && row.email === 'person@example.com') continue;
        if (row.exportedRunId && row.exportedRunId !== draft.id) throw new SpreadsheetError('run');
        let existing = row.exportedRowId
            ? recipients.find(recipient => recipientKey(recipient) === row.exportedRowId)
            : undefined;
        if (row.exportedRowId && (!existing || row.exportedRunId !== draft.id))
            throw new SpreadsheetError('run');
        if (!existing && (incomingCounts.get(row.email) ?? 0) === 1) {
            const matching = recipients.filter(
                recipient =>
                    recipient.kind === 'email' && normalizeEmail(recipient.email) === row.email
            );
            if (matching.length === 1 && !assigned.has(recipientKey(matching[0]!)))
                existing = matching[0];
        }
        const key = existing ? recipientKey(existing) : row.rowId;
        if (assigned.has(key)) throw new SpreadsheetError('mapping');
        assigned.add(key);
        sourceRows.push({ ...row, rowId: key });
        const recipient: Recipient =
            existing?.kind === 'profile'
                ? existing
                : {
                      kind: 'email',
                      rowId: key,
                      email: row.email,
                      displayName:
                          row.displayName ||
                          (existing?.kind === 'email' ? existing.displayName : undefined),
                  };
        if (existing) recipients[recipients.indexOf(existing)] = recipient;
        else recipients.push(recipient);
        const previous = values[key] ?? {};
        const cellProblems = { ...formulaCells[key] };
        if (row.cells[`column-${sheet.emailColumn}`]?.problem)
            cellProblems['Recipient Email'] = row.email;
        else if (cellProblems['Recipient Email'] !== row.email)
            delete cellProblems['Recipient Email'];
        const imported = Object.fromEntries(
            mapped.map(name => {
                const cell = row.cells[matches[name]!.id] ?? { text: '' };
                const binding = draft.mappings?.find(mapping => mapping.variable === name);
                const canonical = row.exportedRunId === draft.id;
                if (binding && !canonical) assertMappingFormat(cell, binding);
                let value = binding
                    ? normalizeMappedCell(
                          cell,
                          canonical
                              ? { ...binding, numericFormat: 'dot', dateFormat: 'iso' }
                              : binding
                      )
                    : cell.text;
                // Old exports have no reversible codec. Only the saved original
                // can prove Papa added a quote; changed/unknown cells stay literal.
                if (!decodedRows.has(row) && row.exportedRunId === draft.id)
                    value = decodeLegacyCsvValue(value, previous[name]);
                // CSV has no XLSX error metadata. An unchanged error remains unresolved.
                if (row.cells[matches[name]!.id]?.problem) cellProblems[name] = value;
                else if (cellProblems[name] !== value) delete cellProblems[name];
                return [name, value];
            })
        );
        values[key] = { ...previous, ...imported };
        if (evidenceColumn) {
            evidence[key] = row.cells[evidenceColumn.id]?.text.trim() ?? '';
            if (row.cells[evidenceColumn.id]?.problem) cellProblems.Evidence = evidence[key];
            else if (cellProblems.Evidence !== evidence[key]) delete cellProblems.Evidence;
        }
        formulaCells[key] = cellProblems;
    }
    return {
        draft: {
            ...draft,
            sourceName: sheet.source.name,
            recipients,
            values,
            evidence,
            formulaCells,
            source: { ...sheet, rows: sourceRows, rowEvidenceColumn: evidenceColumn?.id },
        },
        mapped,
    };
};

export const exportRosterCsv = (
    draft: RosterDraft,
    variables: string[],
    scopes: ColumnScopes,
    shared: Record<string, string>,
    problems?: Record<string, string>
): string => {
    const recipients = problems
        ? draft.recipients.filter(recipient => recipientKey(recipient) in problems)
        : draft.recipients;
    const labels = rosterCsvFieldNames(draft, variables);
    const fieldLabel = (name: string): string => labels[name]!;
    const rows = recipients.map(recipient => ({
        'Recipient Email': recipient.kind === 'email' ? recipient.email : '',
        'Recipient Name': recipientDisplayName(recipient),
        ...Object.fromEntries(
            Object.entries(
                effectiveRowValues(recipient, variables, scopes, shared, draft.values)
            ).map(([name, value]) => [fieldLabel(name), value])
        ),
        Evidence: draft.evidence[recipientKey(recipient)] ?? '',
        [EXPORT_RUN_COLUMN]: draft.id,
        [EXPORT_ROW_COLUMN]: recipientKey(recipient),
        [EXPORT_EXAMPLE_COLUMN]: '',
        [EXPORT_ENCODING_COLUMN]: CSV_ENCODING,
        ...(problems ? { Problem: problems[recipientKey(recipient)] } : {}),
    }));
    if (!rows.length && !problems)
        rows.push({
            'Recipient Email': 'person@example.com',
            'Recipient Name': 'Example person',
            ...Object.fromEntries(variables.map(name => [fieldLabel(name), shared[name] ?? ''])),
            Evidence: '',
            [EXPORT_RUN_COLUMN]: '',
            [EXPORT_ROW_COLUMN]: '',
            [EXPORT_EXAMPLE_COLUMN]: 'true',
            [EXPORT_ENCODING_COLUMN]: CSV_ENCODING,
        });
    return Papa.unparse(
        {
            fields: [
                'Recipient Email',
                'Recipient Name',
                ...variables.map(fieldLabel),
                'Evidence',
                EXPORT_RUN_COLUMN,
                EXPORT_ROW_COLUMN,
                EXPORT_EXAMPLE_COLUMN,
                EXPORT_ENCODING_COLUMN,
                ...(problems ? ['Problem'] : []),
            ],
            data: rows.map(row =>
                Object.fromEntries(
                    Object.entries(row).map(([name, value]) => [name, encodeCsvValue(value)])
                )
            ),
        },
        { escapeFormulae: true }
    );
};

export const downloadRosterCsv = (csv: string, filename: string): void => {
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
