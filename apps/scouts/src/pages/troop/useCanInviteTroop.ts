import React from 'react';
import { VC } from '@learncard/types';
import { useModal, ModalTypes } from 'learn-card-base';
import { getScoutsNounForRole, getScoutsRole } from '../../helpers/troop.helpers';
import { useGetBoostPermissions } from 'learn-card-base';
import ScoutConnectModal from './ScoutConnectModal';
import useTroopIds from '../../hooks/useTroopIds';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';

interface UseTroopIdsParams {
    credential: VC; // Replace VC with the actual type of credential
    boostUri: string;
}

export const useCanInviteTroop = ({ credential, boostUri }: UseTroopIdsParams) => {
    const role = getScoutsRole(credential);
    const scoutNoun = getScoutsNounForRole(role);
    const { scoutBoostUri, troopBoostUri, currentBoostUri } = useTroopIds({ boostUri, credential });

    const { data: troopPermissionsData } = useGetBoostPermissions(troopBoostUri);
    const { data: scoutPermissionsData } = useGetBoostPermissions(scoutBoostUri);
    const { data: boostPermissionsData } = useGetBoostPermissions(currentBoostUri);

    const isScout = role === ScoutsRoleEnum.scout;
    const isLeader = role === ScoutsRoleEnum.leader;
    const isScoutOrLeader = isScout || isLeader;

    let showInviteButton = boostPermissionsData?.canIssue;
    if (isScoutOrLeader) {
        showInviteButton = scoutPermissionsData?.canIssue || troopPermissionsData?.canIssue;
    }

    return {
        showInviteButton,
        scoutPermissionsData,
        scoutBoostUri,
        troopBoostUri,
        troopPermissionsData,
        boostPermissionsData,
        currentBoostUri,
        scoutNoun,
    };
};
