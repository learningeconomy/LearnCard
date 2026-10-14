import React, { useEffect, useRef, useState } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('check-list-certs');

import TrashBin from '../../../svgs/TrashBin';
import DocIcon from 'learn-card-base/svgs/DocIcon';
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

import { useTheme } from '../../../../theme/hooks/useTheme';
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
        retryFileExtraction,
        retryFileSave,
    } = useUploadFile(UploadTypesEnum.Certificate);
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

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
    const buttonIcon = <UploadIcon className="w-[25px] h-[26px] text-white mr-2" />;

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
                    {(isSaving || isParsing) && (
                        <ChecklistLoader fileType={UploadTypesEnum.Certificate} />
                    )}
                    <div className="w-full bg-white items-center justify-center flex flex-col shadow-button-bottom px-6 pt-2 pb-4 mt-4 rounded-[15px]">
                        <div className="flex flex-col items-start justify-center py-2 w-full">
                            <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                                {m['passport.buildMyLearnCard.managers.certs.title']()}
                            </h4>
                            <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
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
                            certs?.length > 0 &&
                            certs?.map?.((cert: CertType) => {
                                return (
                                    <div
                                        key={cert?.id}
                                        className="flex flex-col w-full mt-4 relative pb-4"
                                    >
                                        <div className="flex items-center justify-start">
                                            <DocIcon className="text-[#FF3636] h-[55px] min-h-[55px] min-w-[55px] w-[55px] mr-2" />
                                            <div className="flex items-start justify-center text-left flex-col pr-4">
                                                <p className="text-grayscale-800 text-sm font-semibold text-left line-clamp-2">
                                                    {cert?.fileName}
                                                </p>
                                                <p className="w-full text-xs text-grayscale-600">
                                                    {cert?.fileType} • {cert?.fileSize}
                                                </p>
                                            </div>
                                        </div>
                                        <UploadedOriginalDocument
                                            fileName={cert.fileName}
                                            data={cert.data}
                                            disabled={busy}
                                            onRetry={
                                                fileUploadOutcomes.some(
                                                    item =>
                                                        item.artifact.id === cert.artifactId &&
                                                        item.status !== 'review' &&
                                                        item.status !== 'stored'
                                                )
                                                    ? undefined
                                                    : async () => {
                                                          const wallet = await initWallet();
                                                          const artifact =
                                                              RawArtifactCredentialValidator.parse(
                                                                  await wallet.read.get(cert.uri)
                                                              );
                                                          const result = await retryFileExtraction(
                                                              artifact,
                                                              UploadTypesEnum.Certificate,
                                                              cert.uri
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
                                            onClick={() => confirmDelete(cert?.id)}
                                            disabled={busy}
                                            className="bg-white overflow-hidden rounded-full shadow-bottom p-2 min-h-[35px] min-w-[35px]"
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

export default CheckListCerts;
