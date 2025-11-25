import React from 'react';

import { IonTextarea } from '@ionic/react';

import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useGetVCInfo } from 'learn-card-base';
import { EndorsementState } from './endorsement-state.helpers';

export const EndorsementQualificationsTextForm: React.FC<{
    endorsement: EndorsementState;
    setEndorsement: React.Dispatch<React.SetStateAction<EndorsementState>>;
    errors: Record<string, string[]>;
}> = ({ endorsement, setEndorsement, errors }) => {
    const handleStateChange = (key: string, value: string) => {
        setEndorsement(prevState => {
            return {
                ...prevState,
                [key]: value,
            };
        });
    };

    return (
        <div className="w-full flex flex-col items-start gap-2 justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] mt-4 shadow-bottom-2-4">
            <h4 className="text-sm text-indigo-500 font-semibold text-left">Optional</h4>
            <p className="text-[17px] text-grayscale-900 text-left">
                Share your qualifications that support this endorsement.
            </p>
            <IonTextarea
                autocapitalize="on"
                value={endorsement?.qualification}
                onIonInput={e => handleStateChange('qualification', e.detail.value)}
                placeholder="My qualifications include..."
                className={`bg-grayscale-100 font-poppins text-grayscale-800 rounded-[15px] px-[16px] py-[8px] text-[17px] mt-2
                    ${errors?.qualification ? 'border-red-300 border-2' : ''}
                `}
            />
        </div>
    );
};

export default EndorsementQualificationsTextForm;
