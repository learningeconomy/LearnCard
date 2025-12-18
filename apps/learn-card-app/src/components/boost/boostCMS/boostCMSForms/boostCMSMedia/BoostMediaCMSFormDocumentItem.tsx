import React from 'react';

import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';
import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import FileIcon from 'learn-card-base/svgs/FileIcon';

import { BoostMediaOptionsEnum } from '../../../boost';
import { BoostMediaCMSFormItemProps } from './BoostCMSMediaForm';

import { ModalTypes, useModal } from 'learn-card-base';
import useTheme from '../../../../../theme/hooks/useTheme';

const BoostMediaCMSFormDocumentItem: React.FC<BoostMediaCMSFormItemProps> = ({
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

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleEdit = () => {
        newModal(
            <div className="w-full flex flex-col items-center justify-center">
                <CreateMediaAttachmentForm
                    initialState={state}
                    initialMedia={media}
                    initialIndex={index}
                    setParentState={setState}
                    hideBackButton={true}
                    initialActiveMediaType={BoostMediaOptionsEnum.document}
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
            className="flex items-center justify-between w-full bg-grayscale-100 mt-[20px] ion-padding rounded-[20px] relative"
        >
            <a
                href={media.url || ''}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-start w-full text-decoration-none"
                style={{ textDecoration: 'none' }}
            >
                <FileIcon className="text-[#FF3636] h-[50px] w-[50px] mr-1" />
                <div className="flex items-start justify-center text-left ml-2 flex-col flex-grow">
                    <p className="text-grayscale-800 text-xs text-left line-clamp-1">
                        {media.title}
                    </p>
                    <div className="w-full overflow-hidden">
                        <span
                            className={`line-clamp-1 text-${primaryColor} text-base font-semibold`}
                        >
                            View Document
                        </span>
                    </div>
                </div>
            </a>
            <div className="absolute right-1 bottom-1 z-30 cursor-pointer flex flex-col justify-between h-full pt-[10px]">
                <button
                    onClick={() => handleEdit()}
                    type="button"
                    className="text-grayscale-900 flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] drop-shadow"
                >
                    <Pencil className="h-[60%]" />
                </button>
                <div className="flex items-center justify-center bg-white rounded-full h-[35px] w-[35px] cursor-pointer drop-shadow">
                    <TrashBin
                        className="h-[25px] w-[25px] text-grayscale-800"
                        onClick={e => {
                            e.preventDefault();
                            setState(state => ({
                                ...state,
                                mediaAttachments: state.mediaAttachments.filter(
                                    a => a.url !== media.url
                                ),
                            }));
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default BoostMediaCMSFormDocumentItem;
