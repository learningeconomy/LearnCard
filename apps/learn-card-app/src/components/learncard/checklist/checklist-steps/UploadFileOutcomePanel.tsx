import React from 'react';
import * as m from '../../../../paraglide/messages.js';
import type { FileUploadOutcome } from '../../../../hooks/uploadFile.types';
import { useUploadedDocumentPreview } from '../../../../hooks/useUploadedDocumentPreview';

type UploadFileOutcomePanelProps = {
    message?: string;
    retryKind?: 'extraction' | 'save';
    status?: Exclude<FileUploadOutcome['status'], 'stored'>;
    fileName?: string;
    fileData?: string;
    extractedCount?: number;
    onRetry?: (button: HTMLButtonElement) => void;
    isRetrying?: boolean;
    disabled?: boolean;
};

export const UploadFileOutcomePanel: React.FC<UploadFileOutcomePanelProps> = ({
    message,
    retryKind,
    status,
    fileName,
    fileData,
    extractedCount,
    onRetry,
    isRetrying = false,
    disabled = false,
}) => {
    const { opening, openDocument } = useUploadedDocumentPreview(
        fileName ?? '',
        fileData ?? '',
        disabled || isRetrying
    );
    const isFailure = status === 'save_failed' || retryKind === 'save';
    const isReady = status === 'review';
    const isSavingOriginal = status === 'saving_original';
    const panelClass = isFailure
        ? 'border-red-200 bg-red-50 text-red-700'
        : isReady
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-amber-200 bg-amber-50 text-amber-900';
    const defaultMessage = isSavingOriginal
        ? m['passport.buildMyLearnCard.managers.extractionFailedSavingOriginal']()
        : status === 'empty'
          ? m['passport.buildMyLearnCard.managers.documentNoCredentials']()
          : status === 'review'
            ? m['passport.buildMyLearnCard.managers.credentialsReady']({
                  count: extractedCount ?? 0,
              })
            : status === 'extraction_failed'
              ? m['passport.buildMyLearnCard.managers.errorProcessingFailed']()
              : m['passport.buildMyLearnCard.managers.saveOutcomeError']();

    return (
        <div
            role={isFailure ? 'alert' : 'status'}
            aria-busy={isSavingOriginal || isRetrying || opening}
            className={`w-full rounded-xl border p-3 mb-3 font-poppins ${panelClass}`}
        >
            {fileName &&
                (fileData ? (
                    <button
                        type="button"
                        onClick={event => void openDocument(event)}
                        disabled={disabled || isRetrying || opening}
                        aria-label={`${m['passport.buildMyLearnCard.managers.openFile']()}: ${fileName}`}
                        className="mb-1 max-w-full rounded-[20px] text-left text-sm font-semibold [overflow-wrap:anywhere] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait disabled:opacity-50"
                    >
                        {fileName}
                    </button>
                ) : (
                    <p className="text-sm font-semibold mb-1">{fileName}</p>
                ))}
            {opening && (
                <p className="text-xs mb-1">
                    {m['passport.buildMyLearnCard.managers.openingFile']()}
                </p>
            )}
            <p className="text-sm mb-2 flex items-center gap-2">
                {isSavingOriginal && (
                    <span
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
                    />
                )}
                {message ?? defaultMessage}
            </p>
            {onRetry && retryKind && (
                <button
                    type="button"
                    disabled={disabled || isRetrying || opening}
                    onClick={event => onRetry(event.currentTarget)}
                    className="rounded-[20px] bg-grayscale-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span className="flex items-center justify-center gap-2">
                        {isRetrying && (
                            <span
                                aria-hidden="true"
                                className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            />
                        )}
                        {isRetrying
                            ? m['passport.buildMyLearnCard.managers.retrying']()
                            : retryKind === 'extraction'
                              ? m['passport.buildMyLearnCard.managers.retryExtraction']()
                              : m['passport.buildMyLearnCard.managers.retrySave']()}
                    </span>
                </button>
            )}
        </div>
    );
};
