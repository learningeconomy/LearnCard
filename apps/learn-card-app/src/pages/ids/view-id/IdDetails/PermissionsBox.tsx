import React from 'react';
import { useGetBoostPermissions, useGetBoost } from 'learn-card-base';
import {
    childPermissionsToDisplayString,
    convertBoostPermissionsToCategoryPermissions,
} from '../../../../scouts/src/helpers/permissions.helpers';
import { VC } from '@learncard/types';
import { getRoleFromCred } from '../../../../scouts/src/helpers/troop.helpers';
import { ScoutsRoleEnum } from '../../../../scouts/src/stores/troopPageStore';

type PermissionsBoxProps = {
    credential: VC;
    boostUri: string;
    scoutTypeNoun: string;
    profileId?: string;
};

const PermissionsBox: React.FC<PermissionsBoxProps> = ({
    credential,
    boostUri,
    scoutTypeNoun,
    profileId,
}) => {
    const role = getRoleFromCred(credential);

    // TODO this will only be for the General view now,
    //   switch to use claimBoostPermissions (once it's wired up)
    //   this will have claimBoostPermissions on it pending a PR
    // const { data: boost } = useGetBoost(boostUri);

    const { data: permissionsData } = useGetBoostPermissions(boostUri, profileId);
    const permissionsByCategory = convertBoostPermissionsToCategoryPermissions(permissionsData);

    const { canViewAnalytics } = permissionsByCategory;

    const displayPermissions: any = {};

    if (canViewAnalytics) {
        displayPermissions.General = 'View Analytics';
    }
    if (role === ScoutsRoleEnum.global) {
        displayPermissions['Global Network'] =
            childPermissionsToDisplayString(permissionsByCategory);
        displayPermissions['National Network'] = childPermissionsToDisplayString(
            permissionsByCategory['Network']
        );
        displayPermissions['Troops'] = childPermissionsToDisplayString(
            permissionsByCategory['Troop']
        );
        displayPermissions['Social Boosts'] = childPermissionsToDisplayString(
            permissionsByCategory['Social Badge']
        );
        displayPermissions['Merit Badges'] = childPermissionsToDisplayString(
            permissionsByCategory['Merit Badge']
        );
    }
    if (role === ScoutsRoleEnum.national) {
        displayPermissions['National Network'] =
            childPermissionsToDisplayString(permissionsByCategory);
        displayPermissions['Troops'] = childPermissionsToDisplayString(
            permissionsByCategory['Troop']
        );
        displayPermissions['Social Boosts'] = childPermissionsToDisplayString(
            permissionsByCategory['Social Badge']
        );
        displayPermissions['Merit Badges'] = childPermissionsToDisplayString(
            permissionsByCategory['Merit Badge']
        );
    }
    if (role === ScoutsRoleEnum.leader) {
        displayPermissions['Troops'] = childPermissionsToDisplayString(permissionsByCategory);
        displayPermissions['Social Boosts'] = childPermissionsToDisplayString(
            permissionsByCategory['Social Badge']
        );
        displayPermissions['Merit Badges'] = childPermissionsToDisplayString(
            permissionsByCategory['Merit Badge']
        );
    }
    if (role === ScoutsRoleEnum.scout) {
        displayPermissions['Social Boosts'] = childPermissionsToDisplayString(
            permissionsByCategory['Social Badge']
        );
        displayPermissions['Merit Badges'] = childPermissionsToDisplayString(
            permissionsByCategory['Merit Badge']
        );
    }

    if (role === ScoutsRoleEnum.scout) {
        // Don't show permissions for Scout ID
        return undefined;
    }

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom p-[15px] w-full relative">
            <h3 className="text-[17px] text-grayscale-900 font-notoSans flex flex-col gap-[3px]">
                <span className="text-[17px] text-grayscale-900 font-notoSans">Permissions</span>
                <span className="text-[17px] text-grayscale-900 font-notoSans">
                    {scoutTypeNoun}
                </span>
            </h3>
            {permissionsData && (
                <div className="flex flex-col w-full">
                    {Object.keys(displayPermissions).map((key, index) => {
                        return (
                            <div
                                key={index}
                                className="flex flex-col gap-[5px] py-[10px] border-b-[1px] border-grayscale-200 border-solid last:border-b-0 w-full items-start"
                            >
                                <span className="text-grayscale-900 font-notoSans text-[14px] font-[600]">
                                    {key}
                                </span>
                                <span className="text-grayscale-700 font-notoSans text-[14px]">
                                    {String(displayPermissions[key])}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* {!historyExists && (
                <div className="flex flex-col py-[10px] items-start">
                    <span className="text-grayscale-700 font-notoSans text-[14px]">
                        No history available
                    </span>
                </div>
            )} */}
        </div>
    );
};

export default PermissionsBox;
