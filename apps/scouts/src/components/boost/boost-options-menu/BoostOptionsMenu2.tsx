import React from 'react';

import CopyStack from '../../svgs/CopyStack';
import ShareBoostLink from './ShareBoostLink';
import ShareTroopIdModal from '../../../pages/troop/ShareTroopIdModal';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import ViewJsonModal from './ViewJsonModal';

import { Boost, VC } from '@learncard/types';
import { BoostMenuType } from '../hooks/useBoostMenu';
import { BoostCategoryOptionsEnum, ModalTypes, useModal, useConfirmation } from 'learn-card-base';
import { isTroopCategory } from '../../../helpers/troop.helpers';

type BoostOptionsMenuProps = {
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    handleDeleteBoost: () => void;
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
            const troopCredential = (boost as any)?.boostCredential ?? boost;
            const troopUri = (boost as any)?.boostId ?? boostUri;

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

    return (
        <section className="py-[25px]">
            <div className="w-full flex items-center justify-center px-4">
                <button
                    onClick={selfBoostConfirmationAlert}
                    className="flex items-center font-medium justify-center bg-sp-purple-base rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                >
                    <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Delete
                </button>
            </div>

            {menuType === BoostMenuType.earned && (
                <div className="w-full flex items-center justify-center mt-2 px-4">
                    <button
                        onClick={() => {
                            handleShare();
                        }}
                        className="flex items-center font-medium justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                    >
                        <LinkChain className="ml-[5px] h-[30px] w-[30px] mr-2" /> Share
                    </button>
                </div>
            )}

            <div className="w-full flex items-center justify-center mt-2 px-4">
                <button
                    onClick={presentViewJsonModal}
                    className="flex items-center font-medium justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                >
                    <CopyStack className="ml-[5px] h-[30px] w-[30px] mr-2" /> View JSON
                </button>
            </div>
        </section>
    );
};

export default BoostOptionsMenu;

{
    /* <li
                        key={id}
                        onClick={() => onClick?.()}
                        className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0"
                    >
                        <p className="text-grayscale-900">{title}</p>
                        {icon}
                    </li> */
}
