import React, { useState, useEffect } from 'react';
import { useWallet } from 'learn-card-base';
import { IonSpinner, useIonToast } from '@ionic/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Plus from 'apps/scouts/src/components/svgs/Plus';
// import TrashIcon from 'learn-card-base/svgs/TrashIcon';
import Pencil from 'apps/scouts/src/components/svgs/Pencil';

type SkillFramework = {
    id: string;
    name: string;
    description?: string;
    sourceURI?: string;
    status?: 'active' | 'archived';
};

type Network = {
    uri: string;
    name: string;
    category?: string;
};

/**
 * Full CRUD interface for Skill Frameworks
 * Includes network attachment capabilities
 */
export const FrameworkCRUD: React.FC = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const [presentToast] = useIonToast();

    const [selectedFramework, setSelectedFramework] = useState<SkillFramework | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showNetworkAttach, setShowNetworkAttach] = useState(false);

    // Load frameworks
    const { data: frameworks, isLoading: loadingFrameworks } = useQuery({
        queryKey: ['skillFrameworks'],
        queryFn: async () => {
            const wallet = await initWallet();
            return await wallet.invoke.listMySkillFrameworks();
        },
    });

    // Load my networks (boosts that could have frameworks)
    const { data: networks, isLoading: loadingNetworks } = useQuery({
        queryKey: ['myNetworks'],
        queryFn: async () => {
            const wallet = await initWallet();
            const boosts = await wallet.invoke.getPaginatedBoosts({ limit: 100 });
            // Filter for membership/ID boosts (networks)
            return boosts.records.filter((b: any) => 
                b.category === 'membership' || b.category === 'id'
            );
        },
    });

    // Create framework mutation
    const createFrameworkMutation = useMutation({
        mutationFn: async (data: { name: string; description: string }) => {
            const wallet = await initWallet();
            const frameworkId = `fw-${Date.now()}`;
            
            await wallet.invoke.createManagedSkillFrameworks({
                frameworks: [{
                    id: frameworkId,
                    name: data.name,
                    description: data.description,
                    sourceURI: 'internal://scouts-admin',
                    status: 'active' as const,
                    skills: [], // Start with empty, add skills later
                }],
            });
            
            return frameworkId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skillFrameworks'] });
            presentToast({
                message: 'Framework created successfully!',
                duration: 2000,
                color: 'success',
            });
            setShowCreateForm(false);
        },
        onError: (error: any) => {
            presentToast({
                message: `Error: ${error.message}`,
                duration: 3000,
                color: 'danger',
            });
        },
    });

    // Attach framework to network
    const attachToNetworkMutation = useMutation({
        mutationFn: async ({ frameworkId, networkUri }: { frameworkId: string; networkUri: string }) => {
            const wallet = await initWallet();
            return await wallet.invoke.attachFrameworkToBoost(networkUri, frameworkId);
        },
        onSuccess: () => {
            presentToast({
                message: 'Framework attached to network!',
                duration: 2000,
                color: 'success',
            });
        },
        onError: (error: any) => {
            presentToast({
                message: `Error: ${error.message}`,
                duration: 3000,
                color: 'danger',
            });
        },
    });

    // Get frameworks attached to a network
    const getNetworkFrameworks = async (networkUri: string) => {
        const wallet = await initWallet();
        return await wallet.invoke.getBoostFrameworks(networkUri);
    };

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-grayscale-900">Skill Frameworks</h2>
                    <p className="text-sm text-grayscale-600">
                        Manage frameworks and attach them to networks
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-indigo-600"
                >
                    <Plus className="w-5 h-5" />
                    Create Framework
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-indigo-500">
                    <h3 className="text-lg font-bold mb-4">Create New Framework</h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createFrameworkMutation.mutate({
                                name: formData.get('name') as string,
                                description: formData.get('description') as string,
                            });
                        }}
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-grayscale-700 mb-1">
                                    Framework Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-3 py-2 border border-grayscale-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Scouts Core Skills"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-grayscale-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-grayscale-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Describe this framework..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={createFrameworkMutation.isPending}
                                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:bg-grayscale-400"
                                >
                                    {createFrameworkMutation.isPending ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="bg-grayscale-200 text-grayscale-700 px-4 py-2 rounded-lg hover:bg-grayscale-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Loading State */}
            {loadingFrameworks && (
                <div className="flex items-center justify-center py-8">
                    <IonSpinner name="crescent" />
                </div>
            )}

            {/* Frameworks List */}
            {!loadingFrameworks && frameworks && (
                <div className="space-y-4">
                    {frameworks.length === 0 ? (
                        <div className="bg-grayscale-100 p-8 rounded-lg text-center">
                            <p className="text-grayscale-600">
                                No frameworks yet. Create one to get started!
                            </p>
                        </div>
                    ) : (
                        frameworks.map((framework) => (
                            <div
                                key={framework.id}
                                className="bg-white p-6 rounded-lg shadow border border-grayscale-200"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-grayscale-900">
                                            {framework.name}
                                        </h3>
                                        {framework.description && (
                                            <p className="text-sm text-grayscale-600 mt-1">
                                                {framework.description}
                                            </p>
                                        )}
                                        <p className="text-xs text-grayscale-500 mt-2">
                                            ID: {framework.id}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedFramework(framework);
                                                setShowNetworkAttach(true);
                                            }}
                                            className="bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-600"
                                        >
                                            Attach to Network
                                        </button>
                                        <button
                                            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                                            title="Edit Skills"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm"
                                            title="Delete Framework"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Network Attachment Modal */}
            {showNetworkAttach && selectedFramework && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">
                            Attach "{selectedFramework.name}" to Network
                        </h3>
                        
                        {loadingNetworks ? (
                            <div className="flex justify-center py-4">
                                <IonSpinner name="crescent" />
                            </div>
                        ) : networks && networks.length > 0 ? (
                            <div className="space-y-2">
                                {networks.map((network) => (
                                    <button
                                        key={network.uri}
                                        onClick={() => {
                                            attachToNetworkMutation.mutate({
                                                frameworkId: selectedFramework.id,
                                                networkUri: network.uri,
                                            });
                                            setShowNetworkAttach(false);
                                            setSelectedFramework(null);
                                        }}
                                        disabled={attachToNetworkMutation.isPending}
                                        className="w-full text-left p-3 border border-grayscale-300 rounded-lg hover:bg-grayscale-50 disabled:opacity-50"
                                    >
                                        <div className="font-medium text-grayscale-900">
                                            {network.name}
                                        </div>
                                        <div className="text-xs text-grayscale-600">
                                            {network.category}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-grayscale-600 text-center py-4">
                                No networks found. Create a network (membership/ID boost) first.
                            </p>
                        )}
                        
                        <button
                            onClick={() => {
                                setShowNetworkAttach(false);
                                setSelectedFramework(null);
                            }}
                            className="mt-4 w-full bg-grayscale-200 text-grayscale-700 px-4 py-2 rounded-lg hover:bg-grayscale-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FrameworkCRUD;
