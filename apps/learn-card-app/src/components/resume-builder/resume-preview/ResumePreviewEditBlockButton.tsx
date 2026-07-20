import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, pencilOutline } from 'ionicons/icons';

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
            <IonIcon icon={isEditing ? closeOutline : pencilOutline} />
        </button>
    );
};

export default ResumePreiewEditBlockButton;
