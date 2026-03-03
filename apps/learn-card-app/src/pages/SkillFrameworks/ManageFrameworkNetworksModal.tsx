import React, { useState, useMemo } from 'react';
import {
    useModal,
    useGetCurrentUserTroopIdsResolved,
    useGetMultipleBoosts,
    useWallet,
} from 'learn-card-base';
import { IonSpinner } from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SkillFrameworkType } from '@learncard/types';
import CaretDown from 'apps/learn-card-app/src/components/svgs/CaretDown';
// import ScoutsTroopIcon from 'apps/learn-card-app/src/assets/icons/ScoutsTroopIcon';
import { insertParamsToFilestackUrl } from 'learn-card-base';

type ManageFrameworkNetworksModalProps = {
    frameworkId: string;
};

type NetworkData = {
    uri: string;
    name: string;
    image?: string;
    type: string;
};

const ManageFrameworkNetworksModal: React.FC<ManageFrameworkNetworksModalProps> = ({
    frameworkId,
}) => {
    const { closeModal } = useModal();
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    // Get user's troop IDs - these are the credentials
    const { data: troopIds, isLoading: isLoadingCredentials } = useGetCurrentUserTroopIdsResolved();

    // Fetch framework to get current network attachments
    // Note: We'll need a separate call to get attached boosts since framework doesn't include them
    const { data: frameworkData, isLoading: isLoadingFramework } = useQuery({
        queryKey: ['skillFramework', frameworkId],
        queryFn: async () => {
            const wallet = await initWallet();
            return await wallet.invoke.getSkillFrameworkById(frameworkId);
        },
    });

    const [selected, setSelected] = useState<string[]>([]);

    // TODO: Add a call to get attached boosts for this framework to pre-select them
    // For now, starting with empty selection

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
                name: boost.name || (credType === 'global' ? 'Global Network' : 'Regional Network'),
                image: (boost.meta as any)?.image,
                type: credType === 'global' ? 'Global Network' : 'Regional Network',
            });
        });

        return resolvedNetworks;
    }, [boostQueries, networkBoostIds]);

    // Update framework mutation
    const updateNetworksMutation = useMutation({
        mutationFn: async (boostUris: string[]) => {
            const wallet = await initWallet();
            return await wallet.invoke.updateSkillFramework({
                id: frameworkId,
                boostUris,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skillFrameworks'] });
            queryClient.invalidateQueries({ queryKey: ['skillFramework', frameworkId] });
            closeModal();
        },
        onError: error => {
            console.error('Failed to update networks:', error);
            alert('Failed to update networks. Please try again.');
        },
    });

    const handleToggleNetwork = (uri: string) => {
        setSelected(prev => (prev.includes(uri) ? prev.filter(u => u !== uri) : [...prev, uri]));
    };

    const handleSave = () => {
        updateNetworksMutation.mutate(selected);
    };

    const isLoading =
        isLoadingCredentials || isLoadingFramework || boostQueries.some(q => q.isLoading);

    return (
        <section className="bg-grayscale-100 rounded-[20px] flex flex-col max-w-[600px]">
            <div className="py-[10px] pl-[10px] pr-[20px] flex gap-[10px] items-center shadow-bottom-1-5">
                {/* <ScoutsTroopIcon className="w-[65px] h-[65px]" /> */}
                <p className="text-grayscale-800 font-poppins text-[20px] leading-[130%] tracking-[-0.25px]">
                    Manage Networks
                </p>
                <CaretDown className="ml-auto text-grayscale-800" />
            </div>

            <div className="grow p-[15px] min-h-[300px] max-h-[500px] overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <IonSpinner name="crescent" />
                    </div>
                ) : networks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-[20px]">
                        <p className="text-grayscale-600 font-poppins text-[16px]">
                            No networks found. Create a Global or Regional network first from the
                            Membership page.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-[10px]">
                        {networks.map(network => {
                            const isSelected = selected.includes(network.uri);
                            const thumbnailUrl = network.image
                                ? insertParamsToFilestackUrl(
                                      network.image,
                                      'resize=width:100/quality=value:75/'
                                  )
                                : undefined;

                            return (
                                <button
                                    key={network.uri}
                                    onClick={() => handleToggleNetwork(network.uri)}
                                    className={`flex gap-[10px] items-center p-[10px] rounded-[10px] border-2 transition-all ${
                                        isSelected
                                            ? 'border-emerald-700 bg-emerald-50'
                                            : 'border-grayscale-300 bg-white hover:bg-grayscale-50'
                                    }`}
                                >
                                    {thumbnailUrl ? (
                                        <img
                                            src={thumbnailUrl}
                                            alt={network.name}
                                            className="w-[50px] h-[50px] rounded-[8px] object-cover"
                                        />
                                    ) : (
                                        <div className="w-[50px] h-[50px] rounded-[8px] bg-grayscale-200 flex items-center justify-center">
                                            <ScoutsTroopIcon className="w-[30px] h-[30px]" />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-start flex-1">
                                        <p className="text-grayscale-900 font-poppins text-[16px] font-[600]">
                                            {network.name}
                                        </p>
                                        <p className="text-grayscale-600 font-poppins text-[14px]">
                                            {network.type}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <div className="w-[24px] h-[24px] rounded-full bg-emerald-700 flex items-center justify-center">
                                            <svg
                                                className="w-[16px] h-[16px] text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={3}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white p-[15px] flex gap-[10px] items-center">
                <button
                    onClick={closeModal}
                    className="bg-white text-grayscale-900 px-[20px] py-[7px] rounded-[30px] text-[17px] font-poppins flex-1 shadow-button-bottom"
                >
                    Close
                </button>
                <button
                    onClick={handleSave}
                    disabled={updateNetworksMutation.isPending}
                    className="bg-emerald-700 text-white px-[20px] py-[7px] rounded-[30px] text-[17px] font-poppins flex-1 font-[600] leading-[130%] tracking-[-0.25px] shadow-button-bottom disabled:bg-grayscale-600"
                >
                    {updateNetworksMutation.isPending ? 'Saving...' : `Save (${selected.length})`}
                </button>
            </div>
        </section>
    );
};

export default ManageFrameworkNetworksModal;
