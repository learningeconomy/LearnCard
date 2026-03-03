import React from 'react';

export interface StatItem {
    label: string;
    value: string | number;
    icon: React.ElementType;
    iconBgColor: string;
    iconColor: string;
}

interface QuickStatsProps {
    stats: StatItem[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${stat.iconBgColor} rounded-lg flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                        </div>

                        <div>
                            <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
