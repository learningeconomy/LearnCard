import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { FileViewer } from '@capacitor/file-viewer';
import { Directory, Filesystem } from '@capacitor/filesystem';

import { getLogger } from '../logging/logger';

const log = getLogger('open-attachment-url');

const isInlineDataUri = (url: string): boolean => url.startsWith('data:');

const getDataUriMimeType = (dataUri: string): string => {
    const mimeType = dataUri.match(/^data:([^;]+)?/i)?.[1];
    return mimeType || 'application/octet-stream';
};

const getDataUriBase64 = (dataUri: string): string => {
    const parts = dataUri.split(',');
    if (parts.length < 2) {
        throw new Error('Invalid data URI');
    }

    return parts.slice(1).join(',');
};

const getExtensionFromMimeType = (mimeType: string): string => {
    if (mimeType === 'application/pdf') return '.pdf';
    if (mimeType.startsWith('image/')) return `.${mimeType.split('/')[1] ?? 'png'}`;
    return '';
};

const getFallbackFileName = (url: string): string => {
    const mimeType = getDataUriMimeType(url);
    const extension = getExtensionFromMimeType(mimeType);
    return `attachment${extension}`;
};

const getAlertMessage = (isInline: boolean): string =>
    isInline
        ? "We couldn't open the file. Please try again."
        : "We couldn't open the link. Please try again.";

const showAlert = (message: string): void => {
    if (typeof globalThis.alert === 'function') {
        globalThis.alert(message);
    }
};

/**
 * Opens an attachment or link using the best available platform path.
 *
 * Inline `data:` URIs are written to local storage on native and opened via the file viewer.
 * On web they are converted to blob URLs so the browser can open them reliably.
 */
export const openAttachmentUrl = async (
    url: string | undefined,
    fileName?: string
): Promise<boolean> => {
    if (!url) return false;

    const inlineDataUri = isInlineDataUri(url);

    try {
        if (inlineDataUri) {
            const base64 = getDataUriBase64(url);
            const resolvedFileName = fileName || getFallbackFileName(url);

            if (Capacitor.isNativePlatform()) {
                await Filesystem.writeFile({
                    path: resolvedFileName,
                    data: base64,
                    directory: Directory.Documents,
                });

                const { uri } = await Filesystem.getUri({
                    path: resolvedFileName,
                    directory: Directory.Documents,
                });

                await FileViewer.openDocumentFromLocalPath({ path: uri });
            } else {
                const mimeType = getDataUriMimeType(url);
                const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
                const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));

                window.open(blobUrl, '_blank', 'noopener');

                window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
            }
        } else if (Capacitor.isNativePlatform()) {
            await Browser.open({ url });
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        return true;
    } catch (error) {
        log.error('Failed to open attachment', error, {
            isInlineDataUri: inlineDataUri,
            isNativePlatform: Capacitor.isNativePlatform(),
            fileName,
        });
        showAlert(getAlertMessage(inlineDataUri));
        return false;
    }
};
