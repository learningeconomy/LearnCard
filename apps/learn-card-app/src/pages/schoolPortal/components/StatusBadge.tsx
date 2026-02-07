import React from 'react';
import { Loader2 } from 'lucide-react';

import type { ConnectionStatus } from '../types';

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; bgColor: string }> = {
    CONNECTED: { label: 'Connected', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
    SYNCING: { label: 'Syncing', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    PENDING_APPROVAL: { label: 'Pending Approval', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    ERROR: { label: 'Error', color: 'text-red-700', bgColor: 'bg-red-100' },
};

interface StatusBadgeProps {
    status: ConnectionStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = STATUS_CONFIG[status];

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
        >
            {status === 'SYNCING' && <Loader2 className="w-3 h-3 animate-spin" />}
            {config.label}
        </span>
    );
};
