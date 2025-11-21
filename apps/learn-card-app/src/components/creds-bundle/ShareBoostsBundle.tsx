import React, { useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import queryString from 'query-string';
import { useQueryClient } from '@tanstack/react-query';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { selectedCredsStore, SelectedCredsStoreState } from 'learn-card-base';

import useShareCredentials, { VcType, VC_TYPE } from 'learn-card-base/hooks/useShareCredentials';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';

import { IonContent, IonPage, IonToggle, IonSpinner, IonGrid, useIonAlert } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';
import 'swiper/css/navigation';
import { VC } from '@learncard/types';

type ShareCredentialsProps = {
    onSubmit?: (payload: SelectedCredsStoreState) => void;
    name?: string;
    initialCredentials?: VC[];
    readOnly?: boolean;
};

const ShareBoostsBundle: React.FC<ShareCredentialsProps> = ({
    onSubmit,
    name = 'boost',
    initialCredentials,
    readOnly,
}) => {
    const currentUser = useCurrentUser();
    const [presentAlert] = useIonAlert();

    const [isSharing, setIsSharing] = useState(false);

    const { search } = useLocation();
    let { skipReload } = queryString.parse(search);
    const skipReloadBool = skipReload === 'true';

    const {
        totalSelectedCount,
        totalCredentialsCount,
        allSelected,
        handleToggleSelectAll,
        handleToggleSelectAllType,
        handleVcClick,
        loading: credentialsLoading,
        errorMessage,
        getUniqueId,
        vcCounts,
        getAllSelected,
        getVcsByType,
        isVcSelected,
    } = useShareCredentials(undefined, skipReloadBool, initialCredentials);

    const showCredentials = !credentialsLoading;

    const vcDisplayWord: { [vcType in VcType]: string } = {
        [VC_TYPE.COURSE]: 'Learning History',
        [VC_TYPE.ID]: 'ID',
        [VC_TYPE.ACHIEVEMENT]: 'Achievement',
        [VC_TYPE.SKILL]: 'Skill',
        [VC_TYPE.WORK]: 'Work History',
        [VC_TYPE.SOCIAL_BADGE]: 'Social Badge',
    };

    const getTitle = (type: VcType) => {
        return `${vcCounts[type].selectedCount}/${vcCounts[type].totalCount} ${
            vcDisplayWord[type]
        }${
            vcCounts[type].totalCount !== 1 && type !== VC_TYPE.WORK && type !== VC_TYPE.COURSE
                ? 's'
                : ''
        }`;
    };

    // when you hit the accept button to "Share Credentials"
    //   creates a presentation bundle with all the selected credentials, signs it, and sends it to the app profile via LCN
    const handleIssueCredentials = async () => {
        if (totalSelectedCount === 0 || isSharing) return;

        setIsSharing(true);
        try {
            const selectedState = selectedCredsStore.get.state();
            onSubmit?.(selectedState);
        } catch (e) {
            console.log('///handleSubmit create credential bundle Error', e);
            presentAlert({
                header: 'Error',
                subHeader: 'Create Boost Bundle error',
                message: e?.toString(),
                buttons: ['OK'],
            });
            throw new Error('There was an error. Please try again later.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <IonPage>
            <IonContent>
                <IonGrid className="flex items-center justify-center p-[20px] pb-[100px] max-w-[700px]">
                    <section className="w-full">
                        <div className="flex flex-col gap-[15px] text-grayscale-900">
                            <h1 className="text-[17px] font-[500] leading-[21px]">
                                Select Earned Boosts To Share
                            </h1>
                        </div>

                        <hr className="my-[20px]" />

                        <section className="">
                            {!readOnly && (
                                <>
                                    <div className="flex flex-col items-center justify-center bg-white gap-[10px] text-[14px] leading-[18px] py-[20px] px-[40px] mt-[7px] mx-[7px] shadow-[0_0_7px_0px_rgba(0,0,0,0.2)] rounded-[10px]">
                                        <ProfilePicture
                                            customContainerClass="flex mr-[10px] flex-shrink-0 border-gray-300 border-[2px] w-[55px] h-[55px] items-center justify-center rounded-full overflow-hidden object-cover text-white font-medium text-4xl"
                                            customImageClass="w-full h-full object-cover flex-shrink-0"
                                            customSize={120}
                                        />
                                        <p className="font-[700] text-grayscale-900">
                                            {currentUser?.name || currentUser?.email}
                                        </p>

                                        <p className="font-[500] text-grayscale-700 text-center">
                                            This will create a shared boost bundle that can shared
                                            and viewed.
                                        </p>
                                        <p className="font-[500] text-grayscale-700 text-center">
                                            You have selected{' '}
                                            <span className="font-[700] text-grayscale-900">
                                                {totalSelectedCount}
                                            </span>{' '}
                                            {name}s to share
                                        </p>
                                    </div>

                                    <div className="mt-[15px] text--[14px]">
                                        {credentialsLoading && (
                                            <div className="w-full h-full flex flex-col opacity-[50%] items-center justify-center mt-[40px]">
                                                <IonSpinner />
                                                <p className="mt-[20px]">
                                                    Fetching your earned boosts...
                                                </p>
                                            </div>
                                        )}

                                        {errorMessage && !credentialsLoading && (
                                            <div className="mt-[50px]">
                                                <p className="text-red-500 font-bold">
                                                    Sorry! There was an error fetching your {name}s:{' '}
                                                    {errorMessage}
                                                </p>
                                            </div>
                                        )}

                                        {!credentialsLoading && totalCredentialsCount === 0 && (
                                            <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                                <div className="flex flex-col gap-[20px] text-grayscale-900 font-[700] font-montserrat">
                                                    <span className="text-[30px]">
                                                        No Credentials
                                                    </span>
                                                    <span className="text-[17px]">
                                                        "Love doesn't just sit there, like a stone,
                                                        it has to be made, like bread; remade all
                                                        the time, made new."
                                                    </span>
                                                </div>
                                            </section>
                                        )}
                                    </div>

                                    {!credentialsLoading && totalCredentialsCount > 0 && (
                                        <div className="flex items-center justify-center text-[13px] mt-[25px]">
                                            <span className="mr-[10px] text-[14px] font-semibold">
                                                Share all {name}s
                                            </span>
                                            <IonToggle
                                                slot="end"
                                                checked={allSelected}
                                                onClick={() => handleToggleSelectAll()}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {showCredentials &&
                                Object.values(VC_TYPE).map((vcType, index) => (
                                    <React.Fragment key={index}>
                                        {vcCounts[vcType].totalCount > 0 && (
                                            <section
                                                key={vcType}
                                                data-test-id={`${vcType}-section`}
                                            >
                                                <div className="flex justify-between items-center mx-[10px] mt-[20px]">
                                                    <h2 className="text-[20px] font-bold text-gray-900">
                                                        {getTitle(vcType)}
                                                    </h2>

                                                    {!readOnly && (
                                                        <span className="flex justify-center items-center font-medium">
                                                            All
                                                            <IonToggle
                                                                onClick={() =>
                                                                    handleToggleSelectAllType(
                                                                        vcType
                                                                    )
                                                                }
                                                                slot="end"
                                                                className="ml-[5px]"
                                                                checked={getAllSelected(vcType)}
                                                                aria-label={`${vcType} toggle`}
                                                            />
                                                        </span>
                                                    )}
                                                </div>
                                                <Swiper
                                                    slidesPerView="auto"
                                                    modules={[Navigation]}
                                                    navigation
                                                    spaceBetween={10}
                                                    className="card-slider"
                                                >
                                                    {getVcsByType(vcType)?.map(vc => {
                                                        const uniqueId = getUniqueId(vc);
                                                        const categoryType =
                                                            getDefaultCategoryForCredential(vc);
                                                        return (
                                                            <SwiperSlide key={uniqueId}>
                                                                <BoostEarnedCard
                                                                    credential={vc}
                                                                    useWrapper={false}
                                                                    showChecked={!readOnly}
                                                                    categoryType={categoryType}
                                                                    onCheckMarkClick={() =>
                                                                        handleVcClick(
                                                                            uniqueId,
                                                                            vcType
                                                                        )
                                                                    }
                                                                    selectAll={getAllSelected(
                                                                        vcType
                                                                    )}
                                                                    initialCheckmarkState={isVcSelected(
                                                                        vc
                                                                    )}
                                                                />
                                                            </SwiperSlide>
                                                        );
                                                    })}
                                                </Swiper>
                                            </section>
                                        )}
                                    </React.Fragment>
                                ))}
                        </section>

                        {/* <section className="bottom-spacer-offset h-[150px] w-full"></section> */}
                    </section>
                </IonGrid>
                {!credentialsLoading && !readOnly && (
                    <section className="fixed-bottom-container fixed w-full bottom-[0px] px-[20px] py-[10px] z-[3] h-fit bg-grayscale-50 flex flex items-start justify-center">
                        <button
                            onClick={handleIssueCredentials}
                            className={`w-full bg-cyan-700 py-[15px] px-[2px] rounded-[40px] text-grayscale-50 text-[17px] font-bold max-w-[480px] ${
                                totalSelectedCount === 0 ? 'bg-grayscale-500 opacity-70' : ''
                            }`}
                            disabled={totalSelectedCount === 0}
                        >
                            {!isSharing && 'Share Boosts'}
                            {isSharing && 'Sharing...'}
                        </button>
                    </section>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ShareBoostsBundle;
