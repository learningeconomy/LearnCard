import React, { useEffect, useRef } from 'react';

import { IonCol, IonSpinner } from '@ionic/react';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import HourGlass from '../../../assets/lotties/hourglass.json';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
import {
    CredentialCategoryEnum,
    BoostPageViewModeType,
    BoostPageViewMode,
    useGetPaginatedManagedBoosts,
    BrandingEnum,
    searchManagedBoostsFromCache,
    pluralize,
} from 'learn-card-base';
import {
    SubheaderContentType,
    credentialCategoryToSubheaderType,
} from '../../main-subheader/MainSubHeader.types';
import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import BoostManagedIDCard from './BoostManagedIDCard';
import Lottie from 'react-lottie-player';

type BoostManagedIDListProps = {
    category: CredentialCategoryEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title?: string;
    emptyMessage?: string;
    emptyMessageStyle?: string;
};

const BoostManagedIDList: React.FC<BoostManagedIDListProps> = ({
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    title,
    emptyMessage,
    emptyMessageStyle,
}) => {
    /*
        * start **
        Managed boosts query + pagination 
    */
    const managedBoostInfiniteScrollRef = useRef<HTMLDivElement>(null);
    const {
        data: managedBoosts,
        isLoading: managedBoostsLoading,
        isFetching: managedBoostsFetching,
        hasNextPage: managedBoostsHasNextPage,
        fetchNextPage: managedBoostsFetchNextPage,
        refetch: managedBoostsRefetch,
        error: managedBoostsError,
    } = useGetPaginatedManagedBoosts(category, { limit: 12 });

    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searchResults = searchManagedBoostsFromCache(managedBoosts);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length;

    const noResultsLineColor =
        SubheaderContentType[credentialCategoryToSubheaderType(category)].bgColor;

    const managedBoostsOnScreen = useOnScreen(managedBoostInfiniteScrollRef as any, '-100px', [
        managedBoosts?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (managedBoostsOnScreen && managedBoostsHasNextPage) managedBoostsFetchNextPage();
    }, [
        managedBoostsFetchNextPage,
        managedBoostsHasNextPage,
        managedBoostsOnScreen,
        managedBoostInfiniteScrollRef,
    ]);
    /*
        Managed boosts query + pagination 
         * end **
    */

    const credentialsBackgroundFetching = managedBoostsFetching && !managedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = managedBoostsError ? true : false;

    const managedBoostsList =
        managedBoosts?.pages?.flatMap(page =>
            page?.records
                ?.filter?.(record => searchResults.find(cred => cred.uri === record?.uri))
                ?.map((record, index) => {
                    return (
                        <BoostManagedIDCard
                            key={record?.uri || index}
                            boost={record}
                            defaultImg={defaultImg}
                            categoryType={category}
                            boostPageViewMode={viewMode}
                            loading={managedBoostsLoading}
                            branding={BrandingEnum.scoutPass}
                        />
                    );
                })
        ) ?? [];

    const handleRefetch = async () => {
        try {
            await managedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.');
        }
    };

    const isCardView = viewMode === BoostPageViewMode.Card;

    const searchResultsElement = (
        <div className={`flex flex-col gap-[10px] mt-[6px] ${isCardView ? 'px-[12px]' : ''}`}>
            <span className="font-notoSans text-grayscale-900 text-[14px] font-[700]">
                {searchString?.trim?.() === '' && `Search ${searchResultsCount} managed boosts`}
                {noSearchResults && `No managed ${category} titled "${searchString}"`}
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
            {managedBoostsLoading && !managedBoostsError && (
                <section className="loading-spinner-container flex items-center justify-center h-[80%] w-full ">
                    <div className="max-w-[280px] mt-[-10px]">
                        <Lottie
                            loop
                            animationData={HourGlass}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </section>
            )}

            {!managedBoostsLoading &&
                !boostError &&
                managedBoostsList &&
                managedBoostsList?.length > 0 && (
                    <>
                        {isCardView && (
                            <section className="relative flex flex-wrap gap-[10px] text-center justify-center items-center max-w-[800px]">
                                <div
                                    className={`bg-filler absolute h-full mt-[200px] w-[3000px] z-[-10] ${bgFillerColor}`}
                                />
                                {managedBoostsList}
                                <div role="presentation" ref={managedBoostInfiniteScrollRef} />
                                {managedBoostsFetching && (
                                    <div className="w-full flex items-center justify-center">
                                        <IonSpinner
                                            name="crescent"
                                            color="grayscale-900"
                                            className="scale-[2] mb-8 mt-6"
                                        />
                                    </div>
                                )}
                            </section>
                        )}
                        {!isCardView && (
                            <IonCol className="flex m-auto items-center flex-wrap w-full achievements-list-container">
                                <div
                                    className={`bg-filler absolute h-full mt-[200px] w-[3000px] z-[-10] ${bgFillerColor}`}
                                />
                                <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px]">
                                    {managedBoostsList}
                                </div>
                                <div role="presentation" ref={managedBoostInfiniteScrollRef} />
                                {managedBoostsFetching && (
                                    <div className="w-full flex items-center justify-center">
                                        <IonSpinner
                                            name="crescent"
                                            color="grayscale-900"
                                            className="scale-[2] mb-8 mt-6"
                                        />
                                    </div>
                                )}
                            </IonCol>
                        )}
                    </>
                )}
            {!managedBoostsLoading &&
                !managedBoostsError &&
                managedBoostsList &&
                managedBoostsList?.length === 0 && (
                    <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center mt-[20px]">
                        <img src={defaultImg} alt="ids" className="w-[200px] h-[200px] m-auto" />
                        <p
                            className={`absolute inset-0 flex items-center justify-center font-bold text-center w-[133px] m-auto text-[16px] ${emptyMessageStyle}`}
                        >
                            {emptyMessage}
                        </p>
                        {/* <h2 className="text-2xl font-medium  text-grayscale-900">
                            Organize Into Troops{' '}
                        </h2>
                        <p className="font-medium mt-[20px]  text-grayscale-900">
                            Soon local troops will be able to self organize and issue official scout
                            badges.
                        </p>
                        <SignUpForWaitList /> */}
                    </section>
                )}
            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
        </>
    );
};

export default BoostManagedIDList;

// filler - bg-sp-green-forest-extra-light
