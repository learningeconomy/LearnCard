/** Stored entries to wire shapes: whole entries for subjects, disclosures for clients. */
import type { EntryHeader, EntryRecord, EntryVersion } from '../store/port';
import {
    HCP_ENTRY_SCHEMA,
    HCP_JSON_LD_CONTEXT,
    type Category,
    type Disclosure,
    type Entry,
} from '../schemas';

/** Draft 3 §4.2: the entry as the provider holds it, for `version` (default current). */
export const toEntry = (header: EntryHeader, version: EntryVersion): Entry => ({
    '@context': [HCP_JSON_LD_CONTEXT],
    schema: HCP_ENTRY_SCHEMA,
    id: header.id,
    type: ['ContextEntry'],
    subject: { id: header.subjectDid, relationship: null },
    content: version.content,
    assertion: version.assertion,
    classification: {
        categories: header.categories,
        dimension: header.dimension,
        ...(header.permittedPurposes ? { permittedPurposes: header.permittedPurposes } : {}),
    },
    evidence: version.evidence,
    record: {
        // Status is the entry's; superseded versions keep the status the entry has now.
        status: header.status,
        version: version.version,
        provenance: version.provenance,
    },
});

const HOUR_MS = 60 * 60 * 1000;

/**
 * Draft 3 §7.6. v1 registers no revocation notification endpoints, so rule 4 caps
 * every copy at one hour; an earlier `validUntil` applies first (rule 1).
 */
export const disclosureExpiry = (version: EntryVersion, now: Date): string => {
    const cap = now.getTime() + HOUR_MS;
    const validUntil = version.assertion.validUntil
        ? Date.parse(version.assertion.validUntil)
        : NaN;
    return new Date(Number.isNaN(validUntil) ? cap : Math.min(cap, validUntil)).toISOString();
};

/** Draft 3 §7.4: withholds id, subject, status and record; shows only granted categories. */
export const toDisclosure = (
    ref: string,
    header: EntryHeader,
    version: EntryVersion,
    visibleCategories: Category[],
    now: Date
): Disclosure => ({
    ref,
    version: version.version,
    content: version.content,
    evidence: version.evidence,
    assertion: version.assertion,
    classification: {
        categories: visibleCategories,
        dimension: header.dimension,
        ...(header.permittedPurposes ? { permittedPurposes: header.permittedPurposes } : {}),
    },
    // Confirmation (Draft 3 §3.8) is not implemented in v1, so nothing is confirmed.
    standing: { assurance: version.provenance.assertedBy.assurance, confirmed: false },
    useUntil: disclosureExpiry(version, now),
});

const tokens = (text: string): Set<string> =>
    new Set(text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []);

const entryText = (record: EntryRecord): string => {
    const { value } = record.current.content;
    return `${typeof value === 'string' ? value : JSON.stringify(value)} ${record.header.dimension ?? ''}`;
};

/**
 * Lexical relevance ordering (Draft 3 §7.3, method `lexical`): distinct query terms
 * the entry contains, most first; ties go to the most recently updated entry.
 */
export const rankLexically = (query: string, records: EntryRecord[]): EntryRecord[] => {
    const terms = [...tokens(query)];
    return records
        .map((record, index) => {
            const words = tokens(entryText(record));
            return { record, index, score: terms.filter(term => words.has(term)).length };
        })
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(({ record }) => record);
};
