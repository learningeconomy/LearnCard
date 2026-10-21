import React, { useRef } from 'react';
import * as m from '../../paraglide/messages.js';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import DownloadIcon from 'learn-card-base/svgs/DownloadIcon';
import ManageSkillsUploadingButton from './ManageSkillsUploadingButton';
import { handleDownloadTemplate } from '../../helpers/skillFramework.helpers';

type ManageSkillsUploadJsonButtonProps = {
    isFileUploading: boolean;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const ManageSkillsUploadJsonButton: React.FC<ManageSkillsUploadJsonButtonProps> = ({
    isFileUploading,
    handleFileUpload,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const triggerFileInput = () => fileInputRef.current?.click();

    return (
        <>
            <button
                onClick={handleDownloadTemplate}
                className="text-indigo-500 flex gap-[10px] items-center text-[17px] font-[600] font-notoSans leading-[24px] tracking-[0.25px]"
            >
                <DownloadIcon className="w-[25px] h-[25px]" />
                {m['skillFrameworks.downloadTemplate']()}
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
            />
            {isFileUploading ? (
                <ManageSkillsUploadingButton />
            ) : (
                <button
                    onClick={triggerFileInput}
                    className="bg-indigo-500 text-white pl-[20px] pr-[15px] py-[7px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-[600] font-notoSans leading-[24px] tracking-[0.25px]"
                >
                    <UploadIcon className="w-[25px] h-[25px]" strokeWidth="2" />
                    {m['skillFrameworks.uploadJson']()}
                </button>
            )}
        </>
    );
};

export default ManageSkillsUploadJsonButton;
