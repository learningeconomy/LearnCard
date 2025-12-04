import React, { useState } from 'react';
import { IonSpinner } from '@ionic/react';
import type { LCNIntegration } from '@learncard/types';

import { useDeveloperPortal } from '../useDeveloperPortal';

interface IntegrationSelectorProps {
    integrations: LCNIntegration[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    isLoading: boolean;
}

export const IntegrationSelector: React.FC<IntegrationSelectorProps> = ({
    integrations,
    selectedId,
    onSelect,
    isLoading,
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const { useCreateIntegration } = useDeveloperPortal();
    const createMutation = useCreateIntegration();

    const handleCreate = async () => {
        if (!newName.trim()) return;

        try {
            const id = await createMutation.mutateAsync(newName.trim());
            onSelect(id);
            setNewName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create integration:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <IonSpinner name="crescent" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-grayscale-200 p-4">
            <label className="block text-sm font-medium text-grayscale-700 mb-3">
                Select Integration
            </label>

            {integrations.length > 0 ? (
                <div className="space-y-2 mb-4">
                    {integrations.map(integration => (
                        <button
                            key={integration.id}
                            onClick={() => onSelect(integration.id)}
                            className={`w-full px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                                selectedId === integration.id
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-700'
                                    : 'bg-grayscale-50 border border-grayscale-200 text-grayscale-700 hover:bg-grayscale-100'
                            }`}
                        >
                            <span className="font-medium">{integration.name}</span>

                            {selectedId === integration.id && (
                                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-grayscale-500 text-sm mb-4">
                    No integrations yet. Create one to get started.
                </p>
            )}

            {/* Create New Integration */}
            {isCreating ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Integration name..."
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        autoFocus
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleCreate();
                            if (e.key === 'Escape') {
                                setIsCreating(false);
                                setNewName('');
                            }
                        }}
                    />

                    <button
                        onClick={handleCreate}
                        disabled={!newName.trim() || createMutation.isPending}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {createMutation.isPending ? (
                            <IonSpinner name="crescent" className="w-5 h-5" />
                        ) : (
                            'Create'
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setIsCreating(false);
                            setNewName('');
                        }}
                        className="px-4 py-2 bg-grayscale-200 text-grayscale-700 rounded-lg font-medium hover:bg-grayscale-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-grayscale-300 rounded-lg text-grayscale-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Integration
                </button>
            )}
        </div>
    );
};
