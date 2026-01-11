import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, Loader2, Check, Settings, LayoutDashboard } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useDeveloperPortalContext } from '../DeveloperPortalContext';

interface HeaderIntegrationSelectorProps {
    integrations: LCNIntegration[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    isLoading: boolean;
}

export const HeaderIntegrationSelector: React.FC<HeaderIntegrationSelectorProps> = ({
    integrations,
    selectedId,
    onSelect,
    isLoading,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { createIntegration, isCreatingIntegration } = useDeveloperPortalContext();

    const selectedIntegration = integrations.find(i => i.id === selectedId);

    // Update dropdown position when opened
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
            });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                buttonRef.current && !buttonRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
                setIsCreating(false);
                setNewName('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when creating
    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating]);

    const handleSelectIntegration = (integration: LCNIntegration) => {
        onSelect(integration.id);
        setIsOpen(false);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;

        try {
            await createIntegration(newName.trim());
            setNewName('');
            setIsCreating(false);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to create integration:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading...</span>
            </div>
        );
    }

    const dropdownContent = isOpen && createPortal(
        <div
            ref={dropdownRef}
            className="fixed w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-[9999] overflow-hidden"
            style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
        >
            {integrations.length > 0 && (
                <div className="max-h-48 overflow-y-auto">
                    {integrations.map(integration => {
                        const isSetup = integration.status === 'setup' || !integration.status;

                        return (
                            <button
                                key={integration.id}
                                onClick={() => handleSelectIntegration(integration)}
                                className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                    selectedId === integration.id ? 'bg-cyan-50' : ''
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {isSetup ? (
                                        <Settings className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                    ) : (
                                        <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    )}

                                    <span className={`text-sm truncate ${selectedId === integration.id ? 'text-cyan-700 font-medium' : 'text-gray-700'}`}>
                                        {integration.name}
                                    </span>
                                </div>

                                {selectedId === integration.id && (
                                    <Check className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="border-t border-gray-100">
                {isCreating ? (
                    <div className="p-2">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Integration name..."
                                className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
                                disabled={!newName.trim() || isCreatingIntegration}
                                className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isCreatingIntegration ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Add'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full px-4 py-2.5 text-left flex items-center gap-2 text-cyan-600 hover:bg-cyan-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Project</span>
                    </button>
                )}
            </div>
        </div>,
        document.body
    );

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
                <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate">
                    {selectedIntegration?.name || 'Select Project'}
                </span>

                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownContent}
        </div>
    );
};

export default HeaderIntegrationSelector;
