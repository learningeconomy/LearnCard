import React, { useEffect, useState, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { cloudUploadOutline, downloadOutline, closeOutline } from 'ionicons/icons';
import { useModal, ModalTypes } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import { parseSpreadsheet, readSpreadsheetFile, readSpreadsheetText } from './parseSpreadsheet';
import type { ParsedSpreadsheet, SpreadsheetSource } from './types';
import { spreadsheetErrorMessage } from './messages';

const INPUT =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
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
    return (
        <div className="font-poppins p-6 space-y-5 bg-white text-grayscale-900">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h2 className="text-xl font-semibold">{m['issueFlow.sheet.review']()}</h2>
                    <p className="text-sm text-grayscale-600 break-all">{source.name}</p>
                </div>
                <button
                    type="button"
                    aria-label={m['common.cancel']()}
                    onClick={onClose}
                    className="p-2 text-grayscale-600"
                >
                    <IonIcon icon={closeOutline} />
                </button>
            </div>
            {Object.keys(source.sheets).length > 1 && (
                <label className="block text-xs font-medium text-grayscale-700">
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
            <label className="block text-xs font-medium text-grayscale-700">
                {m['issueFlow.sheet.emailColumn']()}
                <select
                    className={`${INPUT} mt-1.5`}
                    value={parsed.emailColumn ?? ''}
                    onChange={event =>
                        setEmailColumn(
                            event.target.value === '' ? undefined : Number(event.target.value)
                        )
                    }
                >
                    <option value="">{m['issueFlow.sheet.chooseEmail']()}</option>
                    {parsed.columns.map(column => (
                        <option key={column.id} value={column.index}>
                            {column.label} (
                            {source.sheets[parsed.sheetName]
                                ?.find(row => row[column.index]?.text.trim())
                                ?.[column.index]?.text.slice(0, 40)}
                            )
                        </option>
                    ))}
                </select>
            </label>
            <label className="block text-xs font-medium text-grayscale-700">
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
            <p className="text-sm text-grayscale-600">
                {m['issueFlow.sheet.importSummary']({
                    count: parsed.rows.filter(
                        row => !row.example || row.email !== 'person@example.com'
                    ).length,
                    skipped: parsed.skipped,
                })}
            </p>
            <ul className="space-y-1 text-sm text-grayscale-700">
                {parsed.rows.slice(0, 3).map(row => (
                    <li key={row.rowId}>
                        {row.displayName} {row.email}
                    </li>
                ))}
            </ul>
            {error && (
                <p role="alert" className="p-3 bg-red-50 text-sm text-red-700 rounded-2xl">
                    {error}
                </p>
            )}
            <button
                type="button"
                disabled={busy || parsed.emailColumn === undefined}
                onClick={submit}
                className={`${BUTTON} w-full`}
            >
                {busy ? m['issueFlow.sheet.importing']() : m['issueFlow.sheet.addPeople']()}
            </button>
        </div>
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
            {},
            { mobile: ModalTypes.Freeform, desktop: ModalTypes.Center }
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
