import React from 'react';
import WarningIcon from '../../../../svgs/WarningIcon';

import { useModal } from 'learn-card-base';

export const BoostCMSMediaDisplayWarning: React.FC<{ handleShowMediaOptions: () => void }> = ({
    handleShowMediaOptions,
}) => {
    const { closeModal } = useModal();
    return (
        <div className="flex flex-col gap-[5px] items-center justify-center px-6 py-6">
            <WarningIcon className="!h-[30px] !w-[30px] text-grayscale-800" />
            <h4 className="text-grayscale-800 w-full text-center font-semibold text-lg">
                Media Attachment Required
            </h4>
            <p className="text-grayscale-600 w-full text-base">
                This credential uses a media-based display. Please attach a document, image, or link
                to showcase.{' '}
                <span
                    role="button"
                    className="text-indigo-800 font-semibold"
                    onClick={() => {
                        closeModal();
                        handleShowMediaOptions();
                    }}
                >
                    Add media attachment
                </span>
            </p>
        </div>
    );
};

export default BoostCMSMediaDisplayWarning;
