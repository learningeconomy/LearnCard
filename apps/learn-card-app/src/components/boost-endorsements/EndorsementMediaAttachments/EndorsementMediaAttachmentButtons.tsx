import React from 'react';

import { IonProgressBar } from '@ionic/react';

import {
    EndorsementMediaOptionsEnum,
    endorsementMediaOptions,
} from '../EndorsementForm/endorsement-state.helpers';

export const EndorsementMediaAttachmentButtons: React.FC<{
    handleImageSelect: () => void;
    handleDocumentSelect: () => void;
    loadingProgress?: number | boolean;
    handleMediaTypeSelect?: (type: EndorsementMediaOptionsEnum) => void;
}> = ({ handleImageSelect, handleDocumentSelect, loadingProgress, handleMediaTypeSelect }) => {
    return (
        <div className="w-full flex flex-col items-start gap-2 justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] shadow-bottom-2-4">
            <div className="w-full flex items-center justify-center text-grayscale-900">
                <h4 className="text-[22px] text-gray-900 font-poppins">Select Media Type</h4>
            </div>

            {loadingProgress && (
                <div className="w-full px-4">
                    <IonProgressBar
                        color="grayscale-800"
                        value={(loadingProgress as number) / 100}
                    />
                    <p className="mt-2 text-sm font-medium text-grayscale-900">
                        {loadingProgress}% uploaded
                    </p>
                </div>
            )}

            <div className="w-full flex flex-wrap items-center justify-center">
                {endorsementMediaOptions.map(({ id, type, title, color, Icon }) => {
                    let styles = '';

                    const handleMediaSelect = () => {
                        if (type === EndorsementMediaOptionsEnum.photo) {
                            handleImageSelect();
                        }
                        if (type === EndorsementMediaOptionsEnum.document) {
                            handleDocumentSelect();
                        }
                        if (
                            type !== EndorsementMediaOptionsEnum.photo &&
                            type !== EndorsementMediaOptionsEnum.document
                        ) {
                            handleMediaTypeSelect?.(type);
                        }
                    };

                    return (
                        <button
                            key={id}
                            className={`flex flex-col items-center justify-center text-center ion-padding h-[122px] m-2 bg-grayscale-100 rounded-[20px] ${styles} w-[45%] xs:!w-[60%]`}
                            onClick={handleMediaSelect}
                        >
                            <Icon
                                version="outlined"
                                className="h-[40px] text-grayscale-800 max-h-[40px] max-w-[40px]"
                            />
                            <p className="font-poppins text-grayscale-800 text-xl tracking-wider">
                                {title}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default EndorsementMediaAttachmentButtons;
