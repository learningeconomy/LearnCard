import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useTrustedAppsRegistry } from 'learn-card-base/hooks/useRegistry';

import {
    IonContent,
    IonPage,
    IonToolbar,
    IonButtons,
    IonHeader,
    IonSpinner,
    IonGrid,
} from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';

import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import useShareCredentials from 'learn-card-base/hooks/useShareCredentials';
import { useGetCredentialsSharedWithApp } from 'learn-card-base/react-query/queries/vcQueries';
import ConnectedAppInfo from './ConnectedAppInfo';
import ShareCredentialCards from './ShareCredentialCards';

const ViewCredentialsSharedWithApp: React.FC = () => {
    const history = useHistory();
    const currentUser = useCurrentUser();
    const { profileId } = useParams<{ profileId: string }>();
    const { data: appRegistryInfo, isLoading: trustedAppInfoLoading } =
        useTrustedAppsRegistry(profileId);
    const { data: sharedCredentials, isLoading: loadingSharedCredentials } =
        useGetCredentialsSharedWithApp(profileId);

    const {
        totalSelectedCount,
        loading: credentialsLoading,
        errorMessage,
    } = useShareCredentials(sharedCredentials);

    const showCredentials = !credentialsLoading && !loadingSharedCredentials;

    const allowUpdatingVPs =
        appRegistryInfo?.app.allowSendingAdditionalVPs || // trusted app has the boolean set to true
        (!trustedAppInfoLoading && !appRegistryInfo); // unknown app

    return (
        <IonPage className="">
            <IonHeader className="ion-no-border ion-fixed bg-white">
                <IonToolbar className="ion-no-border" color="white">
                    <IonButtons slot="start">
                        <button
                            className="text-grayscale-600 bg-transparent"
                            onClick={() => history.push('/launchpad')}
                        >
                            <LeftArrow className="w-10 h-auto text-grayscale-600" />
                        </button>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="">
                <IonGrid className="flex items-center justify-center p-[20px] pb-[100px]">
                    <section className="w-full">
                        <div className="flex flex-col gap-[15px] text-grayscale-900">
                            <h1 className="text-[17px] font-[500] leading-[21px]">
                                Shared Credentials
                            </h1>
                            <ConnectedAppInfo />
                        </div>

                        <hr className="my-[20px]" />

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
                                    You are sharing{' '}
                                    <span className="font-[700] text-grayscale-900">
                                        {totalSelectedCount}
                                    </span>{' '}
                                    credential{totalSelectedCount === 1 ? '' : 's'} with this
                                    application
                                </p>

                                {allowUpdatingVPs && (
                                    <button
                                        role="button"
                                        className="bg-grayscale-900 rounded-[20px] px-[20px] py-[8px] text-white text-[14px] font-[600]"
                                        onClick={() =>
                                            history.push(
                                                `/select-credentials/${encodeURI(
                                                    profileId
                                                )}?skipReload=true`
                                            )
                                        }
                                    >
                                        Update Shared Credentials
                                    </button>
                                )}
                            </div>

                            <div className="mt-[15px] text--[14px]">
                                {!showCredentials && (
                                    <div className="w-full h-full flex flex-col opacity-[50%] items-center justify-center mt-[40px]">
                                        <IonSpinner />
                                        <p className="mt-[20px]">Fetching your credentials...</p>
                                    </div>
                                )}

                                {errorMessage && !credentialsLoading && (
                                    <div className="mt-[50px]">
                                        <p className="text-red-500 font-bold">
                                            Sorry! There was an error fetching your credentials:{' '}
                                            {errorMessage}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <ShareCredentialCards viewOnly />
                        </section>
                    </section>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ViewCredentialsSharedWithApp;
