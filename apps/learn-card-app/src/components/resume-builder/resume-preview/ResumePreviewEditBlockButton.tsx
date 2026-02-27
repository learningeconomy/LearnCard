import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, pencilOutline } from 'ionicons/icons';

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
            title={isEditing ? 'Stop editing' : 'Edit'}
        >
            <IonIcon icon={isEditing ? closeOutline : pencilOutline} />
        </button>
    );
};

export default ResumePreiewEditBlockButton;
