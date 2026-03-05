import React, { useEffect, useRef, useState } from 'react';

import TrashBin from '../../../components/svgs/TrashBin';

type ResumePreviewEditableTextBlockProps = {
    value: string;
    placeholder: string;
    isEditing: boolean;
    isSelfAttested: boolean;
    showDefaultSummaryDecoration?: boolean;
    onRestoreDefault?: () => void;
    onChange: (val: string) => void;
    onRemove?: () => void;
    multiline?: boolean;
};

const ResumePreviewEditableTextBlock: React.FC<ResumePreviewEditableTextBlockProps> = ({
    value,
    placeholder,
    isEditing,
    isSelfAttested,
    showDefaultSummaryDecoration,
    onRestoreDefault,
    onChange,
    onRemove,
    multiline,
}) => {
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
    const showDecoration = multiline && showDefaultSummaryDecoration;

    const commit = () => onChange(draft.trim());

    useEffect(() => {
        setDraft(value);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            commit();
        }
    };

    if (isEditing) {
        const sharedProps = {
            ref: inputRef as any,
            value: draft,
            placeholder,
            onKeyDown: handleKeyDown,
            onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
                setDraft(e.target.value);
                onChange(e.target.value);
            },
            className: `w-full text-xs text-grayscale-700 bg-indigo-50 rounded-lg px-2 py-1.5 outline-none resize-none leading-relaxed ${
                showDecoration ? 'pb-7' : ''
            }`,
        };

        return (
            <div className="flex items-start justify-center gap-2 w-full my-1">
                {!multiline && (
                    <span className="text-xs text-grayscale-900 leading-relaxed shrink-0 mt-2">
                        •
                    </span>
                )}
                <div className="relative flex-1">
                    {multiline ? (
                        <textarea {...(sharedProps as any)} rows={3} />
                    ) : (
                        <input {...(sharedProps as any)} type="text" />
                    )}
                    {showDecoration && (
                        <div className="absolute bottom-2 right-2 bg-indigo-50 p-1">
                            {isSelfAttested ? (
                                <span className="text-grayscale-600 font-semibold text-xs">
                                    Edited
                                    {onRestoreDefault && (
                                        <>
                                            <span className="mx-1 text-grayscale-600">•</span>
                                            <button
                                                type="button"
                                                className="text-indigo-600 font-semibold text-xs"
                                                onClick={onRestoreDefault}
                                            >
                                                Restore Default
                                            </button>
                                        </>
                                    )}
                                </span>
                            ) : (
                                <span className="text-grayscale-600 font-semibold text-xs">
                                    Default Summary
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {onRemove && (
                    <div className="flex items-center justify-center h-full">
                        <button
                            onClick={onRemove}
                            className="shrink-0 text-grayscale-700 bg-grayscale-100 rounded-[10px] p-1 leading-none"
                            title="Remove"
                        >
                            <TrashBin className="w-[24px] h-[24px]" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (!value) return null;

    return (
        <div className="flex items-start gap-1 w-full">
            <span className="text-xs text-grayscale-600 leading-relaxed shrink-0">–</span>
            <span
                className={`text-xs text-left leading-relaxed flex-1 ${
                    isSelfAttested ? 'text-grayscale-600' : 'text-grayscale-600'
                }`}
            >
                {value}
            </span>
        </div>
    );
};

export default ResumePreviewEditableTextBlock;
