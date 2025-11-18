import React from 'react';
import { Capacitor } from '@capacitor/core';

import { useFlags } from 'launchdarkly-react-client-sdk';
import useJoinLCNetworkModal from '../../components/network-prompts/hooks/useJoinLCNetworkModal';

import ScanIcon from 'learn-card-base/svgs/ScanIcon';
import AiWandIcon from 'learn-card-base/svgs/AiWandIcon';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import AddCredentialIcon from 'learn-card-base/svgs/AddCredentialIcon';
import CheckListContainer from '../learncard/checklist/CheckListContainer';
import NewAiSessionContainer from '../new-ai-session/NewAiSessionContainer';
import BoostTemplateSelector from '../boost/boost-template/BoostTemplateSelector';
import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';
import BoostsTwoTonedIcon from 'learn-card-base/svgs/SideNav/BoostsTwoTonedIcon';
import BoostSelectMenu from '../boost/boost-select-menu/BoostSelectMenu';
import useBoostModal from '../boost/hooks/useBoostModal';
import { NewAiSessionIconShaded } from 'learn-card-base/svgs/NewAiSessionIcon';

import {
    useModal,
    ModalTypes,
    ChecklistEnum,
    QRCodeScannerStore,
    useGetCredentialList,
    useIsCurrentUserLCNUser,
    useDeviceTypeByWidth,
} from 'learn-card-base';

export enum AddToLearnCardMenuEnum {
    boostSomeone = 'boostSomeone',
    newAiSession = 'newAiSession',
    issueCredential = 'issueCredential',
    uploadCredential = 'uploadCredential',
    claimCredential = 'claimCredential',
}

export type AddToLearnCardMenuItem = {
    type: AddToLearnCardMenuEnum;
    Icon: React.FC<{ className?: string; shadeColor?: string }>;
    label: string;
    onClick?: () => void;
};

export const AddToLearnCardMenu: React.FC = () => {
    const flags = useFlags();
    const { isDesktop } = useDeviceTypeByWidth();
    const { newModal, closeModal } = useModal();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const { data: topics, isLoading: topicsLoading } = useGetCredentialList('AI Topic');
    const existingTopics = topics?.pages?.[0]?.records || [];

    const handleNewSession = (showAiAppSelector?: boolean) => {
        closeModal();

        if (!currentLCNUser && !currentLCNUserLoading) {
            handlePresentJoinNetworkModal();
            return;
        }

        newModal(
            <NewAiSessionContainer
                existingTopics={existingTopics}
                showAiAppSelector={showAiAppSelector}
                shortCircuitStepDesktop={isDesktop}
            />,
            {
                hideButton: true,
            },
            {
                mobile: ModalTypes.Right,
                desktop: ModalTypes.Right,
            }
        );
    };

    const { handlePresentBoostModal } = useBoostModal(undefined, undefined, true, true);

    const handleNewBoostModal = () => {
        closeModal();

        if (!currentLCNUser && !currentLCNUserLoading) {
            handlePresentJoinNetworkModal();
            return;
        }
        handlePresentBoostModal();
    };

    const handleCheckListButton = () => {
        closeModal();

        newModal(
            <CheckListContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleClaimCredentialButton = () => {
        closeModal();

        QRCodeScannerStore.set.showScanner(true);
    };

    const addToLearnCardMenuItems: AddToLearnCardMenuItem[] = [];

    addToLearnCardMenuItems.push({
        type: AddToLearnCardMenuEnum.boostSomeone,
        Icon: BoostsTwoTonedIcon,
        label: 'Boost Someone',
        onClick: () => {
            closeModal();
            newModal(
                <BoostTemplateSelector />,
                {
                    hideButton: true,
                    sectionClassName: '!max-w-[500px]',
                },
                {
                    desktop: ModalTypes.Cancel,
                    mobile: ModalTypes.Cancel,
                }
            );
        },
    });

    if (flags?.enableLaunchPadUpdates) {
        addToLearnCardMenuItems.push({
            type: AddToLearnCardMenuEnum.newAiSession,
            Icon: AiWandIcon,
            label: 'New AI Session',
            onClick: () => handleNewSession(),
        });
    }

    addToLearnCardMenuItems.push(
        {
            type: AddToLearnCardMenuEnum.issueCredential,
            Icon: AddCredentialIcon,
            label: 'Issue Credential',
            onClick: () => handleNewBoostModal(),
        },
        {
            type: AddToLearnCardMenuEnum.uploadCredential,
            Icon: UploadIcon,
            label: 'Upload Credential',
            onClick: () => handleCheckListButton(),
        }
    );

    if (Capacitor.isNativePlatform()) {
        addToLearnCardMenuItems.push({
            type: AddToLearnCardMenuEnum.claimCredential,
            Icon: ScanIcon,
            label: 'Claim Credential',
            onClick: () => handleClaimCredentialButton(),
        });
    }

    return (
        <div className="w-full flex flex-col justify-center p-4">
            <div className="w-full flex flex-col justify-center">
                {addToLearnCardMenuItems.map(menuItem => {
                    const { type, Icon, label, onClick } = menuItem;

                    return (
                        <button
                            key={type}
                            className={`w-full flex items-center justify-start p-2 rounded-[15px] `}
                            onClick={onClick}
                        >
                            <Icon className="w-[35px] h-[35px] text-grayscale-800 mr-2" />
                            <h2 className="text-[18px] font-normal text-grayscale-800 ml-2 font-notoSans">
                                {label}
                            </h2>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AddToLearnCardMenu;
