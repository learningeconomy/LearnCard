import React, { useEffect, useRef, useState } from 'react';
import type {
    ArtifactProcessingResult,
    FileUploadOutcome,
} from '../../../../hooks/uploadFile.types';
import type {
    ParsedFileCredential,
    RawArtifactCredential,
} from 'learn-card-base/types/file-extraction';
import { UploadTypesEnum } from 'learn-card-base';
import { FileExtractionError } from 'learn-card-base/helpers/fileExtraction';
import * as m from '../../../../paraglide/messages.js';
import { UploadFileOutcomePanel } from './UploadFileOutcomePanel';

const EXTRACTION_MESSAGES: Record<string, () => string> = {
    ZERO_STRUCTURED_ITEMS: m['passport.buildMyLearnCard.managers.documentNoCredentials'],
    NO_READABLE_TEXT: m['passport.buildMyLearnCard.managers.errorNoReadableText'],
    INPUT_INVALID: m['passport.buildMyLearnCard.managers.errorInputInvalid'],
    FILE_TOO_LARGE: m['passport.buildMyLearnCard.managers.errorFileTooLarge'],
    READ_FAILED: m['passport.buildMyLearnCard.managers.errorReadFailed'],
    CONTENT_REJECTED: m['passport.buildMyLearnCard.managers.errorContentRejected'],
    CLASSIFICATION_FAILED: m['passport.buildMyLearnCard.managers.errorProcessingFailed'],
    MODEL_FAILED: m['passport.buildMyLearnCard.managers.errorProcessingFailed'],
    CONSTRUCTION_FAILED: m['passport.buildMyLearnCard.managers.errorProcessingFailed'],
    OWNER_OPERATION_UNAVAILABLE: m['passport.buildMyLearnCard.managers.errorProcessingFailed'],
    NETWORK_FAILED: m['passport.buildMyLearnCard.managers.errorNetworkFailed'],
    RESPONSE_INVALID: m['passport.buildMyLearnCard.managers.errorResponseInvalid'],
    CONSENT_DENIED: m['passport.buildMyLearnCard.managers.errorConsentDenied'],
    AI_GATE_LOADING: m['passport.buildMyLearnCard.managers.errorAiGateLoading'],
    UPLOAD_BUSY: m['passport.buildMyLearnCard.managers.errorUploadBusy'],
};

const extractionMessage = (code?: string): string =>
    code && Object.hasOwn(EXTRACTION_MESSAGES, code)
        ? EXTRACTION_MESSAGES[code]()
        : m['passport.buildMyLearnCard.managers.errorProcessingFailed']();

const NON_RETRYABLE_CODES = new Set([
    'FILE_TOO_LARGE',
    'INPUT_INVALID',
    'CONTENT_REJECTED',
    'CONSENT_DENIED',
]);

type Props = {
    outcomes: FileUploadOutcome[];
    fileType: UploadTypesEnum;
    retryExtraction: (
        artifact: RawArtifactCredential,
        fileType: UploadTypesEnum
    ) => Promise<ArtifactProcessingResult>;
    retrySave: (artifact: RawArtifactCredential, fileType: UploadTypesEnum) => Promise<void>;
    onExtracted?: (credentials: ParsedFileCredential[]) => void;
    onSettled?: () => void;
    disabled?: boolean;
};

export const UploadFileOutcomeList: React.FC<Props> = ({
    outcomes,
    fileType,
    retryExtraction,
    retrySave,
    onExtracted,
    onSettled,
    disabled,
}) => {
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [failedId, setFailedId] = useState<string | null>(null);
    const busy = useRef(false);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const retry = async (item: FileUploadOutcome, button: HTMLButtonElement) => {
        if (busy.current || disabled) return;
        busy.current = true;
        const ownedFocus = document.activeElement === button;
        setRetryingId(item.artifact.id);
        setFailedId(null);
        try {
            if (item.status === 'save_failed') {
                await retrySave(item.artifact, fileType);
            } else {
                const result = await retryExtraction(item.artifact, fileType);
                if (result.outcome.status === 'review') onExtracted?.(result.credentials);
            }
            onSettled?.();
        } catch (error) {
            if (error instanceof FileExtractionError && error.code === 'UPLOAD_CANCELLED') return;
            if (mounted.current) setFailedId(item.artifact.id);
        } finally {
            busy.current = false;
            if (mounted.current) {
                setRetryingId(null);
                requestAnimationFrame(() => {
                    if (
                        mounted.current &&
                        ownedFocus &&
                        button.isConnected &&
                        document.activeElement === document.body
                    ) {
                        button.focus({ preventScroll: true });
                    }
                });
            }
        }
    };

    return (
        <div className="w-full">
            {outcomes.map(item => {
                if (item.status === 'stored') return null;
                const retryKind =
                    item.status === 'save_failed'
                        ? 'save'
                        : item.status === 'review' || item.status === 'saving_original'
                          ? undefined
                          : item.status === 'extraction_failed' &&
                              NON_RETRYABLE_CODES.has(item.failureCode ?? '')
                            ? undefined
                            : 'extraction';
                let message = item.message;
                if (failedId === item.artifact.id) {
                    message =
                        retryKind === 'save'
                            ? item.failedStage === 'credential_save'
                                ? m[
                                      'passport.buildMyLearnCard.managers.credentialSaveOutcomeError'
                                  ]()
                                : m['passport.buildMyLearnCard.managers.saveOutcomeError']()
                            : m['passport.buildMyLearnCard.managers.extractionRetryError']();
                } else if (item.status === 'empty') {
                    message = item.failureCode
                        ? extractionMessage(item.failureCode)
                        : m['passport.buildMyLearnCard.managers.documentNoCredentials']();
                } else if (item.status === 'extraction_failed') {
                    const reason = extractionMessage(item.failureCode);
                    message = item.originalSaved
                        ? `${reason} ${m['passport.buildMyLearnCard.managers.originalDocumentSaved']()}`
                        : reason;
                } else if (item.status === 'save_failed') {
                    message =
                        item.failedStage === 'credential_save'
                            ? m['passport.buildMyLearnCard.managers.credentialSaveOutcomeError']()
                            : m['passport.buildMyLearnCard.managers.saveOutcomeError']();
                }
                return (
                    <UploadFileOutcomePanel
                        key={item.artifact.id}
                        status={item.status}
                        fileName={item.artifact.rawArtifact.fileName}
                        fileData={
                            item.status === 'empty' ? item.artifact.rawArtifact.data : undefined
                        }
                        extractedCount={item.extractedCount}
                        message={message}
                        retryKind={retryKind}
                        onRetry={retryKind ? button => void retry(item, button) : undefined}
                        isRetrying={retryingId === item.artifact.id}
                        disabled={disabled || retryingId !== null}
                    />
                );
            })}
        </div>
    );
};
