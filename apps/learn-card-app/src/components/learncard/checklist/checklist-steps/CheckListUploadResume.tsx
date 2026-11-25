import React, { useEffect, useRef, useState } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('check-list-upload-resume');

import ChecklistLoader from '../loader/ChecklistLoader';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import RefreshIcon from 'learn-card-base/svgs/RefreshIcon';
import CheckListItemSkeleton from './CheckListItemSkeleton';
import CheckListManagerFooter from '../CheckListManager/CheckListManagerFooter';
import CheckListCredentialReviewStep from './CheckListCredentialReviewStep';
import { getWalletCategory } from './AchievementTypeSelectorModal';
import { getField } from './credentialEditFields';

import { useUploadFile } from '../../../../hooks/useUploadFile';
import { FileUploadPersistenceError } from '../../../../hooks/uploadFile.types';
import { readUploadedDocument } from './uploadedDocument.helpers';
import type { UnsignedVC } from '@learncard/types';
import {
    useWallet,
    useDeleteCredentialRecord,
    useConfirmation,
    useToast,
    ToastTypeEnum,
    checklistStore,
    useGetCheckListStatus,
    UploadTypesEnum,
} from 'learn-card-base';

import { UploadFileOutcomePanel } from './UploadFileOutcomePanel';
import { UploadedOriginalDocument } from './UploadedOriginalDocument';
import { UploadFileOutcomeList } from './UploadFileOutcomeList';
import * as m from '../../../../paraglide/messages.js';
import type { LCR } from 'learn-card-base/types/credential-records';

export type ResumeType = {
    id: string;
    uri: string;
    artifactId: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    type: string;
    data: string;
    unavailable?: boolean;
};

