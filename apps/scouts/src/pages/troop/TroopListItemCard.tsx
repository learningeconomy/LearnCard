import React from 'react';

import {
    useModal,
    useGetBoostParents,
    useGetCredentialWithEdits,
    useResolveBoost,
    useGetBoostRecipients,
    ModalTypes,
} from 'learn-card-base';
import useEditTroopId from '../../hooks/useEditTroopId';
import boostSearchStore from '../../stores/boostSearchStore';

import TroopPage from './TroopPage';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import TroopUserIcon from '../../components/svgs/TroopUserIcon';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import TroopActionMenu from './TroopActionMenu';
import BoostRecipients from 'learn-card-base/components/boost/BoostRecipients';
import ScoutConnectModal from './ScoutConnectModal';
import InviteSelectionModal from './InviteSelectionModal';

import { Boost, VC } from '@learncard/types';
import { pluralize } from 'learn-card-base';
import { useCanInviteTroop } from './useCanInviteTroop';
import { getDefaultBadgeThumbForCredential, getScoutsRole, getScoutsNounForRole } from '../../helpers/troop.helpers';
import { insertParamsToFilestackUrl, useGetCurrentUserTroopIds } from 'learn-card-base';

type TroopListItemProps = {
    boost: Boost;
    customMemberName?: string;
    showNetwork?: boolean;
};

const TroopListItemCardContainer: React.FC<TroopListItemProps> = ({
    boost,
    showNetwork,
    customMemberName,
}) => {
    const {
        data: _resolvedBoost,
        isLoading: resolvedBoostLoading,
        isFetching: resolvedBoostFetching,
    } = useResolveBoost(boost?.uri);

    if (resolvedBoostLoading) return <></>;
    return (
        <TroopListItemCardItem
            resolvedBoost={_resolvedBoost}
            boostUri={boost?.uri}
            showNetwork={showNetwork}
            customMemberName={customMemberName}
        />
    );
};

type TroopListItemCardItemProps = {
    resolvedBoost: VC;
    customMemberName?: string;
    showNetwork?: boolean;
    boostUri: string;
};

