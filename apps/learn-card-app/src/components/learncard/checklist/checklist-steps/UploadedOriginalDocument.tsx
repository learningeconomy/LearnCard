import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkOutline, trashOutline } from 'ionicons/icons';
import DocIcon from 'learn-card-base/svgs/DocIcon';
import { useUploadedDocumentPreview } from '../../../../hooks/useUploadedDocumentPreview';
import * as m from '../../../../paraglide/messages.js';

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
    const { opening, openDocument } = useUploadedDocumentPreview(fileName, data, disabled);

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
