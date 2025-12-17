import React from 'react';
import { useIonModal } from '@ionic/react';

import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';

import { BoostMediaOptionsEnum } from '../../../boost';
import { BoostMediaCMSFormItemProps } from './BoostCMSMediaForm';

import useTheme from '../../../../../theme/hooks/useTheme';
import { useModal, ModalTypes } from 'learn-card-base';

const BoostMediaCMSFormLinkItem: React.FC<BoostMediaCMSFormItemProps> = ({
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
                    initialActiveMediaType={BoostMediaOptionsEnum.link}
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
            className="w-full bg-grayscale-100 ion-padding rounded-[20px] relative mt-[20px]"
        >
            <a
                href={media.url || ''}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full text-decoration-none"
                style={{ textDecoration: 'none' }}
            >
                <div className="flex items-center justify-start">
                    <LinkChain className={`text-${primaryColor} h-[50px] w-[50px] mr-1`} />
                    <div className="flex items-start justify-center text-left ml-2 flex-col flex-grow">
                        <p className="text-grayscale-800 text-xs text-left line-clamp-1 break-all">
                            {media.title}
                        </p>
                        <span
                            className={`line-clamp-1 text-${primaryColor} text-base font-semibold`}
                        >
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
