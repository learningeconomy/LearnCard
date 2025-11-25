import React, { useState } from 'react';

import {
    useGetAdmins,
    useGetBoostChildrenProfileManagers,
    useGetCurrentLCNUser,
    UserProfilePicture,
} from 'learn-card-base';

import { VC } from '@learncard/types';

export const FamilyMembersList: React.FC<{
    credential: VC;
}> = ({ credential }) => {
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { data: guardians, isLoading: guardiansLoading } = useGetAdmins(credential?.boostId);
    const { data: dependents, isLoading: dependentsLoading } = useGetBoostChildrenProfileManagers(
        credential?.boostId
    );

    const guardianRecords =
        guardians?.records?.length > 0
            ? guardians?.records?.map(g => {
                  return {
                      ...g,
                      type: 'Guardian',
                  };
              })
            : [];

    const dependentRecords =
        dependents?.records?.length > 0
            ? dependents?.records?.map(d => {
                  return {
                      ...d,
                      type: 'Child',
                  };
              })
            : [];

    let guardiansAndDependents = [...(guardianRecords ?? []), ...(dependentRecords ?? [])];
    guardiansAndDependents = guardiansAndDependents.filter(
        member => member?.profileId !== currentLCNUser?.profileId
    );

    const guardiansCount: number = guardianRecords?.length || 0;
    const childrenCount: number = dependentRecords?.length || 0;
    const totalMembersCount: number = guardiansCount + childrenCount || 0;

    const familyTitles = credential?.familyTitles;
    const guardianTitle =
        guardiansCount === 1 ? familyTitles?.guardians?.singular : familyTitles?.guardians?.plural;
    const dependentTitle =
        childrenCount === 1 ? familyTitles?.dependents?.singular : familyTitles?.dependents?.plural;

    return (
        <>
            <div className="w-full">
                <p className="text-grayscale-700 font-poppins text-sm font-semibold text-center mb-1">
                    {guardiansCount} {guardianTitle}, {childrenCount} {dependentTitle}
                </p>
            </div>
            <section className="flex justify-center items-center text-center text-[14px] overflow-hidden text-grayscale-500 px-[4px] py-2">
                {guardiansAndDependents?.slice(0, 6)?.map((recipient, index) => {
                    return (
                        <div
                            key={index}
                            className="profile-thumb-img border-[1px] border-white border-solid  vc-issuee-image h-[40px] w-[40px] rounded-full overflow-hidden mx-[-5px] z-10"
                        >
                            <UserProfilePicture
                                customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-2xl mr-3"
                                customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                                user={recipient}
                            />
                        </div>
                    );
                })}
            </section>
        </>
    );
};

export default FamilyMembersList;
