import React from 'react';

import { IonTextarea } from '@ionic/react';

import { VC } from '@learncard/types';
import { EndorsementState } from './endorsement-state.helpers';
import { CredentialCategoryEnum, useGetVCInfo } from 'learn-card-base';

export const EndorsementTextForm: React.FC<{
    credential: VC;
    categoryType: CredentialCategoryEnum;
    endorsement: EndorsementState;
    setEndorsement: React.Dispatch<React.SetStateAction<EndorsementState>>;
    errors: Record<string, string[]>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}> = ({ credential, categoryType, endorsement, setEndorsement, errors, setErrors }) => {
    const { title } = useGetVCInfo(credential, categoryType);

    const handleStateChange = (key: string, value: string) => {
        setErrors(prevState => {
            return {
                ...prevState,
                [key]: '',
            };
        });
        setEndorsement(prevState => {
            return {
                ...prevState,
                [key]: value,
            };
        });
    };

    return (
        <div className="w-full flex flex-col items-start justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] mt-4 shadow-bottom-2-4">
            <p className="text-[17px] text-grayscale-900 text-left mb-2">
                Write a brief message to support or confirm{' '}
                <span className="font-semibold">{title}</span>
            </p>
            <IonTextarea
                autocapitalize="on"
                value={endorsement?.description}
                onIonInput={e => handleStateChange('description', e.detail.value)}
                placeholder="Write endorsement..."
                className={`bg-grayscale-100 font-poppins text-grayscale-800 rounded-[15px] px-[16px] py-[8px] text-[17px] mb-1
                    ${errors?.description ? 'border-red-300 border-2' : ''}
                `}
            />
            {errors?.description && <p className="text-red-600 pl-2">{errors?.description}</p>}
        </div>
    );
};

export default EndorsementTextForm;
