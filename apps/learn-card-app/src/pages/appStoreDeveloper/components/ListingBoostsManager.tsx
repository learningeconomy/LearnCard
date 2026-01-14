import React, { useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { addOutline, trashOutline, linkOutline } from 'ionicons/icons';

import useDeveloperPortal from '../useDeveloperPortal';

interface ListingBoostsManagerProps {
    listingId: string;
}

export const ListingBoostsManager: React.FC<ListingBoostsManagerProps> = ({ listingId }) => {
    const { useListingBoosts, useAddBoostToListing, useRemoveBoostFromListing } =
        useDeveloperPortal();

    const { data: boosts, isLoading } = useListingBoosts(listingId);
    const addBoostMutation = useAddBoostToListing();
    const removeBoostMutation = useRemoveBoostFromListing();

    const [showAddForm, setShowAddForm] = useState(false);
    const [boostUri, setBoostUri] = useState('');
    const [boostId, setBoostId] = useState('');
    const [error, setError] = useState('');

    const handleAddBoost = async () => {
        if (!boostUri.trim() || !boostId.trim()) {
            setError('Both Boost URI and Boost ID are required');
            return;
        }

        // Validate boostId format
        if (!/^[a-z0-9-]+$/.test(boostId)) {
            setError('Boost ID must be lowercase alphanumeric with hyphens only');
            return;
        }

        try {
            await addBoostMutation.mutateAsync({
                listingId,
                boostUri: boostUri.trim(),
                boostId: boostId.trim(),
            });

            setBoostUri('');
            setBoostId('');
            setShowAddForm(false);
            setError('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add boost');
        }
    };

    const handleRemoveBoost = async (boostIdToRemove: string) => {
        if (!confirm(`Remove boost "${boostIdToRemove}" from this app?`)) return;

        try {
            await removeBoostMutation.mutateAsync({ listingId, boostId: boostIdToRemove });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to remove boost');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <IonSpinner name="crescent" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Credential Boosts</h3>

                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                    <IonIcon icon={addOutline} className="w-4 h-4" />
                    Add Boost
                </button>
            </div>

            <p className="text-sm text-gray-500">
                Attach boosts to this app to enable credential issuance via the Partner Connect SDK.
            </p>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Boost URI
                        </label>

                        <input
                            type="text"
                            value={boostUri}
                            onChange={e => setBoostUri(e.target.value)}
                            placeholder="lc:network:localhost:4000:boost:abc123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />

                        <p className="mt-1 text-xs text-gray-500">
                            The full URI of the boost template
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Boost ID
                        </label>

                        <input
                            type="text"
                            value={boostId}
                            onChange={e =>
                                setBoostId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                            }
                            placeholder="achievement-badge"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />

                        <p className="mt-1 text-xs text-gray-500">
                            A short identifier for this boost (lowercase, alphanumeric, hyphens)
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleAddBoost}
                            disabled={addBoostMutation.isPending}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {addBoostMutation.isPending ? 'Adding...' : 'Add Boost'}
                        </button>

                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setError('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {boosts && boosts.length > 0 ? (
                <div className="space-y-2">
                    {boosts.map(boost => (
                        <div
                            key={boost.boostId}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <IonIcon
                                        icon={linkOutline}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                </div>

                                <div>
                                    <p className="font-medium text-gray-900">{boost.boostId}</p>

                                    <p className="text-xs text-gray-500 truncate max-w-xs">
                                        {boost.boostUri}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRemoveBoost(boost.boostId)}
                                disabled={removeBoostMutation.isPending}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Remove boost"
                            >
                                <IonIcon icon={trashOutline} className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">No boosts attached to this app yet.</p>

                    <p className="text-xs text-gray-400 mt-1">
                        Add a boost to enable credential issuance from your app.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ListingBoostsManager;
