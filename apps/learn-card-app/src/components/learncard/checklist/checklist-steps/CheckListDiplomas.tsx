import React, { useEffect, useRef, useState } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('check-list-diplomas');

import ChecklistLoader from '../loader/ChecklistLoader';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import CheckListItemSkeleton from './CheckListItemSkeleton';
import CheckListManagerFooter from '../CheckListManager/CheckListManagerFooter';
import CheckListCredentialReviewStep from './CheckListCredentialReviewStep';
import { getWalletCategory } from './AchievementTypeSelectorModal';
import { getField } from './credentialEditFields';
import { UploadFileOutcomePanel } from './UploadFileOutcomePanel';
import { UploadFileOutcomeList } from './UploadFileOutcomeList';
import { UploadedOriginalDocument } from './UploadedOriginalDocument';

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

import * as m from '../../../../paraglide/messages.js';
import type { LCR } from 'learn-card-base/types/credential-records';
import { readUploadedDocument } from './uploadedDocument.helpers';
import { FileUploadPersistenceError } from '../../../../hooks/uploadFile.types';
import type { UnsignedVC } from '@learncard/types';

export type DiplomaType = {
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

export const CheckListDiplomas: React.FC = () => {
    const { initWallet } = useWallet();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        getFiles,
        isUploading,
        isSaving,
        isParsing,
        isWaitingForCapacity,
        cancelCapacityWait,
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
    } = useUploadFile(UploadTypesEnum.Diploma);
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [diplomas, setDiplomas] = useState<DiplomaType[]>([]);

    const [showReview, setShowReview] = useState(false);
    const [isSavingSelected, setIsSavingSelected] = useState(false);
    const busy = isSaving || isParsing || isSavingSelected;
    const [reviewError, setReviewError] = useState<string | null>(null);
    const processFiles = async () => {
        const vcs = await fetchParsedCredentialsFromFiles(UploadTypesEnum.Diploma);
        const needed = new Set(vcs.map(entry => entry.artifactId).filter(Boolean));
        const sources = rawArtifactCredentials.filter(source => needed.has(source.id));
        if (vcs.length) {
            const [first, ...rest] = sources;
            if (!first) {
                await handleSetDiploma();
                return;
            }
            checklistStore.set.setPendingReview('diploma', {
                credentials: vcs,
                rawArtifact: first,
                additionalRawArtifacts: rest,
            });
            setShowReview(true);
        } else {
            await handleSetDiploma();
        }
    };
    const handleReviewConfirm = async (selectedVcs: UnsignedVC[]) => {
        setIsSavingSelected(true);
        setReviewError(null);
        const pending = checklistStore.get.pendingReview().diploma;
        const first = pending?.rawArtifact ?? rawArtifactCredentials[0];
        const rest = pending?.additionalRawArtifacts ?? rawArtifactCredentials.slice(1);
        try {
            if (!first) throw new Error('Document unavailable');
            await storeSelectedCredentials(selectedVcs, first, UploadTypesEnum.Diploma, rest);
            checklistStore.set.setPendingReview('diploma', null);
            setShowReview(false);
            await handleSetDiploma();
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
    const handleEditCredential = (index: number, editedVc: UnsignedVC) => {
        setParsedCredentials(previous => {
            const type = getField(editedVc, 'credentialSubject.achievement.achievementType');
            const category = getWalletCategory(type);
            const updated = previous.map((entry, i) =>
                i === index
                    ? {
                          ...entry,
                          vc: editedVc,
                          metadata: {
                              ...entry.metadata,
                              name:
                                  getField(editedVc, 'credentialSubject.achievement.name') ||
                                  entry.metadata?.name,
                              ...(category ? { category } : {}),
                          },
                      }
                    : entry
            );
            const pending = checklistStore.get.pendingReview().diploma;
            if (pending)
                checklistStore.set.setPendingReview('diploma', {
                    ...pending,
                    credentials: updated,
                });
            return updated;
        });
    };

    const pendingReview = checklistStore.useTracked.pendingReview().diploma;
    useEffect(() => {
        if (pendingReview?.credentials.length) {
            setParsedCredentials(pendingReview.credentials);
            setShowReview(true);
        }
    }, [pendingReview]);
    useEffect(() => {
        void handleSetDiploma();
    }, []);

    useEffect(() => {
        if (base64Datas.length && rawArtifactCredentials.length) {
            void processFiles().catch(() =>
                presentToast(m['passport.buildMyLearnCard.managers.toastGenericError'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                })
            );
        }
    }, [base64Datas, rawArtifactCredentials]);

    const handleSetDiploma = async () => {
        try {
            setIsLoading(true);
            const wallet = await initWallet();

            const records = await wallet.index.LearnCloud.get(
                { category: UploadTypesEnum.Diploma },
                { cache: 'skip-cache' }
            );

            const recordUris =
                records?.map(({ uri, id }: { uri: string; id: string }) => ({ uri, id })) ?? [];

            if (recordUris?.length === 0) {
                setDiplomas([]);
                setIsLoading(false);
                return;
            }

            const documents = await Promise.all(
                recordUris.map(record =>
                    readUploadedDocument(
                        record,
                        uri => wallet.read.get(uri),
                        UploadTypesEnum.Diploma
                    )
                )
            );
            setDiplomas(documents);
            setIsLoading(false);
        } catch {
            setIsLoading(false);
            log.error('file.list.failed');
        }
    };

    const handleDeleteDiploma = (id: string) => {
        const deleted = diplomas.find(diploma => diploma?.id === id);
        if (!deleted) return;

        // Optimistic synchronous UI update
        setDiplomas(prev => prev.filter(diploma => diploma?.id !== id));
        const restoreOutcome = clearFileUploadOutcome(deleted.artifactId);

        // Fire-and-forget background work
        void (async () => {
            try {
                const wallet = await initWallet();
                const record = await wallet.index.LearnCloud.get({ id }, { cache: 'skip-cache' });
                const targetRecord = record?.[0] as unknown as LCR | undefined;

                if (!targetRecord) return;

                await deleteCredentialRecord(targetRecord);
                refetchCheckListStatus();
            } catch (error) {
                log.error('handleDeleteDiploma::error', error);
                // Re-insert only the failed item so concurrent deletions aren't clobbered
                setDiplomas(prev => (prev.some(d => d?.id === id) ? prev : [...prev, deleted]));
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

    const confirmDelete = async (id: string) => {
        if (
            await confirm({
                text: m['passport.buildMyLearnCard.managers.confirmRemove.diploma'](),
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            })
        ) {
            handleDeleteDiploma(id);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    let buttonText =
        diplomas?.length > 0
            ? m['passport.buildMyLearnCard.managers.addMore']()
            : m['passport.buildMyLearnCard.managers.addButton']();
    buttonText = isUploading ? m['passport.buildMyLearnCard.managers.uploading']() : buttonText;
    const buttonIcon = <UploadIcon className="w-[25px] h-[26px] mr-2" />;

    return (
        <>
            {showReview ? (
                <>
                    {reviewError && <UploadFileOutcomePanel message={reviewError} />}
                    <CheckListCredentialReviewStep
                        credentials={parsedCredentials}
                        fileType={UploadTypesEnum.Diploma}
                        onConfirm={handleReviewConfirm}
                        onBack={() => setShowReview(false)}
                        isLoading={isSavingSelected}
                        onEditCredential={handleEditCredential}
                    />
                </>
            ) : (
                <>
                    {isParsing && !isSaving && (
                        <ChecklistLoader
                            waitingForCapacity={isWaitingForCapacity}
                            onCancelWait={cancelCapacityWait}
                            fileType={UploadTypesEnum.Diploma}
                        />
                    )}
                    <div className="w-full rounded-[20px] bg-white p-6 mt-4 font-poppins shadow-button-bottom">
                        <div className="flex flex-col items-start justify-center py-2 w-full">
                            <h4 className="text-xl font-semibold text-grayscale-900 text-left mb-2">
                                {m['passport.buildMyLearnCard.managers.diplomas.title']()}
                            </h4>
                            <p className="text-sm text-grayscale-600 text-left mb-4">
                                {m['passport.buildMyLearnCard.managers.diplomas.description']()}
                            </p>
                            <UploadFileOutcomeList
                                outcomes={fileUploadOutcomes}
                                fileType={UploadTypesEnum.Diploma}
                                retryExtraction={retryFileExtraction}
                                retrySave={retryFileSave}
                                onExtracted={credentials => {
                                    setParsedCredentials(credentials);
                                    setShowReview(true);
                                }}
                                onSettled={() => void handleSetDiploma()}
                                disabled={busy}
                            />

                            <input
                                multiple
                                type="file"
                                accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.webp"
                                onChange={async e => {
                                    await getFiles(e, UploadTypesEnum.Diploma);
                                }}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {isLoading && <CheckListItemSkeleton />}

                        {!isLoading && diplomas.length > 0 && (
                            <div className="w-full space-y-3">
                                {diplomas.map(diploma => (
                                    <UploadedOriginalDocument
                                        key={diploma.id}
                                        fileName={diploma.fileName}
                                        fileType={diploma.fileType}
                                        fileSize={diploma.fileSize}
                                        data={diploma.data}
                                        unavailable={diploma.unavailable}
                                        addedCredentialCount={
                                            fileUploadOutcomes.find(
                                                item =>
                                                    item.artifact.id === diploma.artifactId &&
                                                    item.status === 'stored'
                                            )?.storedCount
                                        }
                                        onDelete={() => confirmDelete(diploma.id)}
                                        disabled={busy}
                                    />
                                ))}
                            </div>
                        )}
                        <button
                            type="button"
                            disabled={isUploading || isLoading || busy}
                            onClick={triggerFileInput}
                            className={`mt-6 w-full flex min-h-[48px] rounded-[20px] items-center justify-center py-3 px-4 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                diplomas.length
                                    ? 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                    : 'bg-grayscale-900 text-white hover:opacity-90'
                            }`}
                        >
                            {buttonIcon}
                            {buttonText}
                        </button>
                    </div>
                    <CheckListManagerFooter loading={isSaving || isParsing} />
                </>
            )}
        </>
    );
};

export default CheckListDiplomas;
