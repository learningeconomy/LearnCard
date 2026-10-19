import React, { useEffect, useState, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import {
    cloudUploadOutline,
    downloadOutline,
    gridOutline,
    checkmarkCircleOutline,
    alertCircleOutline,
} from 'ionicons/icons';
import { useModal } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import { parseSpreadsheet, readSpreadsheetFile, readSpreadsheetText } from './parseSpreadsheet';
import type { ParsedSpreadsheet, SpreadsheetSource } from './types';
import { spreadsheetErrorMessage } from './messages';
import { isValidRosterEmail } from './parseSpreadsheet';
import {
    SpreadsheetDialog,
    SPREADSHEET_MODAL_OPTIONS,
    SPREADSHEET_MODAL_TYPES,
} from './SpreadsheetDialog';

const INPUT =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base sm:text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
const BUTTON =
    'py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40';

export const SpreadsheetReview: React.FC<{
    source: SpreadsheetSource;
    onImport: (sheet: ParsedSpreadsheet) => Promise<void>;
    onClose: () => void;
}> = ({ source, onImport, onClose }) => {
    const [sheetName, setSheetName] = useState(Object.keys(source.sheets)[0]);
    const [emailColumn, setEmailColumn] = useState<number>();
    const [headerRow, setHeaderRow] = useState<number>();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const parsed = parseSpreadsheet(source, { sheetName, emailColumn, headerRow });
    const submit = async (): Promise<void> => {
        setBusy(true);
        setError('');
        try {
            await onImport(parsed);
            onClose();
        } catch (reason) {
            setError(spreadsheetErrorMessage(reason));
        } finally {
            setBusy(false);
        }
    };
    const people = parsed.rows.filter(row => !row.example || row.email !== 'person@example.com');
    const invalid = people.filter(row => !isValidRosterEmail(row.email)).length;
    return (
        <SpreadsheetDialog
            title={m['issueFlow.sheet.review']()}
            subtitle={source.name}
            icon={gridOutline}
            onClose={onClose}
            footer={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-relaxed text-grayscale-600">
                        {m['issueFlow.sheet.design.importHint']()}
                    </p>
                    <button
                        type="button"
                        disabled={busy || parsed.emailColumn === undefined || !people.length}
                        onClick={submit}
                        className={`${BUTTON} shrink-0 inline-flex items-center justify-center gap-2`}
                    >
                        {busy && (
                            <span
                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                aria-hidden="true"
                            />
                        )}
                        {busy ? m['issueFlow.sheet.importing']() : m['issueFlow.sheet.addPeople']()}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4 sm:p-5">
                    <h3 className="mb-4 text-sm font-semibold text-grayscale-900">
                        {m['issueFlow.sheet.design.importSetup']()}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {Object.keys(source.sheets).length > 1 && (
                            <label className="block text-xs font-medium text-grayscale-700 sm:col-span-2">
                                {m['issueFlow.sheet.worksheet']()}
                                <select
                                    className={`${INPUT} mt-1.5`}
                                    value={sheetName}
                                    onChange={event => {
                                        setSheetName(event.target.value);
                                        setEmailColumn(undefined);
                                        setHeaderRow(undefined);
                                    }}
                                >
                                    {Object.keys(source.sheets).map(name => (
                                        <option key={name}>{name}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <label className="block min-w-0 text-xs font-medium text-grayscale-700">
                            {m['issueFlow.sheet.emailColumn']()}
                            <select
                                className={`${INPUT} mt-1.5`}
                                value={parsed.emailColumn ?? ''}
                                onChange={event =>
                                    setEmailColumn(
                                        event.target.value === ''
                                            ? undefined
                                            : Number(event.target.value)
                                    )
                                }
                            >
                                <option value="">{m['issueFlow.sheet.chooseEmail']()}</option>
                                {parsed.columns.map(column => (
                                    <option key={column.id} value={column.index}>
                                        {column.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block min-w-0 text-xs font-medium text-grayscale-700">
                            {m['issueFlow.sheet.headerRow']()}
                            <select
                                className={`${INPUT} mt-1.5`}
                                value={parsed.headerRow ?? -1}
                                onChange={event => setHeaderRow(Number(event.target.value))}
                            >
                                <option value={-1}>{m['issueFlow.sheet.noHeader']()}</option>
                                {source.sheets[parsed.sheetName]?.slice(0, 25).map((row, index) => (
                                    <option key={index} value={index}>
                                        {index + 1}:{' '}
                                        {row
                                            .map(cell => cell.text)
                                            .join(' · ')
                                            .slice(0, 90)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-grayscale-100 px-3 py-2 text-grayscale-700">
                        {m['issueFlow.sheet.importSummary']({
                            count: people.length,
                            skipped: parsed.skipped,
                        })}
                    </span>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 ${invalid || !people.length ? 'bg-grayscale-100 text-grayscale-700' : 'bg-emerald-50 text-emerald-700'}`}
                    >
                        <IonIcon
                            icon={
                                invalid || !people.length
                                    ? alertCircleOutline
                                    : checkmarkCircleOutline
                            }
                            className={invalid ? 'text-red-600' : undefined}
                            aria-hidden="true"
                        />
                        {!people.length
                            ? m['issueFlow.sheet.design.emptyImport']()
                            : invalid
                              ? m['issueFlow.sheet.design.issueCount']({ count: invalid })
                              : m['issueFlow.sheet.design.emailFormatGood']()}
                    </span>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-grayscale-900">
                        {m['issueFlow.sheet.design.previewPeople']()}
                    </h3>
                    <p className="mb-3 mt-1 text-xs text-grayscale-500">
                        {m['issueFlow.sheet.design.previewHint']({
                            count: Math.min(8, people.length),
                            total: people.length,
                        })}
                    </p>
                    <div className="divide-y divide-grayscale-100 overflow-hidden rounded-2xl border border-grayscale-200">
                        {people.slice(0, 8).map(row => (
                            <div
                                key={row.rowId}
                                className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 ${!isValidRosterEmail(row.email) ? 'border-s-2 border-red-300 bg-grayscale-10' : 'bg-white'}`}
                            >
                                <span className="text-sm font-medium text-grayscale-900 sm:w-1/3">
                                    {row.displayName || m['issueFlow.sheet.recipient']()}
                                </span>
                                <span className="min-w-0 flex-1 break-all text-sm text-grayscale-600">
                                    {row.email || m['issueFlow.sheet.invalidEmail']()}
                                </span>
                                {!isValidRosterEmail(row.email) && (
                                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-red-700">
                                        <IonIcon icon={alertCircleOutline} aria-hidden="true" />
                                        {m['issueFlow.sheet.invalidEmail']()}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {error && (
                    <p
                        role="alert"
                        className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error}
                    </p>
                )}
            </div>
        </SpreadsheetDialog>
    );
};

export const SpreadsheetUpload: React.FC<{
    onImport: (sheet: ParsedSpreadsheet) => Promise<void>;
    onDownload: () => Promise<void>;
    pastedText?: string;
    onPasteConsumed: () => void;
    disabled?: boolean;
}> = ({ onImport, onDownload, pastedText, onPasteConsumed, disabled }) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const { newModal, closeModal } = useModal();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const review = (source: SpreadsheetSource): void => {
        // Validate shape/limits before presenting a modal, so corrupt files remain recoverable.
        parseSpreadsheet(source);
        newModal(
            <SpreadsheetReview source={source} onImport={onImport} onClose={closeModal} />,
            SPREADSHEET_MODAL_OPTIONS,
            SPREADSHEET_MODAL_TYPES
        );
    };
    useEffect(() => {
        if (!pastedText || disabled) return;
        try {
            review(readSpreadsheetText(pastedText, 'pasted.csv'));
            setError('');
        } catch (reason) {
            setError(spreadsheetErrorMessage(reason));
        }
        onPasteConsumed();
    }, [pastedText]); // The paste event is consumed once; callbacks may change with draft edits.
    const upload = async (file: File): Promise<void> => {
        setBusy(true);
        setError('');
        try {
            review(await readSpreadsheetFile(file));
        } catch (reason) {
            setError(spreadsheetErrorMessage(reason));
        } finally {
            setBusy(false);
        }
    };
    const download = async (): Promise<void> => {
        setBusy(true);
        setError('');
        try {
            await onDownload();
        } catch (reason) {
            setError(spreadsheetErrorMessage(reason));
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="space-y-2">
            <input
                data-testid="issue-spreadsheet-file"
                ref={fileInput}
                type="file"
                accept=".csv,.tsv,.xlsx"
                className="hidden"
                aria-label={m['issueFlow.sheet.upload']()}
                onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) void upload(file);
                    event.target.value = '';
                }}
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => fileInput.current?.click()}
                    className="flex gap-1.5 items-center text-sm text-grayscale-600 hover:text-grayscale-900 disabled:opacity-40"
                >
                    <IonIcon icon={cloudUploadOutline} />
                    {busy ? m['issueFlow.sheet.importing']() : m['issueFlow.sheet.upload']()}
                </button>
                <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={download}
                    className="flex gap-1.5 items-center text-sm text-grayscale-600 hover:text-grayscale-900 disabled:opacity-40"
                >
                    <IonIcon icon={downloadOutline} />
                    {m['issueFlow.sheet.getTemplate']()}
                </button>
            </div>
            {error && (
                <p role="alert" className="p-3 bg-red-50 text-red-700 text-sm rounded-2xl">
                    {error}
                </p>
            )}
        </div>
    );
};
