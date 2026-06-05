import React from 'react';
import WarningIcon from '../../../../svgs/WarningIcon';

import { useModal } from 'learn-card-base';
import { useTranslation } from 'react-i18next';

export const BoostCMSMediaDisplayWarning: React.FC<{ handleShowMediaOptions: () => void }> = ({
    handleShowMediaOptions,
}) => {
    const { closeModal } = useModal();
    const { t } = useTranslation();
    return (
        <div className="flex flex-col gap-[5px] items-center justify-center px-6 py-6">
            <WarningIcon className="!h-[30px] !w-[30px] text-grayscale-800" />
            <h4 className="text-grayscale-800 w-full text-center font-semibold text-lg">
                {t('boost.cms.media.attachmentRequired', 'Media Attachment Required')}
            </h4>
            <p className="text-grayscale-600 w-full text-base">
                {t('boost.cms.media.attachmentRequiredDescription', 'This credential uses a media-based display. Please attach a document, image, or link to showcase.')}{' '}
                <span
                    role="button"
                    className="text-indigo-800 font-semibold"
                    onClick={() => {
                        closeModal();
                        handleShowMediaOptions();
                    }}
                >
                    {t('boost.cms.media.addMediaAttachment', 'Add media attachment')}
                </span>
            </p>
        </div>
    );
};

export default BoostCMSMediaDisplayWarning;
