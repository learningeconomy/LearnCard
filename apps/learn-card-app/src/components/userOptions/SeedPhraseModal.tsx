import React, { useState } from 'react';
import { IonTextarea, IonRow, IonCol } from '@ionic/react';
import KeyIcon from 'learn-card-base/svgs/KeyIcon';
import { useModal, useCurrentUser } from 'learn-card-base';
import CopyStack from '../svgs/CopyStack';
import { Clipboard } from '@capacitor/clipboard';
import { ToastTypeEnum, useToast } from 'learn-card-base/hooks/useToast';

import useTheme from '../../theme/hooks/useTheme';
import { useTranslation } from 'react-i18next';

const SeedPhraseModal: React.FC<{}> = () => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [revealed, setRevealed] = useState(false);
    const { newModal, closeModal } = useModal();
    const currentUser = useCurrentUser();
    const { presentToast } = useToast();

    const handleCopySeedPhrase = () => {
        newModal(
            <div className="p-[20px]">
                <p className="text-[16px] font-poppins font-medium mb-[10px] text-grayscale-900">
                    {t('profile.seed.copyConfirm', 'Are you sure you want to copy this to clipboard?')}
                </p>
                <div className="flex justify-end items-end">
                    <button
                        className="text-[#0054E9] font-medium font-poppins leading-[150%] me-[10px]"
                        onClick={copySeedPhrase}
                    >
                        {t('profile.export.confirm', 'Confirm')}
                    </button>
                    <button
                        className="text-[#0054E9] font-medium font-poppins leading-[150%] me-[10px]"
                        onClick={closeModal}
                    >
                        {t('profile.export.cancel', 'Cancel')}
                    </button>
                </div>
            </div>,
            { sectionClassName: '!max-w-[450px]', hideButton: true }
        );
    };

    const copySeedPhrase = async () => {
        closeModal();
        try {
            await Clipboard.write({ string: currentUser?.privateKey });
            presentToast(t('profile.seed.copiedToast', 'Seed Phrase copied to clipboard'), {
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast(t('profile.seed.copyFailedToast', 'Unable to copy seed phrase to clipboard'), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <section className="h-full pb-[100px]">
            <div className="flex flex-col p-6 w-full bg-white rounded-[30px]">
                <h2 className="flex text-[16px] font-semibold">{t('profile.seed.yourSeedPhrase', 'Your Seed Phrase:')}</h2>
                <IonRow className="flex items-center justify-center w-full bg-grayscale-100 mt-4 mb-4 rounded-[15px]">
                    <IonCol className="w-full flex items-center justify-between px-4 py-3 rounded-2xl">
                        <div className="w-[90%] flex justify-start items-center text-left">
                            <IonTextarea
                                className="flex items-center w-full bg-grayscale-100 rounded-[10px] px-[10px] text-[15px] text-grayscale-900"
                                value={
                                    revealed
                                        ? currentUser?.privateKey
                                        : '•'.repeat(currentUser?.privateKey?.length || 0)
                                }
                                readonly
                                disabled
                            />
                        </div>
                        <div
                            onClick={() => handleCopySeedPhrase()}
                            className="w-[10%] flex items-center justify-end"
                        >
                            <CopyStack className="w-[32px] h-[32px] text-grayscale-900" />
                        </div>
                    </IonCol>
                </IonRow>
                <a
                    className={`text-center mt-[5px] line-clamp-1 text-${primaryColor} text-[14px] font-semibold`}
                    target="_blank"
                    rel="noreferrer"
                    href="https://docs.learncard.com/core-concepts/identities-and-keys/seed-phrases#the-critical-importance-of-securing-your-seed"
                >
                    {t('profile.seed.howToStore', 'How to store your seed phrase safely?')}
                </a>
            </div>

            <div className="flex flex-col justify-center items-center mt-[10px]">
                <button
                    onClick={() => setRevealed(prev => !prev)}
                    className="flex items-center justify-center bg-indigo-500 text-white text-lg font-notoSans py-2 rounded-[20px] font-semibold w-full h-full disabled:opacity-50"
                >
                    <KeyIcon className="w-[20px] mr-[5px]" />
                    {revealed ? t('profile.seed.hide', 'Hide My Seed') : t('profile.seed.reveal', 'Reveal My Seed')}
                </button>
                <button
                    onClick={closeModal}
                    className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                >
                    {t('profile.close', 'Close')}
                </button>
            </div>
        </section>
    );
};

export default SeedPhraseModal;
