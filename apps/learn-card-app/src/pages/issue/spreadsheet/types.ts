import type { Recipient } from '../components/recipientTypes';
import type { SimpleMediaAttachment } from '../components/MediaAttachments';

export interface SpreadsheetCell {
    text: string;
    value?: string | number | boolean;
    date?: string;
    percent?: boolean;
    problem?: 'formula';
}

export interface SpreadsheetColumn {
    id: string;
    label: string;
    index: number;
}

export interface SpreadsheetSource {
    name: string;
    sheets: Record<string, SpreadsheetCell[][]>;
}

export interface SpreadsheetRow {
    rowId: string;
    sourceRow: number;
    email: string;
    displayName: string;
    cells: Record<string, SpreadsheetCell>;
    exportedRunId?: string;
    exportedRowId?: string;
    example?: boolean;
}

export interface ParsedSpreadsheet {
    source: SpreadsheetSource;
    sheetName: string;
    columns: SpreadsheetColumn[];
    rows: SpreadsheetRow[];
    emailColumn?: number;
    emailCandidates: number[];
    headerRow?: number;
    skipped: number;
}

export type RowProblem =
    'email' | 'duplicate' | 'required' | 'evidence' | 'formula' | 'number' | 'date' | 'result';

export type MappingTarget =
    | 'description'
    | 'Percent'
    | 'RawScore'
    | 'LetterGrade'
    | 'GradePointAverage'
    | 'credits'
    | 'evidence'
    | 'awardedDate';
export interface ColumnMapping {
    columnId: string;
    label: string;
    variable: string;
    target: MappingTarget;
    dateFormat: 'iso' | 'dmy' | 'mdy';
    numericFormat: 'dot' | 'comma';
    creditUnit?: string;
}

export interface RosterDraft {
    id: string;
    sourceName?: string;
    mappings?: ColumnMapping[];
    recipients: Recipient[];
    values: Record<string, Record<string, string>>;
    evidence: Record<string, string>;
    formulaCells?: Record<string, Record<string, string>>;
    attachments?: Record<string, SimpleMediaAttachment[]>;
    source?: ParsedSpreadsheet;
}

export const normalizeColumn = (value: string): string =>
    value
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '');

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const EXPORT_RUN_COLUMN = '__lc_run_id';
export const EXPORT_ROW_COLUMN = '__lc_row_id';
export const EXPORT_EXAMPLE_COLUMN = '__lc_example';
export const RESERVED_COLUMNS = new Set([
    EXPORT_RUN_COLUMN,
    EXPORT_ROW_COLUMN,
    EXPORT_EXAMPLE_COLUMN,
    'Problem',
]);
