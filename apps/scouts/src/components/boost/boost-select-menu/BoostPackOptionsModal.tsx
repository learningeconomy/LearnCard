import React, { useMemo, useCallback, useState } from 'react';
import { IonCol, IonInput, IonRow } from '@ionic/react';
import { VC } from '@learncard/types';
import {
    BoostCategoryOptionsEnum,
    useModal,
    useCountFamilialBoosts,
    useGetCurrentUserTroopIds,
    useGetBoostParents,
} from 'learn-card-base';
import { pluralize } from 'learn-card-base';

import CaretLeft from '../../svgs/CaretLeft';
import WorldScoutIcon from '../../svgs/WorldScoutsIcon';
import Checkmark from '../../svgs/Checkmark';
import {
    BadgePackOption,
    badgePackOptions,
    BadgePackOptionsEnum,
    defaultBadgePacks,
    boostPackOptions,
} from './badge-pack.helper';
import { CATEGORY_TO_SUBCATEGORY_LIST } from '../boost-options/boostOptions';
import useGetTroopNetwork from '../../hooks/useGetTroopNetwork';

export const BoostPackOptionsModal: React.FC<{
    boostPackSelected: BadgePackOption;
    setBoostPackSelected: React.Dispatch<React.SetStateAction<BadgePackOption>>;
    showHardcodedBoostPacks?: boolean;
    troopPacks?: BadgePackOption[];
    networkPacks?: BadgePackOption[];
    category: BoostCategoryOptionsEnum;
}> = ({
    boostPackSelected,
    setBoostPackSelected,
    showHardcodedBoostPacks,
    troopPacks = [],
    networkPacks = [],
    category,
}) => {
    const { closeModal } = useModal();

    const [search, setSearch] = useState('');

    const handleSelectBoostPack = useCallback(
        (badgePack: BadgePackOption) => {
            setBoostPackSelected(badgePack);
            closeModal();
        },
        [setBoostPackSelected, closeModal]
    );

    const hardCodedBadgePackOptions = useMemo(
        () =>
            category === BoostCategoryOptionsEnum.socialBadge ? boostPackOptions : badgePackOptions,
        [category]
    );

    const allBadgePackOptions = useMemo(
        () =>
            showHardcodedBoostPacks
                ? [...hardCodedBadgePackOptions, ...troopPacks, ...networkPacks]
                : [...troopPacks, ...networkPacks],
        [showHardcodedBoostPacks, hardCodedBadgePackOptions, troopPacks, networkPacks]
    );

    const filteredBadgePackOptions = useMemo(
        () =>
            allBadgePackOptions.filter(boostPackItem =>
                boostPackItem.name?.toLowerCase().includes(search.toLowerCase())
            ),
        [allBadgePackOptions, search]
    );

    const hasSearchResults = search.length > 0 && filteredBadgePackOptions.length === 0;

    return (
        <div className="w-full">
            <header className="flex items-center justify-start ion-padding">
                <button
                    onClick={closeModal}
                    className="flex items-center mr-3 mt-1"
                    aria-label="Close modal"
                >
                    <CaretLeft className="text-grayscale-900 h-4 w-auto" />
                </button>
                <h1 className="text-grayscale-900 text-[22px] font-notoSans">
                    Select a Boost Pack
                </h1>
            </header>

            <div className="flex flex-col items-center justify-between w-full bg-grayscale-100 rounded-t-[20px]">
                <IonRow class="w-full ion-padding mt-2">
                    <IonCol className="flex w-full items-center justify-start px-2">
                        <IonInput
                            autocapitalize="on"
                            placeholder="Search..."
                            value={search}
                            className="bg-white text-grayscale-800 !px-4 !py-1 rounded-[15px] text-[17px] font-notoSans"
                            onIonInput={e => setSearch(e.detail.value!)}
                            type="text"
                            clearInput={true}
                        />
                    </IonCol>
                </IonRow>

                {hasSearchResults && (
                    <div className="w-full px-4 pb-4">
                        <p className="text-grayscale-700">
                            0{' '}
                            {category === BoostCategoryOptionsEnum.socialBadge ? 'Boost' : 'Badge'}{' '}
                            Packs found for <em className="font-medium not-italic">{search}</em>
                        </p>
                    </div>
                )}

                <div className="w-full px-4 pb-[20px]">
                    {(search ? filteredBadgePackOptions : allBadgePackOptions).map(
                        badgePackOption => {
                            const badgePackItemsCount =
                                category === BoostCategoryOptionsEnum.meritBadge
                                    ? defaultBadgePacks[badgePackOption.type]?.length
                                    : CATEGORY_TO_SUBCATEGORY_LIST[category]?.length ?? 0;

                            return (
                                <BoostPackOptionItem
                                    category={category}
                                    key={badgePackOption.id}
                                    badgePackOption={badgePackOption}
                                    badgePackItemsCount={badgePackItemsCount}
                                    isSelected={boostPackSelected?.id === badgePackOption.id}
                                    onSelect={() => handleSelectBoostPack(badgePackOption)}
                                />
                            );
                        }
                    )}
                </div>
            </div>
        </div>
    );
};

