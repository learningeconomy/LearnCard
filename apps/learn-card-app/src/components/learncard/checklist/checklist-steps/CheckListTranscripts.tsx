import React, { useEffect, useRef, useState } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('check-list-transcripts');

import TrashBin from '../../../svgs/TrashBin';
import DocIcon from 'learn-card-base/svgs/DocIcon';
import ChecklistLoader from '../loader/ChecklistLoader';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import CheckListItemSkeleton from './CheckListItemSkeleton';
import CheckListManagerFooter from '../CheckListManager/CheckListManagerFooter';
import CheckListCredentialReviewStep from './CheckListCredentialReviewStep';
import { getWalletCategory } from './AchievementTypeSelectorModal';
import { getField } from './credentialEditFields';

import { useUploadFile } from '../../../../hooks/useUploadFile';
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

import { useTheme } from '../../../../theme/hooks/useTheme';
import * as m from '../../../../paraglide/messages.js';
import type { LCR } from 'learn-card-base/types/credential-records';
import { RawArtifactCredentialValidator } from 'learn-card-base/types/file-extraction';
import type { UnsignedVC } from '@learncard/types';
import { UploadedOriginalDocument } from './UploadedOriginalDocument';
import { UploadFileOutcomeList } from './UploadFileOutcomeList';
import { FileUploadPersistenceError } from '../../../../hooks/uploadFile.types';
import { UploadFileOutcomePanel } from './UploadFileOutcomePanel';

export type TranscriptType = {
    id: string;
    uri: string;
    artifactId: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    type: string;
    data: string;
};

