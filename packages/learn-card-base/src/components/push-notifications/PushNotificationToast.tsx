import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { notificationsOutline } from 'ionicons/icons';

export type PushNotificationToastProps = {
    title: string;
    body?: string;
    imageUrl?: string;
    onClick: () => void;
};

const FallbackIcon: React.FC = () => (
    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-emerald-50">
        <IonIcon icon={notificationsOutline} className="text-emerald-600 text-lg" />
    </span>
);

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
    title,
    body,
    imageUrl,
    onClick,
}) => {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = imageUrl && !imageFailed;

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center gap-3 text-left font-poppins"
        >
            <span className="shrink-0">
                {showImage ? (
                    <img
                        src={imageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={() => setImageFailed(true)}
                        className="h-9 w-9 rounded-full object-cover"
                    />
                ) : (
                    <FallbackIcon />
                )}
            </span>

            <span className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-grayscale-900 truncate">{title}</span>
                {body && <span className="text-xs text-grayscale-600 truncate">{body}</span>}
            </span>
        </button>
    );
};

export default PushNotificationToast;
