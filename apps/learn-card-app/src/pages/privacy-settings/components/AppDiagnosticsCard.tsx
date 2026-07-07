import React, { useCallback } from 'react';

import { useGetPreferencesForDid, useUpdatePreferences, useBrandingConfig } from 'learn-card-base';

import { useAnalytics } from '../../../analytics';
import GlassCard from './GlassCard';
import SettingRow from './SettingRow';

const AppDiagnosticsCard: React.FC<{ isMinor: boolean; delay?: number }> = ({
    isMinor,
    delay = 0,
}) => {
    const { data: preferences } = useGetPreferencesForDid();
    const { mutate: updatePreferences } = useUpdatePreferences();
    const { setEnabled: setAnalyticsEnabled } = useAnalytics();
    const { name: brandName } = useBrandingConfig();

    const analyticsEnabled = preferences?.analyticsEnabled ?? !isMinor;
    const bugReportsEnabled = preferences?.bugReportsEnabled ?? !isMinor;

    const handleAnalyticsToggle = useCallback(
        (enabled: boolean) => {
            updatePreferences({ analyticsEnabled: enabled });
            setAnalyticsEnabled(enabled);
        },
        [updatePreferences, setAnalyticsEnabled]
    );

    const handleBugReportsToggle = useCallback(
        (enabled: boolean) => {
            updatePreferences({ bugReportsEnabled: enabled });
        },
        [updatePreferences]
    );

    return (
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
                    onChange={handleAnalyticsToggle}
                />
                <SettingRow
                    title="Crash Reports"
                    description="Share technical details if the app crashes so we can fix issues faster."
                    checked={bugReportsEnabled}
                    onChange={handleBugReportsToggle}
                />
            </GlassCard>
        </div>
    );
};

export default AppDiagnosticsCard;
