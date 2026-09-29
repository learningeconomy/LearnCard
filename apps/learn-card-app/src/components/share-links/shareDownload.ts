import type { SharePayload } from '@learncard/types';

/**
 * Recipient download boundary.
 *
 * The only thing a recipient may export is the decrypted holder-signed
 * presentation. It is deliberately not the manifest: the manifest also carries
 * the owner's `selection`/`endorsements` index metadata, and the surrounding
 * link state carries the content key and owner recovery. None of that is
 * signed content and none of it belongs in the file.
 */

/** Safe, ASCII, bounded file name derived from the share title. */
export const shareExportFilename = (title: string): string => {
    const slug = title
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
    return `${slug || 'shared-credentials'}.json`;
};

/** Exact bytes written to disk: the holder-signed presentation, pretty-printed. */
export const buildSharePresentationExport = (payload: Pick<SharePayload, 'presentation'>): string =>
    JSON.stringify(payload.presentation, null, 2);

/**
 * Trigger a browser download of the exported presentation. Throws if the
 * browser cannot create the blob URL or anchor so the caller can surface an
 * error instead of silently doing nothing.
 */
export const downloadSharePresentation = (
    payload: Pick<SharePayload, 'presentation'>,
    title: string
): void => {
    const contents = buildSharePresentationExport(payload);
    const blob = new Blob([contents], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = shareExportFilename(title);
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        try {
            anchor.click();
        } finally {
            anchor.remove();
        }
    } finally {
        // Defer revocation one task so the click has started the download, then
        // make sure the object URL never outlives the gesture.
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }
};