const BoostPackOptionItem: React.FC<{
    badgePackOption: BadgePackOption;
    badgePackItemsCount: number;
    isSelected: boolean;
    category: BoostCategoryOptionsEnum;
    onSelect: () => void;
}> = React.memo(({ badgePackOption, badgePackItemsCount, isSelected, onSelect, category }) => {
    const { name, color } = badgePackOption;

    const { data: myTroopIdData, isLoading: troopIdDataLoading } = useGetCurrentUserTroopIds();
    const childGenerations = myTroopIdData?.isScout ? 1 : 4;
    const parentGenerations = myTroopIdData?.isScout ? 2 : 4;

    const { data: troopBoostCount, isLoading } = useCountFamilialBoosts(
        badgePackOption.id,
        childGenerations,
        parentGenerations,
        {
            category,
            status: 'LIVE',
        },
        !troopIdDataLoading,
        myTroopIdData?.isScout ? true : false
    );

    const {
        data: parentBoosts,
        isLoading: parentBoostsLoading,
        error,
    } = useGetBoostParents(badgePackOption.id, 2, undefined);

    const parentName = parentBoosts?.records?.filter(r => r?.type !== 'ext:TroopID')?.[0]?.name;

    const categoryDisplayWord =
        category === BoostCategoryOptionsEnum.socialBadge ? 'Social Boost' : category;
    const countName = pluralize(categoryDisplayWord, troopBoostCount || badgePackItemsCount);
    let displayCount = !troopIdDataLoading ? troopBoostCount : '--';
    if (badgePackOption?.type !== 'network' && badgePackOption?.type !== 'troop') {
        displayCount = badgePackItemsCount;
    }

    return (
        <button
            onClick={onSelect}
            className={`w-full flex items-center justify-between rounded-full p-2 mt-4 shadow-sm hover:shadow-md transition-shadow ${
                isSelected
                    ? 'border-2 border-emerald-700 bg-emerald-50'
                    : 'bg-white border-2 border-transparent'
            }`}
            aria-pressed={isSelected}
        >
            <div className="flex items-center flex-1 min-w-0">
                <WorldScoutIcon
                    className="mr-2 shrink-0"
                    fill={color || '#64748b'}
                    aria-hidden="true"
                />
                <div className="flex flex-col min-w-0">
                    <h3 className="text-left line-clamp-1 font-semibold text-grayscale-900 uppercase text-xs font-notoSans">
                        {name} | {parentName}
                    </h3>
                    <p className="text-[17px] text-grayscale-900 font-normal truncate text-left">
                        {displayCount} {countName}
                    </p>
                </div>
            </div>

            {isSelected && (
                <div className="ml-2 shrink-0 flex items-center justify-center rounded-full bg-emerald-700 p-1">
                    <Checkmark className="text-white h-6 w-6" aria-hidden="true" />
                </div>
            )}
        </button>
    );
});
