import React from 'react';

import ShareBoostLink from '../../components/boost/boost-options-menu/ShareBoostLink';
import Pencil from '../../components/svgs/Pencil';
import TrashBin from '../../components/svgs/TrashBin';
import BracketsIcon from '../../components/svgs/BracketsIcon';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import { Boost, VC } from '@learncard/types';
import { BoostMenuType } from '../../components/boost/hooks/useBoostMenu';
import { ModalTypes, useModal, useConfirmation, useGetCurrentUserTroopIds } from 'learn-card-base';
import AddUserIcon from '../../components/svgs/AddUserIcon';
import IdentificationCard from '../../components/svgs/IdentificationCard';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import { getScoutsNounForRole } from '../../helpers/troop.helpers';

type TroopActionMenuProps = {
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    handleDeleteBoost: () => void;
    handleEdit?: () => void;
    handleDetails?: () => void;
    handleShareBoost?: () => void;
    handleInviteMember?: () => void;
    ownsCurrentId?: boolean;
    role?: ScoutsRoleEnum;
};

const TroopActionMenu: React.FC<TroopActionMenuProps> = ({
    handleCloseModal,
    showCloseButton = true,
    title,
    handleDeleteBoost,
    handleDetails,
    handleEdit,
    handleInviteMember,
    handleShareBoost,
    ownsCurrentId,
    role,
}) => {
    const confirm = useConfirmation();

    const { data: troopIds, isLoading: troopIdsLoading } = useGetCurrentUserTroopIds();
    const hasGlobalAdminID = troopIds?.isScoutGlobalAdmin;

    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const handleDelete = async () => {
        handleCloseModal?.();
        await handleDeleteBoost?.();
    };

    const presentShareBoostLink = () => {
        handleCloseModal?.();
        handleShareBoost?.();
    };

    const handleShare = async () => {
        presentShareBoostLink();
    };

    const _handleEdit = async () => {
        handleCloseModal?.();
        handleEdit?.();
    };

    const handleAddMember = async () => {
        handleCloseModal?.();
        handleInviteMember?.();
    };

    const boostMenuOptions: {
        id?: number;
        title?: string;
        icon?: React.ReactNode;
        onClick?: () => void;
    }[] = [];

    boostMenuOptions.push({
        id: 1,
        title: 'Invite Member',
        icon: <AddUserIcon className="text-grayscale-900" />,
        onClick: () => handleAddMember(),
    });

    if (handleInviteMember) {
        boostMenuOptions.push({
            id: 0,
            title: 'Edit',
            icon: <Pencil className="text-grayscale-900" />,
            onClick: () => _handleEdit(),
        });
    }

    if (ownsCurrentId) {
        boostMenuOptions.push(
            {
                id: 2,
                title: 'Share My ID',
                icon: <ReplyIcon version="2" className="text-grayscale-900" />,
                onClick: () => handleShare(),
            },
            {
                id: 3,
                title: 'My ID Details',
                icon: <IdentificationCard className="text-grayscale-900" />,
                onClick: () => {
                    handleCloseModal?.();
                    handleDetails?.();
                },
            }
        );
    }

    if (hasGlobalAdminID && role !== ScoutsRoleEnum.global) {
        boostMenuOptions.push({
            id: 4,
            title: `Delete ${title ?? getScoutsNounForRole((role as ScoutsRoleEnum) ?? 1, true)}`,
            icon: <TrashBin className="text-grayscale-900" />,
            onClick: () => {
                handleDelete?.();
                handleCloseModal?.();
            },
        });
    }

    return (
        <ul className="w-full flex flex-col items-center justify-center ion-padding">
            {boostMenuOptions?.map(action => {
                const { id, title, icon, onClick } = action;
                return (
                    <li
                        key={id}
                        role={onClick ? 'button' : undefined}
                        onClick={() => onClick?.()}
                        className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0"
                    >
                        <p className="text-grayscale-900">{title}</p>
                        {icon}
                    </li>
                );
            })}
        </ul>
    );
};

export default TroopActionMenu;
