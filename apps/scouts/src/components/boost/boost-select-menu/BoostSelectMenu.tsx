import React, { useState, useEffect } from 'react';
import { useLocation, type NavigateFunction } from 'react-router';
import Lottie from 'react-lottie-player';

import {
    useScreenWidth,
    useGetBoosts,
    useGetResolvedBoosts,
    categoryMetadata,
    BoostCategoryOptionsEnum,
    walletSubtypeToDefaultImageSrc,
} from 'learn-card-base';
import useBoostModal from '../hooks/useBoostModal';

import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import { AppSelect } from 'learn-card-base/ui/controls/AppSelect';
import BoostManagedCard from '../../boost/boost-managed-card/BoostManagedCard';
import BoostManagedIDCard from '../boost-managed-card/BoostManagedIDCard';

import {
    BoostUserTypeEnum,
    boostCategoryOptions,
    boostVCTypeOptions,
} from '../boost-options/boostOptions';
import { UnsignedVC, VC } from '@learncard/types';

import PurpGhost from '../../../assets/lotties/purpghost.json';
import * as m from '../../../paraglide/messages.js';
import { LoadingSpinner } from 'learn-card-base/components/loaders/LoadingSpinner';
import { AppContent, AppHeader, AppPage } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
import { AppItem, AppList } from 'learn-card-base/ui/list';

const PATH_TO_CATEGORY = {
    learninghistory: BoostCategoryOptionsEnum.learningHistory,
    workhistory: BoostCategoryOptionsEnum.workHistory,
    ids: BoostCategoryOptionsEnum.id,
    skills: BoostCategoryOptionsEnum.skill,
    achievements: BoostCategoryOptionsEnum.achievement,
    socialBadges: BoostCategoryOptionsEnum.socialBadge,
    memberships: BoostCategoryOptionsEnum.membership,
    badges: BoostCategoryOptionsEnum.socialBadge,
    troops: BoostCategoryOptionsEnum.membership,
};

type BoostSelectMenuProps = {
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    boostCredential: VC | UnsignedVC;
    boostUri: string;
    profileId: string;
    history: NavigateFunction;
    showNewBoost?: boolean;
    otherUserProfileId?: string;
};

