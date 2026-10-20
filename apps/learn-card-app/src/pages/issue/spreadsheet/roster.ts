import Papa from 'papaparse';
import { recipientKey, recipientDisplayName, type Recipient } from '../components/recipientTypes';
import { isValidRosterEmail, SpreadsheetError } from './parseSpreadsheet';
import {
    EXPORT_RUN_COLUMN,
    EXPORT_ROW_COLUMN,
    EXPORT_EXAMPLE_COLUMN,
    normalizeColumn,
    normalizeEmail,
    type ParsedSpreadsheet,
    type RowProblem,
    type RosterDraft,
} from './types';

export type ColumnScopes = Record<string, 'shared' | 'perRecipient'>;

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

export const getRowProblems = (
    recipients: Recipient[],
    variables: string[],
    scopes: ColumnScopes,
    shared: Record<string, string>,
    perRow: RosterDraft['values'],
    evidence: Record<string, string>,
    formulaCells: RosterDraft['formulaCells'] = {}
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
            if (recipient.kind === 'email' && !isValidRosterEmail(recipient.email))
                problems.push('email');
            if ((counts.get(identity) ?? 0) > 1) problems.push('duplicate');
            if (
                Object.values(
                    effectiveRowValues(recipient, variables, scopes, shared, perRow)
                ).some(value => !value.trim())
            )
                problems.push('required');
            if (evidence[key]?.trim()) {
                try {
                    const url = new URL(evidence[key]!.trim());
                    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname)
                        problems.push('evidence');
                } catch {
                    problems.push('evidence');
                }
            }
            const values = effectiveRowValues(recipient, variables, scopes, shared, perRow);
            if (
                Object.entries(formulaCells[key] ?? {}).some(([name, raw]) =>
                    name === 'Evidence'
                        ? evidence[key] === raw
                        : name === 'Recipient Email'
                          ? recipient.kind === 'email' && recipient.email === raw
                          : variables.includes(name) &&
                            scopes[name] === 'perRecipient' &&
                            values[name] === raw
                )
            )
                problems.push('formula');
            return [key, problems];
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
    const matches = Object.fromEntries(
        variables.map(name => {
            const columns = sheet.columns.filter(
                column => normalizeColumn(column.label) === normalizeColumn(name)
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
    // Decode only the exact address our exporter escaped for this saved row.
    // A literal leading apostrophe is itself valid in some email local parts.
    const rows = sheet.rows.map(row => {
        const existing =
            row.exportedRunId === draft.id && row.exportedRowId
                ? draft.recipients.find(recipient => recipientKey(recipient) === row.exportedRowId)
                : undefined;
        return existing?.kind === 'email' &&
            /^'[=+\-@\t\r]/.test(row.email) &&
            normalizeEmail(existing.email) === row.email.slice(1)
            ? { ...row, email: row.email.slice(1) }
            : row;
    });
    const incomingCounts = new Map<string, number>();
    for (const row of rows) incomingCounts.set(row.email, (incomingCounts.get(row.email) ?? 0) + 1);
    const evidenceColumn = sheet.columns.find(column =>
        /^(evidence|evidencelink|portfolio|portfoliolink)$/.test(normalizeColumn(column.label))
    );
    const sourceRows: ParsedSpreadsheet['rows'] = [];
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
                let value = row.cells[matches[name]!.id]?.text ?? '';
                // Undo our CSV formula-escape only for verified, same-run app exports.
                if (row.exportedRunId === draft.id && /^'[=+\-@\t\r]/.test(value))
                    value = value.slice(1);
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
            source: { ...sheet, rows: sourceRows },
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
    const rows = recipients.map(recipient => ({
        'Recipient Email': recipient.kind === 'email' ? recipient.email : '',
        'Recipient Name': recipientDisplayName(recipient),
        ...effectiveRowValues(recipient, variables, scopes, shared, draft.values),
        Evidence: draft.evidence[recipientKey(recipient)] ?? '',
        [EXPORT_RUN_COLUMN]: draft.id,
        [EXPORT_ROW_COLUMN]: recipientKey(recipient),
        [EXPORT_EXAMPLE_COLUMN]: '',
        ...(problems ? { Problem: problems[recipientKey(recipient)] } : {}),
    }));
    if (!rows.length && !problems)
        rows.push({
            'Recipient Email': 'person@example.com',
            'Recipient Name': 'Example person',
            ...Object.fromEntries(variables.map(name => [name, shared[name] ?? ''])),
            Evidence: '',
            [EXPORT_RUN_COLUMN]: '',
            [EXPORT_ROW_COLUMN]: '',
            [EXPORT_EXAMPLE_COLUMN]: 'true',
        });
    return Papa.unparse(
        {
            fields: [
                'Recipient Email',
                'Recipient Name',
                ...variables,
                'Evidence',
                EXPORT_RUN_COLUMN,
                EXPORT_ROW_COLUMN,
                EXPORT_EXAMPLE_COLUMN,
                ...(problems ? ['Problem'] : []),
            ],
            data: rows,
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
