import React, { useEffect, useRef, useMemo } from 'react';

import { useHistory } from 'react-router-dom';
import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import useBoostModal from '../hooks/useBoostModal';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';
import { EmptyState } from '../boost-select-menu/NewBoostSelectMenu';
import { IonRow, IonGrid, IonSpinner } from '@ionic/react';
import BoostManagedCard, { BoostManagedCardSkeleton } from './BoostManagedCard';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import { CredentialListSkeleton } from 'learn-card-base/components/loaders/CredentialListSkeleton';
import {
    CredentialCategoryEnum,
    BoostPageViewModeType,
    BoostPageViewMode,
    useGetPaginatedFamilialBoosts,
    BrandingEnum,
    searchManagedBoostsFromCache,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import { BoostQuery } from '@learncard/types';

import NewBoostSelectMenuCustomTypeButton from '../boost-select-menu/NewBoostSelectMenuCustomTypeButton';
import {
    credentialCategoryToSubheaderType,
    SubheaderContentType,
} from '../../main-subheader/MainSubHeader.types';

type BoostManagedListProps = {
    parentUri: string;
    parentGenerations: number;
    childGenerations: number;
    query?: BoostQuery;
    category: CredentialCategoryEnum | BoostCategoryOptionsEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg?: string;
    title?: string;
    search?: string;
    enableCreateButton?: boolean;
    includeExtendedFamily?: boolean;
    handleCloseModal?: () => void;
    returnToParentAfterSave?: boolean;
    useManagedCardSkeleton?: boolean;
};
const INITIAL_SKELETON_COUNT = 4;

const BoostManagedChildrenList: React.FC<BoostManagedListProps> = ({
    parentUri,
    parentGenerations = 2,
    childGenerations = 2,
    query,
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    includeExtendedFamily,
    enableCreateButton = true,
    handleCloseModal,
    returnToParentAfterSave = false,
    useManagedCardSkeleton = false,
}) => {
    const history = useHistory();
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
    } = useGetPaginatedFamilialBoosts(
        parentUri,
        parentGenerations,
        childGenerations,
        query,
        category,
        includeExtendedFamily
    );

    const searchActive = credentialSearchStore.use.isSearchActive();
    const searchString = credentialSearchStore.use.searchString() || '';
    const searchResults = searchManagedBoostsFromCache(managedBoosts);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length ?? 0;

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

    const noResultsLineColor =
        SubheaderContentType[credentialCategoryToSubheaderType(category)].bgColor;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { handlePresentBoostModal } = useBoostModal(history, category);

    const credentialsBackgroundFetching = managedBoostsFetching && !managedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = managedBoostsError ? true : false;

    const managedBoostsList = useMemo(
        () =>
            managedBoosts?.pages?.flatMap(page =>
                page?.records
                    ?.filter(record => searchResults.some(cred => cred.uri === record?.uri))
                    ?.map((record, index) => (
                        <BoostManagedCard
                            key={record?.uri ?? `boost-${index}`}
                            boost={record}
                            refetchQuery={managedBoostsRefetch}
                            defaultImg={defaultImg}
                            categoryType={category}
                            boostPageViewMode={viewMode}
                            loading={managedBoostsLoading}
                            branding={BrandingEnum.scoutPass}
                            useCmsModal={true}
                        />
                    ))
            ) ?? [],
        [
            managedBoosts,
            searchResults,
            category,
            viewMode,
            managedBoostsLoading,
            managedBoostsRefetch,
            defaultImg,
        ]
    );
    const loadingManagedBoosts = Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
        <BoostManagedCardSkeleton
            key={`managed-child-skeleton-${category}-${index}`}
            categoryType={category}
            boostPageViewMode={viewMode}
            branding={BrandingEnum.scoutPass}
        />
    ));

    const handleRefetch = async () => {
        try {
            await managedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.');
        }
    };

    const isCardView = viewMode === BoostPageViewMode.Card;
    const searchResultsText =
        searchString.trim() === ''
            ? searchResultsCount === 1
                ? m['common.searchResults.managedCountOne']({ count: searchResultsCount })
                : m['common.searchResults.managedCountOther']({ count: searchResultsCount })
            : noSearchResults
            ? m['common.searchResults.noManaged']({ query: searchString })
            : searchResultsCount === 1
            ? m['common.searchResults.foundOne']({
                  count: searchResultsCount,
                  query: searchString,
              })
            : m['common.searchResults.foundOther']({
                  count: searchResultsCount,
                  query: searchString,
              });

    const searchResultsElement = (
        <div className={`flex flex-col gap-[10px] mt-[6px] ${isCardView ? 'px-[12px]' : ''}`}>
            <span className="font-notoSans text-grayscale-900 text-[14px] font-[700]">
                {searchResultsText}
            </span>
            <div className={`h-[1px] bg-sp-blue-ocean mb-[5px] ${noResultsLineColor}`} />
        </div>
    );

    return (
        <>
            {managedBoostsLoading &&
                !boostError &&
                (useManagedCardSkeleton ? (
                    <section
                        className="w-full"
                        role="status"
                        aria-label={m['common.searchResults.loadingManaged']()}
                    >
                        {isCardView ? (
                            <IonGrid className="max-w-[600px]">
                                <IonRow>{loadingManagedBoosts}</IonRow>
                            </IonGrid>
                        ) : (
                            <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px] pt-[25px]">
                                {loadingManagedBoosts}
                            </div>
                        )}
                    </section>
                ) : (
                    <CredentialListSkeleton
                        viewMode={isCardView ? 'card' : 'list'}
                        cardSize="credential"
                    />
                ))}

            {!managedBoostsLoading && !boostError && managedBoostsList && (
                <>
                    {isCardView && (
                        <IonGrid className="max-w-[600px]">
                            {searchActive && searchResultsElement}
                            <IonRow>
                                {enableCreateButton && (
                                    <NewBoostSelectMenuCustomTypeButton
                                        category={category}
                                        handleCloseModal={handleCloseModal}
                                        useCMSModal
                                        parentUri={parentUri}
                                        returnToParentAfterSave={returnToParentAfterSave}
                                    />
                                )}
                                {managedBoostsList}
                            </IonRow>
                            <div
                                aria-hidden="true"
                                role="presentation"
                                ref={managedBoostInfiniteScrollRef}
                            />
                        </IonGrid>
                    )}
                    {!isCardView && (
                        <>
                            {searchActive && searchResultsElement}
                            {managedBoostsList}
                            {/* {enableCreateButton && (
                                        <NewBoostButton
                                            credentialType={category}
                                            onClick={handlePresentBoostModal}
                                            viewMode={viewMode}
                                            branding={BrandingEnum.scoutPass}
                                        />
                                    )} */}

                            <div role="presentation" ref={managedBoostInfiniteScrollRef} />
                        </>
                    )}
                    {managedBoostsFetching && (
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
                </>
            )}

            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
            {!managedBoostsLoading && !managedBoostsError && managedBoostsList?.length === 0 && (
                <div className="flex w-full justify-center">
                    <EmptyState />
                </div>
            )}
        </>
    );
};

export default BoostManagedChildrenList;
