import React, { useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { addOutline, trashOutline, linkOutline, alertCircleOutline } from 'ionicons/icons';
import { Award, Info } from 'lucide-react';

import useDeveloperPortal from '../useDeveloperPortal';

interface BoostEntry {
    boostUri: string;
    templateAlias: string;
}

interface CredentialsStepProps {
    listingId: string | null;
    pendingBoosts: BoostEntry[];
    onPendingBoostsChange: (boosts: BoostEntry[]) => void;
}

export const CredentialsStep: React.FC<CredentialsStepProps> = ({
    listingId,
    pendingBoosts,
    onPendingBoostsChange,
}) => {
    const { useListingBoosts, useAddBoostToListing, useRemoveBoostFromListing } =
        useDeveloperPortal();

    const { data: existingBoosts, isLoading } = useListingBoosts(listingId);
    const addBoostMutation = useAddBoostToListing();
    const removeBoostMutation = useRemoveBoostFromListing();

    const [showAddForm, setShowAddForm] = useState(false);
    const [boostUri, setBoostUri] = useState('');
    const [templateAlias, setTemplateAlias] = useState('');
    const [error, setError] = useState('');

    const handleAddBoost = async () => {
        if (!boostUri.trim() || !templateAlias.trim()) {
            setError('Both Boost URI and Template Alias are required');
            return;
        }

        if (!/^[a-z0-9-]+$/.test(templateAlias)) {
            setError('Template Alias must be lowercase alphanumeric with hyphens only');
            return;
        }

        // Check for duplicates
        const allAliases = [
            ...(existingBoosts?.map(b => b.templateAlias) || []),
            ...pendingBoosts.map(b => b.templateAlias),
        ];

        if (allAliases.includes(templateAlias.trim())) {
            setError('A boost with this alias already exists');
            return;
        }

        if (listingId) {
            // Listing exists - add directly
            try {
                await addBoostMutation.mutateAsync({
                    listingId,
                    boostUri: boostUri.trim(),
                    templateAlias: templateAlias.trim(),
                });

                setBoostUri('');
                setTemplateAlias('');
                setShowAddForm(false);
                setError('');
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to add boost');
            }
        } else {
            // No listing yet - add to pending
            onPendingBoostsChange([
                ...pendingBoosts,
                { boostUri: boostUri.trim(), templateAlias: templateAlias.trim() },
            ]);

            setBoostUri('');
            setTemplateAlias('');
            setShowAddForm(false);
            setError('');
        }
    };

    const handleRemoveBoost = async (aliasToRemove: string, isPending: boolean) => {
        if (isPending) {
            onPendingBoostsChange(pendingBoosts.filter(b => b.templateAlias !== aliasToRemove));
        } else if (listingId) {
            try {
                await removeBoostMutation.mutateAsync({ listingId, templateAlias: aliasToRemove });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to remove boost');
            }
        }
    };

    const allBoosts = [
        ...(existingBoosts?.map(b => ({ ...b, isPending: false })) || []),
        ...pendingBoosts.map(b => ({ ...b, isPending: true })),
    ];

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Credentials</h2>

                <p className="text-sm text-gray-500 mt-1">
                    Configure credential boosts that your app can issue to users.
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">How Credential Boosts Work</p>

                    <p>
                        Attach boosts to your app to enable credential issuance via the Partner
                        Connect SDK. When users interact with your app, you can issue credentials
                        based on these boost templates.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <IonIcon icon={alertCircleOutline} className="w-4 h-4" />
                    {error}
                </div>
            )}

            {isLoading && listingId ? (
                <div className="flex items-center justify-center p-8">
                    <IonSpinner name="crescent" />
                </div>
            ) : (
                <>
                    {allBoosts.length === 0 && !showAddForm ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />

                            <p className="text-gray-500 mb-4">
                                No credential boosts configured yet.
                            </p>

                            <button
                                onClick={() => setShowAddForm(true)}
                                className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
                            >
                                Add Your First Boost
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allBoosts.map(boost => (
                                <div
                                    key={boost.templateAlias}
                                    className={`flex items-center justify-between p-4 rounded-xl border ${
                                        boost.isPending
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <Award className="w-5 h-5 text-indigo-600" />
                                        </div>

                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {boost.templateAlias}
                                            </p>

                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <IonIcon icon={linkOutline} className="w-3 h-3" />
                                                {boost.boostUri.length > 50
                                                    ? `${boost.boostUri.slice(0, 50)}...`
                                                    : boost.boostUri}
                                            </p>

                                            {boost.isPending && (
                                                <span className="text-xs text-amber-600 font-medium">
                                                    Will be added when listing is saved
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            handleRemoveBoost(boost.templateAlias, boost.isPending)
                                        }
                                        disabled={removeBoostMutation.isPending}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <IonIcon icon={trashOutline} className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}

                            {!showAddForm && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
                                >
                                    <IonIcon icon={addOutline} className="w-5 h-5" />
                                    Add Another Boost
                                </button>
                            )}
                        </div>
                    )}

                    {showAddForm && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Boost URI
                                </label>

                                <input
                                    type="text"
                                    value={boostUri}
                                    onChange={e => setBoostUri(e.target.value)}
                                    placeholder="lc:network:boost:..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />

                                <p className="text-xs text-gray-400 mt-1">
                                    The URI of the boost template to use for credential issuance
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template Alias
                                </label>

                                <input
                                    type="text"
                                    value={templateAlias}
                                    onChange={e =>
                                        setTemplateAlias(
                                            e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                        )
                                    }
                                    placeholder="my-credential"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />

                                <p className="text-xs text-gray-400 mt-1">
                                    A unique alias for this template (lowercase, alphanumeric,
                                    hyphens)
                                </p>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setBoostUri('');
                                        setTemplateAlias('');
                                        setError('');
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleAddBoost}
                                    disabled={addBoostMutation.isPending}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
                                >
                                    {addBoostMutation.isPending ? 'Adding...' : 'Add Boost'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <p className="text-xs text-gray-400 text-center">
                This step is optional. You can add boosts later from your dashboard.
            </p>
        </div>
    );
};

export default CredentialsStep;
