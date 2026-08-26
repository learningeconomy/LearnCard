import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

/** Which mechanism actually handled the share. Recorded in analytics. */
export type ShareMethod = 'native' | 'web_share' | 'clipboard';

export type ShareResult = {
    method: ShareMethod;
    /** False when the user dismissed a share sheet without sharing. */
    shared: boolean;
};

export type ShareOrCopyInput = {
    url: string;
    title?: string;
    text?: string;
};

/**
 * Share a URL through the best mechanism the current platform offers.
 *
 * Native app  → the OS share sheet via Capacitor.
 * Mobile web  → the Web Share API, which is the same OS sheet in Safari/Chrome.
 * Anything else → copy to the clipboard.
 *
 * A dismissed Web Share sheet resolves as `{ shared: false }` rather than
 * falling through to the clipboard: the user chose not to share, and silently
 * overwriting their clipboard is a surprise. Any other Web Share failure is a
 * genuine fault and does fall through.
 */
export const shareOrCopy = async ({
    url,
    title = '',
    text = '',
}: ShareOrCopyInput): Promise<ShareResult> => {
    if (Capacitor.isNativePlatform()) {
        await Share.share({ title, text, url, dialogTitle: title });

        return { method: 'native', shared: true };
    }

    const canWebShare =
        typeof navigator !== 'undefined' && typeof (navigator as Navigator).share === 'function';

    if (canWebShare) {
        try {
            await navigator.share({ title, text, url });

            return { method: 'web_share', shared: true };
        } catch (err) {
            if ((err as Error | undefined)?.name === 'AbortError') {
                return { method: 'web_share', shared: false };
            }
            // Fall through to the clipboard for real failures.
        }
    }

    await Clipboard.write({ string: url });

    return { method: 'clipboard', shared: true };
};
