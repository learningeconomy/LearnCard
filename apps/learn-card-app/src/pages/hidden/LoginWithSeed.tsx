import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import useWallet from 'learn-card-base/hooks/useWallet';
import { currentUserStore, getRandomBaseColor, useSQLiteStorage } from 'learn-card-base';
import { walletStore } from 'learn-card-base/stores/walletStore';

import { IonCol, IonInput } from '@ionic/react';

import { setAuthToken } from 'learn-card-base/helpers/authHelpers';

const LoginWithSeed: React.FC = () => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const { setCurrentUser } = useSQLiteStorage();
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

            const wallet = await initWallet(seed);
            if (wallet) {
                walletStore.set.wallet(wallet);
            } else {
                throw new Error('Error: Could not initialize wallet');
            }

            const currentUser = currentUserStore.get.currentUser();

            if (currentUser) setAuthToken('dummy');

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
