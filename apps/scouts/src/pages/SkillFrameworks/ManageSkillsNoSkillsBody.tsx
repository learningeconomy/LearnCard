import React from 'react';
import ManageSkillsUploadJsonButton from './ManageSkillsUploadJsonButton';

type ManageSkillsNoSkillsBodyProps = {
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isFileUploading: boolean;
};

const ManageSkillsNoSkillsBody: React.FC<ManageSkillsNoSkillsBodyProps> = ({
    handleFileUpload,
    isFileUploading,
}) => {
    return (
        <div className="bg-white max-w-[800px] w-full rounded-[20px] p-[15px] shadow-box-bottom flex flex-col gap-[15px]">
            <h4 className="text-[19px] text-grayscale-900 font-poppins font-[500]">
                Add Competencies
            </h4>

            <p className="text-[14px] text-grayscale-90 font-poppins">
                Import competencies using our template or upload a JSON file.
            </p>

            {/* <p className="text-[14px] text-grayscale-90 font-poppins">
                If your file comes from OpenSALT or a similar tool, we'll read it as
                standard JSON.
            </p> */}

            <ManageSkillsUploadJsonButton
                handleFileUpload={handleFileUpload}
                isFileUploading={isFileUploading}
            />
        </div>
    );
};

export default ManageSkillsNoSkillsBody;
