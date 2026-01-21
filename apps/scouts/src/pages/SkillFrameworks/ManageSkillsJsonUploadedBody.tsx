import React, { useRef } from 'react';
import { ModalTypes, useModal } from 'learn-card-base';

import Refresh from '../../components/svgs/Refresh';
import CheckCircle from 'learn-card-base/svgs/CheckCircle';
import WarningIcon from '../../components/svgs/WarningIcon';
import ExclamationCircle from 'learn-card-base/svgs/ExclamationCircle';
import ManageSkillsUploadingButton from './ManageSkillsUploadingButton';
import ManageSkillsFileInfoDisplay from './ManageSkillsFileInfoDisplay';
import ManageSkillsConfirmationModal from './ManageSkillsConfirmationModal';

import { SkillFramework } from '../../components/boost/boost';
import { countNodeRoles } from '../../helpers/skillFramework.helpers';

export type FrameworkJsonError =
    | {
          type: 'format';
          errors: string[];
      }
    | {
          type: 'processing';
          errors: string[];
      };

type ManageSkillsJsonUploadedBodyProps = {
    fileInfo: { type: string; size: string; name: string } | null;
    fileSkillFramework: SkillFramework;
    frameworkApproved: boolean;
    jsonError: FrameworkJsonError | null;
    isFileUploading: boolean;
    isPrematureSave: boolean;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    retryIconGeneration: () => void;
};

const ManageSkillsJsonUploadedBody: React.FC<ManageSkillsJsonUploadedBodyProps> = ({
    fileInfo,
    fileSkillFramework,
    frameworkApproved,
    jsonError,
    isFileUploading,
    isPrematureSave,
    handleFileUpload,
    retryIconGeneration,
}) => {
    const { newModal } = useModal();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const triggerFileInput = () => fileInputRef.current?.click();

    const skills = fileSkillFramework?.skills;

    const { tiers, competencies } = countNodeRoles(skills);
    const numberOfTiers = tiers;
    const numberOfCompetencies = competencies;

    const isError = jsonError !== null;
    const errors = jsonError?.errors || [];

    return (
        <div className="bg-white max-w-[800px] w-full rounded-[20px] p-[15px] shadow-box-bottom flex flex-col gap-[10px]">
            <h4 className="text-[19px] text-grayscale-900 font-poppins font-[500]">
                Review & Edit Framework
            </h4>

            {isFileUploading && <ManageSkillsUploadingButton />}

            {!isFileUploading && (
                <>
                    {!isError && (
                        <p className="text-[19px] font-poppins text-emerald-500 font-[500]">
                            File upload successful.
                        </p>
                    )}

                    {isError && (
                        <p className="text-[19px] font-poppins text-rose-600 font-[500]">
                            {jsonError.type === 'format'
                                ? 'File Formatting Error'
                                : 'Processing Error'}
                        </p>
                    )}

                    <div className="flex flex-col gap-[10px] w-full">
                        <ManageSkillsFileInfoDisplay
                            fileInfo={fileInfo}
                            icon={isError ? 'error' : 'check'}
                        />

                        <div className="flex flex-col gap-[10px] w-full">
                            {!isError && !frameworkApproved && (
                                <div
                                    className={`p-[10px] rounded-[10px] flex flex-col gap-[5px] ${
                                        isPrematureSave ? 'bg-orange-100' : 'bg-indigo-100'
                                    }`}
                                >
                                    <p
                                        className={`flex items-center gap-[8px] font-poppins font-[600] text-[18px] ${
                                            isPrematureSave ? 'text-orange-700' : 'text-indigo-600'
                                        }`}
                                    >
                                        <ExclamationCircle />
                                        Review & Approve Before Saving
                                    </p>

                                    <div
                                        className={`text-[14px] ${
                                            isPrematureSave ? 'text-orange-700' : 'text-indigo-500'
                                        }`}
                                    >
                                        <p className="font-poppins">You will be importing:</p>

                                        <ul className="list-disc list-inside pl-[8px]">
                                            <li className="font-poppins">
                                                <span className="font-bold font-poppins">
                                                    {numberOfTiers}
                                                </span>{' '}
                                                Framework Tiers
                                            </li>
                                            <li className="font-poppins">
                                                <span className="font-bold font-poppins">
                                                    {numberOfCompetencies}
                                                </span>{' '}
                                                Competencies
                                            </li>
                                        </ul>

                                        <p className="mt-[10px] font-poppins text-[14px]">
                                            <span className="font-bold font-poppins">
                                                Icons have been automatically assigned
                                            </span>{' '}
                                            and can be manually edited.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!isError && frameworkApproved && (
                                <div className="p-[10px] rounded-[10px] flex flex-col gap-[5px] bg-emerald-50">
                                    <p className="flex items-center gap-[8px] text-emerald-501 font-poppins font-[600] text-[18px]">
                                        <CheckCircle
                                            className="w-[25px] h-[25px]"
                                            color="currentColor"
                                        />
                                        Framework Approved
                                    </p>

                                    <div className="text-emerald-501 text-[14px]">
                                        <p className="font-poppins">You will be importing:</p>

                                        <ul className="list-disc list-inside pl-[8px]">
                                            <li className="font-poppins">
                                                <span className="font-bold font-poppins">
                                                    {numberOfTiers}
                                                </span>{' '}
                                                Framework Tiers
                                            </li>
                                            <li className="font-poppins">
                                                <span className="font-bold font-poppins">
                                                    {numberOfCompetencies}
                                                </span>{' '}
                                                Competencies
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {isError && (
                                <div className="p-[10px] rounded-[10px] flex flex-col gap-[5px] bg-orange-100">
                                    <p className="flex items-center gap-[8px] font-poppins font-[600] text-[18px] text-orange-700">
                                        <WarningIcon className="w-[24px] h-[24px]" />
                                        Errors
                                    </p>

                                    <ul className="pl-[6px] text-[14px] text-orange-700">
                                        {errors.map((error, index) => (
                                            <li key={index} className="flex items-baseline">
                                                <span className="mr-2 font-poppins font-[600]">
                                                    •
                                                </span>
                                                <span className="flex-1 font-poppins">{error}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        {isError && jsonError.type === 'processing' && (
                            <button
                                onClick={retryIconGeneration}
                                className="bg-indigo-500 text-white pl-[20px] pr-[15px] py-[7px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-[600] font-notoSans leading-[24px] tracking-[0.25px]"
                            >
                                <Refresh className="w-[25px] h-[25px]" color="currentColor" />
                                Try Again
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (isError) {
                                    triggerFileInput();
                                    return;
                                } else {
                                    newModal(
                                        <ManageSkillsConfirmationModal
                                            mainText="Replace JSON file?"
                                            secondaryText="Uploading a new file will replace your current file and discard your changes."
                                            confirmationButtonText="Yes, Replace JSON"
                                            onConfirm={triggerFileInput}
                                        />,
                                        {
                                            sectionClassName:
                                                '!bg-transparent !shadow-none !overflow-visible',
                                        },
                                        { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                                    );
                                }
                            }}
                            className={`${
                                isError && jsonError.type === 'format'
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-grayscale-100 text-indigo-500'
                            } pl-[20px] pr-[15px] py-[7px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-[600] font-notoSans leading-[24px] tracking-[0.25px]`}
                        >
                            <Refresh className="w-[25px] h-[25px]" color="currentColor" />
                            Replace File
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManageSkillsJsonUploadedBody;
