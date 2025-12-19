import React, { useEffect, useRef } from 'react';

import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import { IonRow, IonCol, IonGrid, IonSpinner } from '@ionic/react';
import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';

import {
    CredentialCategoryEnum,
    useGetCredentialList,
    BoostPageViewMode,
    BoostPageViewModeType,
    searchCredentialsFromCache,
    pluralize,
} from 'learn-card-base';
import {
    credentialCategoryToSubheaderType,
    SubheaderContentType,
} from '../../main-subheader/MainSubHeader.types';
import CategoryEmptyPlaceholder from '../../empty-placeholder/CategoryEmptyPlaceHolder';

type CategoryType = keyof typeof CredentialCategoryEnum | 'Hidden' | 'Course';

type BoostEarnedListProps = {
    category: CategoryType;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title: string;
};

const BoostEarnedList: React.FC<BoostEarnedListProps> = ({
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    title,
}) => {
    /*
        * start **
        Earned boosts query + pagination 
    */
    const infiniteScrollRef = useRef<HTMLDivElement>(null);
    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
        hasNextPage,
        fetchNextPage,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentialList(
        category as
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
    );

    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searchResults = searchCredentialsFromCache(records);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length;

    const onScreen = useOnScreen(infiniteScrollRef as any, '-100px', [
        records?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen, infiniteScrollRef]);
    /*
        Earned boosts query + pagination 
        * end **
    */

    const { bgColor: noResultsLineColor, title: categoryTitle } =
        SubheaderContentType[credentialCategoryToSubheaderType(category)];

    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = earnedBoostsError ? true : false;

    const categoryColors = {
        [CredentialCategoryEnum.learningHistory]: 'emerald-700',
        [CredentialCategoryEnum.socialBadge]: 'blue-400',
        [CredentialCategoryEnum.achievement]: 'pink-400',
        [CredentialCategoryEnum.accomplishment]: 'yellow-400',
        [CredentialCategoryEnum.workHistory]: 'blue-600',
        [CredentialCategoryEnum.accommodation]: 'violet-500',
        [CredentialCategoryEnum.id]: 'blue-500',
        [CredentialCategoryEnum.membership]: 'blue-500',
    };

    const textColor = categoryColors[category];

    const credentials =
        records?.pages?.flatMap(page =>
            page?.records
                ?.filter?.(record => searchResults.find(cred => cred.uri === record?.uri))
                .map((record, index) => {
                    return (
                        <BoostEarnedCard
                            key={record?.uri || index}
                            record={record}
                            defaultImg={defaultImg}
                            categoryType={
                                category as
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
                            loading={credentialsLoading}
                            textColor={textColor}
                        />
                    );
                })
        ) ?? [];

    const handleRefetch = async () => {
        try {
            await earnedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.');
        }
    };

    const isCardView = viewMode === BoostPageViewMode.Card;

    const searchResultsElement = (
        <div className={`flex flex-col gap-[5px] mt-[6px] ${isCardView ? 'px-[15px]' : ''}`}>
            <span className="font-notoSans text-grayscale-900 text-[14px] font-[700]">
                {searchString?.trim?.() === '' && `Search ${searchResultsCount} earned boosts`}
                {noSearchResults && `No earned ${categoryTitle} titled "${searchString}"`}
                {searchResultsCount > 0 &&
                    searchString?.trim?.() !== '' &&
                    `Found ${searchResultsCount} ${pluralize(
                        'result',
                        searchResultsCount
                    )} for "${searchString}" `}
            </span>
            <div className={`h-[1px] bg-sp-blue-ocean mb-[5px] ${noResultsLineColor}`} />
        </div>
    );

    return (
        <>
            {(credentialsLoading ||
                (credentials?.length === 0 && !credentialsLoading && !searchActive)) &&
                !boostError && (
                    <section className="flex relative  min-h-[200px]  flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                        <CategoryEmptyPlaceholder category={category} />
                        <div className="text-black mt-10">
                            <strong>
                                <span
                                    className={`flex justify-center ${
                                        credentialsLoading ? 'animate-pulse' : 'normal'
                                    }`}
                                >
                                    {credentialsLoading ? (
                                        <p className={`loader text-${textColor}`}></p>
                                    ) : (
                                        <p className="font-montserrat text-[14px] font-[700] text-grayscale-900">{`No ${title} yet.`}</p>
                                    )}
                                </span>
                            </strong>
                        </div>
                    </section>
                )}
            {!credentialsLoading && !boostError && records && (
                <>
                    <IonCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                        {isCardView && (
                            <IonGrid className="max-w-[600px] pt-[20px]">
                                {searchActive && searchResultsElement}
                                <IonRow>{credentials}</IonRow>
                                <div role="presentation" ref={infiniteScrollRef} />
                            </IonGrid>
                        )}
                        {!isCardView && (
                            <>
                                <div className="flex flex-col gap-[10px] w-full max-w-[600px] px-[20px] pt-[25px]">
                                    {searchActive && searchResultsElement}
                                    {credentials}
                                </div>
                                <div role="presentation" ref={infiniteScrollRef} />
                            </>
                        )}
                        {credentialsFetching && (
                            <div className="w-full flex items-center justify-center">
                                <IonSpinner
                                    name="crescent"
                                    color="grayscale-900"
                                    className="scale-[2] mb-8 mt-6"
                                />
                            </div>
                        )}
                        <div
                            className={`bg-filler absolute h-full top-[0px] left-[0px] w-full mt-[110px] z-[-50] ${bgFillerColor}`}
                        />
                    </IonCol>
                </>
            )}

            {boostError && <BoostErrorsDisplay refetch={handleRefetch} category={category} />}
        </>
    );
};

export default BoostEarnedList;
