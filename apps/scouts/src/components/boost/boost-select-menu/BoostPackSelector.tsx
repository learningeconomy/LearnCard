import React, { useMemo } from 'react';
import { IonSpinner } from '@ionic/react';
import { WorldScoutIcon } from '../../svgs/WorldScoutsIcon';
import CaretDown from 'learn-card-base/svgs/CaretDown';
import { ModalTypes, useModal, BoostCategoryOptionsEnum } from 'learn-card-base';
import { BoostPackOptionsModal } from './BoostPackOptionsModal';
import { BadgePackOption, BadgePackOptionsEnum } from './badge-pack.helper';
import { useGetCurrentUserTroopIdsResolved } from 'learn-card-base';
import { VC } from '@learncard/types';

interface BoostPackSelectorProps {
    boostPackType: BoostCategoryOptionsEnum;
    boostPackItemCount?: number;
    isLoading?: boolean;
    boostPackSelected: BadgePackOption;
    setBoostPackSelected: React.Dispatch<React.SetStateAction<BadgePackOption>>;
    showHardcodedBoostPacks?: boolean;
    showMoreOptionsCaret?: boolean;
    hideNetworkBoostPacks?: boolean;
}

interface FormattedPack {
    name?: string;
    color: string;
    type?: BadgePackOptionsEnum;
    id?: string;
}

const formatTroopDataToPack = (
    data: VC[] | undefined,
    type?: BadgePackOptionsEnum
): FormattedPack[] => {
    if (!data) return [];
    return data.map(troop => ({
        name: troop?.name || troop?.boostCredential?.name,
        color: '#4B9F5C', // Consider moving to constants
        type,
        id: troop?.boostId,
    }));
};

const BoostPackSelector: React.FC<BoostPackSelectorProps> = ({
    boostPackType,
    isLoading,
    boostPackItemCount,
    boostPackSelected,
    setBoostPackSelected,
    showHardcodedBoostPacks,
    showMoreOptionsCaret,
    hideNetworkBoostPacks,
}) => {
    const { newModal, closeModal } = useModal();
    const { data: myTroopIdData, isLoading: troopIdDataLoading } =
        useGetCurrentUserTroopIdsResolved(hideNetworkBoostPacks);

    let troopData = myTroopIdData?.scout;
    if (myTroopIdData?.isTroopLeader) {
        troopData = myTroopIdData?.troopLeader;
    }
    const [troopPacks, networkPacks] = useMemo(
        () => [
            formatTroopDataToPack(troopData, BadgePackOptionsEnum.troop),
            formatTroopDataToPack(myTroopIdData?.nationalAdmin, BadgePackOptionsEnum.network),
        ],
        [myTroopIdData]
    );

    const { boostPackTypeTitle, badgePackName, badgePackColor } = useMemo(() => {
        const baseData = {
            boostPackTypeTitle: '',
            badgePackName: 'ScoutPass',
            badgePackColor: '#248737', // Consider moving to constants
        };

        switch (boostPackSelected?.type) {
            case BadgePackOptionsEnum.network:
                return {
                    ...baseData,
                    boostPackTypeTitle: 'Network',
                    badgePackName: boostPackSelected.name,
                    badgePackColor: boostPackSelected.color,
                };

            case BadgePackOptionsEnum.troop:
                return {
                    ...baseData,
                    boostPackTypeTitle: 'Troop',
                    badgePackName: boostPackSelected.name,
                    badgePackColor: boostPackSelected.color,
                };

            default:
                return boostPackType === BoostCategoryOptionsEnum.meritBadge
                    ? {
                          ...baseData,
                          boostPackTypeTitle: 'Badge',
                          badgePackName: boostPackSelected?.name || baseData.badgePackName,
                          badgePackColor: boostPackSelected?.color || baseData.badgePackColor,
                      }
                    : {
                          ...baseData,
                          boostPackTypeTitle: 'Boost',
                      };
        }
    }, [boostPackType, boostPackSelected]);

    const handlePackSelection = () => {
        if (!showMoreOptionsCaret || troopIdDataLoading) return;

        newModal(
            <BoostPackOptionsModal
                boostPackSelected={boostPackSelected}
                setBoostPackSelected={setBoostPackSelected}
                showHardcodedBoostPacks={showHardcodedBoostPacks}
                troopPacks={troopPacks}
                networkPacks={!hideNetworkBoostPacks ? networkPacks : undefined}
                category={boostPackType}
            />,
            {},
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    return (
        <button
            onClick={handlePackSelection}
            disabled={!showMoreOptionsCaret || troopIdDataLoading}
            className="w-full flex items-center justify-between rounded-full px-2 py-2 mt-6 shadow-soft-bottom"
            aria-label={`Select ${boostPackTypeTitle} pack`}
        >
            <BoostPackListItem
                loading={troopIdDataLoading}
                badgePackColor={badgePackColor}
                title={boostPackTypeTitle}
                name={badgePackName}
                count={boostPackItemCount}
                showMoreOptionsCaret={showMoreOptionsCaret}
            />
        </button>
    );
};

interface BoostPackListItemProps {
    loading: boolean;
    badgePackColor: string;
    title: string;
    name: string;
    count?: number;
    showMoreOptionsCaret?: boolean;
}

const BoostPackListItem: React.FC<BoostPackListItemProps> = ({
    loading,
    badgePackColor,
    title,
    name,
    count,
    showMoreOptionsCaret,
}) => (
    <>
        <div className="flex items-center justify-start">
            {loading ? (
                <IonSpinner
                    name="crescent"
                    color="grayscale-900"
                    className="scale-[1]"
                    aria-label="Loading packs"
                />
            ) : (
                <WorldScoutIcon className="mr-2" fill={badgePackColor} aria-hidden="true" />
            )}
            <div className="flex flex-col items-start justify-center">
                <h3 className="font-semibold text-grayscale-900 uppercase text-xs font-notoSans">
                    {title} Pack
                </h3>
                <p className="text-[17px] font-normal font-notoSans line-clamp-1">{name}</p>
            </div>
        </div>

        <div className="flex items-center justify-center mr-2 text-grayscale-900">
            <span className="font-semibold text-[17px] font-notoSans mr-2">{count ?? '--'}</span>
            {showMoreOptionsCaret && <CaretDown aria-hidden="true" />}
        </div>
    </>
);

export default React.memo(BoostPackSelector);
