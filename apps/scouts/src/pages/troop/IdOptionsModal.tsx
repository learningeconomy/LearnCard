import React from 'react';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';

import ViewTroopIdModal from './ViewTroopIdModal';
import ViewJsonModal from '../../components/boost/boost-options-menu/ViewJsonModal';
import CodeIcon from 'learn-card-base/svgs/CodeIcon';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import PeaceIcon from 'learn-card-base/svgs/PeaceIcon';
import GreenScoutsIdCard from '../../components/svgs/GreenScoutsIdCard';
import {
    ModalTypes,
    ProfilePicture,
    useConfirmation,
    useGetCurrentUserTroopIds,
    useModal,
    useResolveBoost,
    useWallet,
} from 'learn-card-base';
import { getScoutsRole } from '../../helpers/troop.helpers';
import { VC } from '@learncard/types';
import { PermissionsByRole } from '../../components/troopsCMS/troops.helpers';

type IdOptionsModalProps = {
    isPersonalId: boolean;
    canManageId: boolean;
    ownerImage: string;
    ownerName: string;
    ownerProfileId: string;
    boostUri: string;
    handleShare: () => void;
    credential: VC;
    type?: string;
};

const IdOptionsModal: React.FC<IdOptionsModalProps> = ({
    isPersonalId,
    canManageId,
    ownerImage,
    ownerName,
    ownerProfileId,
    boostUri,
    handleShare,
    credential,
    type,
}) => {
    const { initWallet } = useWallet();
    const confirm = useConfirmation();
    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const { data: troopIds, isLoading: troopIdsLoading } = useGetCurrentUserTroopIds();
    const hasGlobalAdminID = troopIds?.isScoutGlobalAdmin;

    const role = getScoutsRole(credential);
    const troopOrNetwork =
        role === ScoutsRoleEnum.scout || role === ScoutsRoleEnum.leader ? 'Troop' : 'Network';

    const { data: resolvedCredential } = useResolveBoost(boostUri);
    const _credential = resolvedCredential ?? credential;

    const handleViewId = () => {
        closeModal();
        newModal(
            <ViewTroopIdModal
                credential={_credential}
                boostUri={boostUri}
                handleShare={handleShare}
                name={ownerName}
                image={ownerImage}
                profileId={ownerProfileId}
                skipProofCheck
            />
        );
    };

    const handleViewJson = () => {
        closeModal();
        newModal(<ViewJsonModal boost={_credential} />, {
            sectionClassName: '!max-h-[90%] !mx-[20px]',
        });
    };

    const handleRevoke = async () => {
        const wallet = await initWallet();

        if (isPersonalId) {
            await confirm({
                text: `Are you sure you want to leave ${credential?.name}?`,
                onConfirm: () => {
                    console.log('TODO revoke');
                    // closeAllModals();
                },
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            });
        } else {
            await confirm({
                text: `Are you sure you want to remove ${ownerName} from ${credential?.name}?`,
                onConfirm: async () => {
                    const removedAdmin = await wallet?.invoke?.removeBoostAdmin(
                        boostUri,
                        ownerProfileId
                    );

                    const updates = PermissionsByRole.troop;
                    const updatedPermissions = await wallet?.invoke?.updateBoostPermissions(
                        boostUri,
                        { ...updates },
                        ownerProfileId
                    );

                    closeAllModals();
                },
                cancelButtonClassName:
                    'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                confirmButtonClassName:
                    'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
            });
        }
    };

    return (
        <div className="flex flex-col px-[30px] py-[20px]">
            {/* hidden for now because Profile has not been implemented */}
            {!isPersonalId && false && (
                <IdOptionRow
                    text="View Profile"
                    icon={
                        <ProfilePicture
                            customContainerClass="h-[35px] w-[35px] overflow-hidden"
                            overrideSrcURL={ownerImage}
                            overrideSrc
                        />
                    }
                    onClick={() => console.log('TODO profile')}
                />
            )}

            <IdOptionRow text="View Troop ID" icon={<GreenScoutsIdCard />} onClick={handleViewId} />

            {isPersonalId && (
                <IdOptionRow
                    text="Share ID"
                    icon={<ReplyIcon size="30" filled={false} />}
                    onClick={() => {
                        closeModal();
                        handleShare();
                    }}
                />
            )}

            <IdOptionRow text="View ID JSON" icon={<CodeIcon />} onClick={handleViewJson} />

            {isPersonalId && (
                <IdOptionRow
                    text={`Leave ${troopOrNetwork}`}
                    icon={<PeaceIcon />}
                    onClick={handleRevoke}
                />
            )}
            {!isPersonalId && (canManageId || hasGlobalAdminID) && type === 'Admin' && (
                <IdOptionRow
                    text={`Remove from ${troopOrNetwork}`}
                    icon={<PeaceIcon />}
                    onClick={handleRevoke}
                />
            )}
        </div>
    );
};

type IdOptionRowProps = {
    text: string;
    icon: React.ReactNode;
    onClick: () => void;
};

const IdOptionRow: React.FC<IdOptionRowProps> = ({ text, icon, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex gap-[10px] items-center py-[10px] text-grayscale-900 border-b-[1px] border-grayscale-200 border-solid last:border-b-0 h-[56px]"
        >
            <span className="font-notoSans text-[17px]">{text}</span>
            <div className="ml-auto">{icon}</div>
        </button>
    );
};

export default IdOptionsModal;
