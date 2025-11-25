import React from 'react';

import X from '../../svgs/X';
import { IonFooter } from '@ionic/react';

import { useModal } from 'learn-card-base';

export const NewAiSessionFooter: React.FC = () => {
    const { closeModal } = useModal();

    return (
        <IonFooter className="w-full bg-white flex items-center justify-center ion-padding border-t-[1px] border-grayscale-100">
            <button onClick={closeModal} className="rounded-full bg-white shadow-3xl p-4">
                <X className="text-grayscale-800 w-[20px] h-auto" strokeWidth="5" />
            </button>
        </IonFooter>
    );
};

export default NewAiSessionFooter;
