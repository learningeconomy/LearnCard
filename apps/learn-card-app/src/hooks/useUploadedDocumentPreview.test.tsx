import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUploadedDocumentPreview } from './useUploadedDocumentPreview';

const { presentToast } = vi.hoisted(() => ({ presentToast: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useToast: () => ({ presentToast }),
    ToastTypeEnum: { Error: 'error' },
}));
vi.mock('../paraglide/messages.js', () => ({
    'passport.buildMyLearnCard.managers.toastGenericError': () => 'Could not open file',
}));

// Exercise the real attachment opener up to the browser's blob/new-tab boundary.
const createObjectURL = vi.fn((_blob: Blob | MediaSource) => 'blob:uploaded-document');
const revokeObjectURL = vi.fn();
const BrowserURL = URL;

const Preview = ({ fileName, data }: { fileName: string; data: string }) => {
    const { opening, openDocument } = useUploadedDocumentPreview(fileName, data);
    return (
        <button disabled={opening} onClick={event => void openDocument(event)}>
            Open document
        </button>
    );
};

const open = async (fileName: string, data: string): Promise<void> => {
    render(<Preview fileName={fileName} data={data} />);
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Open document' }));
    });
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal(
        'URL',
        class extends BrowserURL {
            static createObjectURL = createObjectURL;
            static revokeObjectURL = revokeObjectURL;
        }
    );
    vi.spyOn(window, 'open').mockReturnValue(null);
});

afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('uploaded document preview security', () => {
    it.each([
        ['renamed HTML', 'resume.pdf', 'data:text/html;base64,PHNjcmlwdD4='],
        ['renamed SVG', 'resume.pdf', 'data:image/svg+xml;base64,PHN2Zz4='],
        ['untyped SVG', 'resume.svg', 'data:;base64,PHN2Zz4='],
        ['generic SVG', 'resume.svg', 'data:application/octet-stream;base64,PHN2Zz4='],
        ['untyped unknown extension', 'resume.bin', 'data:;base64,JVBERi0xLjQK'],
        [
            'generic unknown extension',
            'resume.bin',
            'data:application/octet-stream;base64,JVBERi0xLjQK',
        ],
        ['non-inline URL', 'resume.pdf', 'https://example.test/resume.pdf'],
    ])('rejects %s without creating a browser preview', async (_case, fileName, data) => {
        await open(fileName, data);
        expect(createObjectURL).not.toHaveBeenCalled();
        expect(window.open).not.toHaveBeenCalled();
        expect(presentToast).toHaveBeenCalledOnce();
    });

    it.each([
        ['resume.pdf', 'data:;base64,JVBERi0xLjQK'],
        ['resume.PDF', 'data:application/octet-stream;base64,JVBERi0xLjQK'],
        [`${'long-'.repeat(30)}resume.pdf`, 'data:;base64,JVBERi0xLjQK'],
    ])('opens %s as an actual PDF blob despite missing/generic MIME', async (fileName, data) => {
        await open(fileName, data);
        expect(createObjectURL).toHaveBeenCalledOnce();
        const blob = createObjectURL.mock.calls[0]?.[0];
        expect(blob).toBeInstanceOf(Blob);
        expect(blob).toMatchObject({ type: 'application/pdf', size: 9 });
        expect(window.open).toHaveBeenCalledOnce();
        expect(presentToast).not.toHaveBeenCalled();
    });
});
