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
import * as m from '../../../../paraglide/messages.js';
import { UploadFileOutcomePanel } from './UploadFileOutcomePanel';

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
        } catch {
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
                const retryKind =
                    item.status === 'save_failed'
                        ? 'save'
                        : item.status === 'stored' ||
                            item.status === 'review' ||
                            item.status === 'saving_original'
                          ? undefined
                          : 'extraction';
                return (
                    <UploadFileOutcomePanel
                        key={item.artifact.id}
                        status={item.status}
                        fileName={item.artifact.rawArtifact.fileName}
                        extractedCount={item.extractedCount}
                        selectedCount={item.selectedCount}
                        storedCount={item.storedCount}
                        message={
                            failedId === item.artifact.id
                                ? item.failedStage === 'credential_save'
                                    ? m[
                                          'passport.buildMyLearnCard.managers.credentialSaveOutcomeError'
                                      ]()
                                    : m['passport.buildMyLearnCard.managers.saveOutcomeError']()
                                : item.status === 'extraction_failed'
                                  ? m[
                                        'passport.buildMyLearnCard.managers.extractionFailedOriginalSaved'
                                    ]()
                                  : item.message
                        }
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
