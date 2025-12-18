import React from 'react';

import { IonTextarea } from '@ionic/react';

import { EndorsementRequestState } from './endorsement-request.helpers';

export const EndorsementRequestTextForm: React.FC<{
    endorsementRequest: EndorsementRequestState;
    setEndorsementRequest: React.Dispatch<React.SetStateAction<EndorsementRequestState>>;
}> = ({ endorsementRequest, setEndorsementRequest }) => {
    const handleStateChange = (key: string, value: string) => {
        setEndorsementRequest(prevState => ({
            ...prevState,
            [key]: value,
        }));
    };

    return (
        <div className="w-full flex flex-col items-start justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] mt-4 shadow-bottom-2-4">
            <p className="text-[17px] text-grayscale-900 text-left mb-2">
                What would you like to say?
            </p>
            <IonTextarea
                autocapitalize="on"
                value={endorsementRequest?.text}
                onIonInput={e => handleStateChange('text', e.detail.value)}
                placeholder="Write endorsement..."
                className={`bg-grayscale-100 font-poppins text-grayscale-800 rounded-[15px] px-[16px] py-[8px] text-[17px] mb-1`}
            />
        </div>
    );
};

export default EndorsementRequestTextForm;
