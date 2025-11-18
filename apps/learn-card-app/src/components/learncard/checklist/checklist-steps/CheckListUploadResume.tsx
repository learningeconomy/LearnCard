import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

import TrashBin from '../../../svgs/TrashBin';
import DocIcon from 'learn-card-base/svgs/DocIcon';
import ChecklistLoader from '../loader/ChecklistLoader';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import RefreshIcon from 'learn-card-base/svgs/RefreshIcon';
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

export type ResumeType = {
    id: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    type: string;
};

export const CheckListUploadResume: React.FC = () => {
    const { initWallet } = useWallet();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { getFile, isUploading, isSaving, parseFile, base64Data, rawArtifactCredential } =
        useUploadFile(UploadTypesEnum.Resume);
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const confirm = useConfirmation();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const [resume, setResume] = useState<ResumeType | null>(null);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    useEffect(() => {
        handleSetResume();
    }, []);

    useEffect(() => {
        if (base64Data && rawArtifactCredential) {
            parseFile(UploadTypesEnum.Resume);
        }
    }, [base64Data, rawArtifactCredential]);

    const handleSetResume = async () => {
        try {
            setIsLoading(true);
            const wallet = await initWallet();

            const record = await wallet.index.LearnCloud.get({ category: UploadTypesEnum.Resume });

            const recordUri = record?.[0]?.uri as string;

            if (!recordUri) {
                setResume(null);
                setIsLoading(false);
                return;
            }

            const resumeCredential = await wallet.read.get(recordUri);

            setResume({
                id: record?.[0]?.id as string,
                fileName: resumeCredential?.rawArtifact?.fileName,
                fileSize: resumeCredential?.rawArtifact?.fileSize,
                fileType: resumeCredential?.rawArtifact?.fileType,
                type: UploadTypesEnum.Resume,
            });
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.error('handleSetResume::error', error);
        }
    };

    const handleDeleteResume = async () => {
        try {
            setIsDeleting(true);
            const wallet = await initWallet();
            const record = await wallet.index.LearnCloud.get({ category: UploadTypesEnum.Resume });

            const recordUri = record?.[0]?.uri as string;

            if (!recordUri) {
                setResume(null);
                return;
            }

            await wallet.index.LearnCloud.remove(resume?.id || (record?.[0]?.id as string));
            await refetchCheckListStatus();
            setResume(null);
            setIsDeleting(false);
        } catch (error) {
            setIsDeleting(false);
            console.error('handleDeleteResume::error', error);
        }
    };

    const confirmDelete = async () => {
        if (
            await confirm({
                text: `Are you sure you want remove your uploaded resume?`,
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

    let buttonText = resume ? 'Update' : 'Add';
    buttonText = isUploading ? 'Uploading...' : buttonText;
    const buttonIcon = resume ? (
        <RefreshIcon className={`w-[25px] h-[26px] text-${primaryColor} mr-2`} />
    ) : (
        <UploadIcon className="w-[25px] h-[26px] text-white mr-2" />
    );

    return (
        <>
            {(isSaving || checklistStore.get.isParsing().resume) && (
                <ChecklistLoader fileType={UploadTypesEnum.Resume} />
            )}
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-button-bottom px-6 pt-2 pb-4 mt-4 rounded-[15px]">
                <div className="flex flex-col items-start justify-center py-2 w-full">
                    <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                        Resume
                    </h4>
                    <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                        Upload your most recent resume.
                    </p>

                    <input
                        type="file"
                        accept=".pdf,.txt,.docx"
                        onChange={async e => {
                            const resumeCredential = await getFile(e, UploadTypesEnum.Resume);
                            if (resumeCredential?.fileInfo) {
                                setResume({
                                    fileName: resumeCredential.fileInfo.name,
                                    fileSize: resumeCredential.fileInfo.size,
                                    fileType: resumeCredential.fileInfo.type,
                                    type: UploadTypesEnum.Resume,
                                    id: uuid(),
                                });
                            }
                        }}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                    />

                    <button
                        disabled={isUploading || isLoading}
                        onClick={triggerFileInput}
                        className={`w-full flex rounded-[30px] items-center justify-center  py-2 font-semibold text-[17px] ${
                            resume
                                ? `bg-grayscale-100 text-${primaryColor}`
                                : `bg-${primaryColor} text-white`
                        }`}
                    >
                        {buttonIcon}
                        {buttonText}
                    </button>
                </div>

                {(isLoading || isDeleting) && <CheckListItemSkeleton />}

                {resume && !isLoading && !isDeleting && (
                    <div className="flex items-center justify-between w-full mt-4 relative pb-4">
                        <div className="flex items-center justify-start overflow-hidden">
                            <DocIcon className="text-[#FF3636] h-[55px] min-h-[55px] min-w-[55px] w-[55px] mr-2" />
                            <div className="flex flex-col overflow-hidden min-w-0 pr-4">
                                <p className="text-grayscale-800 text-sm font-semibold truncate">
                                    {resume.fileName}
                                </p>
                                <p className="text-xs text-grayscale-600">
                                    {resume.fileType} • {resume.fileSize}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={confirmDelete}
                            className="bg-white overflow-hidden flex items-center justify-center rounded-full shadow-bottom p-2 min-h-[45px] min-w-[45px] h-[45px] w-[45px]"
                        >
                            <TrashBin className="text-blue-950 h-[25px] w-[25px]" />
                        </button>
                    </div>
                )}
            </div>
            <CheckListManagerFooter
                // handleSave={handleSaveResume}
                loading={isSaving || checklistStore.get.isParsing().resume}
            />
        </>
    );
};

export default CheckListUploadResume;