const BoostSelectMenu: React.FC<BoostSelectMenuProps> = ({
    handleCloseModal,
    showCloseButton = true,
    history,
    boostCredential,
    boostUri,
    profileId,
    showNewBoost,
    otherUserProfileId,
}) => {
    const width = useScreenWidth(true);
    const location = useLocation();
    const { handlePresentBoostModal } = useBoostModal(history);

    const [showNewBoostOptions, setShowNewBoostOptions] = useState(false);
    const [selectedVCType, setSelectedVCType] = useState<BoostCategoryOptionsEnum>(
        BoostCategoryOptionsEnum.socialBadge
    );

    const handleCategoryTypeChange = (value: BoostCategoryOptionsEnum) => {
        setSelectedVCType(value);
    };
    const pathName = location?.pathname?.replace('/', '');

    const onCategoryRoute = pathName ? PATH_TO_CATEGORY[pathName] : null;

    useEffect(() => {
        if (onCategoryRoute) {
            setSelectedVCType(onCategoryRoute);
        } else {
            setSelectedVCType(BoostCategoryOptionsEnum.socialBadge);
        }
    }, [onCategoryRoute]);

    const boostUserType = BoostUserTypeEnum.someone;
    const boostDropdownCategoryOptions = boostVCTypeOptions[boostUserType];

    const { color, IconComponent, title } = boostCategoryOptions[selectedVCType];

    const [issueLoading, setIssueLoading] = useState(false);

    const {
        data: allBoostUris,
        isLoading: allBoostUrisLoading,
        error: allBoostUrisError,
    } = useGetBoosts();

    const {
        data: boostUris,
        isLoading: boostUrisLoading,
        error,
    } = useGetBoosts(boostCategoryMetadata[selectedVCType].credentialType);
    const { data: boosts, isLoading: boostsResolvedLoading } = useGetResolvedBoosts(
        boostUris ?? []
    );

    const boostsLoading = boostUrisLoading || boostsResolvedLoading;

    const currentWalletSubtype =
        categoryMetadata[boostCategoryMetadata[selectedVCType].credentialType].walletSubtype;
    const imgSrc = walletSubtypeToDefaultImageSrc(currentWalletSubtype);
    const renderBoostsList = boosts?.map((boost, index) => {
        const isID = boost?.boost?.category === BoostCategoryOptionsEnum.id;
        const isMembership = boost?.boost?.category === BoostCategoryOptionsEnum.membership;

        if (isID || isMembership) {
            return (
                // eslint-disable-next-line react/jsx-key -- existing keyless list; picking keys changes React reconciliation, out of scope here
                <div className="mt-6">
                    <BoostManagedIDCard
                        key={boost?.boost?.uri || index}
                        boost={boost?.boost}
                        boostVC={boost?.boostVC}
                        defaultImg={imgSrc}
                        categoryType={BoostCategoryOptionsEnum.id}
                        userToBoostProfileId={otherUserProfileId}
                    />
                </div>
            );
        }

        return (
            <BoostManagedCard
                key={index}
                boost={boost?.boost}
                boostVC={boost?.boostVC}
                defaultImg={imgSrc}
                categoryType={selectedVCType}
                sizeLg={6}
                sizeMd={6}
                sizeSm={6}
                userToBoostProfileId={otherUserProfileId}
            />
        );
    });

    const handleNewBoostModal = () => {
        handlePresentBoostModal();
    };

    if (allBoostUrisLoading) {
        return (
            <AppPage className="bg-white">
                <AppContent className="w-full h-full  bg-white">
                    <div className="flex flex-col w-full h-full items-center justify-center  bg-white">
                        <div className="max-w-[150px]">
                            <LoadingSpinner />
                        </div>
                    </div>
                </AppContent>
            </AppPage>
        );
    }

    return (
        <AppPage>
            <AppHeader className="ion-no-border bg-white pt-5">
                <AppRow className="w-full bg-white">
                    <AppCol className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={handleNewBoostModal}
                            className="mx-[20px] flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] font-medium text-white text-2xl w-full shadow-lg"
                        >
                            <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                            {m['boost.newBoost']()}
                        </button>
                    </AppCol>
                </AppRow>
            </AppHeader>

            <AppContent>
                <AppGrid className="ion-padding">
                    <div className="flex w-full items-center justify-between px-4">
                        <p className="font-bold">{m['boost.existingBoosts']()}</p>
                        <AppList className="rounded-full ion-no-padding p-0 shadow-3xl">
                            <AppItem lines="none">
                                <IconComponent
                                    className={`text-${color} m-0 p-0 min-h-[30px] min-w-[30px] h-[30px] w-[30px]`}
                                />
                                <AppSelect
                                    onValueChange={value =>
                                        handleCategoryTypeChange(value as BoostCategoryOptionsEnum)
                                    }
                                    value={selectedVCType}
                                    className="text-black"
                                    selectedText=" "
                                    aria-label={m['boost.existingBoosts']()}
                                    options={boostDropdownCategoryOptions.map(
                                        ({ type, title }) => ({
                                            value: type,
                                            label: title,
                                        })
                                    )}
                                />
                            </AppItem>
                        </AppList>
                    </div>

                    <AppCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                        <AppGrid className="max-w-[400px]">
                            {!boostsLoading && boosts && boosts?.length == 0 && (
                                <div className="flex flex-col w-full h-full items-center justify-center">
                                    <div className="max-w-[160px] m-auto flex justify-center">
                                        <Lottie
                                            loop
                                            animationData={PurpGhost}
                                            play
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                    <p className="mt-2 text-2xl">{m['boost.noBoostsYet']()}</p>
                                </div>
                            )}
                            {!boostsLoading && boosts && boosts?.length > 0 && (
                                <AppRow> {renderBoostsList}</AppRow>
                            )}
                            {boostsLoading && (
                                <div className="flex flex-col w-full h-full items-center justify-center">
                                    <div className="max-w-[150px]">
                                        <LoadingSpinner />
                                    </div>
                                </div>
                            )}
                        </AppGrid>
                    </AppCol>

                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </AppGrid>
            </AppContent>
        </AppPage>
    );
};

export default BoostSelectMenu;
