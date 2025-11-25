import React, { useEffect, useMemo, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonInput,
    IonPage,
    IonRow,
    IonToolbar,
} from '@ionic/react';
import BoostPackSelector from './BoostPackSelector';
import { BoostSelectMenuTabsEnum } from './NewBoostSelectMenuTabs';
import NewBoostSelectMenuBoostPackItem from './NewBoostSelectMenuBoostPackItem';
import NewBoostSelectMenuCustomTypeButton from './NewBoostSelectMenuCustomTypeButton';
import BoostManagedCard from '../boost-managed-card/BoostManagedCard';
import X from '../../svgs/X';
import { useGetPaginatedManagedBoostsQuery } from 'learn-card-base';
import { useScoutPassStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { useLoadingLine } from '../../../stores/loadingStore';
import {
    boostCategoryOptions,
    BoostCategoryOptionsEnum,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../boost-options/boostOptions';
import { BrandingEnum, CredentialCategory, useGetBoosts } from 'learn-card-base';
import { LCNBoostStatusEnum } from '../boost';
import {
    BadgePackOption,
    badgePackOptions,
    BadgePackOptionsEnum,
    badgePacks,
} from './badge-pack.helper';

interface NewBoostSelectMenuProps {
    handleCloseModal: () => void;
    parentUri?: string;
    useCMSModal?: boolean;
    category?: BoostCategoryOptionsEnum;
}

const NewBoostSelectMenu: React.FC<NewBoostSelectMenuProps> = ({
    handleCloseModal,
    category = BoostCategoryOptionsEnum.socialBadge,
    parentUri,
    useCMSModal,
}) => {
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
    const filteredBoostPack = useMemo(
        () => boostPack?.filter(item => item.title?.toLowerCase().includes(search.toLowerCase())),
        [boostPack, search]
    );

    const filteredBoosts = useMemo(() => {
        return (
            myBoosts?.pages?.flatMap(page =>
                page?.records?.filter(
                    boost =>
                        boost?.title?.toLowerCase().includes(search.toLowerCase()) &&
                        boost?.status === LCNBoostStatusEnum.live
                )
            ) ?? []
        );
    }, [myBoosts, search]);

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
                        0 {title}s found for <em className="font-medium">{search}</em>
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
                    />

                    {(filteredBoostPack?.length > 0 ? filteredBoostPack : boostPack)?.map(item => (
                        <NewBoostSelectMenuBoostPackItem
                            key={item.title}
                            category={category}
                            parentUri={parentUri}
                            useCMSModal={useCMSModal}
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
                        handleCloseModal={handleCloseModal}
                    />
                )}
            </>
        );
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border ion-no-padding">
                <IonToolbar className="ion-no-border ion-no-padding">
                    <div className="w-full flex flex-col items-center justify-center ion-padding">
                        <div className="flex items-center justify-between w-full max-w-[600px]">
                            <h3 className="text-[22px] text-grayscale-900 font-notoSans">
                                Create a{' '}
                                <span className={`text-${color} font-semi-bold`}>
                                    {subTitle ?? title}
                                </span>
                            </h3>
                            <button type="button" onClick={handleCloseModal} aria-label="Close">
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
                            <IonInput
                                value={search}
                                placeholder="Search..."
                                autocapitalize="on"
                                className="bg-grayscale-100 text-grayscale-800 !px-4 !py-1 rounded-[15px] text-[17px] font-notoSans"
                                onIonInput={e => setSearch(e.detail.value?.trim() || '')}
                                clearInput
                            />
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent color="grayscale-100" fullscreen>
                <IonCol className="flex m-auto items-center flex-wrap w-full achievements-list-container">
                    <IonGrid className="max-w-[600px]">
                        {renderNoResults(activeTab)}
                        <IonRow>{renderBoostItems()}</IonRow>
                    </IonGrid>
                </IonCol>
            </IonContent>
        </IonPage>
    );
};

export default NewBoostSelectMenu;
