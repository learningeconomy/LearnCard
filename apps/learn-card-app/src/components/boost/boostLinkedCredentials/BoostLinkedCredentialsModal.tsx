import React, { useRef, useState } from 'react';

import { IonFooter, IonCol, IonGrid, IonRow, IonInput } from '@ionic/react';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import BoostEarnedCard from '../boost-earned-card/BoostEarnedCard';
import ListItemsIcon from 'learn-card-base/svgs/ListItemsIcon';
import GridIcon from 'learn-card-base/svgs/GridIcon';
import Search from 'learn-card-base/svgs/Search';

import {
    BoostPageViewMode,
    BoostPageViewModeType,
    DisplayTypeEnum,
    useModal,
} from 'learn-card-base';

import {
    isBoostCredential,
    getUrlFromImage,
    getImageUrlFromCredential,
    getCredentialSubject,
    getCredentialName,
} from 'learn-card-base/helpers/credentialHelpers';
import { BoostCategoryOptionsEnum, boostCategoryOptions } from 'learn-card-base';
import { VC } from '@learncard/types';
import keyboardStore from 'learn-card-base/stores/keyboardStore';
import { Capacitor } from '@capacitor/core';

export const BoostLinkedCredentialsModal: React.FC<{
    credential: VC;
    linkedCredentials: VC[];
    linkedCredentialCount: number;
    categoryType: BoostCategoryOptionsEnum;
    defaultImg?: string;
    displayType: DisplayTypeEnum;
}> = ({
    credential,
    linkedCredentials,
    categoryType,
    linkedCredentialCount,
    defaultImg,
    displayType,
}) => {
    const bottomBarRef = useRef<HTMLDivElement>();
    const { closeModal } = useModal();

    const [viewMode, setViewMode] = useState<BoostPageViewModeType>(BoostPageViewMode.Card);
    const isCardView = viewMode === BoostPageViewMode.Card;

    const [search, setSearch] = useState<string>('');

    keyboardStore.store.subscribe(({ isOpen }) => {
        if (isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `hidden`;
        }
        if (!isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `flex`;
        }
    });

    const isBoost = credential && isBoostCredential(credential);
    const cardTitle = isBoost ? credential?.name : getCredentialName(credential);
    const credImg = getUrlFromImage(getCredentialSubject(credential)?.image ?? '');
    const thumbImage = (credential && getImageUrlFromCredential(credential)) || defaultImg;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : thumbImage;

    const achievementType = credential?.credentialSubject?.achievement?.achievementType;

    const { subColor, color } = boostCategoryOptions?.[categoryType];
    const categoryColors = {
        [BoostCategoryOptionsEnum.learningHistory]: 'emerald-700',
        [BoostCategoryOptionsEnum.socialBadge]: 'blue-400',
        [BoostCategoryOptionsEnum.achievement]: 'pink-400',
        [BoostCategoryOptionsEnum.accomplishment]: 'yellow-400',
        [BoostCategoryOptionsEnum.workHistory]: 'blue-600',
        [BoostCategoryOptionsEnum.accommodation]: 'violet-500',
        [BoostCategoryOptionsEnum.id]: 'blue-400',
        [BoostCategoryOptionsEnum.membership]: 'blue-500',
    };
    const textColor = categoryColors?.[categoryType as BoostCategoryOptionsEnum];

    const credentials =
        linkedCredentials
            ?.filter(record =>
                record?.credentialSubject?.achievement?.name
                    ?.toLowerCase()
                    .includes(search.toLowerCase())
            )
            ?.map((record, index) => {
                return (
                    <BoostEarnedCard
                        key={record?.uri || index}
                        credential={record}
                        defaultImg={defaultImg}
                        categoryType={
                            categoryType as
                                | 'Achievement'
                                | 'Skill'
                                | 'ID'
                                | 'Learning History'
                                | 'Work History'
                                | 'Hidden'
                                | 'Social Badge'
                                | 'Membership'
                                | 'Currency'
                                | 'Course'
                                | 'Accomplishment'
                                | 'Accommodation'
                                | 'Relationship'
                                | 'Events'
                                | 'Merit Badge'
                                | 'Family'
                        }
                        boostPageViewMode={viewMode}
                        loading={false}
                        textColor={textColor}
                        sizeSm={6}
                        sizeMd={6}
                        sizeLg={6}
                    />
                );
            }) ?? [];

    return (
        <section
            className={`h-full flex flex-col justify-start items-start bg-white/50 backdrop-blur-sm`}
        >
            <div className="w-full flex items-center justify-start ion-padding bg-white rounded-b-[30px] overflow-hidden shadow-md">
                <div>
                    <CredentialBadge
                        achievementType={
                            credential?.credentialSubject?.achievement?.achievementType
                        }
                        fallbackCircleText={' '}
                        boostType={categoryType}
                        badgeThumbnail={badgeThumbnail}
                        badgeThumbnailContainerClass="w-[80%] h-[80%]"
                        badgeContainerCustomClass="mt-[0px] mb-[8px]"
                        badgeCircleCustomClass={`!w-[54px] h-[54px] mt-1 shadow-3xl`}
                        badgeRibbonContainerCustomClass="left-[30%] bottom-[-70%]"
                        badgeRibbonCustomClass="w-[20px]"
                        badgeRibbonIconCustomClass="w-[80%] mt-[4px]"
                        credential={credential}
                        borderStyle="border-[1px]"
                        certRibbonCustomClass="!w-[75px]"
                    />
                </div>
                <div className="flex flex-col items-start ml-[12px]">
                    <h4 className="text-grayscale-900 line-clamp-2 font-semibold text-large">
                        {cardTitle}
                    </h4>
                    <p className="text-grayscale-900">{achievementType}</p>
                    <p className="text-grayscale-600 font-semibold text-sm mt-2">
                        {linkedCredentialCount} Linked Credentials
                    </p>
                </div>
            </div>

            <div className={`px-[12px] overflow-y-auto flex-1 w-full pb-[100px]`}>
                <div className="w-full flex mt-4">
                    <div className="relative bg-gray-100 rounded-[15px] cursor-pointer w-full mr-2">
                        <Search
                            version="1"
                            className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-grayscale-600"
                        />
                        <IonInput
                            autocapitalize="on"
                            placeholder="Credentials..."
                            value={search}
                            className="!pl-10 text-grayscale-800 text-[17px] font-notoSans !py-1 w-full"
                            onIonInput={e => setSearch(e.detail.value ?? '')}
                            type="text"
                        />
                    </div>
                    <div
                        className={`rounded-[15px] fix-ripple flex w-fit items-center px-[4px] py-[0px] shrink-0  bg-${subColor}`}
                    >
                        <button
                            className={`rounded-[13px] py-[10px] px-[10px] shrink-0 ${
                                viewMode === BoostPageViewMode.Card
                                    ? `bg-white ${color} text-grayscale-600`
                                    : 'text-white'
                            } ${viewMode === BoostPageViewMode.List ? 'text-black' : ''}`}
                            onClick={() => setViewMode(BoostPageViewMode.Card)}
                        >
                            {<GridIcon />}
                        </button>
                        <button
                            className={`rounded-[13px] py-[10px] px-[10px] shrink-0 ${
                                viewMode === BoostPageViewMode.List
                                    ? `bg-white ${color} text-black`
                                    : 'text-white'
                            } ${viewMode === BoostPageViewMode.Card ? 'text-grayscale-600' : ''}`}
                            onClick={() => setViewMode(BoostPageViewMode.List)}
                        >
                            <ListItemsIcon />
                        </button>
                    </div>
                </div>
                {search.length > 0 && credentials.length === 0 && (
                    <div className="w-full flex items-center justify-center z-10 mt-4">
                        <div className="w-full max-w-[550px] flex items-center justify-start px-2 border-t-[1px] border-solid border-grayscale-200 pt-2">
                            <p className="text-grayscale-800 text-base font-normal font-notoSans">
                                No results found for{' '}
                                <span className="text-black italic">{search}</span>
                            </p>
                        </div>
                    </div>
                )}

                <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                    {isCardView && (
                        <IonGrid className="max-w-[600px] pt-[25px]">
                            <IonRow>{credentials}</IonRow>
                        </IonGrid>
                    )}
                    {!isCardView && (
                        <>
                            <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px] pt-[25px]">
                                {credentials}
                            </div>
                        </>
                    )}
                </IonCol>
            </div>

            <IonFooter
                ref={bottomBarRef}
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px] z-9999"
            >
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                        <button
                            onClick={closeModal}
                            className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </IonFooter>
        </section>
    );
};

export default BoostLinkedCredentialsModal;
