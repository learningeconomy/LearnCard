import React from 'react';
import { Layers } from 'lucide-react';

import { useModal, ModalTypes } from 'learn-card-base';

import { COMMON_TYPES, getTypeByObv3, type CredentialTypeEntry } from './credentialTypeCatalog';
import { TypeBrowserModal } from './TypeBrowserModal';

interface TypePickerProps {
    selectedObv3Type: string | null;
    onSelectType: (entry: CredentialTypeEntry) => void;
}

const TypePill: React.FC<{
    entry: CredentialTypeEntry;
    active: boolean;
    onClick: () => void;
}> = ({ entry, active, onClick }) => {
    const { Icon } = entry;
    return (
        <button
            type="button"
            onClick={onClick}
            title={entry.pickWhen}
            className={`flex items-center gap-2 py-2.5 px-3 rounded-full border text-sm font-medium transition-all duration-200 ${
                active
                    ? 'bg-grayscale-900 border-grayscale-900 text-white'
                    : 'bg-white border-grayscale-300 text-grayscale-700 motion-safe:hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
        >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{entry.label}</span>
        </button>
    );
};

export const TypePicker: React.FC<TypePickerProps> = ({ selectedObv3Type, onSelectType }) => {
    const { newModal, closeModal } = useModal();

    const selectedIsUncommon = Boolean(
        selectedObv3Type && !COMMON_TYPES.some(t => t.obv3Type === selectedObv3Type)
    );

    const selectedLabel = selectedObv3Type
        ? getTypeByObv3(selectedObv3Type)?.label ?? selectedObv3Type
        : null;

    const openBrowser = () => {
        newModal(
            <TypeBrowserModal
                selectedObv3Type={selectedObv3Type}
                onSelect={onSelectType}
                handleCloseModal={closeModal}
            />,
            {},
            { mobile: ModalTypes.Freeform, desktop: ModalTypes.FullScreen }
        );
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_TYPES.map(entry => (
                    <TypePill
                        key={entry.obv3Type}
                        entry={entry}
                        active={selectedObv3Type === entry.obv3Type}
                        onClick={() => onSelectType(entry)}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={openBrowser}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-full border text-sm font-medium transition-colors ${
                    selectedIsUncommon
                        ? 'bg-grayscale-900 border-grayscale-900 text-white'
                        : 'bg-grayscale-100 border-transparent text-grayscale-700 hover:bg-grayscale-200'
                }`}
            >
                <Layers className="w-4 h-4" />
                {selectedIsUncommon ? `Type: ${selectedLabel}` : 'Browse all types'}
            </button>
        </div>
    );
};
