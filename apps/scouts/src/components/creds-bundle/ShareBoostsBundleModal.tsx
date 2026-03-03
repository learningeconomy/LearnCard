import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { Clipboard } from '@capacitor/clipboard';
import { initLearnCard } from '@learncard/init';

import {
    IonContent,
    IonPage,
    IonHeader,
    IonButton,
    IonToolbar,
    IonButtons,
    IonSpinner,
    useIonAlert,
} from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import { VP, UnsignedVP } from '@learncard/types';
import { useWallet, SelectedCredsStoreState, useToast, ToastTypeEnum } from 'learn-card-base';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import ShareBoostsBundle from './ShareBoostsBundle';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';

export const baseUrl = process.env.NODE_ENV === 'production' ? 'pass.scout.org' : 'localhost:3000';

const ShareBoostsBundleModal = ({
    onDismiss,
}: {
    onDismiss: (data?: string | null | undefined | number, role?: string) => void;
}) => {
    const [page, setPage] = useState('application');
    const { presentToast } = useToast();
    const [vpUri, setVpUri] = useState<string>();
    const [pinNum, setPinNum] = useState<string>();
    const [randomSeed, setRandomSeed] = useState<string>();
    const [loading, setLoading] = useState(false);
    const currentUser = useCurrentUser();
    const [presentAlert] = useIonAlert();
    // VP related
    const { initWallet } = useWallet();

    const handleSubmit = async (payload: SelectedCredsStoreState) => {
        setLoading(true);
        try {
            if (!payload) throw new Error('No payload found. Payload is required.');
            // Get selected Credentials from submitted payload data
            const credentials = payload?.credentials;
            //Merge credentials into one array
            const allCredentials = [
                ...(credentials?.achievements ?? []),
                ...(credentials?.courses ?? []),
                ...(credentials?.ids ?? []),
                ...(credentials?.skills ?? []),
                ...(credentials?.workHistory ?? []),
                ...(credentials?.socialBadges ?? []),
            ];

            // Merge all selected credentials into one array
            const selectedIdIds = payload?.selectedIdIds ?? [];
            const selectedCourseIds = payload?.selectedCourseIds ?? [];
            const selectedAchievementIds = payload?.selectedAchievementIds ?? [];
            const selectedSkillIds = payload?.selectedSkillIds ?? [];
            const selectedSocialBadgeIds = payload?.selectedSocialBadgeIds ?? [];
            const selectedWorkHistoryIds = payload?.selectedWorkHistoryIds ?? [];

            const allSelectedCredIds = [
                ...selectedAchievementIds,
                ...selectedCourseIds,
                ...selectedIdIds,
                ...selectedSkillIds,
                ...selectedSocialBadgeIds,
                ...selectedWorkHistoryIds,
            ];

            const selectedCredentials = allCredentials?.filter((cred: any) => {
                const selected = allSelectedCredIds.includes(cred.id);
                return selected;
            });

            setLoading(true);

            // Generate random seed
            const pinNum = Math.floor(Math.random() * 9000 + 1000)?.toString();

            setPinNum(pinNum);
            const pin = pinNum?.toString();
            const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(30)), dec =>
                dec.toString(16).padStart(2, '0')
            ).join('');

            setRandomSeed(randomKey);

            const walletSeed = `${randomKey}${pin}`;

            //init throwaway wallet
            const wallet = await initLearnCard({ seed: walletSeed });

            // currentUser's wallet
            const myWallet = await initWallet();

            const myWalletDid = await myWallet.id.did();

            // create a VP
            const vp: UnsignedVP = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                holder: myWalletDid,
                //verifiableCredential: selectedCredentials,
            };

            let bundleWalletIndex = await wallet.invoke.getIDXIndex();

            // Add job listing id to jobWalletIndex for fetching data for that later...
            // used for displaying useful metadata about the job and user
            // probably need to encrypt this...
            if (!bundleWalletIndex) {
                bundleWalletIndex = { bundles: [], credentials: [] };

                bundleWalletIndex.bundles = [
                    { bundleId: 'bundle', name: currentUser?.name, issueeDid: myWallet.id.did() },
                ];
            }

            // set jobId in job wallet Index
            await wallet.invoke.setIDXIndex(bundleWalletIndex);

            // Add selected Credentials to VP
            vp.verifiableCredential = selectedCredentials;

            // issue presentation
            const issuedVp = await myWallet.invoke.issuePresentation(vp);

            //setVP(vp);

            // Publish VP to Ceramic (encrypted)

            const publishedVpUri = await myWallet.store.LearnCloud.uploadEncrypted!(issuedVp, {
                recipients: [wallet.id.did(), myWallet.id.did()],
            });

            setVpUri(publishedVpUri);

            // get current index data stored on ceramic for user

            let currentIndex = (
                await myWallet.invoke.learnCloudRead<{
                    bundles: { bundleId: string; pin: string; randomSeed: string; uri: string }[];
                    credentials: any[];
                }>({ type: 'bundleIndex' })
            )[0];
            // Add listing to user's bundle history (stored on ceramic)
            if (!currentIndex) {
                currentIndex = { bundles: [], credentials: [] };
                await myWallet.invoke.learnCloudCreate({ type: 'bundleIndex', ...currentIndex });
            }

            if (!currentIndex?.bundles && currentIndex) {
                currentIndex.bundles = [
                    { bundleId: 'bundle', pin, randomSeed: randomKey, uri: publishedVpUri },
                ];
            }

            if (currentIndex?.bundles && currentIndex) {
                currentIndex.bundles = [
                    ...currentIndex.bundles,
                    { bundleId: 'bundle', pin, randomSeed: randomKey, uri: publishedVpUri },
                ];
            }

            // update modified index data to ceramic
            await myWallet.invoke.learnCloudUpdate({ type: 'bundleIndex' }, currentIndex);

            setLoading(false);
            setPage('success');
        } catch (e) {
            presentAlert({
                header: 'Error',
                subHeader: 'Create Credential Bundle error',
                message: e?.toString(),
                buttons: ['OK'],
            });
            setLoading(false);
            throw new Error('There was an error. Please try again later.');
        }
    };

    const link = `https://${baseUrl}/share-creds/${vpUri}/${randomSeed}`;

    const handleCopy = async () => {
        try {
            await Clipboard.write({
                string: link,
            });
            presentToast('Verified resume link copied to clipboard', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy verified resume link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleViewLink = async () => {
        if (Capacitor.isNativePlatform()) {
            //await Browser?.open({ url: link });
        } else {
            window?.open(link);
        }
    };

    const handleDismiss = () => {
        onDismiss();
    };

    return (
        <IonPage className="modal-wrapper">
            <IonHeader className="ion-no-border ion-fixed">
                <IonToolbar className=" ion-no-border ">
                    <IonButtons slot="start">
                        <IonButton className="text-graye-600" onClick={() => handleDismiss()}>
                            <LeftArrow className="w-10 h-auto text-gray-600" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="course-details-container bg-white h-full" fullscreen>
                {page === 'application' && !loading && (
                    <ShareBoostsBundle onSubmit={handleSubmit} />
                )}

                {loading && (
                    <div className="flex flex-col justify-center items-center w-full h-full">
                        <div className="flex flex-col justify-center items-center w-full h-full mt-[-100px]">
                            <IonSpinner name="crescent" color="dark" className="scale-[1.75]" />
                            <p className="mt-[30px]">Creating your boost bundle....</p>
                        </div>
                    </div>
                )}

                {page === 'success' && !loading && (
                    <section className="text-center flex flex-col p-[20px] max-w-[600px] m-auto">
                        <h1 className="text-emerald-700 text-[24px] font-bold mt-[20px]">
                            {' '}
                            Created Boost Bundle
                        </h1>
                        <div></div>

                        <div className="shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] p-[20px] m-[20px] rounded-[20px]">
                            <section className="professor-details flex items-center mb-[20px]">
                                <ProfilePicture
                                    customContainerClass="flex mr-[15px] flex-shrink-0 border-gray-300 border-[2px] w-[55px] h-[55px] items-center justify-center rounded-full overflow-hidden object-cover text-white font-medium text-4xl"
                                    customImageClass="w-full h-full object-cover flex-shrink-0"
                                    customSize={500}
                                />
                                <p className="text-xl text-left font-medium  w-full text-indigo-900">
                                    {currentUser?.name || currentUser?.email}
                                </p>
                            </section>

                            <div className="text-left">
                                <p className="text-[14px] uppercase">Boost bundle created </p>

                                <br />
                                <strong className="text-[20px]">Your PIN is: {pinNum} </strong>
                                <br />
                                <br />
                                <strong className="text-[14px] mt-[20px] text-left">
                                    Share your PIN and this link:{' '}
                                    <div className="py-[10px] flex flex-wrap">
                                        <button
                                            onClick={handleCopy}
                                            className="mt-[5px] bg-cyan-700 py-[15px] px-[25px] rounded-[40px] text-grayscale-50 text-[17px] font-bold"
                                        >
                                            Copy link
                                        </button>
                                        <button
                                            onClick={handleViewLink}
                                            className="mt-[5px] bg-cyan-700 py-[15px] px-[25px] ml-[10px] rounded-[40px] text-grayscale-50 text-[17px] font-bold"
                                        >
                                            View Link
                                        </button>
                                    </div>
                                </strong>
                                <br />
                                <br />
                            </div>
                        </div>
                    </section>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ShareBoostsBundleModal;
