import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkOutline, trashOutline } from 'ionicons/icons';
import { ToastTypeEnum, useToast } from 'learn-card-base';
import DocIcon from 'learn-card-base/svgs/DocIcon';
import { Capacitor } from '@capacitor/core';
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
    fileType: string;
    fileSize: string;
    data: string;
    addedCredentialCount?: number;
    onDelete: () => Promise<void>;
    disabled?: boolean;
};

export const UploadedOriginalDocument: React.FC<UploadedOriginalDocumentProps> = ({
    fileName,
    fileType,
    fileSize,
    data,
    addedCredentialCount,
    onDelete,
    disabled = false,
}) => {
    const { presentToast } = useToast();
    const [opening, setOpening] = useState(false);
    const busy = useRef(false);
    const mounted = useRef(true);
    const focusToRestore = useRef<{
        button: HTMLButtonElement;
        fileName: string;
        data: string;
    } | null>(null);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (opening || disabled || !focusToRestore.current) return;
        const previous = focusToRestore.current;
        focusToRestore.current = null;
        if (
            previous.button.isConnected &&
            previous.fileName === fileName &&
            previous.data === data &&
            document.activeElement === document.body
        ) {
            previous.button.focus({ preventScroll: true });
        }
    }, [opening, disabled, fileName, data]);

    const openDocument = async (event: React.MouseEvent<HTMLButtonElement>) => {
        if (busy.current || disabled || !data) return;
        const button = event.currentTarget;
        const ownedFocus = document.activeElement === button;
        busy.current = true;
        setOpening(true);
        try {
            // Only supported documents may open; HTML/SVG blobs could execute uploaded scripts.
            if (
                !/^data:(?:application\/pdf|text\/plain|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(?:png|jpeg|webp));base64,/i.test(
                    data
                )
            ) {
                throw new Error('Unsupported preview type');
            }
            const basename = (fileName.split(/[\\/]/).pop() ?? '')
                .replace(/\p{Cc}/gu, '')
                .slice(0, 120);
            const safeName =
                basename && basename !== '.' && basename !== '..' ? basename : 'document';
            const mimeType = data.slice(5, data.indexOf(';')).toLowerCase();
            await openAttachmentUrl(
                data,
                Capacitor.isNativePlatform()
                    ? `upload-${crypto.randomUUID()}-${safeName.replace(/\.[^.]*$/, '')}${PREVIEW_EXTENSIONS[mimeType]}`
                    : safeName
            );
        } catch {
            presentToast(m['passport.buildMyLearnCard.managers.toastGenericError'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            busy.current = false;
            if (mounted.current) {
                if (ownedFocus) focusToRestore.current = { button, fileName, data };
                setOpening(false);
            }
        }
    };

    const hasAddedCredentials = (addedCredentialCount ?? 0) > 0;

    return (
        <section
            aria-label={fileName}
            className={`w-full rounded-2xl border p-4 font-poppins ${
                hasAddedCredentials
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-grayscale-200 bg-white'
            }`}
        >
            {hasAddedCredentials && (
                <div
                    role="status"
                    className="mb-4 flex items-center gap-2 text-lg font-semibold leading-snug text-emerald-700"
                >
                    <IonIcon
                        icon={checkmarkOutline}
                        aria-hidden="true"
                        className="h-6 w-6 shrink-0"
                    />
                    <span>
                        {addedCredentialCount === 1
                            ? m['passport.buildMyLearnCard.managers.credentialAdded']()
                            : m['passport.buildMyLearnCard.managers.credentialsAdded']({
                                  count: addedCredentialCount ?? 0,
                              })}
                    </span>
                </div>
            )}
            <div className="flex items-center gap-3">
                <DocIcon className="h-14 w-12 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={event => void openDocument(event)}
                        disabled={disabled || opening || !data}
                        aria-label={`${m['passport.buildMyLearnCard.managers.openFile']()}: ${fileName}`}
                        className="max-w-full rounded-[20px] text-left text-sm font-semibold text-grayscale-900 [overflow-wrap:anywhere] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait disabled:opacity-50"
                    >
                        {fileName}
                    </button>
                    <p className="mt-0.5 text-xs text-grayscale-600">
                        {fileType} • {fileSize}
                    </p>
                    {opening && (
                        <p role="status" className="mt-1 text-xs text-grayscale-600">
                            {m['passport.buildMyLearnCard.managers.openingFile']()}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => void onDelete()}
                    disabled={disabled || opening}
                    aria-label={`${m['common.delete']()}: ${fileName}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[20px] border border-grayscale-200 bg-white text-grayscale-700 shadow-sm transition-colors hover:bg-grayscale-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <IonIcon icon={trashOutline} aria-hidden="true" className="h-5 w-5" />
                </button>
            </div>
        </section>
    );
};
