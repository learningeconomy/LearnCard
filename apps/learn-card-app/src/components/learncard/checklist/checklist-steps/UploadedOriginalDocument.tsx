import React, { useEffect, useRef, useState } from 'react';
import { ToastTypeEnum, useToast } from 'learn-card-base';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { openAttachmentUrl } from 'learn-card-base/helpers/openAttachmentUrl';
import * as m from '../../../../paraglide/messages.js';

const PREVIEW_EXTENSIONS: Record<string, string> = {
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
};

type UploadedOriginalDocumentProps = {
    fileName: string;
    data: string;
    onRetry?: () => Promise<void>;
    disabled?: boolean;
};

export const UploadedOriginalDocument: React.FC<UploadedOriginalDocumentProps> = ({
    fileName,
    data,
    onRetry,
    disabled = false,
}) => {
    const { presentToast } = useToast();
    const [action, setAction] = useState<'open' | 'download' | 'extract' | null>(null);
    const busy = useRef(false);
    const mounted = useRef(true);
    const currentFile = useRef({ fileName, data });
    currentFile.current = { fileName, data };

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const performAction = async (
        kind: 'open' | 'download' | 'extract',
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        if (busy.current || disabled || !data) return;
        const button = event.currentTarget;
        const ownedFocus = document.activeElement === button;
        // Persisted artifact names are untrusted. Never use them as native paths.
        const basename = (fileName.split(/[\\/]/).pop() ?? '')
            .replace(/\p{Cc}/gu, '')
            .slice(0, 120);
        const safeName = basename && basename !== '.' && basename !== '..' ? basename : 'document';
        busy.current = true;
        setAction(kind);
        try {
            if (!/^data:[^,]*;base64,/i.test(data)) throw new Error('Invalid document data');
            if (kind === 'extract') {
                if (!onRetry) throw new Error('Extraction is unavailable');
                await onRetry();
            } else if (kind === 'open') {
                // A same-origin HTML/SVG blob could execute uploaded scripts. Only open
                // the supported document/image types; other originals remain downloadable.
                if (
                    !/^data:(?:application\/pdf|text\/plain|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(?:png|jpeg|webp));base64,/i.test(
                        data
                    )
                ) {
                    throw new Error('Unsupported preview type');
                }
                const mimeType = data.slice(5, data.indexOf(';')).toLowerCase();
                await openAttachmentUrl(
                    data,
                    Capacitor.isNativePlatform()
                        ? `upload-${crypto.randomUUID()}-${safeName.replace(/\.[^.]*$/, '')}${PREVIEW_EXTENSIONS[mimeType]}`
                        : safeName
                );
            } else if (Capacitor.isNativePlatform()) {
                const separator = data.indexOf(',');
                if (!data.startsWith('data:') || separator < 0)
                    throw new Error('Invalid document data');
                await Filesystem.writeFile({
                    path: `upload-${crypto.randomUUID()}-${safeName}`,
                    data: data.slice(separator + 1),
                    directory: Directory.Documents,
                });
                presentToast(m['passport.buildMyLearnCard.managers.downloadSaved'](), {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });
            } else {
                const link = document.createElement('a');
                link.href = data;
                link.download = safeName;
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch {
            presentToast(m['passport.buildMyLearnCard.managers.toastGenericError'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            busy.current = false;
            if (mounted.current) setAction(null);
            requestAnimationFrame(() => {
                if (
                    ownedFocus &&
                    mounted.current &&
                    button.isConnected &&
                    currentFile.current.fileName === fileName &&
                    currentFile.current.data === data &&
                    document.activeElement === document.body
                ) {
                    button.focus({ preventScroll: true });
                }
            });
        }
    };

    return (
        <div className="w-full border border-grayscale-200 rounded-xl p-3 mb-3 font-poppins">
            <p className="text-sm font-semibold text-grayscale-900">
                {m['passport.buildMyLearnCard.managers.uploadedDocument']()}
            </p>
            <p className="text-xs text-grayscale-600 mb-3">
                {m['passport.buildMyLearnCard.managers.providedNotVerified']()}
            </p>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={disabled || Boolean(action) || !data}
                    onClick={event => void performAction('open', event)}
                    className="rounded-[20px] border border-grayscale-300 px-4 py-2 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span className="flex items-center justify-center gap-2">
                        {action === 'open' && (
                            <span
                                aria-hidden="true"
                                className="h-4 w-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin"
                            />
                        )}
                        {action === 'open'
                            ? m['passport.buildMyLearnCard.managers.openingFile']()
                            : m['passport.buildMyLearnCard.managers.openFile']()}
                    </span>
                </button>
                <button
                    type="button"
                    disabled={disabled || Boolean(action) || !data}
                    onClick={event => void performAction('download', event)}
                    className="rounded-[20px] border border-grayscale-300 px-4 py-2 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span className="flex items-center justify-center gap-2">
                        {action === 'download' && (
                            <span
                                aria-hidden="true"
                                className="h-4 w-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin"
                            />
                        )}
                        {action === 'download'
                            ? m['passport.buildMyLearnCard.managers.downloadingFile']()
                            : m['passport.buildMyLearnCard.managers.downloadFile']()}
                    </span>
                </button>
                {onRetry && (
                    <button
                        type="button"
                        disabled={disabled || Boolean(action) || !data}
                        onClick={event => void performAction('extract', event)}
                        className="rounded-[20px] bg-grayscale-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="flex items-center justify-center gap-2">
                            {action === 'extract' && (
                                <span
                                    aria-hidden="true"
                                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                />
                            )}
                            {action === 'extract'
                                ? m['passport.buildMyLearnCard.managers.retrying']()
                                : m['passport.buildMyLearnCard.managers.retryExtraction']()}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};
