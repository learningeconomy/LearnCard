import React from 'react';

type ResumePreviewCurrentJobSelectorProps = {
    isSelected: boolean;
    onClick: () => void;
};

const ResumePreviewCurrentJobSelector: React.FC<ResumePreviewCurrentJobSelectorProps> = ({
    isSelected,
    onClick,
}) => {
    if (isSelected) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-emerald-50 px-2 py-1.5"
                aria-pressed={isSelected}
            >
                <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-white" />
                </span>
                <span className="text-xs leading-none font-semibold text-grayscale-800">
                    Current Job
                </span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-grayscale-50 px-2 py-1.5"
            aria-pressed={isSelected}
        >
            <span className="h-4 w-4 rounded-full bg-grayscale-300" />
            <span className="text-xs leading-none font-semibold text-grayscale-500">
                Current Job
            </span>
        </button>
    );
};

export default ResumePreviewCurrentJobSelector;
