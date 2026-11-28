import React, { useEffect, useMemo, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import BoostPackSelector from './BoostPackSelector';
import { BoostSelectMenuTabsEnum } from './NewBoostSelectMenuTabs';
import NewBoostSelectMenuBoostPackItem from './NewBoostSelectMenuBoostPackItem';
import NewBoostSelectMenuCustomTypeButton from './NewBoostSelectMenuCustomTypeButton';
import BoostManagedCard from '../boost-managed-card/BoostManagedCard';
import X from '../../svgs/X';
import { useGetPaginatedManagedBoostsQuery } from 'learn-card-base';
import { useScoutPassStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { useLoadingLine } from '../../../stores/loadingStore';
import { boostCategoryOptions, CATEGORY_TO_SUBCATEGORY_LIST } from '../boost-options/boostOptions';
import { BrandingEnum, BoostCategoryOptionsEnum } from 'learn-card-base';
import { LCNBoostStatusEnum } from '../boost';
import * as m from '../../../paraglide/messages.js';
import TransP from '../../../i18n/TransP';
import { useLocale } from '../../../i18n';
import { useLocalizedBoostFilter } from './useLocalizedBoostFilter';
import {
    BadgePackOption,
    badgePackOptions,
    BadgePackOptionsEnum,
    badgePacks,
} from './badge-pack.helper';
import { AppContent, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppInput } from 'learn-card-base/ui/controls/AppInput';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

interface NewBoostSelectMenuProps {
    handleCloseModal: () => void;
    parentUri?: string;
    useCMSModal?: boolean;
    returnToParentAfterSave?: boolean;
    category?: BoostCategoryOptionsEnum;
}

const NewBoostSelectMenu: React.FC<NewBoostSelectMenuProps> = ({
    handleCloseModal,
    category = BoostCategoryOptionsEnum.socialBadge,
    parentUri,
    useCMSModal,
    returnToParentAfterSave = false,
}) => {
    const locale = useLocale();
    const flags = useFlags();
    const { data: stylePack, isLoading: stylePackLoading } = useScoutPassStylesPackRegistry();
    const { data: myBoosts } = useGetPaginatedManagedBoostsQuery();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<BoostSelectMenuTabsEnum>(
        BoostSelectMenuTabsEnum.new
    );

    const isMeritBadge = category === BoostCategoryOptionsEnum.meritBadge;
    const { title, subTitle, color, CategoryImage } = boostCategoryOptions[category];

    // State management
    const defaultBoostPack = badgePackOptions.find(
        ({ type }) => type === BadgePackOptionsEnum.scoutpass
    ) as BadgePackOption;
    const [boostPackSelected, setBoostPackSelected] = useState<BadgePackOption>(defaultBoostPack);
    const [boostPack, setBoostPack] = useState(
        isMeritBadge ? badgePacks[defaultBoostPack.type] : CATEGORY_TO_SUBCATEGORY_LIST[category]
    );

    // Derived values
    const filteredBoostPack = useLocalizedBoostFilter(boostPack, search);

    const filteredBoosts = useMemo(() => {
        return (
            myBoosts?.pages?.flatMap(page =>
                page?.records?.filter(
                    boost =>
                        boost?.title
                            ?.toLocaleLowerCase(locale)
                            .includes(search.toLocaleLowerCase(locale)) &&
                        boost?.status === LCNBoostStatusEnum.live
                )
            ) ?? []
        );
    }, [myBoosts, search, locale]);

    // Effects
    useEffect(() => {
        if (isMeritBadge) {
            setBoostPack(badgePacks[boostPackSelected.type]);
        }
    }, [boostPackSelected, isMeritBadge]);

    useLoadingLine(stylePackLoading);

    // Render helpers
    const renderNoResults = (tabType: BoostSelectMenuTabsEnum) => {
        const isNewTab = tabType === BoostSelectMenuTabsEnum.new;
        const resultsCount = isNewTab ? filteredBoostPack?.length : filteredBoosts?.length;

        if (search && resultsCount === 0) {
            return (
                <div className="w-full flex items-center justify-start px-2 mt-2 border-b-2 border-solid border-grayscale-200 pb-2">
                    <p className="text-grayscale-700">
                        <TransP
                            m={m['boost.noResultsFoundFor']}
                            values={{ search }}
                            components={[<em key="em" className="font-medium" />]}
                        />
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderBoostItems = () => {
        if (activeTab === BoostSelectMenuTabsEnum.new) {
            return (
                <>
                    <NewBoostSelectMenuCustomTypeButton
                        category={category}
                        handleCloseModal={handleCloseModal}
                        useCMSModal={useCMSModal}
                        overrideCustomize
                        parentUri={parentUri}
                        returnToParentAfterSave={returnToParentAfterSave}
                    />

                    {(filteredBoostPack?.length > 0 ? filteredBoostPack : boostPack)?.map(item => (
                        <NewBoostSelectMenuBoostPackItem
                            key={item.title}
                            category={category}
                            parentUri={parentUri}
                            useCMSModal={useCMSModal}
                            returnToParentAfterSave={returnToParentAfterSave}
                            boostPackItem={item}
                            handleCloseModal={handleCloseModal}
                            stylePack={stylePack}
                        />
                    ))}
                </>
            );
        }

        return (
            <>
                {filteredBoosts.map((boost, index) => (
                    <BoostManagedCard
                        key={boost?.uri || index}
                        boost={boost}
                        defaultImg={CategoryImage}
                        categoryType={category}
                        loading={stylePackLoading}
                        branding={BrandingEnum.scoutPass}
                        showSelectMenuPlusButton
                        handleCloseModal={handleCloseModal}
                    />
                ))}
                {!flags.disableCmsCustomization && (
                    <NewBoostSelectMenuCustomTypeButton
                        category={category}
                        useCMSModal={useCMSModal}
                        overrideCustomize
                        parentUri={parentUri}
                        returnToParentAfterSave={returnToParentAfterSave}
                        handleCloseModal={handleCloseModal}
                    />
                )}
            </>
        );
    };

    return (
        <AppPage>
            <AppHeader className="ion-no-border ion-no-padding">
                <AppToolbar className="ion-no-border ion-no-padding">
                    <div className="w-full flex flex-col items-center justify-center ion-padding">
                        <div className="flex items-center justify-between w-full max-w-[600px]">
                            <h3 className="text-[22px] text-grayscale-900 font-notoSans">
                                {m['boost.createTitle']({ title: subTitle ?? title })}
                            </h3>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                aria-label={m['common.close']()}
                            >
                                <X className="text-grayscale-900 h-auto w-[30px]" />
                            </button>
                        </div>

                        {activeTab === BoostSelectMenuTabsEnum.new && (
                            <div className="flex items-center justify-between w-full max-w-[600px]">
                                <BoostPackSelector
                                    boostPackType={category}
                                    boostPackItemCount={boostPack?.length}
                                    boostPackSelected={boostPackSelected}
                                    setBoostPackSelected={setBoostPackSelected}
                                    showHardcodedBoostPacks
                                    showMoreOptionsCaret
                                    hideNetworkBoostPacks
                                />
                            </div>
                        )}

                        <div className="w-full max-w-[600px] mt-6">
                            <AppInput
                                value={search}
                                placeholder={m['boost.searchPlaceholder']()}
                                autocapitalize="on"
                                className="bg-grayscale-100 text-grayscale-800 px-4! py-1! rounded-[15px] text-[17px] font-notoSans"
                                onValueInput={value => setSearch(value?.trim() || '')}
                                clearInput
                            />
                        </div>
                    </div>
                </AppToolbar>
            </AppHeader>

            <AppContent color="grayscale-100" fullscreen>
                <AppCol className="flex m-auto items-center flex-wrap w-full achievements-list-container">
                    <AppGrid className="max-w-[600px]">
                        {renderNoResults(activeTab)}
                        <AppRow>{renderBoostItems()}</AppRow>
                    </AppGrid>
                </AppCol>
            </AppContent>
        </AppPage>
    );
};

export default NewBoostSelectMenu;
