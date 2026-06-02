import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
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
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import useTheme from '../../theme/hooks/useTheme';

const SeedPhraseModal: React.FC = () => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const brandingConfig = useBrandingConfig();

    const [seed, setSeed] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const { closeModal } = useModal();
    const history = useHistory();
    const { initWallet } = useWallet();
    const { setCurrentUser } = useSQLiteStorage();

    const regex = /^[0-9a-fA-F]+$/;
    const handleLogin = async () => {
        if (!regex.test(seed)) {
            setErrorMessage(t('login.seedPhrase.error.invalidChars', 'Seed must only contain numbers and letters (a–f).'));
            return;
        } else if (seed.length < 64) {
            setErrorMessage(t('login.seedPhrase.error.tooShort', 'Seed phrase needs to be 64 characters long.'));
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
            setErrorMessage(t('login.seedPhrase.error.generic', 'Something went wrong. Please try again.'));
            console.log('login error:', e);
        }
    };

    return (
        <section className="p-[20px] bg-white h-full">
            <h1 className="font-poppins text-[22px] font-medium leading-[28.6px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                {t('login.seedPhrase.title', 'Use a Seed Phrase to Import Your Passport')}
            </h1>
            <p className="font-poppins text-[14px] font-normal leading-[18.2px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                <Trans
                    i18nKey="login.seedPhrase.description"
                    defaults="Enter your <0>64-character</0> or <2>word phrase seed</2> below to regain access to an existing {{brand}} passport."
                    values={{ brand: brandingConfig?.name }}
                    components={[<span className="font-semibold" key="0" />, <React.Fragment key="1" />, <span className="font-semibold" key="2" />]}
                />
            </p>
            <p className="font-poppins text-[14px] font-normal leading-[18.2px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                <Trans
                    i18nKey="login.seedPhrase.advancedOption"
                    defaults="This is an advanced option for users who already saved their seed during passport creation. If you don"'"t have a seed, you will need to go back and <0>create a new passport</0> instead."
                    components={[
                        <button
                            key="0"
                            onClick={closeModal}
                            className={`text-${primaryColor} font-semibold underline`}
                        />,
                    ]}
                />
            </p>
            <IonInput
                placeholder={t('login.seedPhrase.placeholder', 'Paste your seed phrase or key here...')}
                value={seed}
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal text-[14px]"
                onIonInput={e => setSeed(e?.detail?.value)}
                type="password"
            />
            <section className="rounded-[10px] bg-orange-100 p-[10px] mt-[30px]">
                <div className="flex items-center">
                    <AlertTriangle />
                    <h2 className="ml-[5px] text-orange-700 font-poppins text-[17px] font-semibold">
                        {t('login.seedPhrase.important.heading', 'Important!')}
                    </h2>
                </div>
                <ul className="list-disc pl-6 text-orange-700 font-poppins font-normal text-[14px]">
                    <li>{t('login.seedPhrase.important.rule1', 'Keep your seed safe and offline.')}</li>
                    <li>{t('login.seedPhrase.important.rule2', 'Never share it with anyone.')}</li>
                    <li>{t('login.seedPhrase.important.rule3', 'If someone else has your seed, they can control your passport.')}</li>
                </ul>
            </section>
            {errorMessage && <p className="text-red-500 text-sm mt-2 mb-[-10px]">{errorMessage}</p>}
            <div className="flex justify-center items-end relative mb-2">
                <button
                    onClick={closeModal}
                    className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full max-w-[170px] h-full mt-[20px] mr-[10px] border-grayscale-200 border-solid border-[1px] shadow-[0px_3px_4px_0px_rgba(0,0,0,0.25)]"
                >
                    {t('login.seedPhrase.back', 'Back')}
                </button>
                <button
                    disabled={seed === ''}
                    className={`bg-${primaryColor} text-white text-lg font-notoSans py-2 rounded-[20px] font-semibold w-full max-w-[350px] h-full shadow-[0px_3px_4px_0px_rgba(0,0,0,0.25)] disabled:opacity-50`}
                    onClick={handleLogin}
                >
                    {t('login.seedPhrase.import', 'Import Passport')}
                </button>
            </div>
        </section>
    );
};

export default SeedPhraseModal;
