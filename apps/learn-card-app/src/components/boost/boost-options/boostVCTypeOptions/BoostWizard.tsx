import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useModal } from 'learn-card-base';
import { IonTextarea, IonRow, IonCol, IonGrid } from '@ionic/react';
import Wand from 'learn-card-base/svgs/Wand';
import {
    AIBoostStore,
    constructCustomBoostType,
    useGetProfile,
    useWallet,
    CredentialCategoryEnum,
    ModalTypes,
    lazyWithRetry,
} from 'learn-card-base';
import { createBoost, sendBoostCredential } from '../../boostHelpers';
import { LCNBoostStatusEnum, BoostCMSState } from '../../boost';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { BoostUserTypeEnum, BoostCategoryOptionsEnum } from '../boostOptions';
import { boostCategoryOptions, boostVCTypeOptions } from '../boostOptions';
const BoostCMS = lazyWithRetry(() => import('../../boostCMS/BoostCMS'));
import BoostDescriptionInput from './BoostDescriptionInput';
import X from 'learn-card-base/svgs/X';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import BoostTemplateSelector from '../../boost-template/BoostTemplateSelector';
import AiSessionLoader from '../../../new-ai-session/AiSessionLoader';

import { useTheme } from '../../../../theme/hooks/useTheme';

interface GeneratedDetails {
    title: string;
    description: string;
    category: string;
    categoryEnum: string;
    type: string;
    imageUrl: string;
    skills?: string[];
    narrative?: string;
    backgroundImageUrl?: string;
}

type BoostWizardProps = {
    boostUserType: BoostUserTypeEnum;
};

export const aiGeneratedCredentialText: string[] = [
    'Analyzing your inputs...',
    'Spinning up your smart credential...',
    'Generating your credential...',
    'Sealing your achievement...',
    'Building your verifiable record...',
    'Packing it all up...',
    'Creating your digital badge...',
    'Finalizing everything now...',
    'AI is crafting your proof...',
    'Almost there...',
];

