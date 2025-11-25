import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import {
    useGetCurrentUserTroopIdsResolved,
    BoostPageViewMode,
    useCountFamilialBoosts,
    useModal,
    ModalTypes,
    useGetBoostPermissions,
} from 'learn-card-base';
import { useScoutPassStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { useLoadingLine } from '../../../stores/loadingStore';
import BoostPackSelector from './BoostPackSelector';
import NewBoostSelectMenuBoostPackItem from './NewBoostSelectMenuBoostPackItem';
import NewBoostSelectMenuCustomTypeButton from './NewBoostSelectMenuCustomTypeButton';
import X from '../../svgs/X';
import BoostManagedChildrenList from '../boost-managed-card/BoostManagedChildrenList';
import {
    boostCategoryOptions,
    BoostCategoryOptionsEnum,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../boost-options/boostOptions';
import { BadgePackOption, BadgePackOptionsEnum, defaultBadgePacks } from './badge-pack.helper';
import Lottie from 'react-lottie-player';
import Pulpo from '../../../assets/lotties/cuteopulpo.json';
import boostSearchStore from '../../../stores/boostSearchStore';

interface NewBoostSelectMenuProps {
    handleCloseModal: () => void;
    parentUri?: string;
    useCMSModal?: boolean;
    category?: BoostCategoryOptionsEnum;
    showHardcodedBoostPacks?: boolean;
}

const NewBoostSelectMenu: React.FC<NewBoostSelectMenuProps> = ({
    handleCloseModal,
    category = BoostCategoryOptionsEnum.socialBadge,
    parentUri,
    useCMSModal,
    showHardcodedBoostPacks,
}) => {
    const flags = useFlags();
    const [search, setSearch] = useState('');
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    // Data fetching hooks
    const {
        data: myTroopIdData,
        isLoading: troopIdDataLoading,
        error: troopIdQueryError,
        refetch,
    } = useGetCurrentUserTroopIdsResolved();

    // Hardcoded boostpack
    const {
        data: stylePack,
        isLoading: stylePackLoading,
        error: fetchPackError,
    } = useScoutPassStylesPackRegistry();

    // Derived state
    const { title, subTitle, color } = boostCategoryOptions[category];
    const [boostPackSelected, setBoostPackSelected] = useState<BadgePackOption>();
    const isLoading = stylePackLoading || troopIdDataLoading;
    const error = fetchPackError || troopIdQueryError;

    // Memoized values
    const isHardcodedPack = useMemo(
        () =>
            [BadgePackOptionsEnum.local, BadgePackOptionsEnum.scoutpass].includes(
                boostPackSelected?.type!
            ),
        [boostPackSelected?.type]
    );

    const hardcodedBoostPack = useMemo(() => {
        //if (!isHardcodedPack || !boostPackSelected) return undefined;
        return category === BoostCategoryOptionsEnum.socialBadge
            ? CATEGORY_TO_SUBCATEGORY_LIST?.[category]
            : CATEGORY_TO_SUBCATEGORY_LIST?.[BoostCategoryOptionsEnum.meritBadge].slice(-3);
    }, [isHardcodedPack, boostPackSelected, category]);

    const _parentUri = useMemo(
        () =>
            (!isHardcodedPack && boostPackSelected?.id) ||
            parentUri ||
            myTroopIdData?.troopLeader?.[0]?.boostId ||
            myTroopIdData?.scout?.[0]?.boostId ||
            myTroopIdData?.nationalAdmin?.[0]?.boostId,
        [boostPackSelected, parentUri, myTroopIdData, isHardcodedPack]
    );

    // Permissions and counts
    const { data: boostPermissionData } = useGetBoostPermissions(_parentUri);
    const canCreateNewBoost =
        boostPermissionData?.canCreateChildren && boostPermissionData?.canCreateChildren !== '';

    const childGenerations = myTroopIdData?.isScout ? 1 : 4;
    const parentGenerations = myTroopIdData?.isScout ? 2 : 4;

    const { data: troopBoostCount } = useCountFamilialBoosts(
        _parentUri,
        childGenerations,
        parentGenerations,
        { category, status: 'LIVE' },
        !troopIdDataLoading,
        !!myTroopIdData?.isScout
    );

    useLoadingLine(isLoading);

    // Auto-selection logic
    const selectFirstTroopOption = useCallback(
        (troopType: keyof typeof myTroopIdData, packType: BadgePackOptionsEnum) => {
            const troop = myTroopIdData?.[troopType]?.[0];
            if (troop?.boostCredential) {
                setBoostPackSelected({
                    name: troop.name || troop.boostCredential.name,
                    color: '#4B9F5C',
                    type: packType,
                    id: troop.boostCredential.boostId,
                });
            }
        },
        [myTroopIdData]
    );

    useEffect(() => {
        if (showHardcodedBoostPacks) {
            setBoostPackSelected({
                name: 'ScoutPass',
                color: '#4B9F5C',
                type: BadgePackOptionsEnum.scoutpass,
                id: 'scoutpass',
            });
        }

        if (!myTroopIdData) return;

        const troopTypes = [
            { type: 'troopLeader', packType: BadgePackOptionsEnum.troop },
            { type: 'scout', packType: BadgePackOptionsEnum.troop },
            { type: 'nationalAdmin', packType: BadgePackOptionsEnum.network },
        ];

        for (const { type, packType } of troopTypes) {
            if (myTroopIdData[type]?.length) {
                selectFirstTroopOption(type as keyof typeof myTroopIdData, packType);
                break;
            }
        }
    }, [myTroopIdData, selectFirstTroopOption, showHardcodedBoostPacks]);

    useEffect(() => {
        if (!boostPackSelected) return;

        if (isHardcodedPack) boostSearchStore.set.reset();
        else {
            // set this so that the boost search is limited to the appropriate scope
            const credential =
                myTroopIdData?.scout?.find(cred => cred.boostId === _parentUri) ||
                myTroopIdData?.troopLeader?.find(cred => cred.boostId === _parentUri) ||
                myTroopIdData?.nationalAdmin?.find(cred => cred.boostId === _parentUri) ||
                myTroopIdData?.globalAdmin?.find(cred => cred.boostId === _parentUri);
            boostSearchStore.set.contextCredential(credential);
        }
    }, [boostPackSelected, isHardcodedPack]);

    // Filtered boost packs
    const filteredBoostPack = useMemo(
        () =>
            hardcodedBoostPack?.filter(item =>
                item.title?.toLowerCase().includes(search.toLowerCase())
            ) ?? [],
        [hardcodedBoostPack, search]
    );

    const showNewBoostpackTypes = useMemo(
        () => showHardcodedBoostPacks && isHardcodedPack,
        [showHardcodedBoostPacks, isHardcodedPack]
    );

    const noTroopOrNetworkPacks = useMemo(
        () =>
            !boostPackSelected &&
            !troopIdDataLoading &&
            !myTroopIdData?.troopLeader?.length &&
            !myTroopIdData?.scout?.length &&
            !myTroopIdData?.nationalAdmin?.length,
        [boostPackSelected, troopIdDataLoading, myTroopIdData]
    );

    const query = canCreateNewBoost ? { category } : { category, status: 'LIVE' };

    return (
        <IonPage>
            <IonHeader className="ion-no-border ion-no-padding">
                <IonToolbar className="ion-no-border ion-no-padding">
                    <div className="w-full flex flex-col items-center justify-center ion-padding ">
                        <HeaderSection
                            title={title}
                            subTitle={subTitle}
                            color={color}
                            handleCloseModal={() => {
                                boostSearchStore.set.reset();
                                handleCloseModal();
                            }}
                        />

                        <div className=" max-w-[600px] w-full">
                            <BoostPackSelector
                                boostPackType={category}
                                boostPackItemCount={
                                    showNewBoostpackTypes
                                        ? hardcodedBoostPack?.length
                                        : troopBoostCount
                                }
                                isLoading={isLoading}
                                boostPackSelected={boostPackSelected}
                                setBoostPackSelected={setBoostPackSelected}
                                showHardcodedBoostPacks={showHardcodedBoostPacks}
                                showMoreOptionsCaret
                            />
                        </div>

                        {/* <SearchInput search={search} onSearchChange={setSearch} /> */}
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent color="grayscale-100" fullscreen>
                <IonCol className="badge-list-container !pt-[0px]">
                    <IonGrid className="max-w-[600px]">
                        {filteredBoostPack.length === 0 && search && <NoResultsMessage />}

                        {!noTroopOrNetworkPacks && !error && (
                            <IonRow>
                                {showNewBoostpackTypes && hardcodedBoostPack ? (
                                    <>
                                        {canCreateNewBoost && (
                                            <NewBoostSelectMenuCustomTypeButton
                                                category={category}
                                                handleCloseModal={handleCloseModal}
                                                useCMSModal
                                                parentUri={_parentUri}
                                            />
                                        )}
                                        {(search ? filteredBoostPack : hardcodedBoostPack)?.map(
                                            boostPackItem => (
                                                <NewBoostSelectMenuBoostPackItem
                                                    key={boostPackItem.id}
                                                    category={category}
                                                    parentUri={_parentUri}
                                                    useCMSModal={useCMSModal}
                                                    boostPackItem={boostPackItem}
                                                    handleCloseModal={handleCloseModal}
                                                    stylePack={stylePack}
                                                />
                                            )
                                        )}
                                    </>
                                ) : (
                                    !troopIdDataLoading &&
                                    boostPackSelected && (
                                        <BoostManagedChildrenList
                                            query={query}
                                            parentUri={_parentUri}
                                            handleCloseModal={handleCloseModal}
                                            childGenerations={childGenerations}
                                            parentGenerations={parentGenerations}
                                            category={category}
                                            enableCreateButton={canCreateNewBoost}
                                            viewMode={BoostPageViewMode.Card}
                                            includeExtendedFamily={myTroopIdData?.isScout}
                                        />
                                    )
                                )}
                            </IonRow>
                        )}
                        {noTroopOrNetworkPacks && !error && <EmptyState />}

                        {!troopIdDataLoading && error && (
                            <div className="text-red-600 font-medium w-full max-w-[600px] flex flex-col items-center justify-center">
                                There was an error!
                                <button
                                    onClick={() => refetch()}
                                    className="flex items-center mt-[20px] justify-center max-w-[200px] bg-sp-purple-base rounded-full w-full px-[18px] py-[12px] text-white text-[20px] font-medium"
                                >
                                    Try again
                                </button>
                            </div>
                        )}
                    </IonGrid>
                </IonCol>
            </IonContent>
        </IonPage>
    );
};

// Sub-components
const HeaderSection: React.FC<{
    title: string;
    subTitle?: string;
    color: string;
    handleCloseModal: () => void;
}> = ({ title, subTitle, color, handleCloseModal }) => (
    <div className="flex items-center justify-between w-full max-w-[600px]">
        <h3 className="text-[22px] text-grayscale-900 font-notoSans">
            Issue a{' '}
            <span style={{ color }} className="font-semi-bold">
                {subTitle ?? title}
            </span>
        </h3>
        <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Close modal"
            className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
        >
            <X className="text-grayscale-900 h-auto w-[30px]" />
        </button>
    </div>
);

const SearchInput: React.FC<{
    search: string;
    onSearchChange: (value: string) => void;
}> = ({ search, onSearchChange }) => (
    <div className="flex items-center justify-between w-full max-w-[600px]">
        <IonRow class="w-full max-w-[600px] mt-6 ion-no-padding">
            <IonCol className="flex w-full items-center justify-start ion-no-padding">
                <IonInput
                    aria-label="Search boosts"
                    autocapitalize="on"
                    placeholder="Search..."
                    value={search}
                    className="boost-search-input"
                    onIonInput={e => onSearchChange(e.detail.value || '')}
                    type="text"
                    clearInput
                />
            </IonCol>
        </IonRow>
    </div>
);

export const EmptyState: React.FC<{
    message?: string;
    refetch?: () => void;
}> = ({ message = 'No boosts yet', refetch }) => (
    <div className="flex items-center justify-center w-full max-w-[600px]">
        <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
            <div className="max-w-[300px] m-auto flex justify-center">
                <Lottie loop animationData={Pulpo} play style={{ width: '100%', height: '100%' }} />
            </div>
            <p className="font-medium">{message}</p>
        </section>
    </div>
);

export default NewBoostSelectMenu;
