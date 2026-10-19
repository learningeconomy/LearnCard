import React, { useEffect, useRef, useState } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('check-list-certs');

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
import { RawArtifactCredentialValidator } from 'learn-card-base/types/file-extraction';
import type { UnsignedVC } from '@learncard/types';
import { FileUploadPersistenceError } from '../../../../hooks/uploadFile.types';

export type CertType = {
    id: string;
    uri: string;
    artifactId: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    type: string;
    data: string;
};

export const CheckListCerts: React.FC = () => {
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
    } = useUploadFile(UploadTypesEnum.Certificate);
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [certs, setCert] = useState<CertType[]>([]);
    const [showReview, setShowReview] = useState(false);
    const [isSavingSelected, setIsSavingSelected] = useState(false);
    const busy = isSaving || isParsing || isSavingSelected;

    const [reviewError, setReviewError] = useState<string | null>(null);
    const processFiles = async () => {
        const vcs = await fetchParsedCredentialsFromFiles(UploadTypesEnum.Certificate);
        if (vcs.length) {
            const [first, ...rest] = rawArtifactCredentials;
            checklistStore.set.setPendingReview('certificate', {
                credentials: vcs,
                rawArtifact: first,
                additionalRawArtifacts: rest,
            });
            setShowReview(true);
        } else {
            await handleSetCert();
        }
    };
    const pendingReview = checklistStore.useTracked.pendingReview().certificate;
    useEffect(() => {
        if (pendingReview?.credentials.length) {
            setParsedCredentials(pendingReview.credentials);
            setShowReview(true);
        }
    }, [pendingReview]);
    useEffect(() => {
        void handleSetCert();
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
    const handleReviewConfirm = async (selectedVcs: UnsignedVC[]) => {
        setIsSavingSelected(true);
        setReviewError(null);
        const pending = checklistStore.get.pendingReview().certificate;
        const first = pending?.rawArtifact ?? rawArtifactCredentials[0];
        const rest = pending?.additionalRawArtifacts ?? rawArtifactCredentials.slice(1);
        try {
            if (!first) throw new Error('Document unavailable');
            await storeSelectedCredentials(selectedVcs, first, UploadTypesEnum.Certificate, rest);
            checklistStore.set.setPendingReview('certificate', null);
            setShowReview(false);
            await handleSetCert();
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
            const pending = checklistStore.get.pendingReview().certificate;
            if (pending)
                checklistStore.set.setPendingReview('certificate', {
                    ...pending,
                    credentials: updated,
                });
            return updated;
        });
    };

    const handleSetCert = async () => {
        try {
            setIsLoading(true);
            const wallet = await initWallet();

            const records = await wallet.index.LearnCloud.get({
                category: UploadTypesEnum.Certificate,
            });

            const recordUris =
                records?.map(({ uri, id }: { uri: string; id: string }) => ({ uri, id })) ?? [];

            if (recordUris?.length === 0) {
                setCert([]);
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
                        type: UploadTypesEnum.Certificate,
                    };
                })
            );
            setCert(documents);
            setIsLoading(false);
        } catch {
            setIsLoading(false);
            log.error('file.list.failed');
        }
    };

    const handleDeleteCert = (id: string) => {
        const deleted = certs.find(cert => cert?.id === id);
        if (!deleted) return;

        // Optimistic synchronous UI update
        setCert(prev => prev.filter(cert => cert?.id !== id));
        const restoreOutcome = clearFileUploadOutcome(deleted.artifactId);

        // Fire-and-forget background work
        void (async () => {
            try {
                const wallet = await initWallet();
                const record = await wallet.index.LearnCloud.get({ id });
                const targetRecord = record?.[0] as unknown as LCR | undefined;

                if (!targetRecord) return;

                await deleteCredentialRecord(targetRecord);
                refetchCheckListStatus();
            } catch (error) {
                log.error('Failed to delete certificate', error);
                // Re-insert only the failed item so concurrent deletions aren't clobbered
                setCert(prev => (prev.some(c => c?.id === id) ? prev : [...prev, deleted]));
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
                text: m['passport.buildMyLearnCard.managers.confirmRemove.certificate'](),
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            })
        ) {
            handleDeleteCert(id);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    let buttonText =
        certs?.length > 0
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
                        fileType={UploadTypesEnum.Certificate}
                        onConfirm={handleReviewConfirm}
                        onBack={() => setShowReview(false)}
                        isLoading={isSavingSelected}
                        onEditCredential={handleEditCredential}
                    />
                </>
            ) : (
                <>
                    {isParsing && !isSaving && (
                        <ChecklistLoader fileType={UploadTypesEnum.Certificate} />
                    )}
                    <div className="w-full rounded-[20px] bg-white p-6 mt-4 font-poppins shadow-button-bottom">
                        <div className="flex flex-col items-start justify-center py-2 w-full">
                            <h4 className="text-xl font-semibold text-grayscale-900 text-left mb-2">
                                {m['passport.buildMyLearnCard.managers.certs.title']()}
                            </h4>
                            <p className="text-sm text-grayscale-600 text-left mb-4">
                                {m['passport.buildMyLearnCard.managers.certs.description']()}
                            </p>
                            <UploadFileOutcomeList
                                outcomes={fileUploadOutcomes}
                                fileType={UploadTypesEnum.Certificate}
                                retryExtraction={retryFileExtraction}
                                retrySave={retryFileSave}
                                onExtracted={credentials => {
                                    setParsedCredentials(credentials);
                                    setShowReview(true);
                                }}
                                onSettled={() => void handleSetCert()}
                                disabled={busy}
                            />

                            <input
                                multiple
                                type="file"
                                accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={async e => {
                                    await getFiles(e, UploadTypesEnum.Certificate);
                                }}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {isLoading && <CheckListItemSkeleton />}

                        {!isLoading && certs.length > 0 && (
                            <div className="w-full space-y-3">
                                {certs.map(cert => (
                                    <UploadedOriginalDocument
                                        key={cert.id}
                                        fileName={cert.fileName}
                                        fileType={cert.fileType}
                                        fileSize={cert.fileSize}
                                        data={cert.data}
                                        addedCredentialCount={
                                            fileUploadOutcomes.find(
                                                item =>
                                                    item.artifact.id === cert.artifactId &&
                                                    item.status === 'stored'
                                            )?.storedCount
                                        }
                                        onDelete={() => confirmDelete(cert.id)}
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
                                certs.length
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

export default CheckListCerts;