export const CheckListTranscripts: React.FC = () => {
    const { initWallet } = useWallet();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        getFiles,
        isUploading,
        isSaving,
        isParsing,
        fetchParsedCredentialsFromFiles,
        storeSelectedCredentials,
        parsedCredentials,
        setParsedCredentials,
        base64Datas,
        rawArtifactCredentials,
        fileUploadOutcomes,
        clearFileUploadOutcome,
        retryFileExtraction,
        retryFileSave,
    } = useUploadFile(UploadTypesEnum.Transcript);
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showReview, setShowReview] = useState<boolean>(false);
    const [isSavingSelected, setIsSavingSelected] = useState<boolean>(false);
    const [transcripts, setTranscripts] = useState<TranscriptType[]>([]);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [loaderDismissed, setLoaderDismissed] = useState<boolean>(false);

    const busy = isSaving || isParsing || isSavingSelected;

    const pendingReview = checklistStore.useTracked.pendingReview().transcript;
    useEffect(() => {
        if (pendingReview?.credentials.length) {
            setParsedCredentials(pendingReview.credentials);
            setShowReview(true);
        }
    }, [pendingReview]);
    useEffect(() => {
        void handleSetTranscripts();
    }, []);

    const processFiles = async () => {
        const vcs = await fetchParsedCredentialsFromFiles(UploadTypesEnum.Transcript);
        if (vcs.length > 0) {
            const [first, ...rest] = rawArtifactCredentials;
            checklistStore.set.setPendingReview('transcript', {
                credentials: vcs,
                rawArtifact: first,
                additionalRawArtifacts: rest.length > 0 ? rest : undefined,
            });
            setParsedCredentials(vcs);
            setShowReview(true);
        } else {
            await handleSetTranscripts();
        }
    };

    useEffect(() => {
        if (base64Datas?.length > 0 && rawArtifactCredentials?.length > 0) {
            void processFiles().catch(() =>
                presentToast(m['passport.buildMyLearnCard.managers.toastGenericError'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                })
            );
        }
    }, [base64Datas, rawArtifactCredentials]);

    const handleSetTranscripts = async () => {
        try {
            setIsLoading(true);
            const wallet = await initWallet();

            const records = await wallet.index.LearnCloud.get({
                category: UploadTypesEnum.Transcript,
            });

            const recordUris =
                records?.map(({ uri, id }: { uri: string; id: string }) => ({ uri, id })) ?? [];

            if (recordUris?.length === 0) {
                setTranscripts([]);
                setIsLoading(false);
                return;
            }

            const documents = await Promise.all(
                recordUris.map(async ({ uri, id }) => {
                    const credential = RawArtifactCredentialValidator.parse(
                        await wallet.read.get(uri)
                    );
                    return {
                        ...credential.rawArtifact,
                        id,
                        uri,
                        artifactId: credential.id,
                        type: UploadTypesEnum.Transcript,
                    };
                })
            );
            setTranscripts(documents);
            setIsLoading(false);
        } catch {
            setIsLoading(false);
            log.error('file.list.failed');
        }
    };

    const handleDeleteTranscript = (id: string) => {
        const deleted = transcripts.find(transcript => transcript?.id === id);
        if (!deleted) return;

        // Optimistic synchronous UI update
        setTranscripts(prev => prev.filter(transcript => transcript?.id !== id));

        // Fire-and-forget background work
        void (async () => {
            try {
                const wallet = await initWallet();
                const record = await wallet.index.LearnCloud.get({ id });
                const targetRecord = record?.[0] as unknown as LCR | undefined;

                if (!targetRecord) return;

                await deleteCredentialRecord(targetRecord);
                clearFileUploadOutcome(deleted.artifactId);
                refetchCheckListStatus();
            } catch (error) {
                log.error('handleDeleteTranscript::error', error);
                // Re-insert only the failed item so concurrent deletions aren't clobbered
                setTranscripts(prev => (prev.some(t => t?.id === id) ? prev : [...prev, deleted]));
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

    const confirmDelete = async (id: string) => {
        if (
            await confirm({
                text: m['passport.buildMyLearnCard.managers.confirmRemove.transcript'](),
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            })
        ) {
            handleDeleteTranscript(id);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const handleReviewConfirm = async (selectedVcs: UnsignedVC[]) => {
        setIsSavingSelected(true);
        setReviewError(null);
        const pending = checklistStore.get.pendingReview().transcript;
        const first = pending?.rawArtifact ?? rawArtifactCredentials[0];
        const rest = pending?.additionalRawArtifacts ?? rawArtifactCredentials.slice(1);
        try {
            if (!first) throw new Error('Document unavailable');
            await storeSelectedCredentials(selectedVcs, first, UploadTypesEnum.Transcript, rest);
            checklistStore.set.setPendingReview('transcript', null);
            setShowReview(false);
            await handleSetTranscripts();
        } catch (error) {
            setReviewError(
                error instanceof FileUploadPersistenceError
                    ? error.message
                    : m['passport.buildMyLearnCard.managers.saveOutcomeError']()
            );
        } finally {
            setIsSavingSelected(false);
        }
    };

    const handleReviewBack = () => setShowReview(false);

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
            const pending = checklistStore.get.pendingReview().transcript;
            if (pending)
                checklistStore.set.setPendingReview('transcript', {
                    ...pending,
                    credentials: updated,
                });
            return updated;
        });
    };

    let buttonText =
        transcripts?.length > 0
            ? m['passport.buildMyLearnCard.managers.addMore']()
            : m['passport.buildMyLearnCard.managers.addButton']();
    buttonText = isUploading ? m['passport.buildMyLearnCard.managers.uploading']() : buttonText;
    const buttonIcon = <UploadIcon className="w-[25px] h-[26px] text-white mr-2" />;

    return (
        <>
            {showReview ? (
                <>
                    {reviewError && <UploadFileOutcomePanel message={reviewError} />}
                    <CheckListCredentialReviewStep
                        credentials={parsedCredentials}
                        fileType={UploadTypesEnum.Transcript}
                        onConfirm={handleReviewConfirm}
                        onBack={handleReviewBack}
                        isLoading={isSavingSelected}
                        onEditCredential={handleEditCredential}
                    />
                </>
            ) : (
                <>
                    {(isSaving || isParsing) && !loaderDismissed && (
                        <ChecklistLoader
                            fileType={UploadTypesEnum.Transcript}
                            onDismiss={() => setLoaderDismissed(true)}
                        />
                    )}
                    <div className="w-full bg-white items-center justify-center flex flex-col shadow-button-bottom px-6 pt-2 pb-4 mt-4 rounded-[15px]">
                        <div className="flex flex-col items-start justify-center py-2 w-full">
                            <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                                {m['passport.buildMyLearnCard.managers.transcripts.title']()}
                            </h4>
                            <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                                {m['passport.buildMyLearnCard.managers.transcripts.description']()}
                            </p>

                            <UploadFileOutcomeList
                                outcomes={fileUploadOutcomes}
                                fileType={UploadTypesEnum.Transcript}
                                retryExtraction={retryFileExtraction}
                                retrySave={retryFileSave}
                                onSettled={() => void handleSetTranscripts()}
                                disabled={busy}
                                onExtracted={credentials => {
                                    setParsedCredentials(credentials);
                                    setShowReview(true);
                                }}
                            />

                            {loaderDismissed && isParsing && (
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
                                        {m[
                                            'passport.buildMyLearnCard.managers.transcripts.processingBg'
                                        ]()}
                                    </p>
                                </div>
                            )}

                            <input
                                multiple
                                type="file"
                                accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.webp"
                                onChange={async e => {
                                    setLoaderDismissed(false);
                                    await getFiles(e, UploadTypesEnum.Transcript);
                                }}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />

                            <button
                                disabled={isUploading || isLoading || busy}
                                onClick={triggerFileInput}
                                className={`w-full flex rounded-[30px] items-center justify-center  py-2 font-semibold text-[17px] bg-${primaryColor} text-white`}
                            >
                                {buttonIcon}
                                {buttonText}
                            </button>
                        </div>

                        {isLoading && <CheckListItemSkeleton />}

                        {!isLoading &&
                            transcripts?.length > 0 &&
                            transcripts?.map?.((transcript: TranscriptType) => {
                                return (
                                    <div
                                        key={transcript?.id}
                                        className="flex flex-col w-full mt-4 relative pb-4"
                                    >
                                        <div className="flex items-center justify-start">
                                            <DocIcon className="text-[#FF3636] h-[55px] min-h-[55px] min-w-[55px] w-[55px] mr-2" />
                                            <div className="flex items-start justify-center text-left flex-col pr-4">
                                                <p className="text-grayscale-800 text-sm font-semibold text-left line-clamp-2 break-all">
                                                    {transcript?.fileName}
                                                </p>
                                                <p className="w-full text-xs text-grayscale-600">
                                                    {transcript?.fileType} • {transcript?.fileSize}
                                                </p>
                                            </div>
                                        </div>
                                        <UploadedOriginalDocument
                                            fileName={transcript.fileName}
                                            data={transcript.data}
                                            disabled={busy}
                                            onRetry={
                                                fileUploadOutcomes.some(
                                                    item =>
                                                        item.artifact.id ===
                                                            transcript.artifactId &&
                                                        item.status !== 'review' &&
                                                        item.status !== 'stored'
                                                )
                                                    ? undefined
                                                    : async () => {
                                                          const wallet = await initWallet();
                                                          const parsed =
                                                              RawArtifactCredentialValidator.parse(
                                                                  await wallet.read.get(
                                                                      transcript.uri
                                                                  )
                                                              );
                                                          const result = await retryFileExtraction(
                                                              parsed,
                                                              UploadTypesEnum.Transcript,
                                                              transcript.uri
                                                          );
                                                          if (result.outcome.status === 'review') {
                                                              setParsedCredentials(
                                                                  result.credentials
                                                              );
                                                              setShowReview(true);
                                                          }
                                                      }
                                            }
                                        />

                                        <button
                                            disabled={busy}
                                            onClick={() => confirmDelete(transcript?.id)}
                                            className="bg-white overflow-hidden rounded-full flex items-center justify-center shadow-bottom p-2 min-h-[35px] min-w-[35px] w-[35px] h-[35px]"
                                        >
                                            <TrashBin className="text-blue-950 h-[25px] w-[25px]" />
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                    <CheckListManagerFooter loading={isSaving || isParsing} />
                </>
            )}
        </>
    );
};

export default CheckListTranscripts;
