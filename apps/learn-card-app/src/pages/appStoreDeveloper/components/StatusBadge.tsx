import React from 'react';

import { STATUS_INFO, type AppListingStatus } from '../types';

interface StatusBadgeProps {
    status: AppListingStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const info = STATUS_INFO[status];

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.bgColor} ${info.color}`}>
            {info.label}
        </span>
    );
};
