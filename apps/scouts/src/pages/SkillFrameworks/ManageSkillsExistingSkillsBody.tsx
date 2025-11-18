import React, { useState } from 'react';

import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import FileExportIcon from 'learn-card-base/svgs/FileExportIcon';
import FrameworkSkillsCount from './FrameworkSkillsCount';
import ManageSkillsFileInfoDisplay from './ManageSkillsFileInfoDisplay';
import ManageSkillsUploadJsonButton from './ManageSkillsUploadJsonButton';

import { SkillFramework } from '../../components/boost/boost';
import SkillPreview from './SkillPreview';
import { useWallet, useModal, ModalTypes } from 'learn-card-base';
import {
    ApiSkillNode,
    convertApiSkillFrameworkToSkillFramework,
    downloadFramework,
} from '../../helpers/skillFramework.helpers';

type ManageSkillsExistingSkillsBodyProps = {
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    skillFramework: any; // From api. Has framework with name, description, etc. and skills with paginated skills
    isFileUploading: boolean;
    isManageJsonVersion?: boolean;
};

const ManageSkillsExistingSkillsBody: React.FC<ManageSkillsExistingSkillsBodyProps> = ({
    handleFileUpload,
    skillFramework,
    isFileUploading,
    isManageJsonVersion,
}) => {
    const { initWallet } = useWallet();
    const { newModal } = useModal();

    const [isExporting, setIsExporting] = useState(false);

    const handleExportFramework = async () => {
        setIsExporting(true);

        try {
            const wallet = await initWallet();

            const fullFrameworkSkillTree: { skills: ApiSkillNode[] } =
                await wallet.invoke.getFullSkillTree({
                    frameworkId: skillFramework.framework.id,
                });

            const frameworkToExport: SkillFramework = convertApiSkillFrameworkToSkillFramework({
                framework: skillFramework.framework,
                skills: fullFrameworkSkillTree.skills,
            });

            downloadFramework(frameworkToExport);
        } catch (error) {
            console.error('Error exporting framework:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const openViewFrameworkModal = () => {
        console.log('TODO open view framework modal');

        // const frameworkToPreview: SkillFramework =
        //     convertApiFrameworkToSkillFramework(skillFramework);

        // newModal(
        //     <SkillPreview
        //         framework={frameworkToPreview}
        //         successButtonText="Save"
        //         onSuccess={() => {
        //             console.log('TODO handle save');
        //             // TODO save the framework / enable save button
        //         }}
        //     />,
        //     undefined,
        //     {
        //         desktop: ModalTypes.FullScreen,
        //         mobile: ModalTypes.FullScreen,
        //     }
        // );
    };

    return (
        <>
            {!isManageJsonVersion && (
                <button
                    onClick={openViewFrameworkModal}
                    className="bg-white max-w-[800px] w-full rounded-[20px] p-[15px] shadow-box-bottom flex gap-[10px] items-center"
                >
                    <div className="flex flex-col">
                        <h4 className="text-[19px] text-grayscale-900 font-poppins font-[500]">
                            Review & Edit Framework
                        </h4>

                        <FrameworkSkillsCount
                            frameworkId={skillFramework?.framework.id}
                            includeSkillWord
                            className="text-[17px] text-grayscale-600"
                        />
                    </div>

                    <SlimCaretRight
                        className="text-grayscale-600 ml-auto h-[30px] w-[30px]"
                        strokeWidth="2"
                    />
                </button>
            )}

            <div className="bg-white max-w-[800px] w-full rounded-[20px] p-[15px] shadow-box-bottom flex flex-col gap-[15px]">
                <h4 className="text-[19px] text-grayscale-900 font-poppins font-[500]">
                    Edit JSON
                </h4>

                <p className="text-[14px] text-grayscale-90 font-poppins">
                    Export your current framework, make changes and re-upload.
                </p>

                <ManageSkillsFileInfoDisplay
                    fileInfo={{
                        name: `${skillFramework?.framework.name
                            .replace(/[^\w\s]/gi, '_')
                            .replace(/\s+/g, '_')
                            .toLowerCase()}.json`,
                    }}
                />

                <button
                    onClick={handleExportFramework}
                    disabled={isExporting}
                    className="bg-grayscale-100 text-grayscale-900 pl-[20px] pr-[15px] py-[7px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-[600] font-notoSans leading-[24px] tracking-[0.25px] disabled:opacity-70"
                >
                    <FileExportIcon className="w-[25px] h-[25px]" color="currentColor" />
                    {isExporting ? 'Exporting...' : 'Export Framework'}
                </button>
            </div>

            <div className="bg-white max-w-[800px] w-full rounded-[20px] p-[15px] shadow-box-bottom flex flex-col gap-[15px]">
                <h4 className="text-[19px] text-grayscale-900 font-poppins font-[500]">
                    Replace Framework
                </h4>

                <p className="text-[14px] text-grayscale-90 font-poppins">
                    To replace your current framework, you can upload a new JSON file.
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
        </>
    );
};

export default ManageSkillsExistingSkillsBody;
