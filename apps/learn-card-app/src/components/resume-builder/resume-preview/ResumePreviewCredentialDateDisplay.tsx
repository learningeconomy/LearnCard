import React from 'react';

import Calendar from '../../svgs/Calendar';

type ResumePreviewCredentialDateDisplayProps = {
    isEditing: boolean;
    startLabel?: string;
    formattedStartDate: string;
    formattedEndDate: string;
    dateLabel: string;
    onOpenStartDatePicker: () => void;
    onOpenEndDatePicker: () => void;
};

const ResumePreviewCredentialDateDisplay: React.FC<ResumePreviewCredentialDateDisplayProps> = ({
    isEditing,
    startLabel,
    formattedStartDate,
    formattedEndDate,
    dateLabel,
    onOpenStartDatePicker,
    onOpenEndDatePicker,
}) => {
    if (!startLabel && !formattedStartDate && !formattedEndDate && !dateLabel) return null;

    return (
        <div className="flex items-center gap-1">
            {!isEditing ? (
                <span className="block sm:inline font-medium text-grayscale-600 leading-tight">
                    {dateLabel ? `• ${dateLabel}` : ''}
                </span>
            ) : (
                <>
                    <button
                        data-pdf-hide
                        type="button"
                        onClick={onOpenStartDatePicker}
                        className="ml-1 sm:mt-0 inline-flex items-center gap-2 rounded-[10px] bg-indigo-50 px-3 py-1.5"
                    >
                        <span className="font-medium text-sm text-grayscale-900">
                            {formattedStartDate || startLabel || 'Start date'}
                        </span>
                        <Calendar className="w-5 h-5 text-grayscale-900" />
                    </button>
                    <button
                        data-pdf-hide
                        type="button"
                        onClick={onOpenEndDatePicker}
                        className="ml-1 sm:mt-0 inline-flex items-center gap-2 rounded-[10px] bg-indigo-50 px-3 py-1.5"
                    >
                        <span className="font-medium text-sm text-grayscale-900">
                            {formattedEndDate || 'End date'}
                        </span>
                        <Calendar className="w-5 h-5 text-grayscale-900" />
                    </button>
                </>
            )}
            <span
                data-pdf-export-inline
                style={{ display: 'none' }}
                className="font-medium text-grayscale-600"
            >
                {dateLabel ? `• ${dateLabel}` : ''}
            </span>
        </div>
    );
};

export default ResumePreviewCredentialDateDisplay;
