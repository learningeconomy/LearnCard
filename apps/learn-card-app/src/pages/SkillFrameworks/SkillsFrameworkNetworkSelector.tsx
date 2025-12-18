import React, { useState, useMemo } from 'react';
import { useModal, useGetCurrentUserTroopIdsResolved, useGetMultipleBoosts } from 'learn-card-base';
import { IonSpinner } from '@ionic/react';
import SkillsFrameworkNetworkSelectorItem from './SkillsFrameworkNetworkSelectorItem';

type SkillsFrameworkNetworkSelectorProps = {
    selectedNetworks?: string[];
    onSelectNetworks?: (networks: string[]) => void;
};

export type NetworkData = {
    uri: string;
    name: string;
    image?: string;
    type: string;
};

const SkillsFrameworkNetworkSelector: React.FC<SkillsFrameworkNetworkSelectorProps> = ({
    selectedNetworks = [],
    onSelectNetworks,
}) => {
    const { closeModal } = useModal();
    const [selected, setSelected] = useState<string[]>(selectedNetworks);

    const { data: troopIds, isLoading: isLoadingCredentials } = useGetCurrentUserTroopIdsResolved();

    // Extract all network boostIds from credentials (stable array)
    const networkBoostIds = useMemo(() => {
        const ids: Array<{ boostId: string; credType: 'global' | 'national' }> = [];

        troopIds?.globalAdmin?.forEach(credential => {
            const boostId = (credential as any)?.boostId;
            if (boostId) ids.push({ boostId, credType: 'global' });
        });

        troopIds?.nationalAdmin?.forEach(credential => {
            const boostId = (credential as any)?.boostId;
            if (boostId) ids.push({ boostId, credType: 'national' });
        });

        return ids;
    }, [troopIds?.globalAdmin, troopIds?.nationalAdmin]);

    // Extract just the URIs for the query hook
    const boostUris = useMemo(
        () => networkBoostIds.map(({ boostId }) => boostId),
        [networkBoostIds]
    );

    // Fetch all boosts in parallel using useQueries
    const boostQueries = useGetMultipleBoosts(boostUris);

    // Build networks list from resolved boosts
    const networks = useMemo(() => {
        const resolvedNetworks: NetworkData[] = [];

        boostQueries.forEach((query, index) => {
            const { boostId, credType } = networkBoostIds[index];
            const boost = query.data;

            if (!boost) return;

            // Filter by boost type
            const isGlobal = boost.type === 'ext:GlobalID';
            const isNational = boost.type === 'ext:NetworkID';

            if (!isGlobal && !isNational) return;

            resolvedNetworks.push({
                uri: boostId,
                name: boost.name || (credType === 'global' ? 'Global Network' : 'National Network'),
                image: (boost.meta as any)?.image,
                type: credType === 'global' ? 'Global Network' : 'National Network',
            });
        });

        return resolvedNetworks;
    }, [boostQueries, networkBoostIds]);

    const handleToggleNetwork = (uri: string) => {
        setSelected(prev => (prev.includes(uri) ? prev.filter(u => u !== uri) : [...prev, uri]));
    };

    const handleSave = () => {
        onSelectNetworks?.(selected);
        closeModal();
    };

    const isLoading = isLoadingCredentials || boostQueries.some(q => q.isLoading);

    return (
        <section className="bg-white rounded-[20px] flex flex-col max-w-[600px] py-[">
            <h1 className="text-grayscale-800 font-poppins text-[24px] leading-[130%] pt-[20px] px-[15px]">
                Add Networks
            </h1>
            <div className="grow p-[15px] min-h-[300px] max-h-[500px] overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <IonSpinner name="crescent" />
                    </div>
                ) : networks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-[20px]">
                        <p className="text-grayscale-600 font-poppins text-[16px]">
                            No networks found. Create a Global or National network first from the
                            Troops page.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-[10px]">
                        {networks.map(network => {
                            const isSelected = selected.includes(network.uri);

                            return (
                                <SkillsFrameworkNetworkSelectorItem
                                    key={network.uri}
                                    network={network}
                                    isSelected={isSelected}
                                    handleToggleNetwork={handleToggleNetwork}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-grayscale-100 p-[15px] flex gap-[10px] items-center">
                <button
                    onClick={closeModal}
                    className="bg-white text-grayscale-900 px-[20px] py-[7px] rounded-[30px] text-[17px] font-poppins flex-1 shadow-button-bottom"
                >
                    Close
                </button>
                <button
                    onClick={handleSave}
                    className="bg-emerald-700 text-white px-[20px] py-[7px] rounded-[30px] text-[17px] font-poppins flex-1 font-[600] leading-[130%] tracking-[-0.25px] shadow-button-bottom"
                >
                    Save ({selected.length})
                </button>
            </div>
        </section>
    );
};

export default SkillsFrameworkNetworkSelector;
