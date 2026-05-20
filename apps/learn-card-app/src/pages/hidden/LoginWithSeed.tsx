import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import useWallet from 'learn-card-base/hooks/useWallet';
import { currentUserStore, getRandomBaseColor, getNotificationsEndpoint, useSQLiteStorage } from 'learn-card-base';
import { walletStore } from 'learn-card-base/stores/walletStore';

import { IonCol, IonInput } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';

import { setAuthToken } from 'learn-card-base/helpers/authHelpers';
import { setPlatformPrivateKey } from 'learn-card-base/security/platformPrivateKeyStorage';

const LoginWithSeed: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const { initWallet } = useWallet();
    const { setCurrentUser } = useSQLiteStorage();
    const queryClient = useQueryClient();
    const [seed, setSeed] = useState('');

    const handleDemoLogin = async () => {
        try {
            const dummyUser = {
                uid: '',
                email: seed,
                name: 'User From Seed',
                profileImage: '',
                aggregateVerifier: '',
                verifier: '',
                verifierId: '',
                typeOfLogin: '',
                dappShare: '',
                phoneNumber: '',
                privateKey: seed,
                baseColor: getRandomBaseColor(),
            };

            await setCurrentUser(dummyUser);

            currentUserStore.set.currentUser(dummyUser);

            // Store private key in secure web storage (IndexedDB) for persistence across page navigations
            await setPlatformPrivateKey(seed);

            const wallet = await initWallet(seed);
            if (wallet) {
                walletStore.set.wallet(wallet);
            } else {
                throw new Error('Error: Could not initialize wallet');
            }

            const currentUser = currentUserStore.get.currentUser();

            if (currentUser) setAuthToken('dummy');

            // If profileId query param is set, create a network profile
            const params = new URLSearchParams(location.search);
            const profileId = params.get('profileId');
            if (profileId && wallet) {
                try {
                    await wallet.invoke.createProfile({
                        did: wallet.id.did(),
                        profileId,
                        displayName: `User From Seed`,
                        notificationsWebhook: getNotificationsEndpoint(),
                    });
                } catch (err) {
                    console.log('createProfile::error (may already exist)', err);
                }
                // Mirror production createProfile callers (OnboardingNetworkForm,
                // NewJoinNetworkPrompt, JoinNetworkPrompt) — wipe React Query
                // caches so the next render of useGetProfile fetches fresh state
                // for the new profile. Without this, useGetProfile can have
                // already fired with a pre-createProfile wallet state and cached
                // a null result; the 5-minute staleTime on the query (#1222)
                // then pins that null and the LCN gate in SideMenu.handleBoost
                // opens the OnboardingContainer modal instead of
                // AddToLearnCardMenu when the user clicks `Add to LearnCard`.
                await queryClient.resetQueries();
            }

            history.push('/wallet');
        } catch (e) {
            console.log('///login error');
        }
    };

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                handleDemoLogin();
            }}
            className="h-full w-full p-8"
        >
            <IonCol size="12">
                <p className="font-medium text-grayscale-600 normal">Sign in with Seed</p>
            </IonCol>
            <IonCol size="12">
                <IonInput
                    autocapitalize="on"
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                    placeholder="Seed"
                    onIonInput={e => setSeed(e.detail.value ?? '')}
                    value={seed}
                    type="text"
                />
            </IonCol>
            <IonCol size="12" className="flex items-center justify-center">
                <button
                    className="bg-emerald-700 text-white ion-padding w-full font-bold rounded-[30px] mt-4"
                    type="submit"
                >
                    Sign in with seed
                </button>
            </IonCol>
        </form>
    );
};

export default LoginWithSeed;
