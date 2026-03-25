import React, { useEffect, useRef, useState } from 'react';

import TrashBin from '../../../svgs/TrashBin';
import DocIcon from 'learn-card-base/svgs/DocIcon';
import ChecklistLoader from '../loader/ChecklistLoader';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import CheckListItemSkeleton from './CheckListItemSkeleton';
import CheckListManagerFooter from '../CheckListManager/CheckListManagerFooter';
import CheckListCredentialReviewStep from './CheckListCredentialReviewStep';
import { getWalletCategory } from './AchievementTypeSelectorModal';

import { useUploadFile } from '../../../../hooks/useUploadFile';
import {
    useWallet,
    useConfirmation,
    checklistStore,
    useGetCheckListStatus,
    UploadTypesEnum,
} from 'learn-card-base';

import { useTheme } from '../../../../theme/hooks/useTheme';

export type TranscriptType = {
    id: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    type: string;
};

export const CheckListTranscripts: React.FC = () => {
    const { initWallet } = useWallet();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { getFiles, isUploading, isSaving, fetchParsedCredentialsFromFiles, storeSelectedCredentials, parsedCredentials, setParsedCredentials, base64Datas, rawArtifactCredentials } =
        useUploadFile(UploadTypesEnum.Transcript);
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [showReview, setShowReview] = useState<boolean>(false);
    const [isSavingSelected, setIsSavingSelected] = useState<boolean>(false);
    const [savedCredentialCount, setSavedCredentialCount] = useState<number>(0);
    const [loaderDismissed, setLoaderDismissed] = useState<boolean>(false);

    const [transcripts, setTranscripts] = useState<TranscriptType[]>([]);

    // Restore pending review from store on mount
    useEffect(() => {
        const pending = checklistStore.get.pendingReview().transcript;
        if (pending && pending.credentials.length > 0) {
            setParsedCredentials(pending.credentials);
            setShowReview(true);
        }
        handleSetTranscripts();
    }, []);

    useEffect(() => {
        if (base64Datas?.length > 0 && rawArtifactCredentials?.length > 0) {
            fetchParsedCredentialsFromFiles(UploadTypesEnum.Transcript).then(vcs => {
                if (vcs.length > 0) {
                    const [first, ...rest] = rawArtifactCredentials;
                    checklistStore.set.setPendingReview('transcript', {
                        credentials: vcs,
                        rawArtifact: first,
                        additionalRawArtifacts: rest.length > 0 ? rest : undefined,
                    });
                    setShowReview(true);
                } else {
                    const [first, ...rest] = rawArtifactCredentials;
                    storeSelectedCredentials([], first, UploadTypesEnum.Transcript, rest).finally(
                        () => handleSetTranscripts()
                    );
                }
            });
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

            const transcriptsCredentials = await Promise.all(
                recordUris.map(async ({ uri, id }: { uri: string; id: string }) => {
                    return {
                        ...(await wallet.read.get(uri)),
                        recordId: id,
                    };
                })
            );

            const _transcripts = transcriptsCredentials.map(({ recordId, rawArtifact }: any) => ({
                id: recordId,
                fileName: rawArtifact?.fileName,
                fileSize: rawArtifact?.fileSize,
                fileType: rawArtifact?.fileType,
                type: UploadTypesEnum.Transcript,
            }));

            setTranscripts(_transcripts);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.error('handleSetTranscripts::error', error);
        }
    };

    const handleDeleteTranscript = async (id: string) => {
        try {
            setIsDeleting(true);
            const wallet = await initWallet();

            await wallet.index.LearnCloud.remove(id);
            await refetchCheckListStatus();
            setTranscripts(prevTranscripts =>
                prevTranscripts.filter(transcript => transcript?.id !== id)
            );
            setIsDeleting(false);
        } catch (error) {
            setIsDeleting(false);
            console.error('handleDeleteTranscript::error', error);
        }
    };

    const confirmDelete = async (id: string) => {
        if (
            await confirm({
                text: `Are you sure you want remove your uploaded transcript?`,
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            })
        ) {
            await handleDeleteTranscript(id);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const handleReviewConfirm = async (selectedVcs: any[]) => {
        setIsSavingSelected(true);
        const pending = checklistStore.get.pendingReview().transcript;
        const first = rawArtifactCredentials?.[0] || pending?.rawArtifact;
        const rest = rawArtifactCredentials?.length > 1
            ? rawArtifactCredentials.slice(1)
            : pending?.additionalRawArtifacts || [];
        await storeSelectedCredentials(selectedVcs, first, UploadTypesEnum.Transcript, rest);
        checklistStore.set.setPendingReview('transcript', null);
        setSavedCredentialCount(selectedVcs.length);
        setShowReview(false);
        await handleSetTranscripts();
        setIsSavingSelected(false);
    };

    const handleReviewBack = () => {
        // Keep pending review in store so user can return to it via the checklist
        setShowReview(false);
    };

    const handleEditCredential = (index: number, editedVc: any) => {
        setParsedCredentials(prev => {
            const updated = prev.map((cred, i) => {
                if (i !== index) return cred;
                const achievementType = editedVc?.credentialSubject?.achievement?.achievementType;
                const type = Array.isArray(achievementType) ? achievementType[0] : achievementType;
                const category = type ? getWalletCategory(type) || undefined : undefined;
                return {
                    ...cred,
                    vc: editedVc,
                    metadata: {
                        ...cred.metadata,
                        name: editedVc?.credentialSubject?.achievement?.name || cred.metadata?.name,
                        ...(category ? { category } : {}),
                    },
                };
            });
            const pending = checklistStore.get.pendingReview().transcript;
            if (pending) {
                checklistStore.set.setPendingReview('transcript', { ...pending, credentials: updated });
            }
            return updated;
        });
    };

    let buttonText = transcripts?.length > 0 ? 'Add More' : 'Add';
    buttonText = isUploading ? 'Uploading...' : buttonText;
    const buttonIcon = <UploadIcon className="w-[25px] h-[26px] text-white mr-2" />;

    return (
        <>
            {showReview ? (
                <CheckListCredentialReviewStep
                    credentials={parsedCredentials}
                    fileType={UploadTypesEnum.Transcript}
                    onConfirm={handleReviewConfirm}
                    onBack={handleReviewBack}
                    isLoading={isSavingSelected}
                    onEditCredential={handleEditCredential}
                />
            ) : (
                <>
                    {(isSaving || checklistStore.get.isParsing().transcript) && !loaderDismissed && (
                        <ChecklistLoader
                            fileType={UploadTypesEnum.Transcript}
                            onDismiss={() => setLoaderDismissed(true)}
                        />
                    )}
                    <div className="w-full bg-white items-center justify-center flex flex-col shadow-button-bottom px-6 pt-2 pb-4 mt-4 rounded-[15px]">
                        <div className="flex flex-col items-start justify-center py-2 w-full">
                            <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                                Transcripts
                            </h4>
                            <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                                Upload academic transcripts or joint service transcripts.
                            </p>

                            {savedCredentialCount > 0 && (
                                <div className="w-full flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 mb-4">
                                    <svg
                                        className="w-4 h-4 text-emerald-600 shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <p className="text-xs text-emerald-700 font-medium">
                                        {savedCredentialCount} credential{savedCredentialCount !== 1 ? 's' : ''} saved to your wallet.
                                    </p>
                                </div>
                            )}

                            {loaderDismissed && checklistStore.get.isParsing().transcript && (
                                <div className="w-full flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 mb-4">
                                    <svg
                                        className="w-4 h-4 text-indigo-500 shrink-0 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <p className="text-xs text-indigo-700 font-medium">
                                        Processing your transcripts in the background...
                                    </p>
                                </div>
                            )}

                            <input
                                multiple
                                type="file"
                                accept=".pdf,.txt,.docx"
                                onChange={async e => {
                                    setLoaderDismissed(false);
                                    await getFiles(e, UploadTypesEnum.Transcript);
                                }}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />

                            <button
                                disabled={isUploading || isLoading}
                                onClick={triggerFileInput}
                                className={`w-full flex rounded-[30px] items-center justify-center  py-2 font-semibold text-[17px] bg-${primaryColor} text-white`}
                            >
                                {buttonIcon}
                                {buttonText}
                            </button>
                        </div>

                        {(isLoading || isDeleting) && <CheckListItemSkeleton />}

                        {!isLoading &&
                            !isDeleting &&
                            transcripts?.length > 0 &&
                            transcripts?.map?.((transcript: TranscriptType) => {
                                return (
                                    <div
                                        key={transcript?.id}
                                        className="flex items-center justify-between w-full mt-4 relative pb-4"
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

                                        <button
                                            onClick={() => confirmDelete(transcript?.id)}
                                            className="bg-white overflow-hidden rounded-full flex items-center justify-center shadow-bottom p-2 min-h-[35px] min-w-[35px] w-[35px] h-[35px]"
                                        >
                                            <TrashBin className="text-blue-950 h-[25px] w-[25px]" />
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                    <CheckListManagerFooter
                        loading={isSaving || checklistStore.get.isParsing().transcript}
                    />
                </>
            )}
        </>
    );
};

export default CheckListTranscripts;
