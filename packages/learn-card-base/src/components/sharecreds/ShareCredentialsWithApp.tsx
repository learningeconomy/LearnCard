import React, { useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import queryString from 'query-string';
import { useQueryClient } from '@tanstack/react-query';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { TrustedAppRegistryEntry, useWallet } from 'learn-card-base';
import { useTrustedAppsRegistry } from 'learn-card-base/hooks/useRegistry';
import useShareCredentials from 'learn-card-base/hooks/useShareCredentials';

import ShareCredentialCards from './ShareCredentialCards';
import ConnectedAppInfo from './ConnectedAppInfo';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';

import {
    IonContent,
    IonPage,
    IonToggle,
    IonToolbar,
    IonButtons,
    IonHeader,
    IonSpinner,
    IonGrid,
    useIonAlert,
} from '@ionic/react';

import { UnsignedVP } from '@learncard/types';
import { getSharedCredentialsQueryKey } from 'learn-card-base/react-query/queries/vcQueries';

const ShareCredentialsWithApp: React.FC = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const currentUser = useCurrentUser();
    const [presentAlert] = useIonAlert();
    const { initWallet } = useWallet();
    const { profileId } = useParams<{ profileId: string; skipReload?: boolean }>();
    const { data: trustedAppRegistry } = useTrustedAppsRegistry();

    const [isSharing, setIsSharing] = useState(false);

    const { search } = useLocation();
    let { skipReload } = queryString.parse(search);
    const skipReloadBool = skipReload === 'true';

    const {
        totalSelectedCount,
        totalCredentialsCount,
        allSelected,
        handleToggleSelectAll,
        loading: credentialsLoading,
        errorMessage,
        getAllSelectedCredentials,
    } = useShareCredentials(undefined, skipReloadBool);

    // when you hit the accept button to "Share Credentials"
    //   creates a presentation bundle with all the selected credentials, signs it, and sends it to the app profile via LCN
    const handleIssueCredentials = async () => {
        if (totalSelectedCount === 0 || isSharing) return;

        setIsSharing(true);
        try {
            const selectedCredentials = getAllSelectedCredentials();

            // currentUser's wallet
            const myWallet = await initWallet();

            // create a VP
            const vp: UnsignedVP = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                holder: myWallet.id.did(),
                verifiableCredential: selectedCredentials,
            };

            // issue presentation
            const issuedVp = await myWallet.invoke.issuePresentation(vp);

            // Send presentation to the app you're connecting with
            await myWallet.invoke.sendPresentation(profileId, issuedVp, true);

            // update values in cache
            queryClient.setQueryData(getSharedCredentialsQueryKey(profileId), selectedCredentials);

            // redirect
            const redirectUrl = trustedAppRegistry?.find(
                (app: TrustedAppRegistryEntry) =>
                    app?.profileId?.toLowerCase() === profileId?.toLowerCase()
            )?.app.redirectUrl;
            if (redirectUrl) {
                // to url specified by app if there is one
                window.location.replace(redirectUrl);
            } else {
                // otherwise redirect to view shared crednetials
                history.push(`/view-shared-credentials/${encodeURI(profileId)}`);
            }
        } catch (e) {
            console.log('///handleSubmit create credential bundle Error', e);
            presentAlert({
                header: 'Error',
                subHeader: 'Create Credential Bundle error',
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
            <IonContent>
                <IonGrid className="flex items-center justify-center p-[20px] pb-[100px] max-w-[700px]">
                    <section className="w-full">
                        <div className="flex flex-col gap-[15px] text-grayscale-900">
                            <h1 className="text-[17px] font-[500] leading-[21px]">
                                Select Credentials To Share
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
                                    You have selected{' '}
                                    <span className="font-[700] text-grayscale-900">
                                        {totalSelectedCount}
                                    </span>{' '}
                                    credentials to share with this application
                                </p>
                            </div>

                            <div className="mt-[15px] text--[14px]">
                                {credentialsLoading && (
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

                                {!credentialsLoading && totalCredentialsCount === 0 && (
                                    <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                        <img
                                            src={MiniGhost}
                                            alt="ghost"
                                            className="max-w-[250px] m-auto mb-[20px]"
                                        />
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

                            {!credentialsLoading && totalCredentialsCount > 0 && (
                                <div className="flex items-center justify-center text-[13px] mt-[25px]">
                                    <span className="mr-[10px] text-[14px] font-semibold">
                                        Share all credentials
                                    </span>
                                    <IonToggle
                                        slot="end"
                                        checked={allSelected}
                                        onClick={() => handleToggleSelectAll()}
                                    />
                                </div>
                            )}

                            <ShareCredentialCards />
                        </section>
                    </section>
                </IonGrid>
                {!credentialsLoading && (
                    <section className="fixed-bottom-container fixed w-full bottom-[0px] px-[20px] py-[10px] z-[3] h-fit bg-grayscale-50 flex flex items-start justify-center">
                        <button
                            onClick={handleIssueCredentials}
                            className={`w-full bg-cyan-700 py-[15px] px-[2px] rounded-[40px] text-grayscale-50 text-[17px] font-bold max-w-[480px] ${totalSelectedCount === 0 ? 'bg-grayscale-500 opacity-70' : ''
                                }`}
                            disabled={totalSelectedCount === 0}
                        >
                            {!isSharing && 'Share Credentials'}
                            {isSharing && 'Sharing...'}
                        </button>
                    </section>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ShareCredentialsWithApp;
