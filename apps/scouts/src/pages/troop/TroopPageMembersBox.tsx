import React, { useState, useRef, useCallback, useMemo } from 'react';
import { IonInput } from '@ionic/react';
import useTroopIds from '../../hooks/useTroopIds';
import { useTroopMembers } from '../../hooks/useTroopMembers';
import BulkyAddUser from 'learn-card-base/svgs/BulkyAddUser';
import CaretListItem from './CaretListItem';
import IdOptionsModal from './IdOptionsModal';
import ScoutConnectModal from './ScoutConnectModal';
import Search from 'learn-card-base/svgs/Search';
import {
    useModal,
    useGetBoostPermissions,
    conditionalPluralize,
    ModalTypes,
    ProfilePicture,
    useGetCurrentUserTroopIds,
} from 'learn-card-base';
import { getScoutsRole, getScoutsNounForRole } from '../../helpers/troop.helpers';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import { VC } from '@learncard/types';

export enum MemberTabsEnum {
    All = 'All',
    Scouts = 'Scout',
    Leaders = 'Leader',
}

type TroopPageMembersBoxProps = {
    handleShare: () => void;
    boostUri?: string;
    credential: VC;
    userRole?: ScoutsRoleEnum; // Optional: override role for elevated access
};

const TroopPageMembersBox: React.FC<TroopPageMembersBoxProps> = ({
    handleShare,
    boostUri,
    credential,
    userRole,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });
    const inputRef = useRef<HTMLIonInputElement>(null);

    const [tab, setTab] = useState<MemberTabsEnum>(MemberTabsEnum.All);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: myTroopIds, isLoading: myTroopIdsLoading } = useGetCurrentUserTroopIds();
    const credentialRole = getScoutsRole(credential);
    // Use userRole if provided (for parent admin elevated access), otherwise use credential role
    const role = userRole ?? credentialRole;
    const { scoutBoostUri, troopBoostUri, currentBoostUri } = useTroopIds({ boostUri, credential });

    // Permissions data
    const { data: boostPermissionsData } = useGetBoostPermissions(currentBoostUri);

    // Derived state
    const isScout = role === ScoutsRoleEnum.scout;
    const isLeader = role === ScoutsRoleEnum.leader;
    const isScoutOrLeader = isScout || isLeader;
    let showInviteButton = !myTroopIds?.isScout && boostPermissionsData?.canIssue;

    // temp fix until permissions are more sorted out
    if (
        myTroopIds?.isNationalAdmin &&
        !myTroopIds?.isScoutGlobalAdmin &&
        !scoutBoostUri &&
        !troopBoostUri
    ) {
        showInviteButton = false;
    }

    // Members data
    const { scoutCount, leaderCount, totalCount, memberRows } = useTroopMembers(
        credential,
        tab,
        boostUri
    );

    const filteredMembers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return memberRows.filter(member => member.name.toLowerCase().includes(query));
    }, [memberRows, searchQuery]);

    const handleOpenScoutConnectModal = (boostUri: string) => {
        newModal(<ScoutConnectModal boostUriForClaimLink={boostUri} credential={credential} />, {
            sectionClassName: '!max-w-[450px]',
        });
    };

    const handleInviteClick = useCallback(() => {
        if (myTroopIds?.isTroopLeader) {
            handleOpenScoutConnectModal(scoutBoostUri);
        } else if (boostPermissionsData?.canIssue) {
            handleOpenScoutConnectModal(currentBoostUri);
        }
    }, [
        myTroopIds?.isTroopLeader,
        boostPermissionsData?.canIssue,
        scoutBoostUri,
        currentBoostUri,
        handleOpenScoutConnectModal,
    ]);

    const handleSearch = useCallback((value: string) => {
        setSearchQuery(value.trim());
    }, []);

    const handleShowOptions = useCallback(
        (member: (typeof memberRows)[number]) => {
            newModal(
                <IdOptionsModal
                    credential={credential}
                    isPersonalId={member.isPersonalId}
                    canManageId={member.canManageId}
                    ownerName={member.name}
                    ownerImage={member.image}
                    ownerProfileId={member.profileId}
                    handleShare={handleShare}
                    boostUri={member.boostUri}
                    type={member?.type}
                />,
                { sectionClassName: '!max-w-[400px]' }
            );
        },
        [newModal, credential, handleShare]
    );

    const getTabCount = useCallback(
        (tabOption: MemberTabsEnum) => {
            switch (tabOption) {
                case MemberTabsEnum.Scouts:
                    return scoutCount;
                case MemberTabsEnum.Leaders:
                    return leaderCount;
                default:
                    return totalCount;
            }
        },
        [scoutCount, leaderCount, totalCount]
    );

    const membersExist = totalCount > 0;
    const containerClasses = `bg-white rounded-[20px] shadow-box-bottom overflow-hidden flex flex-col px-5 pt-5 ${
        membersExist ? 'pb-2.5' : 'pb-5'
    }`;

    return (
        <div className={containerClasses}>
            <header className="flex items-center">
                <h2 className="text-gray-900 font-notoSans text-xl">
                    {conditionalPluralize(totalCount, 'Member')}
                </h2>

                {showInviteButton && (
                    <button
                        className="ml-auto pl-5 pr-2 py-1.5 bg-sp-green-forest rounded-[40px] text-white text-[17px] font-notoSans font-semibold leading-6 tracking-0.25 flex gap-2.5 items-center"
                        onClick={handleInviteClick}
                        aria-label="Invite new member"
                    >
                        Invite
                        <BulkyAddUser aria-hidden="true" />
                    </button>
                )}
            </header>

            {membersExist && (
                <>
                    {isScoutOrLeader && (
                        <nav className="flex gap-3.5 pt-2.5">
                            {Object.values(MemberTabsEnum).map(tabOption => {
                                const isActive = tab === tabOption;
                                const count = getTabCount(tabOption);

                                return (
                                    <button
                                        key={tabOption}
                                        onClick={() => setTab(tabOption)}
                                        className={`font-notoSans text-sm font-semibold ${
                                            isActive ? 'text-sp-green-forest' : 'text-gray-600'
                                        }`}
                                        aria-current={isActive ? 'true' : undefined}
                                    >
                                        {tabOption === MemberTabsEnum.All
                                            ? 'All'
                                            : conditionalPluralize(count, tabOption)}
                                    </button>
                                );
                            })}
                        </nav>
                    )}

                    <div className="relative bg-gray-100 rounded-[15px] mt-2.5 cursor-pointer">
                        <label htmlFor="member-search" className="sr-only">
                            Search members
                        </label>
                        <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" />
                        <IonInput
                            id="member-search"
                            ref={inputRef}
                            autocapitalize="on"
                            placeholder="Search..."
                            value={searchQuery}
                            className="!pl-10 text-gray-800 text-[17px] font-notoSans !py-1 w-full"
                            onIonInput={e => handleSearch(e.detail.value ?? '')}
                            type="text"
                            clearInput
                        />
                    </div>
                </>
            )}

            <ul className="flex flex-col">
                {filteredMembers.map(member => (
                    <CaretListItem
                        key={member.profileId}
                        mainText={member.name}
                        caretText={member.type}
                        icon={
                            <ProfilePicture
                                customContainerClass="h-10 w-10 overflow-hidden rounded-full flex items-center justify-center"
                                customImageClass="w-full h-full object-cover"
                                overrideSrcURL={member.image}
                                overrideSrc
                            />
                        }
                        onClick={() => handleShowOptions(member)}
                    />
                ))}
            </ul>
        </div>
    );
};

export default React.memo(TroopPageMembersBox);
