import React from 'react';
import { IonSpinner } from '@ionic/react';

const LoggingOutPanel: React.FC<{ isLoggingOut: boolean }> = ({ isLoggingOut }) => {
    if (!isLoggingOut) return null;

    return (
        <div className="mx-auto mt-2 flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-[12px] px-3 py-2 w-full max-w-[420px]">
            <IonSpinner name="crescent" className="w-[18px] h-[18px]" />
            <span className="text-[14px]">
                Logging out... Please get a parent or guardian to login.
            </span>
        </div>
    );
};

export default LoggingOutPanel;
