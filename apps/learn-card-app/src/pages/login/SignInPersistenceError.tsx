import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { useSignInPersistence } from '../../auth/signInPersistence';

export const SignInPersistenceError = (): React.ReactElement | null => {
    const error = useSignInPersistence(state => state.error);
    if (!error) return null;
    return (
        <div
            role="alert"
            className="font-poppins mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
        >
            <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />
            <span className="text-sm text-red-700 leading-relaxed">{error}</span>
        </div>
    );
};
