import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTrustedAppsRegistry } from 'learn-card-base/hooks/useRegistry';

import LeftArrow from 'learn-card-base/svgs/LeftArrow';

import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import useShareCredentials from 'learn-card-base/hooks/useShareCredentials';
import { useGetCredentialsSharedWithApp } from 'learn-card-base/react-query/queries/vcQueries';
import ConnectedAppInfo from './ConnectedAppInfo';
import ShareCredentialCards from './ShareCredentialCards';
import { AppContent, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppButtons } from 'learn-card-base/ui/controls/AppButtons';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';
import { AppGrid } from 'learn-card-base/ui/layout';

const ViewCredentialsSharedWithApp: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = useCurrentUser();
    const { profileId } = useParams() as { profileId: string };
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
        <AppPage className="">
            <AppHeader className="ion-no-border ion-fixed bg-white">
                <AppToolbar className="ion-no-border" color="white">
                    <AppButtons slot="start">
                        <button
                            className="text-grayscale-600 bg-transparent"
                            onClick={() => navigate('/launchpad')}
                        >
                            <LeftArrow className="w-10 h-auto text-grayscale-600" />
                        </button>
                    </AppButtons>
                </AppToolbar>
            </AppHeader>
            <AppContent className="">
                <AppGrid className="flex items-center justify-center p-[20px] pb-[100px]">
                    <section className="w-full">
                        <div className="flex flex-col gap-[15px] text-grayscale-900">
                            <h1 className="text-[17px] font-medium leading-[21px]">
                                Shared Credentials
                            </h1>
                            <ConnectedAppInfo />
                        </div>

                        <hr className="my-[20px]" />

                        <section className="">
                            <div className="flex flex-col items-center justify-center bg-white gap-[10px] text-[14px] leading-[18px] py-[20px] px-[40px] mt-[7px] mx-[7px] shadow-[0_0_7px_0px_rgba(0,0,0,0.2)] rounded-[10px]">
                                <ProfilePicture
                                    customContainerClass="flex mr-[10px] shrink-0 border-gray-300 border-2 w-[55px] h-[55px] items-center justify-center rounded-full overflow-hidden object-cover text-white font-medium text-4xl"
                                    customImageClass="w-full h-full object-cover shrink-0"
                                    customSize={120}
                                />
                                <p className="font-bold text-grayscale-900">
                                    {currentUser?.name || currentUser?.email}
                                </p>
                                <p className="font-medium text-grayscale-700 text-center">
                                    You are sharing{' '}
                                    <span className="font-bold text-grayscale-900">
                                        {totalSelectedCount}
                                    </span>{' '}
                                    credential{totalSelectedCount === 1 ? '' : 's'} with this
                                    application
                                </p>

                                {allowUpdatingVPs && (
                                    <button
                                        className="bg-grayscale-900 rounded-[20px] px-[20px] py-[8px] text-white text-[14px] font-[600]"
                                        onClick={() =>
                                            navigate(
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
                                    <div className="w-full h-full flex flex-col opacity-50 items-center justify-center mt-[40px]">
                                        <AppSpinner />
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
                </AppGrid>
            </AppContent>
        </AppPage>
    );
};

export default ViewCredentialsSharedWithApp;
