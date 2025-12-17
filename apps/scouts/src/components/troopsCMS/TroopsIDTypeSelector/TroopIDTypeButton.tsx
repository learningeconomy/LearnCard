import React, { useEffect, useState } from 'react';

import { useIonModal } from '@ionic/react';
import { conditionalPluralize, useGetSearchProfiles } from 'learn-card-base';

import Pencil from '../../svgs/Pencil';
import ScoutDiamond from '../../svgs/ScoutDiamond';
import TroopUserIcon from '../../svgs/TroopUserIcon';
import ScoutLeaderHalfCircle from '../../svgs/ScoutLeaderHalfCircle';
import TroopGlobalLeader from '../../svgs/TroopGlobalLeader';
import TroopNationalLeader from '../../svgs/TroopNationalLeader';
import TroopsIDCMSWrapper from '../TroopsIDCMS/TroopIDCMSWrapper';
import BoostAddressBook, {
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from '../../boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook';

import { TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import { BoostCMSIssueTo } from '../../boost/boost';

type TroopIDTypeButtonProps = {
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
    viewModeSubtype?: TroopsCMSViewModeEnum;

    admins?: BoostCMSIssueTo[];
    setAdmins?: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;

    members?: BoostCMSIssueTo[];
    setMembers?: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;
};

export const TroopIDTypeButton: React.FC<TroopIDTypeButtonProps> = ({
    state,
    setState,
    members,
    setMembers,
    admins,
    setAdmins,
    viewMode,
    viewModeSubtype,
}) => {
    const [search, setSearch] = useState<string>('');
    const { data: searchResults, isLoading: loading } = useGetSearchProfiles(search ?? '');

    const scoutsList = members ?? [];
    const leadersList = admins ?? [];

    const scoutsListLength = scoutsList?.length ?? 0;
    const leadersListLength = leadersList?.length ?? 0;

    useEffect(() => {
        if (scoutsListLength > 0) {
            setMembers?.(scoutsList);
            return;
        }

        if (leadersListLength > 0) {
            setAdmins?.(leadersList);
            return;
        }
    }, [members, admins]);

    const isInGlobalViewMode = viewMode === TroopsCMSViewModeEnum.global;
    const isInNetworkViewMode = viewMode === TroopsCMSViewModeEnum.network;
    const isInTroopViewMode = viewMode === TroopsCMSViewModeEnum.troop;
    const isInLeaderViewMode = viewModeSubtype === TroopsCMSViewModeEnum.leader;

    let icon = null;
    let title = '';

    if (isInGlobalViewMode) {
        icon = <TroopGlobalLeader className="text-sp-green-forest-light" />;
        title = 'Global Admin ID';
    } else if (isInNetworkViewMode) {
        icon = <TroopNationalLeader className="text-sp-green-forest-light" />;
        title = 'National Admin ID';
    }

    const [presentTroopsCMS, dismissTroopsCMS] = useIonModal(TroopsIDCMSWrapper, {
        handleCloseModal: () => dismissTroopsCMS(),
        rootViewMode: viewMode,
        viewMode: viewModeSubtype,
        state: state,
        setState: setState,
    });

    const [presentAddressBook, dismissAddressBook] = useIonModal(BoostAddressBook, {
        state: state,
        setState: setState,
        viewMode: BoostAddressBookViewMode.full,
        mode: BoostAddressBookEditMode.edit,
        handleCloseModal: () => dismissAddressBook(),
        _issueTo: isInLeaderViewMode ? admins : members,
        _setIssueTo: isInLeaderViewMode ? setAdmins : setMembers,

        search,
        setSearch,
        searchResults,
        isLoading: loading,
        collectionPropName: viewModeSubtype === TroopsCMSViewModeEnum.member ? 'issueTo' : 'admins',
    });

    const adminThumbnail = state?.appearance?.idThumbnail;
    const scoutThumbnail = state?.memberID?.appearance?.idThumbnail;

    if (isInTroopViewMode) {
        if (viewModeSubtype === TroopsCMSViewModeEnum.member) {
            return (
                <div className="flex items-center justify-between w-full bg-white border-b-grayscale-100 border-b-solid border-b-[1px] py-[10px]">
                    <div className="flex items-center justify-start w-full">
                        <div className="bg-sp-green-leaf flex items-center justify-center h-[40px] w-[40px] object-cover rounded-full overflow-hidden mr-[10px]">
                            {scoutThumbnail ? (
                                <img
                                    src={scoutThumbnail}
                                    alt="network thumb"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ScoutDiamond className="text-sp-green-forest-light" />
                            )}
                        </div>
                        <p className="flex flex-col justify-center items-start font-notoSans text-[17px] text-grayscale-900">
                            Scout ID
                            {scoutsListLength > 0 && (
                                <span className="text-[14px] text-grayscale-500 font-notoSans font-[500] leading-normal">
                                    {conditionalPluralize(scoutsListLength, 'Scout')}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="flex items-center justify-center rounded-full bg-grayscale-100 mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                            <button
                                onClick={() => presentTroopsCMS()}
                                className="overflow-hidden flex items-center justify-center p-[8px]"
                            >
                                <Pencil className="text-blue-950 h-[30px] w-[30px]" version={2} />
                            </button>
                        </div>
                        <div className="flex items-center justify-center rounded-full bg-sp-green-forest mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                            <button
                                onClick={() => presentAddressBook()}
                                className="overflow-hidden flex items-center justify-center p-[8px]"
                            >
                                <TroopUserIcon className="h-[30px] w-[30px]" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        } else if (viewModeSubtype === TroopsCMSViewModeEnum.leader) {
            return (
                <div className="flex items-center justify-between w-full bg-white py-[10px]">
                    <div className="flex items-center justify-start w-full">
                        <div className="bg-sp-blue-river flex items-center justify-center h-[40px] w-[40px] object-contain rounded-full overflow-hidden mr-[10px]">
                            {adminThumbnail ? (
                                <img
                                    src={adminThumbnail}
                                    alt="network thumb"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ScoutLeaderHalfCircle className="text-sp-blue-ocean mt-2" />
                            )}
                        </div>
                        <p className="flex flex-col justify-center items-start font-notoSans text-[17px] text-grayscale-900">
                            Leader ID
                            {leadersListLength > 0 && (
                                <span className="text-[14px] text-grayscale-500 font-notoSans font-[500] leading-normal">
                                    {conditionalPluralize(leadersListLength, 'Leader')}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="flex items-center justify-center rounded-full bg-grayscale-100 mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                            <button
                                onClick={() => presentTroopsCMS()}
                                className="overflow-hidden flex items-center justify-center p-[8px]"
                            >
                                <Pencil className="text-blue-950 h-[30px] w-[30px]" version={2} />
                            </button>
                        </div>
                        <div className="flex items-center justify-center rounded-full bg-sp-green-forest mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                            <button
                                onClick={() => presentAddressBook()}
                                className="overflow-hidden flex items-center justify-center p-[8px]"
                            >
                                <TroopUserIcon className="h-[30px] w-[30px]" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="flex items-center justify-between w-full bg-white py-[10px]">
            <div className="flex items-center justify-start w-full font-notoSans text-lg">
                <div className="bg-sp-green-leaf flex items-center justify-center h-[40px] w-[40px] object-contain rounded-full overflow-hidden mr-[10px]">
                    {adminThumbnail ? (
                        <img
                            src={adminThumbnail}
                            alt="network thumb"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <>{icon}</>
                    )}
                </div>
                <p className="flex flex-col justify-center items-start font-notoSans text-[17px] text-grayscale-900">
                    {title}
                    {leadersListLength > 0 && (
                        <span className="text-[14px] text-grayscale-500 font-notoSans font-[500]">
                            {conditionalPluralize(leadersListLength, 'Admin')}
                        </span>
                    )}
                </p>
            </div>
            <div className="flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full bg-grayscale-100 mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                    <button
                        onClick={() => presentTroopsCMS()}
                        className="overflow-hidden flex items-center justify-center p-[8px]"
                    >
                        <Pencil className="text-blue-950 h-[30px] w-[30px]" version={2} />
                    </button>
                </div>
                <div className="flex items-center justify-center rounded-full bg-sp-green-forest mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                    <button
                        onClick={() => presentAddressBook()}
                        className="overflow-hidden flex items-center justify-center p-[8px]"
                    >
                        <TroopUserIcon className="h-[30px] w-[30px]" />
                    </button>
                </div>
            </div>
        </div>
    );
};
