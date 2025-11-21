import React from 'react';

import WarningIcon from '../../../../svgs/WarningIcon';

export const BoostCMSAttachmentWarning: React.FC = () => {
    return (
        <div className="flex flex-col gap-[5px] items-center justify-center px-6 py-6">
            <WarningIcon className="!h-[30px] !w-[30px] text-grayscale-800" />
            <h4 className="text-grayscale-800 w-full text-center font-semibold text-lg">
                Media Attachment Rules
            </h4>
            <p className="text-grayscale-600 w-full text-base text-left">
                You can attach <strong>only one media type</strong> per credential:
                <ul className="list-disc my-2 text-left px-6">
                    <li>One document</li>
                    <li>One video</li>
                    <li>One or more photos</li>
                </ul>
                Mixing types (like photo + video) isn’t allowed.
            </p>
        </div>
    );
};

export default BoostCMSAttachmentWarning;
