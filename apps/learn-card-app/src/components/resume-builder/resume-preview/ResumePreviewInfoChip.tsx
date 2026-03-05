import React from 'react';

import X from '../../svgs/X';
import { LinkedInIcon } from '../../svgs/LinkedInIcon';

import { PersonalDetails, UserInfoEnum, getLinkedInHandle } from '../resume-builder.helpers';

export const ResumePreviewInfoChip: React.FC<{
    detailKey: keyof PersonalDetails;
    value: string;
    onRemove: (key: keyof PersonalDetails) => void;
}> = ({ detailKey, value, onRemove }) => {
    return (
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-grayscale-800 text-xs font-semibold px-3 py-1.5">
            {detailKey === UserInfoEnum.LinkedIn ? (
                <>
                    <LinkedInIcon className="w-4 h-4" />
                    <span className="truncate max-w-[260px]">/{getLinkedInHandle(value)}</span>
                </>
            ) : (
                <span className="truncate max-w-[260px]">{value}</span>
            )}
            <button
                data-pdf-hide
                className="text-grayscale-500 hover:text-grayscale-800 leading-none"
                onClick={() => onRemove(detailKey)}
                aria-label={`Remove ${detailKey}`}
            >
                <X className="w-4 h-4 text-grayscale-800" />
            </button>
        </div>
    );
};

export default ResumePreviewInfoChip;
