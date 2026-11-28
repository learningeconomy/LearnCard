import React from 'react';
import { AppIcon } from 'learn-card-base/ui/icon';
import { closeOutline, pencilOutline } from 'learn-card-base/icons/ionicons';

import * as m from '../../../paraglide/messages.js';

export const ResumePreiewEditBlockButton: React.FC<{
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
}> = ({ isEditing, setIsEditing }) => {
    return (
        <button
            onClick={() => setIsEditing(!isEditing)}
            className={`shrink-0 rounded-lg border h-[28px] w-[28px] flex items-center justify-center ${
                isEditing
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-500'
                    : 'border-grayscale-200 bg-grayscale-100 text-grayscale-400'
            }`}
            title={
                isEditing
                    ? m['passport.resumeBuilder.editBlock.stopEditing']()
                    : m['passport.resumeBuilder.editBlock.edit']()
            }
        >
            <AppIcon icon={isEditing ? closeOutline : pencilOutline} />
        </button>
    );
};

export default ResumePreiewEditBlockButton;
