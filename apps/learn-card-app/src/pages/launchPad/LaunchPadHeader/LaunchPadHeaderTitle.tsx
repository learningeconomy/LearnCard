import React from 'react';

import { IonRow, IonCol } from '@ionic/react';

const LaunchPadHeaderTitle: React.FC = () => {
    return (
        <IonRow className="w-full flex items-center justify-center mt-[-50px] px-4">
            <IonCol className="flex items-center justify-start w-full max-w-[600px]">
                <h2 className="flex items-center justify-start text-grayscale-900 font-notoSans font-bold text-xl tracking-[0.01rem]">
                    Connections
                </h2>
            </IonCol>
        </IonRow>
    );
};

export default LaunchPadHeaderTitle;
