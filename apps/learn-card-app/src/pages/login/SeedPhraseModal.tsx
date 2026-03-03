import React, { useState } from 'react';
import { IonInput } from '@ionic/react';
import {
    useModal,
    useSQLiteStorage,
    getRandomBaseColor,
    currentUserStore,
    setAuthToken,
    walletStore,
} from 'learn-card-base';
import AlertTriangle from '../../components/svgs/AlertTriangle';
import { useHistory } from 'react-router-dom';
import useWallet from 'learn-card-base/hooks/useWallet';

import useTheme from '../../theme/hooks/useTheme';

const SeedPhraseModal: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [seed, setSeed] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const { closeModal } = useModal();
    const history = useHistory();
    const { initWallet } = useWallet();
    const { setCurrentUser } = useSQLiteStorage();

    const regex = /^[0-9a-fA-F]+$/;
    const handleLogin = async () => {
        if (!regex.test(seed)) {
            setErrorMessage('Seed must only contain numbers and letters (a–f).');
            return;
        } else if (seed.length < 64) {
            setErrorMessage('Seed phrase needs to be 64 characters long.');
            return;
        }
        setErrorMessage('');

        try {
            const user = {
                uid: '',
                email: '',
                name: '',
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

            await setCurrentUser(user);

            currentUserStore.set.currentUser(user);

            const wallet = await initWallet(seed);
            if (wallet) {
                walletStore.set.wallet(wallet);
            } else {
                throw new Error('Error: Could not initialize wallet');
            }

            const currentUser = currentUserStore.get.currentUser();

            closeModal();
            history.push('/wallet');
        } catch (e) {
            setErrorMessage('Something went wrong. Please try again.');
            console.log('login error:', e);
        }
    };

    return (
        <section className="p-[20px] bg-white h-full">
            <h1 className="font-poppins text-[22px] font-medium leading-[28.6px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                Use a Seed Phrase to Import Your Passport
            </h1>
            <p className="font-poppins text-[14px] font-normal leading-[18.2px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                Enter your <span className="font-semibold">64-character</span> or{' '}
                <span className="font-semibold">word phrase seed</span> below to regain access to an
                existing LearnCard passport.
            </p>
            <p className="font-poppins text-[14px] font-normal leading-[18.2px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                This is an advanced option for users who already saved their seed during passport
                creation. If you don’t have a seed, you will need to go back and{' '}
                <button
                    onClick={closeModal}
                    className={`text-${primaryColor} font-semibold underline`}
                >
                    create a new passport
                </button>{' '}
                instead.
            </p>
            <IonInput
                placeholder="Paste your seed phrase or key here..."
                value={seed}
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal text-[14px]"
                onIonInput={e => setSeed(e?.detail?.value)}
                type="password"
            />
            <section className="rounded-[10px] bg-orange-100 p-[10px] mt-[30px]">
                <div className="flex items-center">
                    <AlertTriangle />
                    <h2 className="ml-[5px] text-orange-700 font-poppins text-[17px] font-semibold">
                        Important!
                    </h2>
                </div>
                <ul className="list-disc pl-6 text-orange-700 font-poppins font-normal text-[14px]">
                    <li>Keep your seed safe and offline.</li>
                    <li>Never share it with anyone.</li>
                    <li>If someone else has your seed, they can control your passport.</li>
                </ul>
            </section>
            {errorMessage && <p className="text-red-500 text-sm mt-2 mb-[-10px]">{errorMessage}</p>}
            <div className="flex justify-center items-end relative mb-2">
                <button
                    onClick={closeModal}
                    className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full max-w-[170px] h-full mt-[20px] mr-[10px] border-grayscale-200 border-solid border-[1px] shadow-[0px_3px_4px_0px_rgba(0,0,0,0.25)]"
                >
                    Back
                </button>
                <button
                    disabled={seed === ''}
                    className={`bg-${primaryColor} text-white text-lg font-notoSans py-2 rounded-[20px] font-semibold w-full max-w-[350px] h-full shadow-[0px_3px_4px_0px_rgba(0,0,0,0.25)] disabled:opacity-50`}
                    onClick={handleLogin}
                >
                    Import Passport
                </button>
            </div>
        </section>
    );
};

export default SeedPhraseModal;
