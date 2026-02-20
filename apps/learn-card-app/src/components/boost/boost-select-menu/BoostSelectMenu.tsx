import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lottie from 'react-lottie-player';
import {
    useGetBoosts,
    useGetResolvedBoosts,
    useModal,
    walletSubtypeToDefaultImageSrc,
} from 'learn-card-base';
import useBoostModal from '../hooks/useBoostModal';
import BoostWizard from '../boost-options/boostVCTypeOptions/BoostWizard';

import { IonCol, IonRow, IonGrid, IonItem, IonList } from '@ionic/react';
import CaretDown from 'learn-card-base/svgs/CaretDown';

import BoostManagedCard from '../../boost/boost-managed-card/BoostManagedCard';
import BoostManagedIDCard from '../boost-managed-card/BoostManagedIDCard';

import { BoostUserTypeEnum, boostVCTypeOptions } from '../boost-options/boostOptions';
import Wand from 'learn-card-base/svgs/Wand';
import {
    ModalTypes,
    categoryMetadata,
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

const HourGlass = '/lotties/hourglass.json';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';
import BoostSelectCategoryMenu from './BoostSelectCategoryMenu';

const PATH_TO_CATEGORY = {
    learninghistory: BoostCategoryOptionsEnum.learningHistory,
    workhistory: BoostCategoryOptionsEnum.workHistory,
    ids: BoostCategoryOptionsEnum.id,
    skills: BoostCategoryOptionsEnum.skill,
    achievements: BoostCategoryOptionsEnum.achievement,
    socialBadges: BoostCategoryOptionsEnum.socialBadge,
    memberships: BoostCategoryOptionsEnum.membership,
};

type BoostSelectMenuProps = {
    showCloseButton?: boolean;
    otherUserProfileId?: string;
};

const BoostSelectMenu: React.FC<BoostSelectMenuProps> = ({
    showCloseButton = true,
    otherUserProfileId,
}) => {
    const location = useLocation();
    const { handlePresentBoostModal } = useBoostModal(
        undefined,
        undefined,
        true,
        true,
        otherUserProfileId
    );
    const { closeModal, newModal } = useModal();
    const [selectedVCType, setSelectedVCType] = useState<BoostCategoryOptionsEnum | 'All'>(
        BoostCategoryOptionsEnum.all
    );

    const handleCategoryTypeChange = (value: BoostCategoryOptionsEnum | 'All') => {
        setSelectedVCType(value);
    };
    const pathName = location?.pathname?.replace('/', '');
    const onCategoryRoute = pathName ? PATH_TO_CATEGORY[pathName] : null;
    const onSkillCategoryRoute = pathName === 'skills';

    useEffect(() => {
        // change default selectedVCType if on category route
        if (onCategoryRoute && !onSkillCategoryRoute) {
            setSelectedVCType(onCategoryRoute);
        } else {
            setSelectedVCType(BoostCategoryOptionsEnum.all);
        }
    }, [onCategoryRoute]);

    const boostUserType = BoostUserTypeEnum.someone;

    const boostDropdownCategoryOptions = boostVCTypeOptions[boostUserType].map(
        options => options.type
    );

    let color, IconComponent, title;

    ({ color, IconComponent, title } = boostCategoryMetadata[selectedVCType]);

    const { isFetching: fetchingAllBoosts } = useGetBoosts();

    const { data: boostUris, isLoading: boostUrisLoading } =
        selectedVCType !== 'All'
            ? useGetBoosts(boostCategoryMetadata[selectedVCType].credentialType)
            : useGetBoosts();

    const filteredBoostUris = boostUris?.filter(boost => boost.category !== 'Family');
    const boostUrisToUse = selectedVCType === 'All' ? filteredBoostUris ?? [] : boostUris ?? [];

    const { data: boosts, isLoading: boostsResolvedLoading } = useGetResolvedBoosts(
        boostUrisToUse ?? []
    );

    const boostsLoading = boostUrisLoading || fetchingAllBoosts || boostsResolvedLoading;

    const currentWalletSubtype =
        categoryMetadata[boostCategoryMetadata[selectedVCType].credentialType].walletSubtype;
    const imgSrc = walletSubtypeToDefaultImageSrc(currentWalletSubtype);
    const renderBoostsList = boosts?.map((boost, index) => {
        const isID = boost?.boost?.category === BoostCategoryOptionsEnum.id;
        const isMembership = boost?.boost?.category === BoostCategoryOptionsEnum.membership;

        if (isID || isMembership) {
            return (
                <div className="mt-6" key={boost?.boost?.uri || index}>
                    <BoostManagedIDCard
                        boost={boost?.boost}
                        boostVC={boost?.boostVC}
                        defaultImg={imgSrc}
                        categoryType={boost?.boost?.category}
                        userToBoostProfileId={otherUserProfileId}
                        loading={boostsLoading}
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
                categoryType={boost?.boost?.category}
                sizeLg={6}
                sizeMd={6}
                sizeSm={6}
                userToBoostProfileId={otherUserProfileId}
                loading={boostsLoading}
            />
        );
    });

    const handleNewBoostModal = () => {
        handlePresentBoostModal();
    };

    return (
        <section>
            <IonRow className="w-full bg-white">
                <IonCol className="w-full flex items-center justify-center mt-8">
                    <button
                        className="relative flex items-center justify-center bg-indigo-900 text-white rounded-full px-[18px] py-[12px] font-poppins text-xl text-center w-full shadow-lg font-medium mx-[20px] mb-[8px]"
                        onClick={() => {
                            closeModal();
                            newModal(
                                <BoostWizard boostUserType={BoostUserTypeEnum.someone} />,
                                {
                                    sectionClassName: '!max-w-[500px] !bg-white',
                                },
                                { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
                            );
                        }}
                    >
                        <Wand color="#FFFFFF" opacity="full" className="mr-[10px]" />
                        AI Boost Wizard
                    </button>
                </IonCol>
            </IonRow>

            <IonRow className="w-full bg-white">
                <IonCol className="w-full flex items-center justify-center">
                    <button
                        onClick={handleNewBoostModal}
                        className="bg-gradient-rainbow text-xl text-white flex items-center justify-center font-semibold py-[5px] rounded-full w-full mx-[20px] border-solid border-white border-[2px] px-[18px] shadow-soft-bottom mb-[10px]"
                    >
                        New
                        <GearPlusIcon className="ml-1 text-grayscale-800" />
                    </button>
                </IonCol>
            </IonRow>

            <IonGrid className="ion-padding bg-grayscale-100">
                <div className="flex w-full items-center justify-between px-4">
                    <p className="font-bold text-grayscale-900 font-poppins">Templates</p>
                    <IonList className="rounded-full ion-no-padding p-0 shadow-3xl">
                        <IonItem
                            lines="none"
                            role="button"
                            onClick={() =>
                                newModal(
                                    <BoostSelectCategoryMenu
                                        onClick={handleCategoryTypeChange}
                                        closeModal={closeModal}
                                        selectedBoostType={selectedVCType}
                                        categories={boostDropdownCategoryOptions}
                                    />,
                                    {
                                        sectionClassName: '!max-w-[500px]',
                                    }
                                )
                            }
                        >
                            {selectedVCType === 'All' ? (
                                <div className="flex justify-center items-center">
                                    <p className="font-poppins text-[14px] font-semibold text-grayscale-900">
                                        All
                                    </p>
                                    <CaretDown />
                                </div>
                            ) : (
                                <IconComponent
                                    className={`text-${color} m-0 p-0 min-h-[30px] min-w-[30px] h-[30px] w-[30px]`}
                                />
                            )}
                        </IonItem>
                    </IonList>
                </div>
                <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                    <IonGrid className="max-w-[400px] min-h-[220px]">
                        {!boostsLoading && boosts && boosts?.length == 0 && (
                            <div className="flex flex-col w-full h-full items-center justify-center">
                                <div className="max-w-[160px] m-auto flex justify-center  min-h-[50px]"></div>
                                <p className="mt-2 font-poppins text-xl text-grayscale-900">
                                    No Boosts yet!
                                </p>
                            </div>
                        )}
                        {!boostsLoading && boosts && boosts?.length > 0 && (
                            <IonRow> {renderBoostsList}</IonRow>
                        )}
                        {boostsLoading && !boosts && (
                            <div className="flex flex-col w-full h-full items-center justify-center">
                                <div className="max-w-[150px] min-h-[150px]">
                                    <Lottie
                                        loop
                                        path={HourGlass}
                                        play
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            </div>
                        )}
                    </IonGrid>
                </IonCol>

                {showCloseButton && (
                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => closeModal()}
                            className="text-grayscale-900 text-center text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </IonGrid>
        </section>
    );
};

export default BoostSelectMenu;
