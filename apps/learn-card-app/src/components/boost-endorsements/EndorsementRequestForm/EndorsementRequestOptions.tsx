import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import zod from 'zod';

import ShareBoostLink from '../../boost/boost-options-menu/ShareBoostLink';
import EndorsementRequestSuccess from './EndorsementRequestSuccess';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import CopyStack from 'learn-card-base/svgs/CopyStack';
import { IonInput, IonTextarea } from '@ionic/react';
import Mail from 'learn-card-base/svgs/Mail';

import {
    CredentialCategoryEnum,
    useToast,
    ToastTypeEnum,
    useShareBoostMutation,
    useGetVCInfo,
    useModal,
    ModalTypes,
    useWallet,
    useGetCurrentLCNUser,
} from 'learn-card-base';
import useFirebaseAnalytics from '../../../hooks/useFirebaseAnalytics';
import { EndorsementRequestState } from './endorsement-request.helpers';
import { VC } from '@learncard/types';

const schema = zod.object({
    email: zod.string().email(),
});

export const EndorsementRequestOptions: React.FC<{
    credential: VC;
    categoryType: CredentialCategoryEnum;
    endorsementRequest: EndorsementRequestState;
    setEndorsementRequest: React.Dispatch<React.SetStateAction<EndorsementRequestState>>;
}> = ({ credential, categoryType, endorsementRequest, setEndorsementRequest }) => {
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { initWallet } = useWallet();
    const { newModal, closeModal, closeAllModals } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });
    const { achievementType, title } = useGetVCInfo(credential, categoryType);
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const { presentToast } = useToast();
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [shareLink, setShareLink] = useState<string | undefined>('');
    const [isGeneratingShareLink, setIsGeneratingShareLink] = useState<boolean>(false);
    const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

    const { mutate: shareEarnedBoost, isPending: isLinkLoading } = useShareBoostMutation();

    const generateShareLink = async () => {
        setIsGeneratingShareLink(true);
        shareEarnedBoost(
            { credential: credential, credentialUri: credential.id },
            {
                async onSuccess(data) {
                    const url = new URL(data?.link);
                    const params = new URLSearchParams(url.search);

                    const host = url.host;
                    const uri = params.get('uri');
                    const seed = params.get('seed');
                    const pin = params.get('pin');

                    // generate endorsement request share link
                    setShareLink(
                        `https://${host}/?uri=${uri}&seed=${seed}&pin=${pin}&endorsementRequest=true`
                    );
                    logAnalyticsEvent('generate_share_link', {
                        category: categoryType,
                        boostType: achievementType,
                        method: 'Share Boost',
                    });
                },
            }
        );
        setIsGeneratingShareLink(false);
    };

    const copyItem = async () => {
        await Clipboard.write({ string: shareLink });

        presentToast(`Link copied to clipboard`, {
            hasDismissButton: true,
        });
    };

    useEffect(() => {
        generateShareLink();
    }, []);

    const presentShareBoostLink = () => {
        const shareBoostLinkModalProps = {
            handleClose: () => closeModal(),
            boost: credential,
            boostUri: credential.id,
            categoryType,
            hideLinkedIn: true,
            isEndorsementRequest: true,
        };

        newModal(<ShareBoostLink {...shareBoostLinkModalProps} />);
    };

    const showSuccessModal = () => {
        newModal(<EndorsementRequestSuccess closeModal={closeAllModals} />);
    };

    const handleStateChange = (key: string, value: string) => {
        setEndorsementRequest(prevState => ({
            ...prevState,
            [key]: value,
        }));
    };

    const handleSendEmailShareLink = async () => {
        const wallet = await initWallet();

        const result = schema.safeParse({
            email: endorsementRequest?.email,
        });

        if (!result.success) {
            setErrors(result.error.flatten().fieldErrors);
            return;
        }

        setIsSendingEmail(true);

        try {
            await wallet.invoke.sendEndorsementShareLink(
                endorsementRequest?.email!,
                shareLink,
                {
                    name: currentLCNUser?.displayName!,
                },
                {
                    name: title,
                },
                endorsementRequest?.text
            );
            setEndorsementRequest(prevState => ({
                ...prevState,
                email: '',
                text: '',
            }));
            showSuccessModal();
            setIsSendingEmail(false);
        } catch (error) {
            setIsSendingEmail(false);
            presentToast(`Failed to send endorsement request`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <>
            <div className="w-full flex flex-col items-start justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] mt-2 shadow-bottom-2-4 gap-4">
                <p className="text-[17px] text-grayscale-900 text-left mb-2">
                    How do you want to send it?
                </p>

                <button
                    disabled={isGeneratingShareLink}
                    onClick={copyItem}
                    className="text-[17px] text-center flex items-center justify-center rounded-full px-[16px] py-[12px] bg-grayscale-900 text-white w-full cursor-pointer"
                >
                    {isGeneratingShareLink ? 'Generating...' : 'Copy Link'}{' '}
                    <CopyStack className="ml-2 h-[24px] w-[24px]" />
                </button>
                <button
                    disabled={isGeneratingShareLink}
                    onClick={presentShareBoostLink}
                    className="text-[17px] text-center flex items-center justify-center rounded-full px-[16px] py-[12px] bg-grayscale-900 text-white w-full cursor-pointer"
                >
                    Get Code <QRCodeScanner className="ml-2 h-[24px] w-[24px]" />
                </button>
            </div>
            <div className="w-full flex flex-col items-start justify-start py-4 px-4 cursor-pointer bg-white rounded-[20px] mt-4 shadow-bottom-2-4">
                <p className="text-[17px] text-grayscale-900 text-left mb-2">
                    What would you like to say?
                </p>
                <IonTextarea
                    autocapitalize="on"
                    value={endorsementRequest?.text}
                    onIonInput={e => handleStateChange('text', e.detail.value)}
                    placeholder="Message..."
                    className={`bg-grayscale-100 font-poppins text-grayscale-800 rounded-[15px] px-[16px] py-[8px] text-[17px] mb-1`}
                />
                <div className="w-full flex items-center justify-center px-4 py-4">
                    <div className="h-[1px] w-full bg-grayscale-200" />
                </div>
                <div className="w-full flex flex-col items-start justify-center">
                    <IonInput
                        value={endorsementRequest?.email}
                        onIonInput={e => {
                            setErrors({});
                            handleStateChange('email', e.detail.value!);
                        }}
                        placeholder="Email"
                        type="text"
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                            errors?.email ? 'border-rose-500 border-[1px] border-solid' : ''
                        }`}
                    />
                    {errors?.email && (
                        <p className="text-rose-500 text-sm mt-2 ml-1">{errors?.email}</p>
                    )}
                </div>

                <button
                    disabled={isSendingEmail}
                    onClick={handleSendEmailShareLink}
                    className="text-[17px] text-center flex items-center justify-center rounded-full px-[16px] py-[12px] bg-grayscale-900 text-white w-full cursor-pointer mt-4"
                >
                    {isSendingEmail ? 'Sending...' : 'Send Email Request'}{' '}
                    <Mail className="ml-2 h-[24px] w-[24px]" />
                </button>
            </div>
        </>
    );
};

export default EndorsementRequestOptions;
