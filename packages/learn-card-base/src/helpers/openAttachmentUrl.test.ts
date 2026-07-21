// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createObjectURLMock, revokeObjectURLMock } = vi.hoisted(() => ({
    createObjectURLMock: vi.fn(() => 'blob:certificate-preview'),
    revokeObjectURLMock: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn() } }));
vi.mock('@capacitor/file-viewer', () => ({ FileViewer: { openDocumentFromLocalPath: vi.fn() } }));
vi.mock('@capacitor/filesystem', () => ({
    Directory: { Documents: 'DOCUMENTS' },
    Filesystem: { getUri: vi.fn(), writeFile: vi.fn() },
}));
vi.mock('../logging/logger', () => ({
    getLogger: () => ({ error: vi.fn() }),
}));

import { openAttachmentUrl } from './openAttachmentUrl';

const CERTIFICATE_DATA = 'data:application/pdf;base64,Y2VydGlmaWNhdGU=';

describe('openAttachmentUrl', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        createObjectURLMock.mockClear();
        revokeObjectURLMock.mockClear();
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: createObjectURLMock,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: revokeObjectURLMock,
        });
    });

    it('opens an embedded PDF without treating a noopener tab as blocked', async () => {
        const openMock = vi.spyOn(window, 'open').mockReturnValue(null);
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

        await expect(openAttachmentUrl(CERTIFICATE_DATA, 'certificate.pdf')).resolves.toBe(true);

        expect(openMock).toHaveBeenCalledWith('blob:certificate-preview', '_blank', 'noopener');
        expect(alertMock).not.toHaveBeenCalled();
    });
});
