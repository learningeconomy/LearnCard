import React from 'react';

import Plus from 'learn-card-base/svgs/Plus';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import CreateFrameworkModal from '../SkillFrameworks/CreateFrameworkModal';

import { ModalTypes, useModal } from 'learn-card-base';

type SkillsHubPlusOptionsModalProps = {};

const SkillsHubPlusOptionsModal: React.FC<SkillsHubPlusOptionsModalProps> = ({}) => {
    const { newModal, closeModal } = useModal();

    const openCreateFrameworkModal = () => {
        closeModal();
        newModal(
            <CreateFrameworkModal />,
            {
                sectionClassName: '!bg-transparent !shadow-none',
            },
            { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <div className="flex flex-col p-[20px]">
            <button
                onClick={openCreateFrameworkModal}
                className="flex items-center gap-[10px] py-[10px] font-notoSans text-[18px] text-grayscale-800"
            >
                <SkillsFrameworkIcon
                    color="currentColor"
                    version="outlined"
                    className="w-[35px] h-[35px] text-grayscale-900"
                />
                Create Framework
            </button>
            <button
                // onClick={handleDeleteFramework}
                className="flex items-center gap-[10px] py-[10px] font-notoSans text-[18px] text-grayscale-800"
            >
                <Plus className="w-[35px] h-[35px] p-[5px]" strokeWidth="2" />
                Self Assign Skills
            </button>
        </div>
    );
};

export default SkillsHubPlusOptionsModal;
