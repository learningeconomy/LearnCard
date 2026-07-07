import React from 'react';

import type { DataSharingDiagnosticsViewModel } from '../DataSharingCenter.types';
import GlassCard from './GlassCard';
import SettingRow from './SettingRow';

type AppDiagnosticsCardProps = DataSharingDiagnosticsViewModel & { delay?: number };

const AppDiagnosticsCard: React.FC<AppDiagnosticsCardProps> = ({
    brandName,
    analyticsEnabled,
    bugReportsEnabled,
    disabled = false,
    lockedNote,
    onToggleAnalytics,
    onToggleBugReports,
    delay = 0,
}) => (
    <div
        className="animate-fade-in-up"
        style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
    >
        <div className="px-1 mb-2">
            <h3 className="text-[15px] font-semibold text-grayscale-900">App diagnostics</h3>
            <p className="text-sm text-grayscale-600">
                Anonymous data that helps us fix and improve things.
            </p>
        </div>

        <GlassCard className="overflow-hidden divide-y divide-grayscale-100">
            <SettingRow
                title="Usage Analytics"
                description={`Help improve ${brandName} by sharing anonymous app usage data.`}
                checked={analyticsEnabled}
                disabled={disabled}
                lockedNote={lockedNote}
                onChange={onToggleAnalytics}
            />
            <SettingRow
                title="Crash Reports"
                description="Share technical details if the app crashes so we can fix issues faster."
                checked={bugReportsEnabled}
                disabled={disabled}
                lockedNote={lockedNote}
                onChange={onToggleBugReports}
            />
        </GlassCard>
    </div>
);

export default AppDiagnosticsCard;
