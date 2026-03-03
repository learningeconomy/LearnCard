import React from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export type StatusType = 'ready' | 'warning' | 'loading' | 'incomplete';

interface StatusIndicatorProps {
    status: StatusType;
    label: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const STATUS_STYLES: Record<StatusType, { bg: string; text: string; icon: React.ReactNode }> = {
    ready: {
        bg: 'bg-emerald-50 border-emerald-200',
        text: 'text-emerald-700',
        icon: <Check className="w-4 h-4 text-emerald-600" />,
    },
    warning: {
        bg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-700',
        icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
    },
    loading: {
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-600',
        icon: <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />,
    },
    incomplete: {
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-500',
        icon: <div className="w-4 h-4 rounded-full border-2 border-gray-300" />,
    },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
    status,
    label,
    description,
    action,
}) => {
    const styles = STATUS_STYLES[status];

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${styles.bg}`}>
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                {styles.icon}
            </div>

            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${styles.text}`}>{label}</p>

                {description && (
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                )}
            </div>

            {action && (
                <button
                    onClick={action.onClick}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default StatusIndicator;
