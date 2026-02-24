import React, { useRef, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';

type ResumePreviewEditableTextBlockProps = {
    value: string;
    placeholder: string;
    isEditing: boolean;
    isSelfAttested: boolean;
    onChange: (val: string) => void;
    onRemove?: () => void;
    multiline?: boolean;
};

const ResumePreviewEditableTextBlock: React.FC<ResumePreviewEditableTextBlockProps> = ({
    value,
    placeholder,
    isEditing,
    isSelfAttested,
    onChange,
    onRemove,
    multiline,
}) => {
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

    const commit = () => onChange(draft.trim());

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
            className:
                'w-full text-xs text-grayscale-700 bg-indigo-50 rounded-lg px-2 py-1.5 outline-none resize-none leading-relaxed',
        };

        return (
            <div className="flex items-start justify-center gap-2 w-full">
                {multiline ? (
                    <textarea {...(sharedProps as any)} rows={3} />
                ) : (
                    <input {...(sharedProps as any)} type="text" />
                )}
                {onRemove && (
                    <div className="flex items-center justify-center h-full mt-[4px]">
                        <button
                            onClick={onRemove}
                            className="shrink-0 text-grayscale-300 leading-none"
                            title="Remove"
                        >
                            <IonIcon icon={trashOutline} className="w-[24px] h-[24px]" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (!value) return null;

    return (
        <div className="flex items-start gap-1 w-full">
            <span
                className={`text-xs leading-relaxed flex-1 ${
                    isSelfAttested ? 'text-grayscale-600' : 'text-grayscale-600'
                }`}
            >
                {value}
            </span>
        </div>
    );
};

export default ResumePreviewEditableTextBlock;
