import { RESERVED_COLUMNS, normalizeColumn, type RosterDraft } from './types';

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
