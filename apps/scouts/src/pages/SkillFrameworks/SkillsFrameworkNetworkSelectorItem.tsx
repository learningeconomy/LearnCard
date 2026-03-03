import React from 'react';
import { NetworkData } from './SkillsFrameworkNetworkSelector';
import { insertParamsToFilestackUrl, useResolveBoost } from 'learn-card-base';
import { getDefaultBadgeThumbForRole } from '../../helpers/troop.helpers';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import Checkmark from 'learn-card-base/svgs/Checkmark';

type SkillsFrameworkNetworkSelectorItemProps = {
    network: NetworkData;
    isSelected: boolean;
    handleToggleNetwork: (uri: string) => void;
};

const SkillsFrameworkNetworkSelectorItem: React.FC<SkillsFrameworkNetworkSelectorItemProps> = ({
    network,
    isSelected,
    handleToggleNetwork,
}) => {
    const { data: boost } = useResolveBoost(network.uri);

    const image = boost?.image ?? network?.image;

    const thumbnailUrl = image
        ? insertParamsToFilestackUrl(image, 'resize=width:100/quality=value:75/')
        : undefined;

    return (
        <button
            key={network.uri}
            onClick={() => handleToggleNetwork(network.uri)}
            className="flex gap-[10px] items-center px-[10px] h-[60px]"
        >
            {thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt={network.name}
                    className="w-[40px] h-[40px] rounded-full object-cover"
                />
            ) : (
                getDefaultBadgeThumbForRole(
                    network.type === 'Global Network'
                        ? ScoutsRoleEnum.global
                        : ScoutsRoleEnum.national
                )
            )}
            <div className="flex flex-col items-start flex-1">
                <p className="text-grayscale-900 font-poppins text-[17px]">{network.name}</p>
                <p className="text-grayscale-600 font-poppins text-[12px]">{network.type}</p>
            </div>
            {isSelected ? (
                <div className="w-[40px] h-[40px] rounded-full bg-emerald-700 flex items-center justify-center">
                    <Checkmark className="w-[30px] h-[30px] text-white mt-[4px]" />
                </div>
            ) : (
                <div className="w-[40px] h-[40px] rounded-full bg-grayscale-300" />
            )}
        </button>
    );
};

export default SkillsFrameworkNetworkSelectorItem;
