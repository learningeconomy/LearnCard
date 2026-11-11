import type { NormalizedImport } from './normalizeToObv3';
import type { ParsedSpreadsheet, SpreadsheetSource } from '../spreadsheet/types';

export type CredentialImport = { kind: 'credential'; value: NormalizedImport };
export type IssueImportSource =
    CredentialImport | { kind: 'spreadsheet'; source: SpreadsheetSource };
export type IssueImportResult =
    CredentialImport | { kind: 'spreadsheet'; sheet: ParsedSpreadsheet };
