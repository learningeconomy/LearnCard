import React, { useState } from 'react';

import { ConnectIcon } from 'learn-card-base/svgs/ConnectIcon';
import { UserProfilePicture, ProfilePicture, switchedProfileStore } from 'learn-card-base';

import { LCNProfile } from '@learncard/types';

const AiInsightsConsentFlowHeader: React.FC<{
    profile: LCNProfile;
    childProfile?: LCNProfile;
    isPostConsent?: boolean;
}> = ({ profile, childProfile, isPostConsent }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const profileType = switchedProfileStore.use.profileType();
    const isChild = profileType === 'child';

    const role = profile?.role ?? 'Teacher';
    const name = profile?.displayName ?? 'Unknown';
    const shortBio = profile?.shortBio;

    let text = (
        <p className="text-grayscale-900 text-[22px] font-semibold text-center">
            Share Insights with <br /> {profile?.displayName}
        </p>
    );

    if (childProfile || isChild) {
        let childName = childProfile?.displayName;

        text = (
            <p className="text-grayscale-900 text-[17px] text-center">
                Share <span className="font-semibold">{childName}</span>'s insights with{' '}
                <span className="font-semibold">{profile?.displayName}</span>
            </p>
        );
    }

    if (isPostConsent) {
        text = (
            <p className="text-grayscale-900 text-[22px] font-semibold text-center">
                You've successfully shared insights with {profile?.displayName}
            </p>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-center max-w-[600px]">
                <div className="bg-white w-full flex flex-col items-center gap-4 justify-center rounded-[24px]">
                    <div className="flex items-center gap-4">
                        {childProfile ? (
                            <UserProfilePicture
                                customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px] text-[22px] font-semibold text-white"
                                customImageClass="w-full h-full object-cover"
                                user={childProfile}
                            />
                        ) : (
                            <ProfilePicture
                                customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px]"
                                customImageClass="w-full h-full object-cover"
                            />
                        )}

                        <ConnectIcon className="text-grayscale-900 h-[48px] w-[48px]" />

                        <UserProfilePicture
                            customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px] text-[22px] font-semibold text-white"
                            customImageClass="w-full h-full object-cover"
                            user={profile}
                        />
                    </div>

                    {text}
                </div>
            </div>

            <div className="w-full flex flex-col items-center justify-center text-center mt-4 gap-2">
                {isExpanded && (
                    <div className="w-full flex flex-col items-start justify-center">
                        <div className="w-full h-[1px] bg-grayscale-200 mb-2" />
                        <p className="text-grayscale-900 text-sm text-left">
                            {name} {shortBio}
                        </p>
                        <br />
                        <p className="text-grayscale-900 text-sm text-left">
                            If you approve, your teacher will be able to to see your Top Skills,
                            Learning Snapshots, Suggested Pathways. They will also be able to send
                            learning pathway suggestions to you.
                        </p>
                    </div>
                )}

                <button
                    className="text-indigo-500 text-sm font-semibold text-center"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? 'Got it.' : 'Learn more'}
                </button>
            </div>
        </div>
    );
};

export default AiInsightsConsentFlowHeader;
