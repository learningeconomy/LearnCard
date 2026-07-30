import React from 'react';

import WarningIcon from '../../../../svgs/WarningIcon';
import * as m from '../../../../../paraglide/messages.js';

export const BoostCMSAttachmentWarning: React.FC = () => {
    return (
        <div className="flex flex-col gap-[5px] items-center justify-center px-6 py-6">
            <WarningIcon className="!h-[30px] !w-[30px] text-grayscale-800" />
            <h4 className="text-grayscale-800 w-full text-center font-semibold text-lg">
                {m['boost.cms.media.attachmentRules']()}
            </h4>
            <p className="text-grayscale-600 w-full text-base text-left">
                {m['boost.cms.media.attachmentRulesDescription']()}
                <ul className="list-disc my-2 text-left px-6">
                    <li>{m['boost.cms.media.oneDocument']()}</li>
                    <li>{m['boost.cms.media.oneVideo']()}</li>
                    <li>{m['boost.cms.media.oneOrMorePhotos']()}</li>
                </ul>
                {m['boost.cms.media.mixingNotAllowed']()}
            </p>
        </div>
    );
};

export default BoostCMSAttachmentWarning;
