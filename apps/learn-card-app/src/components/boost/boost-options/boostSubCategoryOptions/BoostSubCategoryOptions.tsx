import React, { useState, useEffect } from 'react';
import { z } from 'zod';

import { IonHeader, IonRow, IonCol, IonGrid, IonToolbar, IonInput } from '@ionic/react';
import CaretLeft from '../../../svgs/CaretLeft';
import BoostSubCategoryButton from './BoostSubCategoryButton';

import {
    BoostUserTypeEnum,
    BoostCategoryOptionsEnum,
    boostCategoryOptions,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../boostOptions';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { CUSTOM_BOOST_TYPE_REGEX, constructCustomBoostType, useModal } from 'learn-card-base';

const StateValidator = z.object({
    customType: z
        .string()
        .min(3)
        .max(22)
        .regex(CUSTOM_BOOST_TYPE_REGEX, ' Alphabetical characters only'),
});

type BoostSubCategoryOptionsProps = {
    boostUserType: BoostUserTypeEnum;
    boostCategoryType: BoostCategoryOptionsEnum | string | null;
    setSelectedCategoryType: React.Dispatch<React.SetStateAction<string | null>>;
    otherUserProfileId?: string;
    history: any;
};

export const BoostSubCategoryOptions: React.FC<BoostSubCategoryOptionsProps> = ({
    boostUserType = BoostUserTypeEnum.someone,
    boostCategoryType,
    setSelectedCategoryType,
    otherUserProfileId = '',
    history,
}) => {
    const { closeAllModals } = useModal();

    const [search, setSearch] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [charCount, setCharCount] = useState<number>(0);
    const maxCount = 22;

    useEffect(() => {
        setCharCount(maxCount - search.length);
    }, [search]);

    const { color, subColor, title, CategoryImage } = boostCategoryOptions[boostCategoryType];

    const subCategoryTypes = CATEGORY_TO_SUBCATEGORY_LIST[boostCategoryType].sort(
        (a: { title: string; type: string }, b: { title: string; type: string }) => {
            const textA = a?.title?.toUpperCase();
            const textB = b?.title?.toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
        }
    );

    const filteredAchievementTypes =
        [...CATEGORY_TO_SUBCATEGORY_LIST?.[boostCategoryType]].filter(type =>
            type.title.toLowerCase().includes(search.toLowerCase())
        ) || [];

    const boostOptionsItemList =
        filteredAchievementTypes.length >= 1
            ? filteredAchievementTypes.map((achievement, index) => (
                  <BoostSubCategoryButton
                      key={index}
                      title={achievement.title}
                      boostCategoryType={boostCategoryType}
                      subCategoryType={achievement.type}
                      boostUserType={boostUserType}
                      setSelectedCategoryType={setSelectedCategoryType}
                      otherUserProfileId={otherUserProfileId}
                      history={history}
                  />
              ))
            : null;

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            customType: search,
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

    let _subCategoryColor = `bg-${subColor}`;

    if (boostCategoryType === BoostCategoryOptionsEnum.socialBadge) {
        _subCategoryColor = 'bg-blue-300';
    } else if (boostCategoryType === BoostCategoryOptionsEnum.membership) {
        _subCategoryColor = 'bg-teal-300';
    } else if (boostCategoryType === BoostCategoryOptionsEnum.achievement) {
        _subCategoryColor = 'bg-pink-400';
    }

    const handleSearch = () => {
        if (validate()) {
            const customTitle = constructCustomBoostType(boostCategoryType, search);

            const baseLink = `/boost?boostUserType=${boostUserType}&boostCategoryType=${boostCategoryType}&boostSubCategoryType=${customTitle}`;

            let link = baseLink;

            if (otherUserProfileId) {
                link = `${baseLink}&otherUserProfileId=${otherUserProfileId}`;
            }

            history.push(link);
            closeAllModals();
        }
    };

    return (
        <>
            <div className={`ion-no-border pt-5 ${_subCategoryColor}`}>
                <IonRow className="flex flex-col pb-4">
                    <IonCol className="w-full flex items-center justify-center mt-8">
                        <h6 className="flex items-center justify-center text-white font-poppins text-xl font-medium tracking-wide">
                            <button
                                className="text-grayscale-50 p-0 mr-[10px]"
                                onClick={() => setSelectedCategoryType(null)}
                            >
                                <CaretLeft className="h-auto w-3 text-white" />
                            </button>
                            {title}
                        </h6>
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full mt-4">
                    <IonCol className="text-center">
                        <div className="relative flex flex-col items-center justify-center p-4 pb-0 rounded-3xl flex-1">
                            <div
                                className={`absolute top-0 left-[%50] w-[160px] h-[160px] bg-${color} rounded-full overflow-hidden`}
                            />
                            <img
                                src={CategoryImage}
                                alt="category img"
                                className="z-50 w-[140px] h-[140px] mt-[-4px]"
                            />
                        </div>
                    </IonCol>
                </IonRow>
            </div>
            <IonGrid className={`${_subCategoryColor}`}>
                <IonRow className="w-full flex items-center justify-center pb-6">
                    <div className="max-w-[95%] w-full ion-padding pb-0 rounded-tr-[20px] rounded-tl-[20px] mb-0 relative">
                        <IonInput
                            autocapitalize="on"
                            value={search}
                            onIonInput={e => {
                                setSearch(e.detail.value);
                                setErrors({});
                            }}
                            placeholder="Search or New..."
                            type="text"
                            className={`bg-white text-grayscale-800 rounded-[15px] ion-padding font-medium text-base ${
                                errors?.customType ? 'border-red-500 border-2' : ''
                            }`}
                            maxlength={22}
                        />
                        <div className="flex items-center justify-center absolute top-[35px] right-[15px] z-50">
                            <p className="mr-4 font-bold text-gray-500 text-xs ">{charCount}</p>
                        </div>
                        <div className="w-full flex flex-col ion-padding pt-0 items-center justify-between">
                            {filteredAchievementTypes.length === 0 && (
                                <div className="w-full text-left flex flex-col items-start justify-center mt-[10px]">
                                    <p className="text-grayscale-100 font-poppins text-[18px] font-semibold">
                                        No results found for{' '}
                                        <span className="text-grayscale-100 italic">{search}</span>
                                    </p>
                                    <button
                                        onClick={handleSearch}
                                        className="text-white text-[18px] font-extrabold text-left font-poppins"
                                    >
                                        Create "{search}" Boost!
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="w-full text-left">
                            <p className="text-sm text-red-600 mt-2 ml-2 font-medium">
                                {errors?.customType}{' '}
                            </p>
                        </div>
                    </div>
                    {filteredAchievementTypes.length >= 1 && (
                        <div className="flex items-center justify-center w-full">
                            <div className="flex items-center justify-center w-full px-5 max-w-[95%]">
                                <h2 className="divider-with-text-dynamic border-white border-solid border-b-[1px]">
                                    <span className={`bg-${subColor} text-white`}>or</span>
                                </h2>
                            </div>
                        </div>
                    )}
                    <IonCol className="w-full flex flex-col items-center justify-center">
                        {boostOptionsItemList}
                    </IonCol>
                    <div className="w-full flex items-center justify-center mt-4">
                        <button
                            onClick={() => setSelectedCategoryType(null)}
                            className="text-white text-center text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </IonRow>
            </IonGrid>
        </>
    );
};

export default BoostSubCategoryOptions;
