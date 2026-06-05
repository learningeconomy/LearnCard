import React, { Suspense, lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';

import { useFlags } from 'launchdarkly-react-client-sdk';
import useLCNGatedAction from '../network-prompts/hooks/useLCNGatedAction';

import ScanIcon from 'learn-card-base/svgs/ScanIcon';
import AiWandIcon from 'learn-card-base/svgs/AiWandIcon';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import LinkOutlinedIcon from 'learn-card-base/svgs/LinkOutlinedIcon';
import AddCredentialIcon from 'learn-card-base/svgs/AddCredentialIcon';
import CheckListContainer from '../learncard/checklist/CheckListContainer';

const importPasteOrUploadClaimModal = () =>
    import('../paste-or-upload-claim/PasteOrUploadClaimModal');

const LazyPasteOrUploadClaimModal = lazy(importPasteOrUploadClaimModal);

const PasteOrUploadClaimModalFallback: React.FC = () => (
    <IonPage>
        <IonContent>
            <div className="font-poppins flex items-center justify-center min-h-[360px] p-8">
                <IonSpinner name="crescent" className="text-grayscale-700" />
            </div>
        </IonContent>
    </IonPage>
);
import NewAiSessionContainer from '../new-ai-session/NewAiSessionContainer';
import BoostTemplateSelector from '../boost/boost-template/BoostTemplateSelector';
import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';
import BoostsTwoTonedIcon from 'learn-card-base/svgs/SideNav/BoostsTwoTonedIcon';
import BoostSelectMenu from '../boost/boost-select-menu/BoostSelectMenu';
import useBoostModal from '../boost/hooks/useBoostModal';
import useBoostRecoveryCheck from '../../hooks/useBoostRecoveryCheck';
import IssueManagedBoostSelector from '../../pages/launchPad/LaunchPadHeader/IssueManagedBoostSelector';
import { NewAiSessionIconShaded } from 'learn-card-base/svgs/NewAiSessionIcon';

import {
    useModal,
    ModalTypes,
    ChecklistEnum,
    QRCodeScannerStore,
    useGetCredentialList,
    useDeviceTypeByWidth,
} from 'learn-card-base';
import { chatBotStore } from '../../stores/chatBotStore';

export enum AddToLearnCardMenuEnum {
    boostSomeone = 'boostSomeone',
    newAiSession = 'newAiSession',
    issueCredential = 'issueCredential',
    createCredential = 'createCredential',
    uploadCredential = 'uploadCredential',
    claimCredential = 'claimCredential',
    useClaimLink = 'useClaimLink',
}

export type AddToLearnCardMenuItem = {
    type: AddToLearnCardMenuEnum;
    Icon: React.FC<{ className?: string; shadeColor?: string }>;
    label: string;
    onClick?: () => void;
};

export const AddToLearnCardMenu: React.FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const flags = useFlags();
    const { isDesktop } = useDeviceTypeByWidth();
    const { newModal, closeModal } = useModal();
    const { gate } = useLCNGatedAction();

    const { data: topics, isLoading: topicsLoading } = useGetCredentialList('AI Topic');
    const existingTopics = topics?.pages?.[0]?.records || [];

    useEffect(() => {
        void importPasteOrUploadClaimModal().catch(err => {
            console.error('[ClaimLink] Failed to preload PasteOrUploadClaimModal chunk:', err);
        });
    }, []);

    const handleNewSession = async (showAiAppSelector?: boolean) => {
        chatBotStore.set.resetStore();
        closeModal();

        const { prompted } = await gate();
        if (prompted) return;

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
    const { checkAndPromptRecovery } = useBoostRecoveryCheck();

    const handleNewBoostModal = () => {
        closeModal();
        handlePresentBoostModal();
    };

    const handleIssueManagedBoost = () => {
        closeModal();

        newModal(
            <IssueManagedBoostSelector />,
            {
                hideButton: true,
                sectionClassName: '!max-w-[500px]',
            },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
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

    const handleUseClaimLinkButton = () => {
        closeModal();

        newModal(
            <Suspense fallback={<PasteOrUploadClaimModalFallback />}>
                <LazyPasteOrUploadClaimModal />
            </Suspense>,
            { hideButton: true, sectionClassName: '!max-w-[500px]' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const addToLearnCardMenuItems: AddToLearnCardMenuItem[] = [];

    addToLearnCardMenuItems.push({
        type: AddToLearnCardMenuEnum.boostSomeone,
        Icon: BoostsTwoTonedIcon,
        label: t('launchpad.actions.boostSomeone', 'Boost Someone'),
        onClick: () => {
            closeModal();
            checkAndPromptRecovery(() => {
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
            });
        },
    });

    if (flags?.enableLaunchPadUpdates) {
        addToLearnCardMenuItems.push({
            type: AddToLearnCardMenuEnum.newAiSession,
            Icon: AiWandIcon,
            label: t('sidemenu.newAiSession', 'New AI Session'),
            onClick: () => handleNewSession(),
        });
    }

    addToLearnCardMenuItems.push(
        {
            type: AddToLearnCardMenuEnum.issueCredential,
            Icon: AddCredentialIcon,
            label: t('launchpad.actions.issueCredential', 'Issue Credential'),
            onClick: () => handleIssueManagedBoost(),
        },
        {
            type: AddToLearnCardMenuEnum.createCredential,
            Icon: AddCredentialIcon,
            label: t('launchpad.actions.createCredential', 'Create Credential'),
            onClick: () => {
                closeModal();
                checkAndPromptRecovery(() => {
                    handlePresentBoostModal();
                });
            },
        },
        {
            type: AddToLearnCardMenuEnum.uploadCredential,
            Icon: UploadIcon,
            label: t('launchpad.actions.uploadCredential', 'Upload Credential'),
            onClick: () => handleCheckListButton(),
        }
    );

    if (Capacitor.isNativePlatform()) {
        addToLearnCardMenuItems.push({
            type: AddToLearnCardMenuEnum.claimCredential,
            Icon: ScanIcon,
            label: t('launchpad.actions.scanQrCode', 'Scan a QR Code'),
            onClick: () => handleClaimCredentialButton(),
        });
    }

    addToLearnCardMenuItems.push({
        type: AddToLearnCardMenuEnum.useClaimLink,
        Icon: LinkOutlinedIcon,
        label: t('launchpad.actions.useClaimLink', 'Use a Claim Link'),
        onClick: () => handleUseClaimLinkButton(),
    });

    return (
        <div className={`w-full flex flex-col justify-center p-4 ${className}`}>
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
