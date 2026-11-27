import React, { useEffect, useRef, useMemo } from 'react';
import { useLocale } from '../../../i18n';

import { useNavigate } from 'react-router';
import { useLoadingLine } from '../../../stores/loadingStore';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import useBoostModal from '../hooks/useBoostModal';
import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import BoostManagedCard, { BoostManagedCardSkeleton } from './BoostManagedCard';
import BoostErrorsDisplay from '../../../components/boost/boostErrors/BoostErrorsDisplay';
import {
    CredentialCategoryEnum,
    BoostPageViewModeType,
    BoostPageViewMode,
    useGetPaginatedManagedBoosts,
    BrandingEnum,
    searchManagedBoostsFromCache,
    useModal,
    ModalTypes,
} from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';

import NewBoostButton from 'learn-card-base/components/boost/NewBoostButton';
import NewBoostSelectMenu from '../boost-select-menu/NewBoostSelectMenuOld';
import {
    credentialCategoryToSubheaderType,
    SubheaderContentType,
} from '../../main-subheader/MainSubHeader.types';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

type BoostManagedListProps = {
    category: CredentialCategoryEnum;
    viewMode: BoostPageViewModeType;
    bgFillerColor?: string;
    defaultImg: string;
    title?: string;
    enableCreateButton?: boolean;
};
const INITIAL_SKELETON_COUNT = 4;

const BoostManagedList: React.FC<BoostManagedListProps> = ({
    category,
    viewMode,
    bgFillerColor,
    defaultImg,
    enableCreateButton = false,
}) => {
    useLocale();
    const navigate = useNavigate();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
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
    const searchResultsCount = searchResults?.length ?? 0;

    const managedBoostsOnScreen = useOnScreen(managedBoostInfiniteScrollRef, '-100px', [
        managedBoosts?.pages?.[0]?.records?.length,
    ]);

    const presentNewBoostSelector = () => {
        newModal(<NewBoostSelectMenu handleCloseModal={() => closeModal()} category={category} />);
    };

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

    const { handlePresentBoostModal } = useBoostModal(navigate, category);

    const credentialsBackgroundFetching = managedBoostsFetching && !managedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const boostError = managedBoostsError ? true : false;

    const managedBoostsList = useMemo(
        () =>
            managedBoosts?.pages?.flatMap(page =>
                page?.records
                    ?.filter?.(record => searchResults.find(cred => cred.uri === record?.uri))
                    ?.map((record, index) => {
                        return (
                            <BoostManagedCard
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
            ) ?? [],
        [managedBoosts, searchResults, category, viewMode, managedBoostsLoading, defaultImg]
    );
    const loadingManagedBoosts = Array.from({ length: INITIAL_SKELETON_COUNT }, (_, index) => (
        <BoostManagedCardSkeleton
            key={`managed-skeleton-${category}-${index}`}
            categoryType={category}
            boostPageViewMode={viewMode}
            branding={BrandingEnum.scoutPass}
        />
    ));

    const handleRefetch = async () => {
        try {
            await managedBoostsRefetch?.();
        } catch (e) {
            throw new Error('There was an error, please try again.', { cause: e });
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
            {managedBoostsLoading && !boostError && (
                <AppCol
                    className="flex m-auto items-center flex-wrap w-full achievements-list-container"
                    role="status"
                    aria-label={m['common.searchResults.loadingManaged']()}
                >
                    {isCardView ? (
                        <AppGrid className="max-w-[600px] pt-[20px]">
                            <AppRow>{loadingManagedBoosts}</AppRow>
                        </AppGrid>
                    ) : (
                        <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px] pt-[25px]">
                            {loadingManagedBoosts}
                        </div>
                    )}
                </AppCol>
            )}

            {!managedBoostsLoading && !boostError && managedBoostsList && (
                <>
                    <AppCol className="flex m-auto items-center flex-wrap w-full achievements-list-container ">
                        {isCardView && (
                            <AppGrid className="max-w-[600px] pt-[20px]">
                                {searchActive && searchResultsElement}
                                <AppRow>
                                    {managedBoostsList}
                                    {enableCreateButton && (
                                        <NewBoostButton
                                            credentialType={category}
                                            onClick={() => {
                                                if (
                                                    category === CredentialCategoryEnum.membership
                                                ) {
                                                    handlePresentBoostModal();
                                                } else {
                                                    presentNewBoostSelector();
                                                }
                                            }}
                                            branding={BrandingEnum.scoutPass}
                                            viewMode={viewMode}
                                        />
                                    )}
                                </AppRow>
                                <div role="presentation" ref={managedBoostInfiniteScrollRef} />
                            </AppGrid>
                        )}
                        {!isCardView && (
                            <>
                                <div className="flex flex-col gap-[10px] w-full max-w-[700px] px-[20px] pt-[25px]">
                                    {searchActive && searchResultsElement}
                                    {managedBoostsList}
                                    {enableCreateButton && (
                                        <NewBoostButton
                                            credentialType={category}
                                            onClick={handlePresentBoostModal}
                                            viewMode={viewMode}
                                            branding={BrandingEnum.scoutPass}
                                        />
                                    )}
                                </div>
                                <div role="presentation" ref={managedBoostInfiniteScrollRef} />
                            </>
                        )}
                        {managedBoostsFetching && (
                            <div className="w-full flex items-center justify-center">
                                <AppSpinner
                                    name="crescent"
                                    color="grayscale-900"
                                    className="scale-[2] mb-8 mt-6"
                                />
                            </div>
                        )}
                        <div
                            className={`bg-filler absolute h-full top-[0px] left-[0px] w-full mt-[110px] -z-50 ${bgFillerColor}`}
                        />
                    </AppCol>
                </>
            )}

            {!managedBoostsLoading && !managedBoostsError && managedBoostsList?.length === 0 && (
                <section
                    className={`flex relative items-center flex-col achievements-list-container max-w-[700px]  mx-auto ${
                        isCardView ? 'pt-[30px]' : 'px-[20px] pt-[30px]'
                    }`}
                >
                    {enableCreateButton && !searchActive && (
                        <NewBoostButton
                            credentialType={category}
                            onClick={handlePresentBoostModal}
                            viewMode={viewMode}
                            branding={BrandingEnum.scoutPass}
                        />
                    )}
                </section>
            )}
            {boostError && <BoostErrorsDisplay refetch={handleRefetch} />}
        </>
    );
};

export default BoostManagedList;
