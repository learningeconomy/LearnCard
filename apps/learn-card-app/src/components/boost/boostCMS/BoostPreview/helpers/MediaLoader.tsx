import React from 'react';
import { IonSpinner } from '@ionic/react';

export const MediaLoader: React.FC<{ text: string }> = ({ text = 'Media' }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-grayscale-800">
            <IonSpinner name="crescent" color="grayscale-100" className="w-24 h-24" />
            <h1 className="text-[17px] text-white font-poppins mt-4 text-center font-semibold">
                Loading {text}...
            </h1>
        </div>
    );
};

export default MediaLoader;
