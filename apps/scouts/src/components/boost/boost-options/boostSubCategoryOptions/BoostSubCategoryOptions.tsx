import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useFlags } from 'launchdarkly-react-client-sdk';

import {
    IonHeader,
    IonContent,
    IonRow,
    IonCol,
    IonGrid,
    IonPage,
    IonToolbar,
    IonInput,
} from '@ionic/react';
import CaretLeft from '../../../svgs/CaretLeft';
import BoostSubCategoryButton from './BoostSubCategoryButton';

import {
    BoostUserTypeEnum,
    BoostCategoryOptionsEnum,
    boostCategoryOptions,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../boostOptions';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { CUSTOM_BOOST_TYPE_REGEX, constructCustomBoostType } from 'learn-card-base';
import X from 'learn-card-base/svgs/X';

const StateValidator = z.object({
    customType: z
        .string()
        .min(3)
        .max(22)
        .regex(CUSTOM_BOOST_TYPE_REGEX, ' Alphabetical characters only'),
});

type BoostSubCategoryOptionsProps = {
    closeAllModals: () => void;
    handleCloseModal: () => void;
    boostUserType: BoostUserTypeEnum;
    boostCategoryType: BoostCategoryOptionsEnum | string | null;
    setSelectedCategoryType: React.Dispatch<React.SetStateAction<string | null>>;
    otherUserProfileId?: string;
    hideBackButton: boolean;
    showCloseButton: boolean;
    history: any;
};

export const BoostSubCategoryOptions: React.FC<BoostSubCategoryOptionsProps> = ({
    closeAllModals,
    handleCloseModal,
    boostUserType = BoostUserTypeEnum.someone,
    boostCategoryType,
    setSelectedCategoryType,
    otherUserProfileId = '',
    hideBackButton,
    showCloseButton,
    history,
}) => {
    const flags = useFlags();
    const [customBoostType, setCustomBoostType] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [charCount, setCharCount] = useState<number>(0);
    const maxCount = 22;

    useEffect(() => {
        setCharCount(maxCount - customBoostType.length);
    }, [customBoostType]);

    const { color, subColor, title, CategoryImage } = boostCategoryOptions[boostCategoryType];
    // temp fix for request in polish doc
    const _title = title === 'Badge' ? 'Boost' : title;

    const subCategoryTypes = CATEGORY_TO_SUBCATEGORY_LIST[boostCategoryType].sort(
        (a: { title: string; type: string }, b: { title: string; type: string }) => {
            const textA = a?.title?.toUpperCase();
            const textB = b?.title?.toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
        }
    );

    const boostOptionsItemList = subCategoryTypes?.map(({ title, type }, index) => {
        return (
            <BoostSubCategoryButton
                key={index}
                title={title}
                boostCategoryType={boostCategoryType}
                subCategoryType={type}
                boostUserType={boostUserType}
                setSelectedCategoryType={setSelectedCategoryType}
                closeAllModals={closeAllModals}
                otherUserProfileId={otherUserProfileId}
                history={history}
            />
        );
    });

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            customType: customBoostType,
        });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    const _subCategoryColor = `bg-${subColor}`;

    const handleCustomBoostType = () => {
        if (validate()) {
            const customType = constructCustomBoostType(boostCategoryType, customBoostType);

            const baseLink = `/boost?boostUserType=${boostUserType}&boostCategoryType=${boostCategoryType}&boostSubCategoryType=${customType}`;

            let link = baseLink;

            if (otherUserProfileId) {
                link = `${baseLink}&otherUserProfileId=${otherUserProfileId}`;
            }

            history.push(link);
            closeAllModals();
        }
    };

    return (
        <section className="h-full">
            <IonContent fullscreen color={subColor}>
                <IonHeader className={`ion-no-border pt-10 ${_subCategoryColor}`}>
                    <IonToolbar color="#fffff">
                        <IonRow className="flex flex-col pb-4">
                            {/* {showCloseButton && ( */}
                            <IonCol className="flex flex-1 justify-end items-center px-3">
                                <button className="z-[9999] pt-2" onClick={closeAllModals}>
                                    <X className="text-white h-8 w-8" />
                                </button>
                            </IonCol>
                            {/* )} */}
                            <IonCol className="w-full flex items-center justify-center mt-4">
                                <h6 className="flex items-center justify-center text-white text-3xl font-medium">
                                    {!hideBackButton && (
                                        <button
                                            className="text-grayscale-50 p-0 mr-[10px]"
                                            onClick={() => setSelectedCategoryType(null)}
                                        >
                                            <CaretLeft className="h-auto w-3 text-white" />
                                        </button>
                                    )}
                                    {_title}
                                </h6>
                            </IonCol>
                        </IonRow>
                        <IonRow className="flex items-center justify-center w-full mt-4">
                            <IonCol className="text-center">
                                <div className="relative flex flex-col items-center justify-center p-0 pb-0 rounded-3xl flex-1">
                                    <div
                                        className={`absolute top-0 left-[%50] w-[160px] h-[160px] bg-${color} rounded-full`}
                                    />
                                    <img
                                        src={CategoryImage}
                                        alt="category img"
                                        className="z-50 w-[150px] h-[151px] mt-4"
                                    />
                                </div>
                            </IonCol>
                        </IonRow>
                    </IonToolbar>
                </IonHeader>
                <IonGrid>
                    <IonRow className="w-full flex items-center justify-center pb-6">
                        {/* 
                           Disables customization for ScoutPass MVP
                        */}
                        {!flags?.disableCmsCustomization && (
                            <>
                                <div className="max-w-[95%] w-full ion-padding rounded-tr-[20px] rounded-tl-[20px] mb-0 relative">
                                    <IonInput
                                        autocapitalize="on"
                                        value={customBoostType}
                                        onIonInput={e => {
                                            setCustomBoostType(e.detail.value);
                                            setErrors({});
                                        }}
                                        placeholder="Custom Type..."
                                        type="text"
                                        className={`bg-white text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base ${
                                            errors?.customType ? 'border-red-500 border-2' : ''
                                        }`}
                                        maxlength={22}
                                    />

                                    <div className="flex items-center justify-center absolute top-[24px] right-[15px] z-50">
                                        <p className="mr-4 font-bold text-gray-500 text-xs ">
                                            {charCount}
                                        </p>
                                        <button
                                            slot="end"
                                            className={`bg-emerald-700 rounded-full min-h-[40px] min-w-[40px] flex items-center justify-center shadow-3xl mr-4`}
                                            onClick={handleCustomBoostType}
                                        >
                                            <Checkmark
                                                className="text-white w-[30px]"
                                                strokeWidth="3"
                                            />
                                        </button>
                                    </div>

                                    <div className="w-full text-left">
                                        <p className="text-sm text-red-600 mt-2 ml-2 font-medium">
                                            {errors?.customType}{' '}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center w-full">
                                    <div className="flex items-center justify-center w-full px-5 max-w-[95%]">
                                        <h2 className="divider-with-text-dynamic border-white border-solid border-b-[1px]">
                                            <span className={`bg-${subColor} text-white`}>or</span>
                                        </h2>
                                    </div>
                                </div>
                            </>
                        )}
                        <IonCol className="w-full flex flex-col items-center justify-center">
                            {boostOptionsItemList}
                        </IonCol>
                        <div className="w-full flex items-center justify-center mt-4">
                            <button
                                onClick={() => {
                                    if (hideBackButton) {
                                        closeAllModals();
                                    } else {
                                        setSelectedCategoryType(null);
                                    }
                                }}
                                className="text-white text-center text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </section>
    );
};

export default BoostSubCategoryOptions;
