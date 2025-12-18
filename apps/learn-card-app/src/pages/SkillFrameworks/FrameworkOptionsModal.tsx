import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ModalTypes, useModal, useWallet } from 'learn-card-base';

import Pencil from '../../components/svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import DeleteFrameworkConfirmationModal from './DeleteFrameworkConfirmationModal';

import { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';
import CreateFrameworkModal from './CreateFrameworkModal';

type FrameworkOptionsModalProps = {
    frameworkInfo: ApiFrameworkInfo;
};

const FrameworkOptionsModal: React.FC<FrameworkOptionsModalProps> = ({ frameworkInfo }) => {
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const { newModal, closeModal, closeAllModals } = useModal();

    const handleEditFramework = () => {
        closeModal();
        setTimeout(() => {
            newModal(
                <CreateFrameworkModal isEdit frameworkInfo={frameworkInfo} />,
                {
                    sectionClassName: '!bg-transparent !shadow-none',
                },
                { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
            );
        }, 300);
    };

    const handleDeleteFramework = () => {
        newModal(
            <DeleteFrameworkConfirmationModal
                handleDelete={async () => {
                    const wallet = await initWallet();
                    await wallet.invoke.deleteSkillFramework(frameworkInfo.id);
                    queryClient.invalidateQueries({
                        queryKey: ['listMySkillFrameworks'],
                    });
                    closeAllModals();
                }}
            />,
            { sectionClassName: '!bg-transparent !shadow-none !overflow-visible' },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    return (
        <div className="flex flex-col p-[20px]">
            <button
                onClick={handleEditFramework}
                className="flex items-center gap-[10px] py-[10px] font-notoSans text-[18px] text-grayscale-800"
            >
                <Pencil version={3} className="w-[35px] h-[35px]" />
                Edit Framework
            </button>
            <button
                onClick={handleDeleteFramework}
                className="flex items-center gap-[10px] py-[10px] font-notoSans text-[18px] text-grayscale-800"
            >
                <TrashBin version="thin" className="w-[35px] h-[35px]" />
                Delete Framework
            </button>
        </div>
    );
};

export default FrameworkOptionsModal;
