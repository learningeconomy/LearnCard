import React from 'react';

import { IonRow, IonCol, IonTextarea } from '@ionic/react';
import { BoostCMSState } from '../../../boost';

const BoostCMSNotesForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
}> = ({ state, setState }) => {
    const handleStateChange = (notes: any) => {
        setState({
            ...state,
            notes,
        });
    };

    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <IonCol size="12" className="w-full bg-white">
                <h1 className="font-poppins text-black text-xl p-0 m-0">Notes</h1>

                <div className="flex flex-col items-center justify-center w-full mb-2 mt-2">
                    <IonTextarea
                        autocapitalize="on"
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] px-[16px] py-[8px] font-medium tracking-widest text-base"
                        placeholder="Add a message..."
                        onIonInput={e => handleStateChange(e.detail.value)}
                    />
                </div>
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSNotesForm;
