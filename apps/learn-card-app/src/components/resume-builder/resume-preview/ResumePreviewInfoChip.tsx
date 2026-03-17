import React from 'react';

import X from '../../svgs/X';
import { LinkedInIcon } from '../../svgs/LinkedInIcon';

import { PersonalDetails, UserInfoEnum, getLinkedInHandle } from '../resume-builder.helpers';
import { formatPhoneForDisplay } from './resume-preview.helpers';

export const ResumePreviewInfoChip: React.FC<{
    detailKey: keyof PersonalDetails;
    placeholder?: string;
    value: string;
    onChange?: (key: keyof PersonalDetails, value: string) => void;
    onRemove?: (key: keyof PersonalDetails) => void;
}> = ({ detailKey, placeholder, value, onChange, onRemove }) => {
    const displayValue =
        !onChange && detailKey === UserInfoEnum.Phone ? formatPhoneForDisplay(value) : value;

    return (
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-grayscale-800 text-xs font-semibold px-3 py-1.5">
            {detailKey === UserInfoEnum.LinkedIn && <LinkedInIcon className="w-4 h-4 shrink-0" />}
            {onChange ? (
                <input
                    value={value}
                    onChange={event => onChange(detailKey, event.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder || detailKey}
                    className="truncate min-w-[120px] max-w-[260px] bg-transparent border-none outline-none placeholder:text-grayscale-500 text-xs font-semibold text-grayscale-800"
                />
            ) : detailKey === UserInfoEnum.LinkedIn ? (
                <span className="truncate max-w-[260px]">/{getLinkedInHandle(value)}</span>
            ) : (
                <span className="truncate max-w-[260px]">{displayValue}</span>
            )}
            {onRemove && Boolean(value.trim()) && (
                <button
                    data-pdf-hide
                    className="text-grayscale-500 hover:text-grayscale-800 leading-none"
                    onClick={() => onRemove(detailKey)}
                    aria-label={`Remove ${detailKey}`}
                >
                    <X className="w-4 h-4 text-grayscale-800" />
                </button>
            )}
        </div>
    );
};

export default ResumePreviewInfoChip;