export const CheckListUploadResume: React.FC = () => {
    const { initWallet } = useWallet();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        getFile,
        isUploading,
        isSaving,
        fetchParsedCredentials,
        storeSelectedCredentials,
        parsedCredentials,
        setParsedCredentials,
        base64Data,
        rawArtifactCredential,
        fileUploadOutcomes,
        clearFileUploadOutcome,
        retryFileExtraction,
        retryFileSave,
        isParsing,
        isWaitingForCapacity,
        cancelCapacityWait,
    } = useUploadFile(UploadTypesEnum.Resume);
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showReview, setShowReview] = useState<boolean>(false);
    const [isSavingSelected, setIsSavingSelected] = useState<boolean>(false);
    const [loaderDismissed, setLoaderDismissed] = useState<boolean>(false);

    const [resume, setResume] = useState<ResumeType | null>(null);
    const [uploadOutcome, setUploadOutcome] = useState<{
        message: string;
        retryKind: 'extraction' | 'save';
    } | null>(null);

    const pendingReview = checklistStore.useTracked.pendingReview().resume;
    useEffect(() => {
        if (pendingReview?.credentials.length) {
            setParsedCredentials(pendingReview.credentials);
            setShowReview(true);
        }
    }, [pendingReview]);
    useEffect(() => {
        void handleSetResume();
    }, []);

    useEffect(() => {
        if (base64Data && rawArtifactCredential) {
            fetchParsedCredentials(UploadTypesEnum.Resume)
                .then(async vcs => {
                    if (vcs.length > 0) {
                        // Persist to store so it survives unmount
                        checklistStore.set.setPendingReview('resume', {
                            credentials: vcs,
                            rawArtifact: rawArtifactCredential,
                        });
                        setShowReview(true);
                    } else {
                        await handleSetResume();
                    }
                })
                .catch(() =>
                    setUploadOutcome({
                        message: m['passport.buildMyLearnCard.managers.toastGenericError'](),
                        retryKind: 'extraction',
                    })
                );
        }
    }, [base64Data, rawArtifactCredential]);

    const handleSetResume = async () => {
        try {
            setIsLoading(true);
            const wallet = await initWallet();

            const record = await wallet.index.LearnCloud.get(
                { category: UploadTypesEnum.Resume },
                { cache: 'skip-cache' }
            );

            const recordUri = record?.[0]?.uri as string;

            if (!recordUri) {
                setResume(null);
                setIsLoading(false);
                return;
            }

            setResume(
                await readUploadedDocument(
                    { id: record[0].id, uri: recordUri },
                    uri => wallet.read.get(uri),
                    UploadTypesEnum.Resume
                )
            );
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            log.error('handleSetResume::error', error);
        }
    };

    const handleDeleteResume = () => {
        const previous = resume;
        if (!previous) return;

        setResume(null);
        const restoreOutcome = clearFileUploadOutcome(previous.artifactId);

        void (async () => {
            try {
                const wallet = await initWallet();
                const record = await wallet.index.LearnCloud.get(
                    { id: previous.id },
                    { cache: 'skip-cache' }
                );
                const targetRecord = record?.[0] as unknown as LCR | undefined;

                if (!targetRecord || targetRecord.uri !== previous.uri) {
                    await handleSetResume();
                    return;
                }

                await deleteCredentialRecord(targetRecord);
                refetchCheckListStatus();
            } catch (error) {
                log.error('handleDeleteResume::error', error);
                setResume(current => current ?? previous);
                restoreOutcome();
                presentToast(m['passport.buildMyLearnCard.managers.toastDeleteFailed'](), {
                    title: m['passport.buildMyLearnCard.managers.toastDeleteFailedShort'](),
                    hasDismissButton: true,
                    type: ToastTypeEnum.Error,
                    hasX: true,
                    duration: 5000,
                });
            }
        })();
    };

    const confirmDelete = async () => {
        if (
            await confirm({
                text: m['passport.buildMyLearnCard.managers.confirmRemove.resume'](),
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            })
        ) {
            handleDeleteResume();
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const handleReviewConfirm = async (selectedVcs: UnsignedVC[]) => {
        setIsSavingSelected(true);
        const pending = checklistStore.get.pendingReview().resume;
        const artifact = pending?.rawArtifact ?? rawArtifactCredential;
        try {
            if (!artifact) throw new Error('Document unavailable');
            await storeSelectedCredentials(selectedVcs, artifact, UploadTypesEnum.Resume);
            checklistStore.set.setPendingReview('resume', null);
            setUploadOutcome(null);
            setShowReview(false);
            await handleSetResume();
        } catch (error) {
            setUploadOutcome({
                message:
                    error instanceof FileUploadPersistenceError
                        ? error.message
                        : m['passport.buildMyLearnCard.managers.saveOutcomeError'](),
                retryKind: 'save',
            });
        } finally {
            setIsSavingSelected(false);
        }
    };

    const handleReviewBack = () => {
        setUploadOutcome(null);
        // Keep pending review in store so user can return to it via the checklist
        setShowReview(false);
    };

    const handleEditCredential = (index: number, editedVc: UnsignedVC) => {
        setParsedCredentials(prev => {
            const updated = prev.map((cred, i) => {
                if (i !== index) return cred;
                const type = getField(editedVc, 'credentialSubject.achievement.achievementType');
                const category = type ? getWalletCategory(type) || undefined : undefined;
                return {
                    ...cred,
                    vc: editedVc,
                    metadata: {
                        ...cred.metadata,
                        name:
                            getField(editedVc, 'credentialSubject.achievement.name') ||
                            cred.metadata?.name,
                        ...(category ? { category } : {}),
                    },
                };
            });
            // Keep store in sync with edits
            const pending = checklistStore.get.pendingReview().resume;
            if (pending) {
                checklistStore.set.setPendingReview('resume', { ...pending, credentials: updated });
            }
            return updated;
        });
    };

    let buttonText = resume
        ? m['passport.buildMyLearnCard.managers.update']()
        : m['passport.buildMyLearnCard.managers.addButton']();
    buttonText = isUploading ? m['passport.buildMyLearnCard.managers.uploading']() : buttonText;
    const buttonIcon = resume ? (
        <RefreshIcon className="w-[25px] h-[26px] text-grayscale-700 mr-2" />
    ) : (
        <UploadIcon className="w-[25px] h-[26px] text-white mr-2" />
    );

    return (
        <>
            {uploadOutcome && (
                <UploadFileOutcomePanel
                    message={uploadOutcome.message}
                    retryKind={uploadOutcome.retryKind}
                />
            )}
            {showReview ? (
                <>
                    <CheckListCredentialReviewStep
                        credentials={parsedCredentials}
                        fileType={UploadTypesEnum.Resume}
                        onConfirm={handleReviewConfirm}
                        onBack={handleReviewBack}
                        onEditCredential={handleEditCredential}
                        isLoading={isSavingSelected}
                    />
                </>
            ) : (
                <>
                    {isParsing && !isSaving && !loaderDismissed && (
                        <ChecklistLoader
                            waitingForCapacity={isWaitingForCapacity}
                            onCancelWait={cancelCapacityWait}
                            fileType={UploadTypesEnum.Resume}
                            onDismiss={() => setLoaderDismissed(true)}
                        />
                    )}
                    <div className="w-full rounded-[20px] bg-white p-6 mt-4 font-poppins shadow-button-bottom">
                        <div className="flex flex-col items-start justify-center py-2 w-full">
                            <h4 className="text-xl font-semibold text-grayscale-900 text-left mb-2">
                                {m['passport.buildMyLearnCard.managers.resume.title']()}
                            </h4>
                            <p className="text-sm text-grayscale-600 text-left mb-4">
                                {m['passport.buildMyLearnCard.managers.resume.description']()}
                            </p>

                            <UploadFileOutcomeList
                                outcomes={fileUploadOutcomes}
                                fileType={UploadTypesEnum.Resume}
                                retryExtraction={retryFileExtraction}
                                retrySave={retryFileSave}
                                onExtracted={credentials => {
                                    setParsedCredentials(credentials);
                                    setShowReview(true);
                                }}
                                onSettled={() => void handleSetResume()}
                                disabled={isParsing || isSavingSelected || isSaving}
                            />

                            {loaderDismissed && isParsing && !isSaving && (
                                <div className="w-full flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 mb-4">
                                    <svg
                                        className="w-4 h-4 text-indigo-500 shrink-0 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    <p className="text-xs text-indigo-700 font-medium">
                                        {isWaitingForCapacity
                                            ? m[
                                                  'passport.buildMyLearnCard.loader.waitingForCapacity'
                                              ]()
                                            : m[
                                                  'passport.buildMyLearnCard.managers.resume.processingBg'
                                              ]()}
                                    </p>
                                    {isWaitingForCapacity && (
                                        <button
                                            type="button"
                                            onClick={cancelCapacityWait}
                                            className="ml-auto text-xs text-grayscale-700 hover:text-grayscale-900"
                                        >
                                            {m['common.cancel']()}
                                        </button>
                                    )}
                                </div>
                            )}

                            <input
                                type="file"
                                accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp"
                                onChange={async e => {
                                    setUploadOutcome(null);
                                    setLoaderDismissed(false);
                                    await getFile(e, UploadTypesEnum.Resume);
                                }}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {isLoading && <CheckListItemSkeleton />}

                        {resume && !isLoading && (
                            <UploadedOriginalDocument
                                fileName={resume.fileName}
                                fileType={resume.fileType}
                                fileSize={resume.fileSize}
                                data={resume.data}
                                unavailable={resume.unavailable}
                                addedCredentialCount={
                                    fileUploadOutcomes.find(
                                        item =>
                                            item.artifact.id === resume.artifactId &&
                                            item.status === 'stored'
                                    )?.storedCount
                                }
                                onDelete={confirmDelete}
                                disabled={isParsing || isSaving || isSavingSelected}
                            />
                        )}
                        <button
                            type="button"
                            disabled={
                                isUploading ||
                                isLoading ||
                                isSaving ||
                                isSavingSelected ||
                                isParsing
                            }
                            onClick={triggerFileInput}
                            className={`${resume ? 'mt-6' : 'mt-0'} w-full flex min-h-[48px] rounded-[20px] items-center justify-center py-3 px-4 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                resume
                                    ? 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                    : 'bg-grayscale-900 text-white hover:opacity-90'
                            }`}
                        >
                            {buttonIcon}
                            {buttonText}
                        </button>
                    </div>
                    <CheckListManagerFooter
                        // handleSave={handleSaveResume}
                        loading={isSaving || isParsing}
                    />
                </>
            )}
        </>
    );
};

export default CheckListUploadResume;
