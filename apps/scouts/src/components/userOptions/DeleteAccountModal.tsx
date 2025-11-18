import React from 'react';
import { IonSpinner } from '@ionic/react';

const DeleteAccountModal: React.FC<{}> = () => {
    return (
        <div className="w-full shadow-soft-bottom bg-white flex items-center justify-center p-6 rounded-xl">
            <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
            <h1 className="font-medium text-lg text-grayscale-900">Deleting Account...</h1>
        </div>
    );
};

export default DeleteAccountModal;
