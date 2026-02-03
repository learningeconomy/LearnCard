import { IonSpinner } from '@ionic/react';
import React from 'react';
import { ScoutsLogo } from 'learn-card-base';

const LoggingOutModal: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[40px] w-full max-w-[340px] shadow-2xl border border-gray-50">
            <div className="relative flex items-center justify-center mb-10">
                <style>
                    {`
                        ion-spinner {
                            --stroke-width: 2px !important;
                        }
                        ion-spinner svg, ion-spinner circle {
                            stroke-width: 2px !important;
                        }
                    `}
                </style>
                <IonSpinner
                    name="crescent"
                    className="w-28 h-28 text-sp-purple-base"
                />
                <ScoutsLogo className="w-14 h-14 absolute" />
            </div>
            <div className="font-rubik text-grayscale-900 font-medium text-xl text-center">
                Logging out...
            </div>
        </div>
    );
};

export default LoggingOutModal;