const TroopListItemCardItem: React.FC<TroopListItemCardItemProps> = ({
    resolvedBoost,
    showNetwork,
    customMemberName,
    boostUri,
}) => {
    const { credentialWithEdits } = useGetCredentialWithEdits(resolvedBoost, boostUri);
    const _resolvedBoost = credentialWithEdits ?? resolvedBoost;
    const { data: myTroopIds, isLoading: myTroopIdsLoading } = useGetCurrentUserTroopIds();
    const { data: recipients, isLoading: recipientsLoading } = useGetBoostRecipients(boostUri);
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const { data: networkData, isLoading: networkLoading } = useGetBoostParents(boostUri);

    const {
        showInviteButton,
        scoutNoun,
        scoutPermissionsData,
        currentBoostUri,
        scoutBoostUri,
        troopBoostUri,
        boostPermissionsData,
        troopPermissionsData,
    } = useCanInviteTroop({ credential: _resolvedBoost, boostUri });

    const handleDelete = () => {};

    const handleOptions = () => {
        newModal(
            <TroopActionMenu
                handleCloseModal={() => {
                    closeModal();
                }}
                showCloseButton={true}
                handleDeleteBoost={handleDelete}
                handleEdit={openEditTroopOrNetworkModal}
                handleInviteMember={handleSelectInviteModal}
            />,
            { sectionClassName: '!max-w-[400px]' },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    const networkName = networkData?.records?.[0]?.name;

    const optimizedListBgImage = insertParamsToFilestackUrl(
        _resolvedBoost?.display?.backgroundImage || _resolvedBoost?.boostID?.backgroundImage,
        'resize=width:200/quality=value:75/'
    );

    const bgImgStyle = {
        backgroundImage: `url(${optimizedListBgImage})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
    };

    const { openEditTroopOrNetworkModal } = useEditTroopId(_resolvedBoost, boostUri);

    const handleClick = () => {
        boostSearchStore.set.boostUri(boostUri);
        boostSearchStore.set.contextCredential(_resolvedBoost);

        newModal(
            <TroopPage boostUri={boostUri} credential={_resolvedBoost} handleShare={() => {}} />
        );
    };

    const openScoutConnectModal = (boostUri: string, typeOverride?: string) => {
        newModal(
            <ScoutConnectModal
                boostUriForClaimLink={boostUri}
                credential={_resolvedBoost!}
                type={typeOverride || scoutNoun}
            />,
            {
                sectionClassName: '!max-w-[450px]',
            },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    const modifiedBoostImage = insertParamsToFilestackUrl(
        _resolvedBoost?.image,
        'resize=width:100/quality=value:75/'
    );
    const handleSelectInviteModal = () => {
        const canInviteScout = myTroopIds?.isTroopLeader || scoutPermissionsData?.canIssue;
        const canInviteLeader = boostPermissionsData?.canIssue;

        // Determine the correct label for the current credential type
        const credentialRole = getScoutsRole(_resolvedBoost);
        const credentialLabel = getScoutsNounForRole(credentialRole);

        if (canInviteScout && canInviteLeader) {
            newModal(
                <InviteSelectionModal
                    onInviteLeader={() => openScoutConnectModal(currentBoostUri, credentialLabel)}
                    onInviteScout={() => openScoutConnectModal(scoutBoostUri, 'Scout')}
                    handleCloseModal={closeModal}
                    scoutNoun={scoutNoun}
                />,
                { sectionClassName: '!max-w-[450px]' },
                { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
            );
        } else if (canInviteScout) {
            openScoutConnectModal(scoutBoostUri, 'Scout');
        } else if (canInviteLeader) {
            openScoutConnectModal(currentBoostUri, credentialLabel);
        }
    };

    const handleInviteModal = () => {
        handleSelectInviteModal();
    };

    const memberName = customMemberName ? customMemberName : 'Leader';

    return (
        <div className="cursor-pointer relative rounded-[20px] shadow-bottom-1-4  flex min-h-[130px] items-center h-full bg-white mt-[20px] w-full px-[20px] py-[10px]">
            <div className="absolute w-full top-0 left-0 z-[3] h-full" onClick={handleClick}></div>
            <div className="thumb-container cursor-pointer h-[100px] w-[85px] flex items-center z-[0]">
                <div className="thumbnail rounded-full bg-grayscale-100 h-[70px] w-[70px]">
                    <div
                        className="thumb-bg-el bg-grayscale-50 absolute left-0 top-0 h-[90%] w-[100px] rounded-bl-[0px] rounded-tl-[20px] rounded-br-[100%] z-[2]"
                        style={bgImgStyle}
                    ></div>

                    {resolvedBoost?.boostID?.issuerThumbnail ? (
                        <img
                            src={insertParamsToFilestackUrl(
                                resolvedBoost?.boostID?.issuerThumbnail,
                                'resize=width:100/quality=value:75/'
                            )}
                            className="relative w-full h-full object-cover rounded-full z-[3]"
                        />
                    ) : (
                        getDefaultBadgeThumbForCredential(
                            resolvedBoost,
                            'relative w-full h-full object-cover rounded-full z-[3]'
                        )
                    )}
                </div>
            </div>

            <div className="flex flex-col z-[2] w-full pl-[15px]">
                <span className="text-grayscale-900 cursor-pointer font-medium text-med relative">
                    {_resolvedBoost?.name}
                    <div className="absolute right-[0px] top-[0px] cursor-pointer">
                        <SlimCaretRight
                            className="text-grayscale-400 h-[20px] w-[20px]"
                            color="currentColor"
                        />
                    </div>
                </span>
                {showNetwork && (
                    <span className="text-grayscale-700 font-medium text-medium relative">
                        {networkName}
                    </span>
                )}
                {recipients && recipients?.length > 0 && (
                    <span className="font-medium text-grayscale-700">
                        {recipients?.length} {pluralize(memberName, recipients?.length)}
                    </span>
                )}
                {recipients?.length === 0 && (
                    <span className="font-medium text-grayscale-700">0 People</span>
                )}
                <span className="h-[30px]">
                    <BoostRecipients
                        recipients={recipients}
                        recipientsLoading={recipientsLoading}
                    />
                </span>
            </div>

            {/* <div className="absolute right-[20px] top-[20px] cursor-pointer">
                <SlimCaretRight
                    className="text-grayscale-400 h-[20px] w-[20px]"
                    color="currentColor"
                />
            </div> */}

            <div className="flex items-center justify-center gap-[10px] absolute right-[20px] bottom-[10px] z-[6]">
                <button
                    onClick={() => handleInviteModal()}
                    className="overflow-hidden cursor-pointer flex items-center justify-center p-[7px] rounded-full bg-sp-green-forest"
                >
                    <TroopUserIcon className="h-[26px] w-[26px]" />
                </button>

                <button
                    onClick={handleOptions}
                    className="rounded-full text-grayscale-80 bg-grayscale-100 p-[10px]"
                >
                    <ThreeDots />
                </button>
            </div>
        </div>
    );
};

export default TroopListItemCardContainer;
