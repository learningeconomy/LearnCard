import React from 'react';
import { Updater } from 'use-immer';

import { useCurrentUser } from 'learn-card-base';

import ConsentFlowShareCredentialCards from './ConsentFlowShareCredentialCards';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';

import {
    IonContent,
    IonPage,
    IonToggle,
    IonToolbar,
    IonHeader,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
} from '@ionic/react';
import CaretLeft from '../../components/svgs/CaretLeft';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import { useConsentFlowCredentials } from './useConsentFlowCredentials';
import { curriedStateSlice } from '@learncard/helpers';

const ShareCredentialsWithConsentFlow: React.FC<{
    handleCloseModal: () => void;
    credentials: ConsentFlowTerms['read']['credentials'];
    setCredentials: Updater<ConsentFlowTerms['read']['credentials']>;
    contractDetails: ConsentFlowContractDetails;
    walletCredentials: ReturnType<typeof useConsentFlowCredentials>;
    totalSelectedCount: number;
}> = ({
    handleCloseModal,
    contractDetails,
    credentials,
    setCredentials,
    walletCredentials,
    totalSelectedCount,
}) => {
    const updateSlice = curriedStateSlice(setCredentials);

    const currentUser = useCurrentUser();

    const { anyLoading, anyDoneLoading, totalCredentialsCount, mappedCredentials } =
        walletCredentials;

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar className="ion-no-border" color="light">
                    <IonGrid className="white">
                        <IonRow className="w-full flex flex-col items-center justify-center">
                            <IonRow className="w-full max-w-[600px] flex items-center justify-between">
                                <IonCol className="flex flex-1 justify-start items-center">
                                    <button
                                        className="text-grayscale-900 p-0 mr-[10px]"
                                        aria-label="Back button"
                                        onClick={handleCloseModal}
                                    >
                                        <CaretLeft className="h-auto w-3 text-grayscale-900" />
                                    </button>

                                    <div className="flex items-center justify-normal">
                                        <div className="min-w-[40px] min-h-[40px] w-[40px] h-[40px] flex items-center justify-center rounded-[10px] overflow-hidden shadow-sm">
                                            <img
                                                src={
                                                    contractDetails.owner.image ??
                                                    contractDetails.image
                                                }
                                                className="h-full w-full"
                                            />
                                        </div>
                                        <h3 className="text-grayscale-900 flex items-center justify-start font-poppins font-medium text-xl ml-2">
                                            Share data with {contractDetails.owner.displayName}
                                        </h3>
                                    </div>
                                </IonCol>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonGrid className="flex items-center justify-center p-[20px] pb-[100px] max-w-[700px]">
                    <section className="w-full">
                        <section className="">
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
                                    You have selected{' '}
                                    <span className="font-[700] text-grayscale-900">
                                        {totalSelectedCount}
                                    </span>{' '}
                                    credentials to share
                                </p>
                            </div>

                            <div className="mt-[15px] text--[14px]">
                                {!anyDoneLoading && (
                                    <div className="w-full h-full flex flex-col opacity-[50%] items-center justify-center mt-[40px]">
                                        <IonSpinner />
                                        <p className="mt-[20px]">Fetching your credentials...</p>
                                    </div>
                                )}

                                {!anyLoading && totalCredentialsCount === 0 && (
                                    <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                        <div className="flex flex-col gap-[20px] text-grayscale-900 font-[700] font-montserrat">
                                            <span className="text-[30px]">No Credentials</span>
                                            <span className="text-[17px]">
                                                "Love doesn't just sit there, like a stone, it has
                                                to be made, like bread; remade all the time, made
                                                new."
                                            </span>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {anyDoneLoading && totalCredentialsCount > 0 && (
                                <div className="flex items-center justify-center text-[13px] mt-[25px]">
                                    <span className="mr-[10px] text-[14px] font-semibold">
                                        Share all
                                    </span>
                                    <IonToggle
                                        slot="end"
                                        checked={credentials.shareAll}
                                        onClick={() => {
                                            if (!credentials.shareAll) {
                                                updateSlice('categories', categories => {
                                                    Object.entries(mappedCredentials).forEach(
                                                        ([vcType, vcs]) => {
                                                            if (
                                                                !contractDetails.contract.read
                                                                    .credentials.categories[vcType]
                                                            ) {
                                                                return;
                                                            }

                                                            if (!categories[vcType])
                                                                categories[vcType] = {
                                                                    sharing: true,
                                                                    shareAll: true,
                                                                    shared: [],
                                                                };
                                                            categories[vcType].shareAll = true;
                                                            categories[vcType].sharing = true;
                                                            categories[vcType].shared = Array.from(
                                                                new Set([
                                                                    ...(categories[vcType].shared ??
                                                                        []),
                                                                    ...vcs.map(vc => vc.uri),
                                                                ])
                                                            );
                                                        }
                                                    );
                                                });
                                            }

                                            updateSlice('shareAll', !credentials.shareAll);
                                        }}
                                    />
                                </div>
                            )}

                            <ConsentFlowShareCredentialCards
                                mappedCredentials={mappedCredentials}
                                categories={credentials.categories}
                                setCategories={updateSlice('categories')}
                                setShareAll={updateSlice('shareAll')}
                            />
                        </section>
                    </section>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ShareCredentialsWithConsentFlow;
