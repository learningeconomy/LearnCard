import React, { useState } from 'react';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';
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

import { getLogger } from 'learn-card-base';
const log = getLogger('seed-phrase-modal');

const SeedPhraseModal: React.FC = () => {
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
            setErrorMessage(m['login.seedPhrase.error.invalidChars']());
            return;
        } else if (seed.length < 64) {
            setErrorMessage(m['login.seedPhrase.error.tooShort']());
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
            setErrorMessage(m['login.seedPhrase.error.generic']());
            log.info('login error:', e);
        }
    };

    return (
        <section className="p-[20px] bg-white h-full">
            <h1 className="font-poppins text-[22px] font-medium leading-[28.6px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                {m['login.seedPhrase.title']()}
            </h1>
            <p className="font-poppins text-[14px] font-normal leading-[18.2px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                <TransP
                    m={m['login.seedPhrase.description']}
                    values={{ brand: brandingConfig?.name }}
                    components={[
                        <span className="font-semibold" key="0" />,
                        <React.Fragment key="1" />,
                        <span className="font-semibold" key="2" />,
                    ]}
                />
            </p>
            <p className="font-poppins text-[14px] font-normal leading-[18.2px] tracking-[-0.25px] mb-[20px] text-grayscale-900">
                <TransP
                    m={m['login.seedPhrase.advancedOption']}
                    components={[
                        <button
                            key="0"
                            type="button"
                            aria-label={m['login.seedPhrase.title']()}
                            onClick={closeModal}
                            className={`text-${primaryColor} font-semibold underline`}
                        />,
                    ]}
                />
            </p>
            <label htmlFor="seed-phrase" className="sr-only">
                {m['login.seedPhrase.placeholder']()}
            </label>
            <input
                id="seed-phrase"
                placeholder={m['login.seedPhrase.placeholder']()}
                value={seed}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? 'seed-phrase-error' : undefined}
                className="w-full bg-grayscale-100 text-grayscale-900 rounded-[15px] px-4 py-3 font-normal text-[14px] placeholder:text-grayscale-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent"
                onChange={e => setSeed(e.target.value)}
                type="password"
            />
            <section className="rounded-[10px] bg-orange-100 p-[10px] mt-[30px]">
                <div className="flex items-center">
                    <AlertTriangle />
                    <h2 className="ml-[5px] text-orange-700 font-poppins text-[17px] font-semibold">
                        {m['login.seedPhrase.important.heading']()}
                    </h2>
                </div>
                <ul className="list-disc pl-6 text-orange-700 font-poppins font-normal text-[14px]">
                    <li>{m['login.seedPhrase.important.rule1']()}</li>
                    <li>{m['login.seedPhrase.important.rule2']()}</li>
                    <li>{m['login.seedPhrase.important.rule3']()}</li>
                </ul>
            </section>
            {errorMessage && (
                <p
                    id="seed-phrase-error"
                    role="alert"
                    className="text-red-700 text-sm mt-2 mb-[-10px]"
                >
                    {errorMessage}
                </p>
            )}
            <div className="flex justify-center items-end relative mb-2">
                <button
                    type="button"
                    onClick={closeModal}
                    className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full max-w-[170px] h-full mt-[20px] mr-[10px] border-grayscale-200 border-solid border-[1px] shadow-[0px_3px_4px_0px_rgba(0,0,0,0.25)]"
                >
                    {m['login.seedPhrase.back']()}
                </button>
                <button
                    type="button"
                    disabled={seed === ''}
                    className={`bg-${primaryColor} text-white text-lg font-notoSans py-2 rounded-[20px] font-semibold w-full max-w-[350px] h-full shadow-[0px_3px_4px_0px_rgba(0,0,0,0.25)] disabled:opacity-50`}
                    onClick={handleLogin}
                >
                    {m['login.seedPhrase.import']()}
                </button>
            </div>
        </section>
    );
};

export default SeedPhraseModal;
