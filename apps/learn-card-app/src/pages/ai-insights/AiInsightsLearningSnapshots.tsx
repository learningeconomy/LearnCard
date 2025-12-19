import React from 'react';

import Trophy from 'learn-card-base/svgs/Trophy';
import SproutIcon from 'learn-card-base/svgs/SproutIcon';
import WrenchIcon from 'learn-card-base/svgs/WrenchIcon';
import AiInsightsEmptyPlaceholder from './AiInsightsEmptyPlaceholder';
import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import AiInsightsLearningSnapshotsSkeletonLoader from './AiInsightsLearningSnapshotSkeletonLoader';

import { useAiInsightCredential } from 'learn-card-base';

enum AiInsightsLearningSnapshotType {
    StrongestArea = 'strongest-area',
    Weakness = 'weakness',
    RoomForGrowth = 'room-for-growth',
}

interface AiInsightsLearningSnapshot {
    icon: React.ReactNode;
    label: string;
    title: string;
    description: string;
    type: AiInsightsLearningSnapshotType;
}

const AiInsightsLearningSnapshots: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
    const { data: aiInsightCredential, isLoading: aiInsightCredentialLoading } =
        useAiInsightCredential();

    const insights: AiInsightsLearningSnapshot[] = [
        {
            label: 'Strongest Area',
            title: aiInsightCredential?.insights?.strongestArea.title,
            description: aiInsightCredential?.insights?.strongestArea.summary,
            type: AiInsightsLearningSnapshotType.StrongestArea,
            icon: <Trophy className="w-[25px] h-[25px] text-emerald-700" />,
        },
        {
            label: 'Weakness',
            title: aiInsightCredential?.insights?.weakestArea.title,
            description: aiInsightCredential?.insights?.weakestArea.summary,
            type: AiInsightsLearningSnapshotType.Weakness,
            icon: <WrenchIcon className="w-[25px] h-[25px] text-orange-600" />,
        },
        {
            label: 'Room for Growth',
            title: aiInsightCredential?.insights?.roomForGrowth.title,
            description: aiInsightCredential?.insights?.roomForGrowth.summary,
            type: AiInsightsLearningSnapshotType.RoomForGrowth,
            icon: <SproutIcon className="w-[25px] h-[25px] text-blue-500" />,
        },
    ];

    if (isLoading || aiInsightCredentialLoading) {
        return <AiInsightsLearningSnapshotsSkeletonLoader />;
    }

    if (!aiInsightCredential) return <AiInsightsEmptyPlaceholder />;

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px] mb-4">
            <div className="w-full flex items-center justify-start">
                <AiPathwaysIconWithShape className="w-auto h-[40px]" />
                <h2 className="text-xl text-grayscale-800 font-notoSans">Learning Snapshots</h2>
            </div>

            <div className="w-full flex flex-col items-start justify-start mt-4">
                {insights.map((snapshot, index) => {
                    let color = '';
                    if (snapshot?.type === AiInsightsLearningSnapshotType.StrongestArea) {
                        color = 'emerald-700';
                    } else if (snapshot?.type === AiInsightsLearningSnapshotType.Weakness) {
                        color = 'orange-600';
                    } else if (snapshot?.type === AiInsightsLearningSnapshotType.RoomForGrowth) {
                        color = 'blue-500';
                    }

                    return (
                        <div key={index} className="flex flex-col items-start justify-start">
                            <div className="flex items-center justify-start">
                                {snapshot.icon}
                                <h2
                                    className={`text-sm font-semibold uppercase text-${color} ml-1`}
                                >
                                    {snapshot.label}
                                </h2>
                            </div>
                            <h2 className="text-[17px] text-grayscale-800 font-notoSans ml-1 font-semibold mt-2 text-left">
                                {snapshot.title}
                            </h2>
                            <p className="w-full text-left text-grayscale-700 font-notoSans text-sm mt-2 mx-2 mb-4">
                                {snapshot?.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AiInsightsLearningSnapshots;
