import React from 'react';

import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';

type PendingApprovalBannerProps = {
    className?: string;
};

const PendingApprovalBanner: React.FC<PendingApprovalBannerProps> = ({ className = '' }) => (
    <div
        role="status"
        className={`mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 font-poppins ${className}`}
    >
        <IonIcon icon={alertCircleOutline} className="text-amber-600 text-lg mt-0.5 shrink-0" />
        <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Pending guardian approval</p>
            <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                Your account is waiting for your parent or guardian to approve it. We've emailed
                them a link — some features stay limited until they confirm.
            </p>
        </div>
    </div>
);

export default PendingApprovalBanner;
