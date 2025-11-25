import React from 'react';

import {
    getDefaultBadgeThumbForViewMode,
    getIdBackgroundStyles,
} from '../../../helpers/troop.helpers';
import {
    getMemberTypeText,
    TroopCMSFields,
    TroopsCMSState,
    TroopsCMSViewModeEnum,
} from '../troopCMSState';
import GlobalAdminIdThumbPlaceholder from '../../svgs/GlobalAdminIdThumbPlaceholder';
import NationalAdminIdThumbPlaceholder from '../../svgs/NationalAdminIdThumbPlaceholder';
import LeaderIdThumbPlaceholder from '../../svgs/LeaderIdThumbPlaceholder';
import ScoutIdThumbPlaceholder from '../../svgs/ScoutIdThumbPlaceholder';
import { TroopsAppearanceTabs } from '../TroopsCMSAppearanceForm/TroopsCMSAppearanceTabs';
import { DEFAULT_COLOR_DARK, DEFAULT_COLOR_LIGHT } from '../troops.helpers';

type TroopIDCardProps = {
    state: TroopsCMSState;
    idState: TroopCMSFields;
    rootViewMode: TroopsCMSViewModeEnum;
    viewMode: TroopsCMSViewModeEnum;
};

const TroopIDCard: React.FC<TroopIDCardProps> = ({ state, idState, rootViewMode, viewMode }) => {
    const isInGlobalViewMode = rootViewMode === TroopsCMSViewModeEnum.global;
    const isInNetworkViewMode = rootViewMode === TroopsCMSViewModeEnum.network;
    const isInTroopViewMode = rootViewMode === TroopsCMSViewModeEnum.troop;
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;

    const network = state;
    const networkName = network?.parentID?.basicInfo?.name ?? '';
    let networkImage =
        network?.appearance?.badgeThumbnail ?? network?.appearance?.idIssuerThumbnail ?? '';

    if (state.inheritNetworkStyles) {
        networkImage =
            network.parentID?.appearance?.badgeThumbnail ??
            network.parentID?.appearance?.idIssuerThumbnail;
    }

    let idStyles = idState?.appearance;
    if (isInMemberViewMode) idStyles = idState?.memberID?.appearance;

    const activeAppearanceTab = idStyles?.activeAppearanceTab;
    if (activeAppearanceTab === TroopsAppearanceTabs.dark) {
        idStyles = {
            ...idStyles,
            idBackgroundColor: DEFAULT_COLOR_DARK,
            fontColor: DEFAULT_COLOR_LIGHT,
        };
    } else if (activeAppearanceTab === TroopsAppearanceTabs.light) {
        idStyles = {
            ...idStyles,
            idBackgroundColor: DEFAULT_COLOR_LIGHT,
            fontColor: DEFAULT_COLOR_DARK,
        };
    }

    const backgroundStyles = getIdBackgroundStyles(idStyles);

    let title = '';
    let PlaceholderIcon = ScoutIdThumbPlaceholder;
    if (isInGlobalViewMode) {
        title = 'Global Admin Name';
        PlaceholderIcon = GlobalAdminIdThumbPlaceholder;
    } else if (isInNetworkViewMode) {
        title = 'National Admin Name';
        PlaceholderIcon = NationalAdminIdThumbPlaceholder;
    } else if (isInTroopViewMode && isInLeaderViewMode) {
        title = 'Leader Name';
        PlaceholderIcon = LeaderIdThumbPlaceholder;
    } else if (isInTroopViewMode && isInMemberViewMode) {
        title = 'Scout Name';
        PlaceholderIcon = ScoutIdThumbPlaceholder;
    }

    let name = state?.basicInfo?.name;
    if (!name) {
        name = isInNetworkViewMode || isInGlobalViewMode ? 'Network Name' : 'Troop';
    } else if (isInTroopViewMode) {
        name = `Troop ${name}`;
    }

    return (
        <div className="rounded-[15px] flex flex-col overflow-hidden relative shadow-bottom-4-4">
            <div
                className={`flex gap-[10px] px-[10px] py-[27.5px] bg-contain items-center`}
                style={backgroundStyles}
            >
                {!idStyles?.idThumbnail ? (
                    <PlaceholderIcon className="rounded-full" />
                ) : (
                    <img
                        src={idStyles?.idThumbnail}
                        className="rounded-full h-[80px] w-[80px] object-cover"
                    />
                )}

                <div className="flex flex-col">
                    <span className="font-notoSans font-[600] text-[14px]">{title}</span>
                    <span className="font-notoSans font-[600] text-[12px]">
                        {getMemberTypeText(rootViewMode, viewMode)} ID
                    </span>
                    <span className="font-notoSans font-[600] text-[12px]">Issued (Date)</span>
                </div>
            </div>
            <div className={`flex flex-col justify-center px-[10px] py-[4px] h-[45px] bg-white`}>
                <span
                    className={`flex items-center gap-[5px] font-notoSans text-[14px] font-[600] text-grayscale-900`}
                >
                    {/* <CredentialVerificationDisplay
                        credential={{
                            issuer: currentLCNUser?.did,
                            credentialSubject: {
                                id: 'did:example:123',
                            },
                        }}
                        iconClassName="!h-[17px] !w-[17px]"
                    /> */}
                    {name}
                </span>
                {networkName && !isInGlobalViewMode && !isInNetworkViewMode && (
                    <span
                        style={{ color: idStyles?.accentFontColor }}
                        className="text-grayscale-900 text-[12px] font-notoSans font-[600]"
                    >
                        {networkName}
                    </span>
                )}
            </div>

            {!networkImage ? (
                <div
                    className={`rounded-full overflow-hidden bg-white h-[54px] w-[54px] absolute right-[10px] bottom-[10px] flex items-center justify-center`}
                    style={{ backgroundColor: idStyles?.accentColor }}
                >
                    {getDefaultBadgeThumbForViewMode(viewMode)}
                </div>
            ) : (
                <div
                    className={`rounded-full overflow-hidden h-[54px] w-[54px] absolute right-[10px] bottom-[10px] flex items-center justify-center`}
                    style={{ backgroundColor: idStyles?.accentColor }}
                >
                    <img
                        src={networkImage}
                        className="rounded-full h-[50px] w-[50px] object-cover"
                    />
                </div>
            )}
        </div>
    );
};

export default TroopIDCard;
