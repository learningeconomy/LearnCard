import React, { useEffect, useState } from 'react';

import useTroopIds from './useTroopIds';
import { ScoutsRoleEnum } from '../stores/troopPageStore';
import { getScoutsRole } from '../helpers/troop.helpers';
import {
    useCountBoostRecipients,
    useGetBoostRecipients,
    useGetCurrentLCNUser,
    useWallet,
} from 'learn-card-base';

import { MemberTabsEnum } from '../pages/troop/TroopPageMembersBox';
import { VC } from '@learncard/types';

type MemberRow = {
    name: string;
    image: string;
    profileId: string;
    type: 'Scout' | 'Leader' | 'Admin';
    boostUri: string;
    isPersonalId: boolean;
    canManageId: boolean;
};

export const useTroopMembers = (credential: VC, tab?: MemberTabsEnum, boostUri?: string) => {
    const { initWallet } = useWallet();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const myProfileId = currentLCNUser?.profileId;

    const [memberRows, setMemberRows] = useState<MemberRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const uri = boostUri;
    const role = getScoutsRole(credential);

    const isScout = role === ScoutsRoleEnum.scout;
    const isLeader = role === ScoutsRoleEnum.leader;
    const isScoutOrLeader = isScout || isLeader;

    const isAllTab = tab === MemberTabsEnum.All;
    const isScoutTab = tab === MemberTabsEnum.Scouts;
    const isLeaderTab = tab === MemberTabsEnum.Leaders;

    const { scoutBoostUri, troopBoostUri } = useTroopIds({ credential, boostUri: uri });

    const { data: scoutCount } = useCountBoostRecipients(scoutBoostUri);
    const { data: leaderCount } = useCountBoostRecipients(troopBoostUri);
    const { data: currentBoostCount } = useCountBoostRecipients(uri);

    const skipMembers = tab === undefined;
    const { data: scoutRecipients } = useGetBoostRecipients(scoutBoostUri, !skipMembers);
    const { data: leaderRecipients } = useGetBoostRecipients(troopBoostUri, !skipMembers);
    const { data: currentBoostRecipients } = useGetBoostRecipients(uri, !skipMembers);
console.log('///current BoostRecipeients', currentBoostRecipients)
    const getBoostPermissionsAsync = async (profileId: string) => {
        const wallet = await initWallet();
        return wallet.invoke.getBoostPermissions(uri, profileId);
    };

    // Calculate total count
    const totalCount = isScoutOrLeader
        ? (scoutCount ?? 0) + (leaderCount ?? 0)
        : currentBoostCount ?? '...';

    // Process members data when dependencies change
    useEffect(() => {
        const processMembers = async () => {
            setIsLoading(true);
            const tempRows: MemberRow[] = [];

            if (isScoutOrLeader) {
                if (isAllTab || isScoutTab) {
                    scoutRecipients?.forEach(scout => {
                        tempRows.push({
                            name: scout.to.displayName,
                            profileId: scout.to.profileId,
                            image: scout.to.image ?? '',
                            type: 'Scout',
                            boostUri: scoutBoostUri,
                            isPersonalId: scout.to.profileId === myProfileId,
                            canManageId: false,
                        });
                    });
                }

                if (isAllTab || isLeaderTab) {
                    leaderRecipients?.forEach(leader => {
                        tempRows.push({
                            name: leader.to.displayName,
                            profileId: leader.to.profileId,
                            image: leader.to.image ?? '',
                            type: 'Leader',
                            boostUri: troopBoostUri,
                            isPersonalId: leader.to.profileId === myProfileId,
                            canManageId: false,
                        });
                    });
                }
            } else if (currentBoostRecipients) {
                for (const recipient of currentBoostRecipients) {
                    try {
                        const userPermissions = await getBoostPermissionsAsync(
                            recipient.to.profileId
                        );
                        // ! TEMPORARY WAY OF DISPLAYING AN ID IS NO LONGER VALID !!
                        // TODO: implement Revocation !!
                        if (
                            userPermissions.role === 'creator' ||
                            userPermissions.role === 'Director' ||
                            userPermissions.role === 'Global Admin'
                        ) {
                            // ! TEMPORARY WAY OF DISPLAYING AN ID IS NO LONGER VALID !!
                            // TODO: implement Revocation !!
                            tempRows.push({
                                name: recipient.to.displayName,
                                profileId: recipient.to.profileId,
                                image: recipient.to.image ?? '',
                                type: 'Admin',
                                boostUri: uri,
                                isPersonalId: recipient.to.profileId === myProfileId,
                                canManageId: Boolean(userPermissions?.canManage),
                            });
                        }
                    } catch (error) {
                        console.error(
                            `Failed to get permissions for ${recipient.to.profileId}:`,
                            error
                        );
                        // Still add the user, but mark canManageId as false
                        tempRows.push({
                            name: recipient.to.displayName,
                            profileId: recipient.to.profileId,
                            image: recipient.to.image ?? '',
                            type: 'Admin',
                            boostUri: uri,
                            isPersonalId: recipient.to.profileId === myProfileId,
                            canManageId: false,
                        });
                    }
                }
            }

            // Sort the rows
            tempRows.sort((a, b) => {
                // Sort by name alphabetically, current user on top
                if (a.profileId === myProfileId) return -10; // Current user on top
                if (a.name === b.name) return a.type === 'Leader' ? -1 : 1; // Name ties go to troop leaders
                return a.name.localeCompare(b.name);
            });

            setMemberRows(tempRows);
            setIsLoading(false);
        };

        processMembers();
    }, [
        isScoutOrLeader,
        isAllTab,
        isScoutTab,
        isLeaderTab,
        scoutRecipients,
        leaderRecipients,
        currentBoostRecipients,
        myProfileId,
        scoutBoostUri,
        troopBoostUri,
        uri,
    ]);

    return {
        scoutCount: scoutCount ?? '...',
        leaderCount: leaderCount ?? '...',
        currentBoostCount: currentBoostCount ?? '...',
        totalCount,
        memberRows,
        isLoading,
        scoutRecipients,
        leaderRecipients,
        currentBoostRecipients,
    };
};

export default useTroopMembers;