const BoostWizard: React.FC<BoostWizardProps> = ({ boostUserType }) => {
    const history = useHistory();
    const { closeAllModals, closeModal } = useModal();
    const [showDescriptionInput, setShowDescriptionInput] = useState<boolean>(false);
    const [showBoostCMS, setShowBoostCMS] = useState<boolean>(false);
    const [boostDetails, setBoostDetails] = useState<GeneratedDetails | null>(null);
    const [originalDescription, setOriginalDescription] = useState<string>('');
    const [wallet, setWallet] = useState<BespokeLearnCard | null>(null);
    const [boostCMSState, setBoostCMSState] = useState<BoostCMSState | null>(null);
    const [textInput, setTextInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loader, setLoader] = useState(false);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { initWallet, addVCtoWallet } = useWallet();
    const { data: profile } = useGetProfile();
    const { newModal } = useModal({ desktop: ModalTypes.Cancel });

    useEffect(() => {
        const initializeWallet = async () => {
            const initializedWallet = await initWallet();
            setWallet(initializedWallet);
        };
        initializeWallet();
    }, [initWallet]);

    const title = 'AI Boost Wizard';
    const boostOptions = boostVCTypeOptions[boostUserType];

    const subtext =
        boostUserType === BoostUserTypeEnum.self
            ? 'You can issue yourself boosts to tell your story. Your skills are currencies for your future.'
            : 'Issue boosts to people you know.';

    const handleInputChange = (event: CustomEvent) => {
        const newText = event.detail.value!;
        setTextInput(newText);

        if (newText.length <= 500) {
            setErrorMessage('');
        } else {
            setErrorMessage('You have exceeded the 500-character limit.');
        }
    };

    const countWords = (text: string) => {
        return text.length;
    };

    const generateBoostDetails = async (description: string) => {
        if (!wallet) {
            throw new Error('Wallet is not initialized');
        }

        try {
            const {
                title,
                description: aiDescription,
                category,
                type,
                skills,
                narrative,
            } = await wallet.invoke.generateBoostInfo(description);

            const [generatedImageUrl, generatedBackgroundUrl, generatedSkills] = await Promise.all([
                (async () => {
                    return '';
                    // try {
                    //     return await wallet.invoke.generateImage(
                    //         `A 100% rounded badge in lower resolution for ${title} in the category of ${category} because ${narrative}`
                    //     );
                    // } catch (error) {
                    //     console.error('Error generating image:', error);
                    //     return '';
                    // }
                })(),
                (async () => {
                    return '';
                    // try {
                    //     return await wallet.invoke.generateImage(
                    //         `A very basic, low resolution texture to provide a background image to the badge.`
                    //     );
                    // } catch (error) {
                    //     console.error('Error generating background:', error);
                    //     return '';
                    // }
                })(),
                (async () => {
                    try {
                        return await wallet.invoke.generateBoostSkills(
                            `Please return an array of skills based on ${description}`
                        );
                    } catch (error) {
                        console.error('Error generating skills:', error);
                        return [];
                    }
                })(),
            ]);

            const matchedCategory = Object.keys(boostCategoryOptions)[0];
            // Object.keys(boostCategoryOptions).find(
            //     key => key.toLowerCase() === category.toLowerCase()
            // ) || Object.keys(boostCategoryOptions)[0];

            const { title: categoryTitle, CategoryImage } = boostCategoryOptions[matchedCategory];

            return {
                title: title,
                description: aiDescription,
                category: categoryTitle,
                categoryEnum: matchedCategory,
                type: type,
                imageUrl: generatedImageUrl || CategoryImage,
                skills: generatedSkills,
                narrative: narrative,
                backgroundImageUrl: generatedBackgroundUrl,
            };
        } catch (error) {
            console.error('Error in generateBoostDetails:', error);
            throw new Error('Failed to generate boost details. Please try again.');
        }
    };

    const handleDescriptionSubmit = async (description: string) => {
        setLoader(true);
        setOriginalDescription(description);
        try {
            const details = await generateBoostDetails(description);

            setBoostDetails(details);

            const title = details.title;
            const category = details.categoryEnum as BoostCategoryOptionsEnum;

            if (title && category) {
                const customTitle = constructCustomBoostType(category, title);
                const baseLink = `/boost?boostUserType=${boostUserType}&boostCategoryType=${category}&boostSubCategoryType=${customTitle}`;

                AIBoostStore.set.title(title);
                AIBoostStore.set.description(details?.description);
                AIBoostStore.set.narrative(details?.narrative);
                AIBoostStore.set.category(details?.category as CredentialCategoryEnum);
                AIBoostStore.set.categoryEnum(details?.category);
                AIBoostStore.set.imageUrl(details?.imageUrl);
                AIBoostStore.set.backgroundImageUrl(details?.backgroundImageUrl);
                AIBoostStore.set.skills(details?.skills);

                closeAllModals();
                history.push(baseLink);
                return;
            }
        } catch (error) {
            console.error('Error generating boost details:', error);
            setErrorMessage('An unexpected error occurred. Please try again.');
        } finally {
            setLoader(false);
        }
    };

    const handleEdit = () => {
        setShowBoostCMS(false);
        setShowDescriptionInput(true);
    };

    const handleSendBoost = async () => {
        if (!wallet) {
            throw new Error('Wallet is not initialized');
        }

        try {
            const { boostUri } = await createBoost(boostCMSState!, wallet, LCNBoostStatusEnum.live);

            const { sentBoost, sentBoostUri } = await sendBoostCredential(
                wallet,
                profile?.profileId!,
                boostUri
            );

            const issuedVcUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(sentBoost);
            await addVCtoWallet({ uri: issuedVcUri });
        } catch (error) {
            console.log('error', error);
        }

        closeAllModals();
    };

    if (showBoostCMS && boostDetails && boostCMSState) {
        return (
            <BoostCMS
                boostDetails={boostDetails}
                handleCloseModal={closeAllModals}
                handleEdit={handleEdit}
                handleSend={handleSendBoost}
                wallet={wallet}
                boostCMSState={boostCMSState}
                profileId={profile?.profileId || ''}
            />
        );
    }

    if (showDescriptionInput) {
        return (
            <BoostDescriptionInput
                onSubmit={handleDescriptionSubmit}
                onCancel={() => setShowDescriptionInput(false)}
                initialDescription={originalDescription}
                title={title}
                subtext={subtext}
            />
        );
    }

    return (
        <div>
            <section className="p-[10px]">
                <IonRow className="flex flex-col pb-2">
                    <IonCol className="w-full flex items-center mt-8 sm:px-6 desktop:justify-center">
                        <button
                            className="block desktop:hidden pr-[10px]"
                            onClick={() => {
                                closeModal();
                            }}
                        >
                            <CaretLeft className="text-grayscale-900" />
                        </button>
                        <h6 className="flex text-grayscale-900 font-poppins font-semibold text-[24px] tracking-wide">
                            {title}
                        </h6>
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="text-center text-grayscale-900 mt-[-5px]">
                        <button
                            onClick={closeModal}
                            className="hidden desktop:block absolute top-[-30px] right-5"
                        >
                            <X className="w-[20px] h-auto text-grayscale-900" />
                        </button>
                    </IonCol>
                </IonRow>

                <IonGrid>
                    <IonRow className="w-full flex items-center justify-center">
                        <IonCol className="w-full flex flex-col items-center justify-center sm:px-6 px-0">
                            {loader ? (
                                <div className="relative w-full text-center flex flex-col items-center justify-center">
                                    <div className="max-w-[250px]">
                                        <AiSessionLoader
                                            overrideText={aiGeneratedCredentialText}
                                            isInline
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-full relative text-grayscale-900">
                                        <p className="text-[14px] font-poppins font-normal">
                                            Use simple words to describe why you admire someone,
                                            what they accomplished, why they are great, etc.
                                        </p>
                                        <IonTextarea
                                            className="bg-grayscale-100 text-grayscale-900 font-poppins w-full !pb-[20px]"
                                            style={{
                                                width: '100%',
                                                minHeight: '140px',
                                                borderRadius: '15px',
                                                fontSize: '15px',
                                                padding: '15px',
                                                margin: '10px 0',
                                            }}
                                            placeholder="Write prompt..."
                                            id="textInput"
                                            value={textInput}
                                            onIonInput={handleInputChange}
                                        ></IonTextarea>
                                        <p
                                            className="absolute right-[10px] bottom-[15px] text-xs z-50"
                                            slot="end"
                                        >
                                            {countWords(textInput)} / 500
                                        </p>
                                    </div>
                                </>
                            )}
                            {errorMessage && (
                                <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
                            )}
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </section>
            <div className="flex items-center justify-center">
                <button
                    className={`relative flex items-center justify-center text-white rounded-full px-[18px] py-[6px] font-poppins text-xl text-center w-full shadow-lg normal font-semibold max-w-[80%] mb-4 disabled:opacity-50 bg-${primaryColor}`}
                    onClick={() => handleDescriptionSubmit(textInput)}
                    disabled={textInput.length > 500}
                >
                    Generate Magic
                    <Wand className="ml-[10px]" color="#FFFFFF" opacity="full" />
                </button>
            </div>
        </div>
    );
};

export default BoostWizard;
