import React from 'react';
import { IonIcon } from '@ionic/react';
import { notificationsOutline } from 'ionicons/icons';

export type PushNotificationToastProps = {
    title: string;
    body?: string;
    onClick: () => void;
};

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
    title,
    body,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 text-left font-poppins"
    >
        <span className="flex items-center justify-center shrink-0 h-9 w-9 rounded-full bg-emerald-50">
            <IonIcon icon={notificationsOutline} className="text-emerald-600 text-lg" />
        </span>

        <span className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-grayscale-900 truncate">{title}</span>
            {body && <span className="text-xs text-grayscale-600 truncate">{body}</span>}
        </span>
    </button>
);

export default PushNotificationToast;
