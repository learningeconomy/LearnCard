import React from 'react';

import ShareBoostLink from './ShareBoostLink';
import ShareTroopIdModal from '../../../pages/troop/ShareTroopIdModal';
import ViewJsonModal from './ViewJsonModal';
import TrashBin from '../../svgs/TrashBin';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import BracketsIcon from '../../svgs/BracketsIcon';

import { Boost, VC } from '@learncard/types';
import { BoostMenuType } from '../hooks/useBoostMenu';
import { BoostCategoryOptionsEnum, ModalTypes, useModal, useConfirmation } from 'learn-card-base';
import { isTroopCategory } from '../../../helpers/troop.helpers';

type BoostOptionsMenuProps = {
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    handleDeleteBoost: () => void;
    showDeleteButton?: boolean;
    boost: VC;
    boostCredential: Boost;
    boostUri: string;
    menuType?: BoostMenuType;
    categoryType?: string;
};

const BoostOptionsMenu: React.FC<BoostOptionsMenuProps> = ({
    handleCloseModal,
    showCloseButton = true,
    title,
    handleDeleteBoost,
    showDeleteButton,
    boost,
    boostCredential,
    boostUri,
    menuType,
    categoryType,
}) => {
    const confirm = useConfirmation();

    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const handleDelete = async () => {
        await handleDeleteBoost?.();
        handleCloseModal?.();
    };

    const presentShareBoostLink = () => {
        const isTroop = isTroopCategory(categoryType as BoostCategoryOptionsEnum);

        if (isTroop) {
            const b = boost as VC & { boostCredential?: VC; boostId?: string };
            const troopCredential = b.boostCredential ?? boost;
            const troopUri = b.boostId ?? boostUri;

            newModal(
                <ShareTroopIdModal credential={troopCredential} uri={troopUri} />,
                { sectionClassName: '!bg-transparent !shadow-none !max-w-[355px]' },
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );
            return;
        }

        newModal(
            <ShareBoostLink
                handleClose={closeModal}
                boost={boost}
                boostUri={boostUri}
                categoryType={(categoryType as string) || BoostCategoryOptionsEnum.achievement}
            />,
            {},
            { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
        );
    };

    const handleShare = async () => {
        handleCloseModal?.();
        presentShareBoostLink();
    };

    const selfBoostConfirmationAlert = async () => {
        await confirm({
            text: 'Are you sure you want to delete this?',
            onConfirm: async () => {
                await handleDelete();
                closeAllModals();
            },
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
            confirmButtonClassName:
                'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

    const presentViewJsonModal = () => {
        newModal(<ViewJsonModal boost={boost} />, {
            sectionClassName: '!max-h-[90%] !mx-[20px]',
        });
    };

    const boostMenuOptions: {
        id?: number;
        title?: string;
        icon?: React.ReactNode;
        onClick?: () => void;
    }[] = [];

    if (showDeleteButton) {
        boostMenuOptions.push({
            id: 1,
            title: 'Delete',
            icon: <TrashBin className="text-grayscale-900" />,
            onClick: () => selfBoostConfirmationAlert(),
        });
    }

    if (menuType === BoostMenuType.earned) {
        boostMenuOptions.push({
            id: 2,
            title: 'Share',
            icon: <ReplyIcon version="2" className="text-grayscale-900" />,
            onClick: () => handleShare(),
        });
    }

    boostMenuOptions.push({
        id: 3,
        title: 'View Data',
        icon: <BracketsIcon className="text-grayscale-900" />,
        onClick: () => presentViewJsonModal(),
    });

    return (
        <ul className="w-full flex flex-col items-center justify-center ion-padding">
            {boostMenuOptions?.map(action => {
                const { id, title, icon, onClick } = action;
                return (
                    <li
                        key={id}
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

export default BoostOptionsMenu;
