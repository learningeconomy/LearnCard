import React, { useEffect, useRef, useState } from 'react';

import TrashBin from '../../../components/svgs/TrashBin';

import * as m from '../../../paraglide/messages.js';

type ResumePreviewEditableTextBlockProps = {
    value: string;
    placeholder: string;
    isEditing: boolean;
    isSelfAttested: boolean;
    showDefaultSummaryDecoration?: boolean;
    onRestoreDefault?: () => void;
    onChange?: (val: string) => void;
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

    const commit = () => onChange?.(draft.trim());

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
                onChange?.(e.target.value);
            },
            className: `w-full text-xs text-grayscale-700 px-2 py-1.5 outline-none resize-none leading-relaxed ${
                showDecoration ? 'bg-transparent rounded-none' : 'bg-indigo-50 rounded-lg'
            }`,
        };

        return (
            <div className="flex items-start justify-center gap-2 w-full my-1">
                <div className="flex-1">
                    {showDecoration ? (
                        <div className="bg-indigo-50 rounded-lg overflow-hidden">
                            <textarea {...(sharedProps as any)} rows={3} />
                            <div className="flex justify-end px-2 pb-1.5">
                                {isSelfAttested ? (
                                    <span className="text-grayscale-600 font-semibold text-xs">
                                        {m['passport.resumeBuilder.editable.edited']()}
                                        {onRestoreDefault && (
                                            <>
                                                <span className="mx-1 text-grayscale-600">•</span>
                                                <button
                                                    type="button"
                                                    className="text-indigo-600 font-semibold text-xs"
                                                    onClick={onRestoreDefault}
                                                >
                                                    {m[
                                                        'passport.resumeBuilder.editable.restoreDefault'
                                                    ]()}
                                                </button>
                                            </>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-grayscale-600 font-semibold text-xs">
                                        {m['passport.resumeBuilder.editable.defaultSummary']()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : multiline ? (
                        <textarea {...(sharedProps as any)} rows={2} />
                    ) : (
                        <input {...(sharedProps as any)} type="text" />
                    )}
                </div>
                {onRemove && (
                    <div className="flex items-center justify-center h-full">
                        <button
                            onClick={onRemove}
                            className="shrink-0 text-grayscale-700 bg-grayscale-100 rounded-[10px] p-1 leading-none"
                            title={m['passport.resumeBuilder.remove']()}
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
        <span
            className={`block w-full text-xs text-left leading-relaxed ${
                isSelfAttested ? 'text-grayscale-600' : 'text-grayscale-600'
            }`}
        >
            {value}
        </span>
    );
};

export default ResumePreviewEditableTextBlock;
