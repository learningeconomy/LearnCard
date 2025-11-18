import React from 'react';

import Camera from 'learn-card-base/svgs/Camera';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';

import { BoostMediaCMSFormItemProps } from './BoostCMSMediaForm';
import { BoostMediaOptionsEnum } from '../../../boost';
import { ModalTypes, useModal } from 'learn-card-base';

const BoostMediaCMSFormPhotoItem: React.FC<BoostMediaCMSFormItemProps> = ({
    index,
    media,
    handleDelete,
    state,
    setState,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const handleEdit = () => {
        newModal(
            <div className="w-full flex flex-col items-center justify-center">
                <CreateMediaAttachmentForm
                    initialState={state}
                    initialMedia={media}
                    initialIndex={index}
                    setParentState={setState}
                    hideBackButton={true}
                    initialActiveMediaType={BoostMediaOptionsEnum.photo}
                    handleCloseModal={() => closeModal()}
                    showCloseButton={false}
                    createMode={false}
                    title={
                        <p className="font-poppins flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                            Media Attachment
                        </p>
                    }
                />
            </div>,
            {
                sectionClassName: '!max-w-[500px]',
                hideButton: true,
                usePortal: true,
            }
        );
    };

    return (
        <div
            key={index}
            className="flex bg-grayscale-100 rounded-[20px] relative min-h-[120px] max-h-[120px] w-full mb-4"
        >
            <div className="w-2/5 shrink-0 relative overflow-hidden rounded-[20px] shadow-3xl min-h-[120px] max-h-[120px]">
                <img
                    alt="media attachment"
                    src={media.url || ''}
                    className="h-full w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-10"></div>

                <Camera className="absolute left-2 bottom-2 h-[30px] w-[30px] text-white z-20" />
            </div>

            <div className="flex flex-1 ion-padding rounded-r-[20px] flex-col justify-between">
                <p className="break-all line-clamp-3 pr-2 text-left text-xs leading-4 text-grayscale-900 z-20">
                    {media.title}
                </p>
            </div>

            <div className="absolute right-1 bottom-1 z-20 cursor-pointer flex flex-col justify-between h-full pt-[10px]">
                <button
                    onClick={() => handleEdit()}
                    type="button"
                    className="text-grayscale-900 flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] drop-shadow"
                >
                    <Pencil className="h-[60%]" />
                </button>
                <div className="flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] drop-shadow">
                    <TrashBin
                        className="h-[25px] w-[25px] text-grayscale-800"
                        onClick={() => handleDelete(media)}
                    />
                </div>
            </div>
        </div>
    );
};

export default BoostMediaCMSFormPhotoItem;
