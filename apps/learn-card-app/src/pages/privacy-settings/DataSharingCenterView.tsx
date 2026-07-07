import React from 'react';

import { IonSpinner } from '@ionic/react';

import TrustSummaryCard from './components/TrustSummaryCard';
import ConnectedAppsSection from './components/ConnectedAppsSection';
import AiPersonalizationCard from './components/AiPersonalizationCard';
import ProfileVisibilityCard from './components/ProfileVisibilityCard';
import AppDiagnosticsCard from './components/AppDiagnosticsCard';
import MinorProtectionCard from './components/MinorProtectionCard';
import type { DataSharingCenterViewModel } from './DataSharingCenter.types';
import './dataSharingCenter.scss';

type DataSharingCenterViewProps = {
    vm: DataSharingCenterViewModel;
};

const DataSharingCenterView: React.FC<DataSharingCenterViewProps> = ({ vm }) => {
    const { isLoading, isMinor, contracts, onContractsUpdate, ai, profile, diagnostics } = vm;

    return (
        <div className="ds-content-bg relative min-h-full w-full">
            <div aria-hidden className="ds-aurora">
                <span className="ds-aurora__blob ds-aurora__blob--emerald" />
                <span className="ds-aurora__blob ds-aurora__blob--sky" />
                <span className="ds-aurora__blob ds-aurora__blob--violet" />
            </div>

            {isLoading ? (
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] gap-3">
                    <IonSpinner name="crescent" className="w-8 h-8" />
                    <p className="text-grayscale-600 text-sm">Loading your privacy center...</p>
                </div>
            ) : (
                <div className="relative z-10 mx-auto w-full max-w-[820px] px-5 desktop:px-6 pt-[max(24px,calc(env(safe-area-inset-top)+12px))] pb-14">
                    {isMinor && (
                        <div className="mb-6">
                            <MinorProtectionCard brandName={profile.brandName} />
                        </div>
                    )}

                    <div className="flex flex-col gap-6">
                        <TrustSummaryCard contracts={contracts} />

                        <ConnectedAppsSection
                            contracts={contracts}
                            onUpdate={onContractsUpdate}
                            delay={60}
                        />

                        {ai && <AiPersonalizationCard {...ai} delay={120} />}

                        <ProfileVisibilityCard {...profile} delay={180} />

                        <AppDiagnosticsCard {...diagnostics} delay={240} />

                        <p className="text-xs text-grayscale-500 text-center px-6 mt-1">
                            You can change any of this anytime. Turning something off takes effect
                            right away.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataSharingCenterView;
