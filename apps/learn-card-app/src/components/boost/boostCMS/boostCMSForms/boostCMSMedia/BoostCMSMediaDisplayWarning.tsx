import React from 'react';
import WarningIcon from '../../../../svgs/WarningIcon';

import { useModal } from 'learn-card-base';
import * as m from '../../../../../paraglide/messages.js';

export const BoostCMSMediaDisplayWarning: React.FC<{ handleShowMediaOptions: () => void }> = ({
    handleShowMediaOptions,
}) => {
    const { closeModal } = useModal();
    return (
        <div className="flex flex-col gap-[5px] items-center justify-center px-6 py-6">
            <WarningIcon className="!h-[30px] !w-[30px] text-grayscale-800" />
            <h4 className="text-grayscale-800 w-full text-center font-semibold text-lg">
                {m['boost.cms.media.attachmentRequired']()}
            </h4>
            <p className="text-grayscale-600 w-full text-base">
                {m['boost.cms.media.attachmentRequiredDescription']()}{' '}
                <span
                    role="button"
                    className="text-indigo-800 font-semibold"
                    onClick={() => {
                        closeModal();
                        handleShowMediaOptions();
                    }}
                >
                    {m['boost.cms.media.addMediaAttachment']()}
                </span>
            </p>
        </div>
    );
};

export default BoostCMSMediaDisplayWarning;
