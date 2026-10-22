import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportSheet } from './ImportSheet';
import { ingestFile, ingestText, ImportError } from './ingest';
import { readSpreadsheetText, SpreadsheetError } from '../spreadsheet/parseSpreadsheet';
import type { IssueImportSource } from './issueImport';

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ warn: vi.fn() }),
    isClrCredential: () => false,
    useModal: () => ({}),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
}));
vi.mock('./ingest', async original => ({
    ...(await original<typeof import('./ingest')>()),
    ingestFile: vi.fn(),
    ingestText: vi.fn(),
}));

const csv = 'Email,Name\nada@example.test,Ada';
const spreadsheet = (): IssueImportSource => ({
    kind: 'spreadsheet',
    source: readSpreadsheetText(csv),
});
const renderImport = () => {
    const onUse = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ImportSheet onUse={onUse} handleCloseModal={onClose} />);
    return { onUse, onClose };
};
const upload = (file: File) =>
    fireEvent.change(screen.getByTestId('issue-import-file'), { target: { files: [file] } });

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ingestFile).mockResolvedValue(spreadsheet());
    vi.mocked(ingestText).mockResolvedValue(spreadsheet());
});

describe('credential and spreadsheet import choices', () => {
    it('keeps credential JSON in review until it is explicitly used', async () => {
        const result: IssueImportSource = {
            kind: 'credential',
            value: {
                obv3Json: { credentialSubject: { achievement: { name: 'Imported badge' } } },
                provenance: { source: 'paste', label: 'Credential data' },
                warnings: [],
            },
        };
        vi.mocked(ingestText).mockResolvedValueOnce(result);
        const { onUse, onClose } = renderImport();
        fireEvent.change(screen.getByLabelText('Content to import'), {
            target: { value: JSON.stringify(result.value.obv3Json) },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Review content' }));
        await screen.findByText('Imported badge');
        expect(onUse).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Use this' }));
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect(onUse).toHaveBeenCalledExactlyOnceWith(result);
    });

    it('keeps unexpected internal errors out of the upload message', async () => {
        vi.mocked(ingestFile).mockRejectedValueOnce(new Error('private parser stack details'));
        renderImport();
        upload(new File(['{}'], 'credential.json'));
        await screen.findByRole('alert');
        expect(screen.queryByText('private parser stack details')).toBeNull();
    });

    it('separates file upload from a labeled paste field and explains supported content', () => {
        renderImport();
        const file = screen.getByRole('region', { name: 'Upload a file' });
        const paste = screen.getByRole('region', { name: 'Paste a link or data' });
        expect(within(file).getByRole('button', { name: 'Choose file' })).toBeEnabled();
        expect(within(file).queryByRole('textbox')).toBeNull();
        expect(within(paste).getByLabelText('Content to import')).toBeVisible();
        expect(within(paste).getByRole('button', { name: 'Review content' })).toBeDisabled();
        expect(screen.queryByPlaceholderText(/ce- ID/)).toBeNull();
        fireEvent.click(screen.getByText('What can I paste?'));
        expect(
            screen.getByText('Copy rows with an email column from Google Sheets or Excel.')
        ).toBeVisible();
        expect(
            screen.getByText('Credential Engine links and record IDs also work here.')
        ).toBeVisible();
    });

    it('reviews a chosen file independently of pasted text and confirms before adding people', async () => {
        const { onUse } = renderImport();
        fireEvent.change(screen.getByLabelText('Content to import'), {
            target: { value: 'Unrelated text' },
        });
        const file = new File([csv], 'people.csv', { type: 'text/csv' });
        upload(file);
        await screen.findByRole('heading', { name: 'Review spreadsheet' });
        expect(ingestFile).toHaveBeenCalledExactlyOnceWith(file);
        expect(ingestText).not.toHaveBeenCalled();
        expect(onUse).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Add People' }));
        await waitFor(() => expect(onUse).toHaveBeenCalledOnce());
        expect(onUse.mock.calls[0][0]).toMatchObject({
            kind: 'spreadsheet',
            sheet: { rows: [expect.objectContaining({ email: 'ada@example.test' })] },
        });
    });

    it('routes pasted rows to review without requiring a file', async () => {
        const { onUse } = renderImport();
        fireEvent.change(screen.getByLabelText('Content to import'), { target: { value: csv } });
        fireEvent.click(screen.getByRole('button', { name: 'Review content' }));
        await screen.findByRole('heading', { name: 'Review spreadsheet' });
        expect(ingestText).toHaveBeenCalledExactlyOnceWith(csv);
        expect(ingestFile).not.toHaveBeenCalled();
        expect(onUse).not.toHaveBeenCalled();
    });

    it('prevents simultaneous imports and permits reselecting the same file after an error', async () => {
        let reject!: (reason: unknown) => void;
        vi.mocked(ingestFile).mockImplementationOnce(
            () =>
                new Promise((_resolve, fail) => {
                    reject = fail;
                })
        );
        renderImport();
        fireEvent.change(screen.getByLabelText('Content to import'), { target: { value: csv } });
        const file = new File([csv], 'people.csv');
        upload(file);
        expect(screen.getByRole('button', { name: 'Reading file…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Review content' })).toBeDisabled();
        expect(screen.getByLabelText('Content to import')).toBeDisabled();
        fireEvent.drop(screen.getByRole('region', { name: 'Upload a file' }), {
            dataTransfer: { files: [file] },
        });
        expect(ingestFile).toHaveBeenCalledOnce();
        await act(async () => {
            reject(new SpreadsheetError('limit'));
        });
        expect(
            within(screen.getByRole('region', { name: 'Upload a file' })).getByRole('alert')
        ).toBeVisible();
        expect(screen.getByLabelText('Content to import')).toHaveAttribute('aria-invalid', 'false');
        expect(screen.getByTestId('issue-import-file')).toHaveValue('');
        upload(file);
        await screen.findByRole('heading', { name: 'Review spreadsheet' });
        expect(ingestFile).toHaveBeenCalledTimes(2);
    });

    it('associates link errors with the paste field and clears them after correction', async () => {
        vi.mocked(ingestText).mockRejectedValueOnce(
            new ImportError('That link could not be opened.', true)
        );
        renderImport();
        const input = screen.getByLabelText('Content to import');
        fireEvent.change(input, { target: { value: 'https://example.org/credential.json' } });
        fireEvent.click(screen.getByRole('button', { name: 'Review content' }));
        const alert = await screen.findByRole('alert');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input.getAttribute('aria-describedby')).toContain(alert.id);
        expect(
            within(screen.getByRole('region', { name: 'Upload a file' })).queryByRole('alert')
        ).toBeNull();
        fireEvent.change(input, { target: { value: csv } });
        expect(input).toHaveAttribute('aria-invalid', 'false');
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
