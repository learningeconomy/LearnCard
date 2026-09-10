import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { m } from '../../paraglide/messages.js';

interface RecoveryPinResetBannerProps {
    onDismiss: () => void;
}

export const RecoveryPinResetBanner: React.FC<RecoveryPinResetBannerProps> = ({ onDismiss }) => {
    const history = useHistory();

    return (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5 shadow-lg">
            <IonIcon icon={alertCircleOutline} className="text-amber-500 text-lg mt-0.5 shrink-0" />
            <div className="flex-1">
                <p className="text-sm text-amber-800 leading-relaxed">
                    {m['recovery.pin.resetBanner']()}
                    <button
                        onClick={() => {
                            onDismiss();
                            history.push('/settings/security');
                        }}
                        className="font-medium underline hover:text-amber-900"
                    >
                        {m['recovery.pin.setAgain']()}
                    </button>
                    .
                </p>
            </div>
            <button
                onClick={onDismiss}
                className="p-1 text-amber-500 hover:text-amber-700 transition-colors"
                aria-label="Dismiss"
            >
                <IonIcon icon={closeOutline} className="text-lg" />
            </button>
        </div>
    );
};
