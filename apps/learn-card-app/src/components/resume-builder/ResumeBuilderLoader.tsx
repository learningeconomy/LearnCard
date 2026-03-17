import React from 'react';

import { IonSpinner } from '@ionic/react';

export const ResumeBuilderLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full ">
            <IonSpinner
                name="crescent"
                color="indigo-600"
                style={{ width: '50px', height: '50px' }}
            />
            <div className="text-center text-xl font-medium text-grayscale-800 mt-4">
                Building your resume...
            </div>
        </div>
    );
};

export default ResumeBuilderLoader;
