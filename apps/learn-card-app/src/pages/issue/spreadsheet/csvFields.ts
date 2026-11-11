import { RESERVED_COLUMNS, normalizeColumn, type RosterDraft } from './types';
import { SpreadsheetError } from './parseSpreadsheet';

/** Preserve recorded export identities, reserving old headers when fields are removed. */
export const rosterCsvFieldNames = (
    draft: Pick<RosterDraft, 'mappings' | 'source'>,
    variables: string[]
): Record<string, string> => {
    const reserved = new Set(
        ['Recipient Email', 'Recipient Name', 'Evidence', ...RESERVED_COLUMNS].map(normalizeColumn)
    );
    const previous = draft.source?.exportHeaders ?? {};
    const used = new Set([...reserved, ...Object.values(previous).map(normalizeColumn)]);
    const assigned = new Set<string>();
    return Object.fromEntries(
        variables.map(name => {
            const recorded = previous[name];
            if (recorded) {
                const normalized = normalizeColumn(recorded);
                if (reserved.has(normalized) || assigned.has(normalized))
                    throw new SpreadsheetError('mapping');
                assigned.add(normalized);
                return [name, recorded];
            }
            const base = draft.mappings?.find(mapping => mapping.variable === name)?.label ?? name;
            let label = base;
            for (let suffix = 2; used.has(normalizeColumn(label)); suffix++)
                label = `${base} [${suffix}]`;
            used.add(normalizeColumn(label));
            assigned.add(normalizeColumn(label));
            return [name, label];
        })
    );
};
