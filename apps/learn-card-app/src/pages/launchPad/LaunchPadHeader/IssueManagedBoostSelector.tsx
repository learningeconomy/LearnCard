import React, { useState, useRef, useEffect } from 'react';
import {
    useModal,
    useGetPaginatedManagedBoostsQuery,
    searchManagedBoostsFromCache,
    boostCategoryMetadata,
    walletSubtypeToDefaultImageSrc,
    BoostCategoryOptionsEnum,
    categoryMetadata,
    ModalTypes,
} from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import X from 'learn-card-base/svgs/X';
import Search from 'learn-card-base/svgs/Search';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import { IonInput, IonSpinner } from '@ionic/react';
import BoostTemplateListItem from '../../../components/boost/boost-template/BoostTemplateListItem';

const ALLOWED_CATEGORIES = [
    BoostCategoryOptionsEnum.socialBadge,
    BoostCategoryOptionsEnum.achievement,
    BoostCategoryOptionsEnum.id,
    BoostCategoryOptionsEnum.workHistory,
    BoostCategoryOptionsEnum.course,
    BoostCategoryOptionsEnum.learningHistory,
    BoostCategoryOptionsEnum.family,
    BoostCategoryOptionsEnum.accomplishment,
    BoostCategoryOptionsEnum.accommodation,
];

const CategorySelectorModal: React.FC<{
    selectedCategory: BoostCategoryOptionsEnum;
    onSelect: (category: BoostCategoryOptionsEnum) => void;
}> = ({ selectedCategory, onSelect }) => {
    const { closeModal } = useModal();

    return (
        <div className="flex flex-col w-full h-full bg-white p-5">
            <div className="flex justify-between items-center mb-4 border-b border-grayscale-200 pb-4">
                <h2 className="text-[22px] font-poppins font-semibold text-grayscale-900">
                    Select Category
                </h2>
                <button
                    onClick={closeModal}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-grayscale-100 transition-colors"
                >
                    <X className="w-5 h-5 text-grayscale-900" />
                </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
                {ALLOWED_CATEGORIES.map(category => {
                    const meta = boostCategoryMetadata[category];
                    const isSelected = selectedCategory === category;
                    const Icon = meta.IconComponent;
                    return (
                        <button
                            key={category}
                            onClick={() => {
                                onSelect(category);
                                closeModal();
                            }}
                            className={`flex items-center gap-3 p-3 rounded-[12px] transition-colors ${
                                isSelected ? 'bg-grayscale-100' : 'hover:bg-grayscale-50'
                            }`}
                        >
                            <div
                                className={`p-2 rounded-full bg-${meta.color} bg-opacity-10 text-${meta.color}`}
                            >
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className="font-poppins font-medium text-grayscale-900 text-lg">
                                {meta.title}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const IssueManagedBoostSelector: React.FC = () => {
    const { closeModal, newModal } = useModal();
    const [selectedCategory, setSelectedCategory] = useState<BoostCategoryOptionsEnum>(
        BoostCategoryOptionsEnum.socialBadge
    );

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearchInput, setDebouncedSearchInput] = useState('');

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchInput(searchInput);
        }, 300);
        return () => clearTimeout(timerId);
    }, [searchInput]);

    const {
        data: boosts,
        isLoading: boostsLoading,
        hasNextPage: boostsHasNextPage,
        fetchNextPage: boostsFetchNextPage,
        isFetchingNextPage: boostsIsFetchingNextPage,
    } = useGetPaginatedManagedBoostsQuery({ category: selectedCategory }, { limit: 12 });

    const boostInfiniteScrollRef = useRef<HTMLDivElement>(null);
    const boostsOnScreen = useOnScreen(boostInfiniteScrollRef as any, '200px', [
        boosts?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (boostsOnScreen && boostsHasNextPage) boostsFetchNextPage();
    }, [boostsFetchNextPage, boostsHasNextPage, boostsOnScreen]);

    const searchResults = searchManagedBoostsFromCache(boosts, debouncedSearchInput);
    const searchResultsUris = searchResults?.map(r => r.uri);

    const currentWalletSubtype =
        categoryMetadata[boostCategoryMetadata[selectedCategory].credentialType].walletSubtype;
    const imgSrc = walletSubtypeToDefaultImageSrc(currentWalletSubtype);

    const categoryMeta = boostCategoryMetadata[selectedCategory];

    const openCategorySelector = () => {
        newModal(
            <CategorySelectorModal
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
        );
    };

    const displayBoosts =
        boosts?.pages?.flatMap(page =>
            page?.records
                ?.filter(record => !debouncedSearchInput || searchResultsUris?.includes(record.uri))
                .map((record, index) => (
                    <BoostTemplateListItem
                        key={record.uri || index}
                        boost={record}
                        defaultImg={imgSrc}
                        categoryType={record.category}
                        loading={boostsLoading}
                    />
                ))
        ) ?? [];

    return (
        <div className="relative w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="flex flex-col p-5 border-b border-grayscale-200 bg-white z-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[22px] font-poppins font-semibold text-grayscale-900">
                        Issue Credential
                    </h2>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-grayscale-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-grayscale-900" />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={openCategorySelector}
                        className="flex items-center justify-between w-full p-3 rounded-[15px] border border-grayscale-200 bg-grayscale-50"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-${categoryMeta.color} font-medium text-lg`}>
                                {categoryMeta.title}
                            </span>
                        </div>
                        <CaretDown className="w-4 h-4 text-grayscale-600" />
                    </button>

                    <div className="relative w-full">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                            <Search className="text-grayscale-500 w-[20px] h-[20px]" />
                        </div>
                        <IonInput
                            type="text"
                            value={searchInput}
                            placeholder="Search templates..."
                            onIonInput={e => setSearchInput(e.detail.value || '')}
                            className="bg-grayscale-50 text-grayscale-900 rounded-[15px] !p-[5px] !font-notoSans text-[16px] !pl-[44px] --padding-start=44px border border-grayscale-200"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                <div className="flex flex-col gap-3">
                    {boostsLoading && !displayBoosts.length && (
                        <div className="flex justify-center p-4">
                            <IonSpinner color="dark" />
                        </div>
                    )}

                    {!boostsLoading && displayBoosts.length === 0 && (
                        <div className="text-center text-grayscale-500 font-poppins mt-10">
                            {debouncedSearchInput ? 'No results found' : 'No templates found'}
                        </div>
                    )}

                    {displayBoosts}

                    {(boostsIsFetchingNextPage || (boostsLoading && displayBoosts.length > 0)) && (
                        <div className="flex justify-center p-4">
                            <IonSpinner color="dark" />
                        </div>
                    )}
                    <div ref={boostInfiniteScrollRef} />
                </div>
            </div>
        </div>
    );
};

export default IssueManagedBoostSelector;
