import { IonSpinner } from '@ionic/react';
import React from 'react';

const LoggingOutModal: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl">
            <IonSpinner name="crescent" className="w-10 h-10 mb-4 text-primary" />
            <div className="text-lg font-medium text-gray-800">Logging out...</div>
        </div>
    );
};

export default LoggingOutModal;
