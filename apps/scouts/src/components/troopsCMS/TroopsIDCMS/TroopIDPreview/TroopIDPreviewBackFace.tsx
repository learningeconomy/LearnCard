import React from 'react';

import TruncateTextBox from '../../../../pages/troop/TroopIdDetails/TruncateTextBox';

import { scoutPermissions, TroopsCMSState, TroopsCMSViewModeEnum } from '../../troopCMSState';

export const TroopIDPreviewBackFace: React.FC<{
    rootViewMode: TroopsCMSViewModeEnum;
    viewMode: TroopsCMSViewModeEnum;
    state: TroopsCMSState;
}> = ({ rootViewMode, viewMode, state }) => {
    const isInGlobalViewMode = rootViewMode === TroopsCMSViewModeEnum.global;
    const isInNetworkViewMode = rootViewMode === TroopsCMSViewModeEnum.network;
    const isInTroopViewMode = rootViewMode === TroopsCMSViewModeEnum.troop;
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;

    const network = state;
    const networkDescription = network?.basicInfo?.description;
    const networkName =
        isInLeaderViewMode || isInMemberViewMode
            ? network?.parentID?.basicInfo?.name
            : network?.basicInfo?.name ?? '';
    const globalNetworkName =
        state?.grandParentID?.basicInfo?.name ?? state?.parentID?.basicInfo?.name ?? '';

    let permissionsTitle = '';
    let permissions = [];
    if (isInGlobalViewMode) {
        permissionsTitle = 'Global Admin Permissions';
        permissions = scoutPermissions?.global ?? [];
    } else if (isInNetworkViewMode) {
        permissionsTitle = 'National Admin Permissions';
        permissions = scoutPermissions?.network ?? [];
    } else if (isInTroopViewMode && isInLeaderViewMode) {
        permissionsTitle = 'Leader Permissions';
        permissions = scoutPermissions?.leader ?? [];
    } else if (isInTroopViewMode && isInMemberViewMode) {
        permissionsTitle = 'Scout Permissions';
        permissions = scoutPermissions?.member ?? [];
    }

    return (
        <div className="rounded-t-[20px] rounded-b-[20px] shadow-box-bottom overflow-hidden flex flex-col">
            <TruncateTextBox
                className="mb-4"
                headerText="Details"
                subHeaderText="About"
                text={networkDescription}
            >
                <div className="flex flex-col gap-[5px] font-notoSans text-[14px] pt-[10px] border-t-[1px] border-solid border-grayscale-200 w-full">
                    <div className="flex gap-[4px]">
                        <span className="font-[600] text-grayscale-900 font-notoSans">
                            Issued by:
                        </span>
                        <span className="text-grayscale-700 font-notoSans">
                            {isInTroopViewMode && 'Troop'} {network?.basicInfo?.name}
                        </span>
                    </div>
                    {!isInGlobalViewMode && !isInNetworkViewMode && (
                        <div className="flex gap-[4px]">
                            <span className="font-[600] text-grayscale-900 font-notoSans">
                                National Network:
                            </span>
                            <span className="text-grayscale-700 font-notoSans">{networkName}</span>
                        </div>
                    )}
                    {!isInGlobalViewMode && (
                        <div className="flex gap-[4px]">
                            <span className="font-[600] text-grayscale-900 font-notoSans">
                                Global Network:
                            </span>
                            <span className="text-grayscale-700 font-notoSans">
                                {globalNetworkName}
                            </span>
                        </div>
                    )}
                </div>
            </TruncateTextBox>

            <TruncateTextBox headerText={permissionsTitle} text="">
                <div className="flex flex-col gap-[5px] font-notoSans text-[14px] pt-[10px] border-t-[1px] border-solid border-grayscale-200 w-full">
                    {permissions?.map(permission => {
                        return (
                            <div
                                key={permission?.id}
                                className="w-full flex flex-col last-of-type:border-none border-b-[1px] border-b-solid border-b-grayscale-200 py-2"
                            >
                                <h4 className="text-sm font-semibold font-notoSans">
                                    {permission?.title}
                                </h4>
                                <div className="flex">
                                    {permission?.roles.map((role, i) => {
                                        const isLast = i === permission.roles.length - 1; // Check if it's the last item
                                        const _role = isLast ? role : `${role},`; // Conditionally add the comma

                                        return (
                                            <p
                                                key={i}
                                                className="text-sm font-normal font-notoSans text-grayscale-700"
                                            >
                                                {_role}&nbsp;
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </TruncateTextBox>
        </div>
    );
};

export default TroopIDPreviewBackFace;
