import React from 'react';
import type { AppListingStatus } from '../../types/app-store';
import { STATUS_INFO } from '../../types/app-store';

interface StatusBadgeProps {
    status: AppListingStatus;
    size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
    const info = STATUS_INFO[status];

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full ${info.color} ${info.bgColor} ${
                size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
            }`}
        >
            {info.label}
        </span>
    );
};
