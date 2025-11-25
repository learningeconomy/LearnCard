import React, { useEffect, useState } from 'react';

import TrashBin from '../../../svgs/TrashBin';
import { IonInput } from '@ionic/react';

import { BoostCMSIssueTo, conditionalPluralize, UserProfilePicture } from 'learn-card-base';
import { TroopsCMSState } from '../../troopCMSState';

export enum TroopIDUserListTabsEnum {
    all = 'all',
    scouts = 'scouts',
    leaders = 'leaders',
}

type TroopIDUsersListProps = {
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;

    admins?: BoostCMSIssueTo;
    setAdmins?: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;

    members?: BoostCMSIssueTo[];
    setMembers?: React.Dispatch<React.SetStateAction<BoostCMSIssueTo[]>>;

    isInTroopViewMode: boolean;

    children: React.ReactNode;
};

export const TroopIDUsersList: React.FC<TroopIDUsersListProps> = ({
    state,
    setState,
    members,
    setMembers,
    admins,
    setAdmins,
    isInTroopViewMode,
    children,
}) => {
    const [activeTab, setActiveTab] = useState<TroopIDUserListTabsEnum>(
        TroopIDUserListTabsEnum.all
    );
    const [search, setSearch] = useState<string>('');

    const scoutsList =
        state?.issueTo.map(scout => {
            return {
                ...scout,
                type: 'scout',
            };
        }) ?? [];
    const leadersList =
        state?.admins.map(leader => {
            return {
                ...leader,
                type: 'leader',
            };
        }) ?? [];
    const scoutsAndLeadersList = [...leadersList, ...scoutsList];

    const scoutsListCount = scoutsList?.length ?? 0;
    const leadersListCount = leadersList?.length ?? 0;
    const scoutsAndLeadersListCount = scoutsListCount + leadersListCount;

    const handleDeleteUser = (key: string, profileId: string) => {
        setState(prevState => {
            return {
                ...prevState,
                [key]: [...prevState?.[key]?.filter(user => user?.profileId !== profileId)],
            };
        });

        if (key === 'admins') {
            setAdmins?.(prevState => [...prevState?.filter(user => user?.profileId !== profileId)]);
        }

        if (key === 'issueTo') {
            setMembers?.(prevState => [
                ...prevState?.filter(user => user?.profileId !== profileId),
            ]);
        }
    };

    let filteredList = scoutsAndLeadersList ?? [];
    if (activeTab === TroopIDUserListTabsEnum.leaders) filteredList = leadersList;
    if (activeTab === TroopIDUserListTabsEnum.scouts) filteredList = scoutsList;
    if (search.length > 0) {
        filteredList = filteredList.filter(user => {
            if (
                user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
                user?.profileId?.toLowerCase().includes(search.toLowerCase())
            ) {
                return true;
            }
            return false;
        });
    }

    useEffect(() => {
        if (scoutsListCount === 0 || leadersListCount === 0) {
            // if one of the types is 0, reset to all tab so we're not filtered and hiding the tab buttons
            setActiveTab(TroopIDUserListTabsEnum.all);
        }
    }, [scoutsListCount, leadersListCount]);

    if (scoutsAndLeadersListCount === 0) return <></>;

    return (
        <section className="bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px]">
            {scoutsAndLeadersListCount > 0 && (
                <div className="w-full flex items-start justify-center flex-col">
                    <h3 className="font-notoSans text-xl font-normal mb-2 text-grayscale-900">
                        {conditionalPluralize(scoutsAndLeadersListCount, 'Member')}
                    </h3>
                    {isInTroopViewMode && scoutsListCount > 0 && leadersListCount > 0 && (
                        <div className="flex mb-2">
                            <button
                                onClick={() => setActiveTab(TroopIDUserListTabsEnum.all)}
                                className={`text-sm font-notoSans font-semibold mr-2 ${activeTab === TroopIDUserListTabsEnum.all
                                        ? 'text-sp-blue-ocean'
                                        : 'text-grayscale-700'
                                    }`}
                            >
                                All
                            </button>
                            {scoutsListCount > 0 && (
                                <button
                                    onClick={() => setActiveTab(TroopIDUserListTabsEnum.scouts)}
                                    className={`text-sm font-notoSans font-semibold mr-2 text-grayscale-700 ${activeTab === TroopIDUserListTabsEnum.scouts
                                            ? 'text-sp-blue-ocean'
                                            : 'text-grayscale-700'
                                        }`}
                                >
                                    {scoutsListCount} {scoutsListCount === 1 ? 'Scout' : 'Scouts'}
                                </button>
                            )}

                            {leadersListCount > 0 && (
                                <button
                                    onClick={() => setActiveTab(TroopIDUserListTabsEnum.leaders)}
                                    className={`text-sm font-notoSans font-semibold mr-2 text-grayscale-700 ${activeTab === TroopIDUserListTabsEnum.leaders
                                            ? 'text-sp-blue-ocean'
                                            : 'text-grayscale-700'
                                        }`}
                                >
                                    {leadersListCount}{' '}
                                    {leadersListCount === 1 ? 'Leader' : 'Leaders'}
                                </button>
                            )}
                        </div>
                    )}
                    <IonInput
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-notoSans text-[17px] w-full troops-cms-placeholder"
                        placeholder="Search..."
                        value={search}
                        onIonInput={e => setSearch(e.detail.value)}
                    />
                </div>
            )}

            {children}

            {filteredList?.length > 0 &&
                filteredList.map((user, index) => {
                    const typeTitle = user?.type === 'scout' ? 'Scout' : 'Leader';
                    const deleteKey = user?.type === 'scout' ? 'issueTo' : 'admins';

                    return (
                        <div
                            key={index}
                            className="flex items-center justify-between w-full bg-white border-t-grayscale-100 border-t-solid border-t-[1px] py-[10px]"
                        >
                            <div className="flex items-center justify-start w-full gap-[10px]">
                                <UserProfilePicture
                                    customContainerClass="flex justify-center items-center w-[40px] h-[40px] rounded-full overflow-hidden text-white font-medium text-4xl"
                                    customImageClass="flex justify-center items-center w-[40px] h-[40px] rounded-full overflow-hidden object-cover"
                                    customSize={120}
                                    user={user}
                                />
                                <div className="flex flex-col items-start justify-center">
                                    <p className="text-grayscale-900 font-notoSans text-[17px]">
                                        {user?.displayName || user?.profileId}
                                    </p>
                                    <p className="text-grayscale-500 font-[500] font-notoSans flex items-center justify-center text-[14px]">
                                        {typeTitle}
                                    </p>
                                </div>
                            </div>
                            {!user.unremovable && (
                                <div className="flex items-center justify-center rounded-full bg-grayscale-100 mr-2 h-[40px] w-[40px] min-h-[40px] min-w-[40px]  overflow-hidden">
                                    <button
                                        onClick={() => handleDeleteUser(deleteKey, user?.profileId)}
                                        className="overflow-hidden flex items-center justify-center p-[8px]"
                                    >
                                        <TrashBin className="text-blue-950 h-[30px] w-[30px]" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
        </section>
    );
};

export default TroopIDUsersList;
