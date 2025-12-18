import React, { useState, useRef, useEffect } from 'react';
import {
    useModal,
    useGetPaginatedManagedBoostsQuery,
    searchManagedBoostsFromCache,
    BoostPageViewMode,
    categoryMetadata,
    boostCategoryMetadata,
    BoostPageViewModeType,
    CredentialCategoryEnum,
    walletSubtypeToDefaultImageSrc,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

import { IonRow, IonGrid, IonInput } from '@ionic/react';
import BoostManagedIDCard from '../boost-managed-card/BoostManagedIDCard';
import BoostManagedCard from '../boost-managed-card/BoostManagedCard';
import Search from 'learn-card-base/svgs/Search';
import BoostTemplateListItem from './BoostTemplateListItem';
import BoostTemplateSortAndFilterButton from './BoostTemplateSortAndFilterButton';
import BoostTemplateTabs from './BoostTemplateTabs';
import { BoostTemplateTabsEnum } from './BoostTemplateTabs';
import LearnCardTemplateCard from './LearnCardTemplateCard';
import LearnCardTemplateListItem from './LearnCardTemplateListItem';

import { BoostUserTypeEnum } from '../boost-options/boostOptions';
import {
    BoostTemplateFilterOptionsEnum,
    BoostTemplateSortOptionsEnum,
} from './boostTemplateSearch.helpers';
import { getLearnCardBoostTemplates } from '../boostHelpers';

type BoostTemplateSelectorBodyProps = {
    selectedCategory: BoostCategoryOptionsEnum;
    viewMode: BoostPageViewModeType;
    otherUserProfileId?: string;
};

const BoostTemplateSelectorBody: React.FC<BoostTemplateSelectorBodyProps> = ({
    selectedCategory,
    viewMode,
    otherUserProfileId,
}) => {
    const { closeModal, newModal } = useModal();
    const boostUserType = BoostUserTypeEnum.someone;

    const [filterBy, setFilterBy] = useState<BoostTemplateFilterOptionsEnum>(
        BoostTemplateFilterOptionsEnum.learnCardTemplates
    );
    const [sortBy, setSortBy] = useState<BoostTemplateSortOptionsEnum>(
        BoostTemplateSortOptionsEnum.recentlyAdded
    );

    const [activeTab, setActiveTab] = useState<BoostTemplateTabsEnum>(
        BoostTemplateTabsEnum.learnCardTemplates
    );

    // Debounce search input
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchInput, setDebouncedSearchInput] = useState(''); // to mitigate search lagging while typing
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchInput(searchInput);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(timerId);
        };
    }, [searchInput]);

    const isListView = viewMode === BoostPageViewMode.List;
    const currentWalletSubtype =
        categoryMetadata[boostCategoryMetadata[selectedCategory].credentialType].walletSubtype;
    const imgSrc = walletSubtypeToDefaultImageSrc(currentWalletSubtype);

    const handleTabSwitch = (tab: BoostTemplateTabsEnum) => {
        setActiveTab(tab);
        setFilterBy(BoostTemplateFilterOptionsEnum[tab]);
    };

    const {
        data: boosts,
        isLoading: boostsLoading,
        hasNextPage: boostsHasNextPage,
        fetchNextPage: boostsFetchNextPage,
        isFetchingNextPage: boostsIsFetchingNextPage,
    } = useGetPaginatedManagedBoostsQuery(
        {
            category:
                selectedCategory === BoostCategoryOptionsEnum.all ? undefined : selectedCategory,
        },
        { limit: 12 }
    );

    const boostInfiniteScrollRef = useRef<HTMLDivElement>(null);
    const boostsOnScreen = useOnScreen(boostInfiniteScrollRef as any, '200px', [
        boosts?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (boostsOnScreen && boostsHasNextPage) boostsFetchNextPage();
    }, [boostsFetchNextPage, boostsHasNextPage, boostsOnScreen, boostInfiniteScrollRef]);

    // Use debounced search input for actual searching
    const searchResults = searchManagedBoostsFromCache(boosts, debouncedSearchInput);
    const noSearchResults = searchResults?.length === 0;
    const searchResultsCount = searchResults?.length;

    let boostsList = [];

    const searchTemplates = (templates, searchTerm: string) => {
        const formattedSearch = searchTerm.toLowerCase();
        return templates.filter(template =>
            template?.title?.toLowerCase().includes(formattedSearch)
        );
    };

    useEffect(() => {
        // Fixes case where the first page is not fetched because LearnCard templates push the scroll ref to the bottom
        if (boostsHasNextPage && !boostsLoading && !boostsIsFetchingNextPage) {
            boostsFetchNextPage();
        }
    }, [boostsHasNextPage, boostsLoading, boostsIsFetchingNextPage]);

    if (
        (filterBy === BoostTemplateFilterOptionsEnum.showAll && !boostsHasNextPage) ||
        filterBy === BoostTemplateFilterOptionsEnum.myTemplates
    ) {
        boostsList =
            boosts?.pages?.flatMap(page =>
                page?.records
                    ?.filter?.(record => searchResults.find(cred => cred.uri === record?.uri))
                    ?.map((record, index) => {
                        const isID = record?.category === BoostCategoryOptionsEnum.id;
                        const isMembership =
                            record?.category === BoostCategoryOptionsEnum.membership;

                        if (isListView) {
                            return (
                                <BoostTemplateListItem
                                    key={record?.uri || index}
                                    boost={record}
                                    defaultImg={imgSrc}
                                    categoryType={record?.category}
                                    userToBoostProfileId={otherUserProfileId}
                                    loading={boostsLoading}
                                />
                            );
                        }

                        if (isID || isMembership) {
                            return (
                                <div className="mt-6" key={record?.uri || index}>
                                    <BoostManagedIDCard
                                        boost={record}
                                        defaultImg={imgSrc}
                                        categoryType={record?.category}
                                        userToBoostProfileId={otherUserProfileId}
                                        loading={boostsLoading}
                                    />
                                </div>
                            );
                        }

                        return (
                            <BoostManagedCard
                                key={record?.uri || index}
                                boost={record}
                                defaultImg={imgSrc}
                                categoryType={record?.category}
                                sizeLg={6}
                                sizeMd={6}
                                sizeSm={6}
                                userToBoostProfileId={otherUserProfileId}
                                loading={boostsLoading}
                            />
                        );
                    })
            ) ?? [];
    }

    const subCategoryTypes = getLearnCardBoostTemplates(selectedCategory);
    const filteredTemplates = searchTemplates(subCategoryTypes, debouncedSearchInput);

    const boostTemplates = filteredTemplates.map((subCategoryType, index) => {
        if (isListView) {
            return (
                <LearnCardTemplateListItem
                    key={index}
                    categoryType={subCategoryType.category}
                    subType={subCategoryType.type}
                    userToBoostProfileId={otherUserProfileId}
                />
            );
        } else {
            return (
                <LearnCardTemplateCard
                    key={index}
                    defaultImg={imgSrc}
                    categoryType={subCategoryType.category}
                    subType={subCategoryType.type}
                    userToBoostProfileId={otherUserProfileId}
                    sizeLg={6}
                    sizeMd={6}
                    sizeSm={6}
                />
            );
        }
    });

    if (
        filterBy === BoostTemplateFilterOptionsEnum.learnCardTemplates ||
        filterBy === BoostTemplateFilterOptionsEnum.showAll
    ) {
        boostsList.push(...boostTemplates);
    }

    const boostsExist = boostsList?.length > 0;

    return (
        <section className="flex-1 p-[20px] pt-[5px] max-w-[600px] w-full mx-auto z-0 overflow-y-auto">
            <div className="flex flex-col gap-[20px] h-full">
                <BoostTemplateTabs activeTab={activeTab} handleTabSwitch={handleTabSwitch} />
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] relative">
                        <div className="flex-1 relative mr-2">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                                <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                            </div>
                            <IonInput
                                type="text"
                                value={searchInput}
                                placeholder="Browse templates..."
                                onIonInput={e => setSearchInput(e.detail.value)}
                                className="bg-white text-grayscale-800 rounded-[15px] !p-[5px] !font-notoSans text-[17px] !pl-[48px]"
                            />
                        </div>
                    </div>
                </div>

                <IonGrid
                    className={`flex-1 pb-[160px] ${isListView ? 'p-0 w-full' : 'max-w-[400px]'}`}
                >
                    {!boostsLoading && boostsList?.length === 0 && (
                        <div className="flex flex-col w-full h-full items-center justify-center">
                            <p className="mt-2 font-poppins text-xl text-grayscale-900">
                                {searchInput ? 'No results found' : 'No Boosts yet!'}
                            </p>
                        </div>
                    )}
                    {!boostsLoading && boostsExist && (
                        <>
                            {isListView ? (
                                <div className="flex flex-col gap-[10px] w-full">{boostsList}</div>
                            ) : (
                                <IonRow className="w-full">{boostsList}</IonRow>
                            )}
                        </>
                    )}
                    {(boostsLoading || boostsIsFetchingNextPage) && (
                        <div className="w-full">
                            {isListView ? (
                                <div className="flex flex-col gap-[10px] w-full">
                                    {[...Array(8)].map((_, index) => (
                                        <BoostTemplateListItem
                                            key={index}
                                            loading
                                            boost={{} as any}
                                            defaultImg=""
                                            categoryType={CredentialCategoryEnum.achievement}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <IonRow className="w-full">
                                    {[...Array(8)].map((_, index) => (
                                        <BoostManagedCard
                                            key={index}
                                            loading
                                            sizeLg={6}
                                            sizeMd={6}
                                            sizeSm={6}
                                            boost={{} as any}
                                            defaultImg=""
                                            categoryType={CredentialCategoryEnum.achievement}
                                        />
                                    ))}
                                </IonRow>
                            )}
                        </div>
                    )}
                    <div role="presentation" ref={boostInfiniteScrollRef} />
                </IonGrid>
            </div>
        </section>
    );
};

export default BoostTemplateSelectorBody;
