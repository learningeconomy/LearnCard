import React from 'react';

import { useModal, ModalTypes } from 'learn-card-base';
import SlimCaretRight from '../../svgs/SlimCaretRight';
import TroopsCMSWrapper from '../TroopsCMSWrapper';

import { TroopsCMSViewModeEnum } from '../troopCMSState';

const TroopIDTypeSelectorListItem: React.FC<{
    idType: {
        title: string;
        altTitle?: string;
        Icon: React.FC<{ className?: string }>;
        image: string;
        backgroundImage: string;
        color: string;
        type: TroopsCMSViewModeEnum;
    };
    isFirst: boolean;
    isLast: boolean;
    parentUri?: string | undefined;
    handleCloseModal: () => void;
    onSuccess?: (boostUri?: string) => void;
}> = ({ idType, isFirst, isLast, parentUri, handleCloseModal, onSuccess }) => {
    const { newModal: openFullScreen, closeModal: closeFullScreen } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const { Icon, color, title } = idType;

    return (
        <div className="w-full px-2">
            <button
                onClick={() => {
                    openFullScreen(
                        <TroopsCMSWrapper
                            handleCloseModal={closeFullScreen}
                            viewMode={idType?.type}
                            parentUri={parentUri}
                            onSuccess={onSuccess}
                        />
                    );
                    handleCloseModal();
                }}
                className={`w-full flex items-center justify-between border-solid border-b-[1px] px-2 border-b-grayscale-200 py-4 ${
                    isFirst && !isLast ? 'pb-4' : ''
                } ${isFirst && isLast ? 'border-none p-0' : ''} ${
                    isLast ? 'border-none pb-2' : ''
                }`}
            >
                <div className="flex items-center justify-start">
                    <div className="max-w-[30px] max-h-[30px] min-h-[30px] min-w-[30px] object-contain rounded-full bg-white mr-2">
                        <Icon className={`h-[30px] w-[30px] text-${color}`} />
                    </div>
                    <div className="flex flex-col items-start justify-center">
                        <p className="m-0 p-0 text-lg text-left font-notoSans text-grayscale-900">
                            {title}
                        </p>
                    </div>
                </div>

                <SlimCaretRight className="w-[20px] h-auto text-grayscale-400" strokeWidth="1" />
            </button>
        </div>
    );
};

export default TroopIDTypeSelectorListItem;
