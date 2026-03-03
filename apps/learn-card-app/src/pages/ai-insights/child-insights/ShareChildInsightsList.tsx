import React from 'react';

import ShareChildInsightsCard from './ShareChildInsightsCard';

import { useGetAvailableProfiles } from 'learn-card-base';

import { LCNProfile, LCNProfileManager } from '@learncard/types';

import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';

export const ShareChildInsightsList: React.FC<{}> = () => {
    const { getIconSet } = useTheme();
    const icons = getIconSet(IconSetEnum.placeholders);
    const { floatingBottle: FloatingBottleIcon } = icons;

    const { data: profiles } = useGetAvailableProfiles();

    const profileRecords = profiles?.records?.filter?.(
        ({ profile }: { profile: LCNProfile }) => !profile.isServiceProfile
    );

    const noChildAccounts = profileRecords?.length === 0;

    return (
        <div className="flex flex-col gap-2 w-full">
            {profileRecords?.map?.length > 0 &&
                profileRecords?.map?.(
                    ({ profile, manager }: { profile: LCNProfile; manager: LCNProfileManager }) => (
                        <ShareChildInsightsCard
                            key={profile.did}
                            profile={profile}
                            profileManager={manager}
                        />
                    )
                )}

            {noChildAccounts && (
                <section className="flex flex-col items-center justify-center my-[30px]">
                    <FloatingBottleIcon />
                    <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                        No Child insights found
                    </p>
                </section>
            )}
        </div>
    );
};

export default ShareChildInsightsList;
