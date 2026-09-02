import React from 'react';

import * as m from '../../../paraglide/messages.js';
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
            <h3 className="text-[15px] font-semibold text-grayscale-900">
                {m['dataShareCenter.appDiagnostics']()}
            </h3>
            <p className="text-sm text-grayscale-600">{m['dataShareCenter.diagnosticsDesc']()}</p>
        </div>

        <GlassCard className="overflow-hidden divide-y divide-grayscale-100">
            <SettingRow
                title={m['settings.analytics']()}
                description={m['settings.analyticsDesc']({ brand: brandName })}
                checked={analyticsEnabled}
                disabled={disabled}
                lockedNote={lockedNote}
                onChange={onToggleAnalytics}
            />
            <SettingRow
                title={m['settings.bugReports']()}
                description={m['settings.bugReportsDesc']()}
                checked={bugReportsEnabled}
                disabled={disabled}
                lockedNote={lockedNote}
                onChange={onToggleBugReports}
            />
        </GlassCard>
    </div>
);

export default AppDiagnosticsCard;
