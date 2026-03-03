import React from 'react';

import ShareBoostLink from './ShareBoostLink';
import JsonPreviewModal from './JsonPreviewModal';

import { VC, UnsignedVC } from '@learncard/types';
import { BoostMenuType } from '../hooks/useBoostMenu';
import { ModalTypes, useModal, useConfirmation, useGetRecordForUri } from 'learn-card-base';
import TrashBin from '../../svgs/TrashBin';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import BracketsIcon from '../../svgs/BracketsIcon';
import { LCR } from 'learn-card-base/types/credential-records';

type BoostOptionsMenuProps = {
    handleCloseModal: () => void;
    handleDelete: () => Promise<void>;
    boost: VC | UnsignedVC;
    boostUri?: string;
    record?: Partial<LCR>;
    menuType?: BoostMenuType;
    categoryType?: string;
};

const BoostOptionsMenu: React.FC<BoostOptionsMenuProps> = ({
    handleCloseModal,
    handleDelete,
    boost,
    boostUri,
    record: _record,
    menuType,
    categoryType,
}) => {
    const confirm = useConfirmation();

    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const { data: retrievedRecord } = useGetRecordForUri(
        _record?.uri,
        Boolean(menuType === BoostMenuType.earned && !_record?.id && _record?.uri)
    );

    const record = retrievedRecord || _record;

    const presentShareBoostLink = () => {
        newModal(
            <ShareBoostLink
                handleClose={closeModal}
                boost={boost}
                boostUri={boostUri || record?.uri}
                categoryType={categoryType!}
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
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName:
                'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

    const presentViewJsonModal = () => {
        newModal(
            <JsonPreviewModal boost={boost} />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    const boostMenuOptions: {
        id?: number;
        title?: string;
        icon?: React.ReactNode;
        onClick?: () => void;
    }[] = [];

    if (menuType === BoostMenuType.managed || record?.id) {
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
                        className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0"
                    >
                        <button
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                            type="button"
                            onClick={onClick}
                        >
                            <p className="text-grayscale-900">{title}</p>
                            {icon}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default BoostOptionsMenu;
