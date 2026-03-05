import React from 'react';

import Calendar from '../../svgs/Calendar';

type ResumePreviewCredentialDateDisplayProps = {
    isWorkExperienceSection: boolean;
    createdAt?: string;
    isCurrentJob: boolean;
    formattedEndDate: string;
    dateLabel: string;
    onOpenInlineDatePicker: () => void;
};

const ResumePreviewCredentialDateDisplay: React.FC<ResumePreviewCredentialDateDisplayProps> = ({
    isWorkExperienceSection,
    createdAt,
    isCurrentJob,
    formattedEndDate,
    dateLabel,
    onOpenInlineDatePicker,
}) => {
    if (!isWorkExperienceSection) {
        if (!dateLabel) return null;
        return <span className="font-medium text-grayscale-600">• {dateLabel}</span>;
    }

    if (!createdAt) return null;

    return (
        <>
            <span className="font-medium text-grayscale-600">
                • {createdAt}
                {isCurrentJob && ' - Present'}
                {!isCurrentJob && ' -'}
            </span>
            {!isCurrentJob && (
                <button
                    data-pdf-hide
                    type="button"
                    onClick={onOpenInlineDatePicker}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-indigo-50 px-3 py-1.5"
                >
                    <span className="font-medium text-grayscale-900">
                        {formattedEndDate || 'End date'}
                    </span>
                    <Calendar className="w-5 h-5 text-grayscale-900" />
                </button>
            )}
            {!isCurrentJob && Boolean(dateLabel) && (
                <span
                    data-pdf-export-inline
                    style={{ display: 'none' }}
                    className="font-medium text-grayscale-600"
                >
                    • {dateLabel}
                </span>
            )}
        </>
    );
};

export default ResumePreviewCredentialDateDisplay;
