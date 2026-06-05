import React from 'react';

import WarningIcon from '../../../../svgs/WarningIcon';
import { useTranslation } from 'react-i18next';

export const BoostCMSAttachmentWarning: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col gap-[5px] items-center justify-center px-6 py-6">
            <WarningIcon className="!h-[30px] !w-[30px] text-grayscale-800" />
            <h4 className="text-grayscale-800 w-full text-center font-semibold text-lg">
                {t('boost.cms.media.attachmentRules', 'Media Attachment Rules')}
            </h4>
            <p className="text-grayscale-600 w-full text-base text-left">
                {t('boost.cms.media.attachmentRulesDescription', 'You can attach only one media type per credential:')}
                <ul className="list-disc my-2 text-left px-6">
                    <li>{t('boost.cms.media.oneDocument', 'One document')}</li>
                    <li>{t('boost.cms.media.oneVideo', 'One video')}</li>
                    <li>{t('boost.cms.media.oneOrMorePhotos', 'One or more photos')}</li>
                </ul>
                {t('boost.cms.media.mixingNotAllowed', 'Mixing types (like photo + video) isn\'t allowed.')}
            </p>
        </div>
    );
};

export default BoostCMSAttachmentWarning;
