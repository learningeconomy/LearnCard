import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonRow, IonGrid, IonInput } from '@ionic/react';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import {
    CUSTOM_BOOST_TYPE_REGEX,
    constructCustomBoostType,
    isCustomBoostType,
} from 'learn-card-base';
import * as m from '../../../../../paraglide/messages.js';
import { TransP } from '../../../../../i18n/TransP';

import {
    boostCategoryOptions,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../../../boost-options/boostOptions';

const StateValidator = z.object({
    customType: z
        .string()
        .min(3)
        .max(22)
        .regex(CUSTOM_BOOST_TYPE_REGEX, ' Alphabetical characters only'),
});

type CustomTypeOption = {
    title: string;
    type: string;
};

type CustomTypes = Record<string, CustomTypeOption[]>;

export enum BoostCMSActiveAppearanceForm {
    appearanceForm = 'appearanceForm',
    achievementTypeForm = 'achievementTypeForm',
    badgeForm = 'badgeForm',
}

type BoostCMSSelectorProps = {
    activeCategoryType: string;
    activeType: string;
    setActiveType: React.Dispatch<React.SetStateAction<string>>;
    customTypes: CustomTypes;
    setCustomTypes: React.Dispatch<React.SetStateAction<CustomTypes>>;
};

const BoostCMSCategoryAndTypeSelector: React.FC<BoostCMSSelectorProps> = ({
    activeCategoryType,
    activeType,
    setActiveType,
    customTypes,
    setCustomTypes,
}) => {
    const flags = useFlags();
    const { color, subColor, CategoryImage } = boostCategoryOptions[activeCategoryType];

    const [search, setSearch] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const [charCount, setCharCount] = useState<number>(0);
    const maxCount = 22;

    useEffect(() => {
        setCharCount(maxCount - search.length);
    }, [search]);

    useEffect(() => {
        setSearch('');
        setErrors({});
    }, [activeCategoryType]);

    const categoryTypes = CATEGORY_TO_SUBCATEGORY_LIST?.[activeCategoryType] ?? [];
    const customCategoryTypes = customTypes?.[activeCategoryType] ?? [];
    const filteredAchievementTypes = [...categoryTypes, ...customCategoryTypes].filter(type =>
        type.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleCustomType = (): void => {
        const parsedData = StateValidator.safeParse({ customType: search });
        if (!parsedData.success) {
            setErrors(parsedData.error.flatten().fieldErrors);
            return;
        }

        setErrors({});

        const customType = constructCustomBoostType(activeCategoryType, search);
        setCustomTypes(prevState => ({
            ...prevState,
            [activeCategoryType]: [
                ...(prevState?.[activeCategoryType] ?? []),
                { title: search, type: customType },
            ],
        }));
    };

    return (
        <IonGrid
            className={`w-full h-full ion-no-padding !bg-${color} flex justify-center items-start`}
        >
            <IonRow
                className={`w-full flex flex-col items-center justify-center max-w-[600px] ion-padding !bg-${color}`}
            >
                <div className="w-full ion-padding bg-white rounded-tr-[20px] rounded-tl-[20px] mb-0 relative">
                    <IonInput
                        autocapitalize="on"
                        value={search}
                        onIonInput={e => {
                            setSearch(e.detail.value ?? '');
                            setErrors({});
                        }}
                        placeholder={m['common.search']()}
                        type="text"
                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium font-notoSans tracking-widest text-base ${
                            errors.customType ? 'border-red-500 border-2' : ''
                        }`}
                        maxlength={22}
                    />
                    <div className="flex items-center justify-center absolute font-notoSans top-[35px] right-[15px] z-50">
                        <p className="mr-4 font-bold text-gray-500 text-xs ">{charCount}</p>
                    </div>
                    {errors.customType && (
                        <p className="w-full text-left text-sm text-red-600 mt-2 font-medium font-notoSans">
                            {errors.customType}
                        </p>
                    )}
                </div>

                <div className="w-full flex flex-col ion-padding pt-0 rounded-bl-[20px] rounded-br-[20px] mb-4 items-center justify-between bg-white">
                    {filteredAchievementTypes.length === 0 && (
                        <div className="w-full text-left flex flex-col items-start justify-center">
                            <p className="text-grayscale-600 text-base font-normal font-notoSans">
                                <TransP
                                    m={m['common.searchResults.noResultsFor']}
                                    values={{ query: search }}
                                    components={[<span className="text-black italic" key="q" />]}
                                />
                            </p>
                            {!flags?.disableCmsCustomization && (
                                <button
                                    onClick={handleCustomType}
                                    className="text-indigo-600 text-base font-bold text-left font-notoSans"
                                >
                                    {m['boostCMS.useCustomType']({ search })}
                                </button>
                            )}
                        </div>
                    )}
                    {search.length > 0 &&
                        filteredAchievementTypes?.map(({ title, type }) => {
                            const isActive = type === activeType;
                            const activeStyles = isActive ? 'bg-emerald-100' : 'bg-grayscale-100';
                            const customType = isCustomBoostType(type);

                            return (
                                <button
                                    onClick={() => setActiveType(type)}
                                    className={`relative flex items-center justify-between  rounded-full px-[10px] py-[10px] w-full shadow-lg uppercase tracking-wide max-w-[95%] mb-4 ${activeStyles}`}
                                >
                                    <div
                                        className={`flex items-center justify-center h-[50px] w-[50px] rounded-full bg-${subColor} border-white border-2`}
                                    >
                                        <img
                                            src={CategoryImage}
                                            alt="category"
                                            className="w-[40px]"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-start pl-4">
                                        {customType && (
                                            <p className="w-full text-gray-800 text-xs uppercase font-bold text-left font-notoSans">
                                                {m['boostCMS.customType']()}
                                            </p>
                                        )}
                                        <p className="w-full text-grayscale-700 font-medium text-lg text-left capitalize font-notoSans">
                                            {title}
                                        </p>
                                    </div>
                                    <button className="flex items-center justify-center bg-white rounded-full  shadow-3xl w-12 h-12">
                                        {isActive ? (
                                            <Checkmark className="w-7 h-auto text-emerald-700" />
                                        ) : null}
                                    </button>
                                </button>
                            );
                        })}
                    {search.length === 0 &&
                        customCategoryTypes.map(({ title, type }) => {
                            const isActive = type === activeType;
                            const activeStyles = isActive ? 'bg-emerald-100' : 'bg-grayscale-100';

                            return (
                                <button
                                    key={type}
                                    onClick={() => setActiveType(type)}
                                    className={`relative flex items-center justify-between rounded-full px-[10px] py-[10px] w-full shadow-lg uppercase tracking-wide max-w-[95%] mb-4 ${activeStyles}`}
                                >
                                    <div
                                        className={`flex items-center justify-center h-[50px] w-[50px] rounded-full bg-${subColor} border-white border-2`}
                                    >
                                        <img
                                            src={CategoryImage}
                                            alt="category"
                                            className="w-[40px]"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-start pl-4">
                                        <p className="w-full text-gray-800 text-xs uppercase font-bold text-left font-notoSans">
                                            {m['boostCMS.customType']()}
                                        </p>
                                        <p className="w-full text-grayscale-700 font-medium text-lg text-left capitalize font-notoSans">
                                            {title}
                                        </p>
                                    </div>
                                    <span className="flex items-center justify-center bg-white rounded-full shadow-3xl w-12 h-12">
                                        {isActive && (
                                            <Checkmark className="w-7 h-auto text-emerald-700" />
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    {search.length === 0 &&
                        CATEGORY_TO_SUBCATEGORY_LIST?.[activeCategoryType].map(
                            ({ title, type }) => {
                                const isActive = type === activeType;
                                const activeStyles = isActive
                                    ? 'bg-emerald-100'
                                    : 'bg-grayscale-100';

                                return (
                                    <button
                                        onClick={() => setActiveType(type)}
                                        className={`relative flex items-center justify-between  rounded-full px-[10px] py-[10px] w-full shadow-lg uppercase tracking-wide max-w-[95%] mb-4 ${activeStyles}`}
                                    >
                                        <div
                                            className={`flex items-center justify-center h-[50px] w-[50px] rounded-full bg-${subColor} border-white border-2`}
                                        >
                                            <img
                                                src={CategoryImage}
                                                alt="category"
                                                className="w-[40px]"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-start pl-4">
                                            <p className="w-full text-grayscale-700 font-medium text-lg text-left capitalize font-notoSans">
                                                {title}
                                            </p>
                                        </div>
                                        <button className="flex items-center justify-center bg-white rounded-full  shadow-3xl w-12 h-12">
                                            {isActive ? (
                                                <Checkmark className="w-7 h-auto text-emerald-700" />
                                            ) : null}
                                        </button>
                                    </button>
                                );
                            }
                        )}
                </div>
            </IonRow>
        </IonGrid>
    );
};

export default BoostCMSCategoryAndTypeSelector;
