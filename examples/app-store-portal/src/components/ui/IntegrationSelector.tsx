import React, { useEffect, useState } from 'react';
import { Plus, Package, ChevronDown, Loader2 } from 'lucide-react';
import { useLearnCardStore } from '../../stores/learncard';

export const IntegrationSelector: React.FC = () => {
    const {
        learnCard,
        integrations,
        selectedIntegrationId,
        isLoadingIntegrations,
        loadIntegrations,
        selectIntegration,
        createIntegration,
    } = useLearnCardStore();

    const [showDropdown, setShowDropdown] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newIntegrationName, setNewIntegrationName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (learnCard) {
            loadIntegrations();
        }
    }, [learnCard]);

    // Auto-select first integration
    useEffect(() => {
        if (integrations.length > 0 && !selectedIntegrationId) {
            selectIntegration(integrations[0].id);
        }
    }, [integrations]);

    const selectedIntegration = integrations.find(i => i.id === selectedIntegrationId);

    const handleCreate = async () => {
        if (!newIntegrationName.trim()) return;

        setIsCreating(true);
        const id = await createIntegration(newIntegrationName);

        if (id) {
            selectIntegration(id);
            setNewIntegrationName('');
            setShowCreateModal(false);
        }

        setIsCreating(false);
    };

    if (!learnCard) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white border border-apple-gray-200 rounded-apple-lg hover:border-apple-gray-300 transition-colors w-full"
            >
                <Package className="w-5 h-5 text-apple-gray-400" />

                <div className="flex-1 text-left">
                    {isLoadingIntegrations ? (
                        <span className="text-apple-gray-400">Loading...</span>
                    ) : selectedIntegration ? (
                        <span className="text-apple-gray-600 font-medium">
                            {selectedIntegration.name}
                        </span>
                    ) : (
                        <span className="text-apple-gray-400">Select integration project</span>
                    )}
                </div>

                <ChevronDown className={`w-4 h-4 text-apple-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-apple-gray-200 rounded-apple-lg shadow-apple-lg z-20 overflow-hidden animate-fade-in">
                    {integrations.map(integration => (
                        <button
                            key={integration.id}
                            onClick={() => {
                                selectIntegration(integration.id);
                                setShowDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-apple-gray-50 transition-colors ${
                                selectedIntegrationId === integration.id ? 'bg-apple-blue/5' : ''
                            }`}
                        >
                            <p className="font-medium text-apple-gray-600">{integration.name}</p>

                            <p className="text-xs text-apple-gray-400 truncate">{integration.id}</p>
                        </button>
                    ))}

                    <button
                        onClick={() => {
                            setShowDropdown(false);
                            setShowCreateModal(true);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-apple-gray-50 transition-colors border-t border-apple-gray-100 flex items-center gap-2 text-apple-blue"
                    >
                        <Plus className="w-4 h-4" />
                        Create new integration
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-apple-xl p-6 w-full max-w-md shadow-apple-xl">
                        <h3 className="text-lg font-semibold text-apple-gray-600 mb-4">
                            Create Integration
                        </h3>

                        <div className="mb-4">
                            <label className="label">Integration Name</label>

                            <input
                                type="text"
                                value={newIntegrationName}
                                onChange={e => setNewIntegrationName(e.target.value)}
                                placeholder="My App Integration"
                                className="input"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewIntegrationName('');
                                }}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleCreate}
                                disabled={!newIntegrationName.trim() || isCreating}
                                className="btn-primary flex-1"
                            >
                                {isCreating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Create'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
