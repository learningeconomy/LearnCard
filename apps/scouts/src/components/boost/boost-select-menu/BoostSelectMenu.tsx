import React, { useState, useEffect } from 'react';
import { useLocation, RouteComponentProps } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';
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

import {
    IonCol,
    IonContent,
    IonRow,
    IonGrid,
    IonHeader,
    IonPage,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
} from '@ionic/react';

import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import BoostManagedCard from '../../boost/boost-managed-card/BoostManagedCard';
import BoostManagedIDCard from '../boost-managed-card/BoostManagedIDCard';

import {
    BoostUserTypeEnum,
    boostCategoryOptions,
    boostVCTypeOptions,
} from '../boost-options/boostOptions';
import { UnsignedVC, VC } from '@learncard/types';

import PurpGhost from '../../../assets/lotties/purpghost.json';
import HourGlass from '../../../assets/lotties/hourglass.json';

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
    history: RouteComponentProps['history'];
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
    const flags = useFlags();
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
        //Change default selectedVCType if on category route
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
            <IonPage className="bg-white">
                <IonContent className="w-full h-full  bg-white">
                    <div className="flex flex-col w-full h-full items-center justify-center  bg-white">
                        <div className="max-w-[150px]">
                            <Lottie
                                loop
                                animationData={HourGlass}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonHeader className="ion-no-border bg-white pt-5">
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={handleNewBoostModal}
                            className="mx-[20px] flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] font-medium text-white text-2xl w-full shadow-lg"
                        >
                            <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> New
                            Boost
                        </button>
                    </IonCol>
                </IonRow>
            </IonHeader>

            <IonContent>
                <IonGrid className="ion-padding">
                    <div className="flex w-full items-center justify-between px-4">
                        <p className="font-bold">Existing boosts</p>
                        <IonList className="rounded-full ion-no-padding p-0 shadow-3xl">
                            <IonItem lines="none">
                                <IconComponent
                                    className={`text-${color} m-0 p-0 min-h-[30px] min-w-[30px] h-[30px] w-[30px]`}
                                />
                                <IonSelect
                                    interface="popover"
                                    onIonChange={e => handleCategoryTypeChange(e.detail.value)}
                                    value={selectedVCType}
                                    className="text-black"
                                    selectedText=" "
                                >
                                    {boostDropdownCategoryOptions.map(({ type, title, id }) => {
                                        return (
                                            <IonSelectOption key={id} value={type}>
                                                {title}
                                            </IonSelectOption>
                                        );
                                    })}
                                </IonSelect>
                            </IonItem>
                        </IonList>
                    </div>

                    <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                        <IonGrid className="max-w-[400px]">
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
                                    <p className="mt-2 text-2xl">No Boosts yet!</p>
                                </div>
                            )}
                            {!boostsLoading && boosts && boosts?.length > 0 && (
                                <IonRow> {renderBoostsList}</IonRow>
                            )}
                            {boostsLoading && (
                                <div className="flex flex-col w-full h-full items-center justify-center">
                                    <div className="max-w-[150px]">
                                        <Lottie
                                            loop
                                            animationData={HourGlass}
                                            play
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </IonGrid>
                    </IonCol>

                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default BoostSelectMenu;
