import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

import TrashBin from '../../../svgs/TrashBin';
import DocIcon from 'learn-card-base/svgs/DocIcon';
import ChecklistLoader from '../loader/ChecklistLoader';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import CheckListItemSkeleton from './CheckListItemSkeleton';
import CheckListManagerFooter from '../CheckListManager/CheckListManagerFooter';

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

    const { getFiles, isUploading, isSaving, parseFiles, base64Datas, rawArtifactCredentials } =
        useUploadFile(UploadTypesEnum.Transcript);
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const [transcripts, setTranscripts] = useState<TranscriptType[]>([]);

    useEffect(() => {
        handleSetTranscripts();
    }, []);

    useEffect(() => {
        if (base64Datas?.length > 0 && rawArtifactCredentials?.length > 0) {
            parseFiles(UploadTypesEnum.Transcript);
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

    let buttonText = transcripts?.length > 0 ? 'Add More' : 'Add';
    buttonText = isUploading ? 'Uploading...' : buttonText;
    const buttonIcon = <UploadIcon className="w-[25px] h-[26px] text-white mr-2" />;

    return (
        <>
            {(isSaving || checklistStore.get.isParsing().transcript) && (
                <ChecklistLoader fileType={UploadTypesEnum.Transcript} />
            )}
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-button-bottom px-6 pt-2 pb-4 mt-4 rounded-[15px]">
                <div className="flex flex-col items-start justify-center py-2 w-full">
                    <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                        Transcripts
                    </h4>
                    <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                        Upload academic transcripts or joint service transcripts.
                    </p>

                    <input
                        multiple
                        type="file"
                        accept=".pdf,.txt,.docx"
                        onChange={async e => {
                            const transcriptCredential = await getFiles(
                                e,
                                UploadTypesEnum.Transcript
                            );
                            if (transcriptCredential?.fileInfos) {
                                setTranscripts(prev => [
                                    ...prev,
                                    ...transcriptCredential.fileInfos?.map((fileInfo: any) => ({
                                        id: uuid(),
                                        fileName: fileInfo.name,
                                        fileSize: fileInfo.size,
                                        fileType: fileInfo.type,
                                        type: UploadTypesEnum.Transcript,
                                    })),
                                ]);
                            }
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
                                        <p className="text-grayscale-800 text-sm font-semibold text-left line-clamp-2">
                                            {transcript?.fileName}
                                        </p>
                                        <p className="w-full text-xs text-grayscale-600">
                                            {transcript?.fileType} • {transcript?.fileSize}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => confirmDelete(transcript?.id)}
                                    className="bg-white overflow-hidden rounded-full shadow-bottom p-2 min-h-[35px] min-w-[35px]"
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
    );
};

export default CheckListTranscripts;
