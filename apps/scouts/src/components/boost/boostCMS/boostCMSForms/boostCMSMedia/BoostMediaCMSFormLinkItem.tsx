import React from 'react';
import { BoostMediaOptionsEnum } from '../../../boost';
import Pencil from '../../../../svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import { CreateMediaAttachmentFormModal } from './CreateMediaAttachmentForm';
import { BoostMediaCMSFormItemProps } from './BoostCMSMediaForm';
import { useModal, ModalTypes } from 'learn-card-base';

const BoostMediaCMSFormLinkItem: React.FC<BoostMediaCMSFormItemProps> = ({
    index,
    media,
    setState,
    state,
}) => {
    const { newModal: newEditModal, closeModal: closeEditModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Cancel,
    });

    const handleEdit = () => {
        newEditModal(
            <CreateMediaAttachmentFormModal
                initialState={state}
                initialMedia={media}
                initialIndex={index}
                setParentState={setState}
                hideBackButton={true}
                initialActiveMediaType={BoostMediaOptionsEnum.link}
                handleCloseModal={() => closeEditModal()}
                showCloseButton={false}
                title={
                    <p className="flex items-center justify-center text-xl w-full h-full text-grayscale-900">
                        Media Attachment
                    </p>
                }
            />
        );
    };

    return (
        <div
            key={index}
            className="w-full bg-grayscale-100 ion-padding rounded-[20px] relative mt-[20px] py-6"
        >
            <a
                href={media.url || ''}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full text-decoration-none"
                style={{ textDecoration: 'none' }}
            >
                <div className="flex items-center justify-start">
                    <LinkChain className="text-indigo-500 h-[35px] w-[35px] mr-1" />
                    <div className="flex items-start justify-center text-left ml-2 flex-col flex-grow">
                        <p className="text-grayscale-800 text-xs text-left line-clamp-1 break-all font-notoSans">
                            {media.title}
                        </p>
                        <span className="line-clamp-1 text-indigo-600 text-base font-semibold font-notoSans">
                            Visit Link
                        </span>
                    </div>
                </div>
            </a>
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
                        onClick={e => {
                            e.stopPropagation();
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

export default BoostMediaCMSFormLinkItem;
