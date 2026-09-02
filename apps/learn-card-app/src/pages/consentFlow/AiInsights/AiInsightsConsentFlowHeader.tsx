import React, { useState } from 'react';

import { ConnectIcon } from 'learn-card-base/svgs/ConnectIcon';
import { UserProfilePicture, ProfilePicture, switchedProfileStore } from 'learn-card-base';

import { LCNProfile } from '@learncard/types';
import * as m from '../../../paraglide/messages.js';
import TransP from '../../../i18n/TransP';

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
            {m['aiInsights.shareInsightsWith']({ name: profile?.displayName ?? '' })}
        </p>
    );

    if (childProfile || isChild) {
        let childName = childProfile?.displayName;

        text = (
            <p className="text-grayscale-900 text-[17px] text-center">
                <TransP
                    m={m['aiInsights.shareChildInsights']}
                    values={{ child: childName ?? '', teacher: profile?.displayName ?? '' }}
                    components={[
                        <span className="font-semibold" />,
                        <span className="font-semibold" />,
                    ]}
                />
            </p>
        );
    }

    if (isPostConsent) {
        text = (
            <p className="text-grayscale-900 text-[22px] font-semibold text-center">
                {m['aiInsights.successfullyShared']({ name: profile?.displayName ?? '' })}
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
                            {m['aiInsights.approveDescription']()}
                        </p>
                    </div>
                )}

                <button
                    className="text-indigo-500 text-sm font-semibold text-center"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? m['common.gotIt']() : m['common.learnMore']()}
                </button>
            </div>
        </div>
    );
};

export default AiInsightsConsentFlowHeader;
