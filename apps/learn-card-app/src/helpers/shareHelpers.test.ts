import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCapacitor, mockShare, mockClipboard } = vi.hoisted(() => ({
    mockCapacitor: { isNativePlatform: vi.fn(() => false) },
    mockShare: { share: vi.fn(async () => undefined) },
    mockClipboard: { write: vi.fn(async () => undefined) },
}));

vi.mock('@capacitor/core', () => ({ Capacitor: mockCapacitor }));
vi.mock('@capacitor/share', () => ({ Share: mockShare }));
vi.mock('@capacitor/clipboard', () => ({ Clipboard: mockClipboard }));

import { shareOrCopy } from './shareHelpers';

const URL = 'https://learncard.app/invite?challenge=abc&profileId=jackson';

const setNavigatorShare = (impl: ((data: unknown) => Promise<void>) | undefined) => {
    if (impl) {
        Object.defineProperty(navigator, 'share', { value: impl, configurable: true });
    } else {
        // @ts-expect-error deliberately removing an optional API for the test
        delete navigator.share;
    }
};

describe('shareOrCopy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCapacitor.isNativePlatform.mockReturnValue(false);
        setNavigatorShare(undefined);
    });

    it('uses the Capacitor share sheet on a native platform', async () => {
        mockCapacitor.isNativePlatform.mockReturnValue(true);

        const result = await shareOrCopy({ url: URL, title: 'Join me' });

        expect(mockShare.share).toHaveBeenCalledWith(
            expect.objectContaining({ url: URL, title: 'Join me' })
        );
        expect(mockClipboard.write).not.toHaveBeenCalled();
        expect(result).toEqual({ method: 'native', shared: true });
    });

    it('uses the Web Share API on web when the browser exposes it and the caller opts in', async () => {
        const webShare = vi.fn(async () => undefined);
        setNavigatorShare(webShare);

        const result = await shareOrCopy({ url: URL, title: 'Join me', allowWebShare: true });

        expect(webShare).toHaveBeenCalledWith(expect.objectContaining({ url: URL }));
        expect(mockClipboard.write).not.toHaveBeenCalled();
        expect(result).toEqual({ method: 'web_share', shared: true });
    });

    it('falls back to the clipboard on web without navigator.share', async () => {
        const result = await shareOrCopy({ url: URL, allowWebShare: true });

        expect(mockClipboard.write).toHaveBeenCalledWith({ string: URL });
        expect(result).toEqual({ method: 'clipboard', shared: true });
    });

    it('reports a dismissed Web Share sheet without silently copying', async () => {
        const abort = Object.assign(new Error('dismissed'), { name: 'AbortError' });
        setNavigatorShare(
            vi.fn(async () => {
                throw abort;
            })
        );

        const result = await shareOrCopy({ url: URL, allowWebShare: true });

        expect(mockClipboard.write).not.toHaveBeenCalled();
        expect(result).toEqual({ method: 'web_share', shared: false });
    });

    it('falls back to the clipboard when Web Share fails for a real reason', async () => {
        setNavigatorShare(
            vi.fn(async () => {
                throw new Error('NotAllowedError');
            })
        );

        const result = await shareOrCopy({ url: URL });

        expect(mockClipboard.write).toHaveBeenCalledWith({ string: URL });
        expect(result).toEqual({ method: 'clipboard', shared: true });
    });
    // The bug this guards: navigator.share is NOT mobile-only. Desktop Chrome on
    // macOS implements it, so feature detection alone sent desktop users to the
    // OS share sheet instead of this app's in-app share modal.
    it('ignores navigator.share when the caller has not opted in, even if the browser has it', async () => {
        const webShare = vi.fn(async () => undefined);
        setNavigatorShare(webShare);

        const result = await shareOrCopy({ url: URL, title: 'Join me' });

        expect(webShare).not.toHaveBeenCalled();
        expect(mockClipboard.write).toHaveBeenCalledWith({ string: URL });
        expect(result).toEqual({ method: 'clipboard', shared: true });
    });

    // Capacitor's Share plugin REJECTS on iOS when the user dismisses the
    // activity sheet (`call.reject("Share canceled")`). Before this, that
    // rejection escaped shareOrCopy and the caller's catch told the user the
    // invite link had failed — for a link that had resolved fine.
    it('reports a dismissed native share sheet instead of throwing', async () => {
        mockCapacitor.isNativePlatform.mockReturnValue(true);
        mockShare.share.mockRejectedValueOnce(new Error('Share canceled'));

        const result = await shareOrCopy({ url: URL });

        expect(result).toEqual({ method: 'native', shared: false });
        expect(mockClipboard.write).not.toHaveBeenCalled();
    });

    it('rethrows a genuine native share failure', async () => {
        mockCapacitor.isNativePlatform.mockReturnValue(true);
        mockShare.share.mockRejectedValueOnce(new Error('No sharing activity found'));

        await expect(shareOrCopy({ url: URL })).rejects.toThrow(/no sharing activity/i);
    });

    it('still uses the native sheet on a native platform regardless of allowWebShare', async () => {
        mockCapacitor.isNativePlatform.mockReturnValue(true);
        setNavigatorShare(vi.fn(async () => undefined));

        const result = await shareOrCopy({ url: URL, allowWebShare: false });

        expect(mockShare.share).toHaveBeenCalled();
        expect(result).toEqual({ method: 'native', shared: true });
    });
});
