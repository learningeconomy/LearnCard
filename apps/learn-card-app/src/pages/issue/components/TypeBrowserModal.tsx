import React, { useMemo, useState } from 'react';
import { Search, X, Check } from 'lucide-react';

import * as m from '../../../paraglide/messages.js';
import {
    CREDENTIAL_FAMILIES,
    CREDENTIAL_TYPES,
    getTypesForFamily,
    typeLabel,
    typePickWhen,
    familyLabel,
    familyBlurb,
    type CredentialTypeEntry,
} from './credentialTypeCatalog';

interface TypeBrowserModalProps {
    selectedObv3Type: string | null;
    onSelect: (entry: CredentialTypeEntry) => void;
    handleCloseModal: () => void;
}

export const TypeBrowserModal: React.FC<TypeBrowserModalProps> = ({
    selectedObv3Type,
    onSelect,
    handleCloseModal,
}) => {
    const [query, setQuery] = useState('');

    const trimmed = query.trim().toLowerCase();

    const matches = useMemo(() => {
        if (!trimmed) return null;
        return CREDENTIAL_TYPES.filter(
            t =>
                typeLabel(t).toLowerCase().includes(trimmed) ||
                typePickWhen(t).toLowerCase().includes(trimmed) ||
                t.obv3Type.toLowerCase().includes(trimmed)
        );
    }, [trimmed]);

    const handlePick = (entry: CredentialTypeEntry) => {
        onSelect(entry);
        handleCloseModal();
    };

    const renderRow = (entry: CredentialTypeEntry) => {
        const { Icon } = entry;
        const active = selectedObv3Type === entry.obv3Type;
        return (
            <button
                key={entry.obv3Type}
                type="button"
                onClick={() => handlePick(entry)}
                className={`w-full flex items-start gap-3 py-3 px-3 rounded-2xl border text-left transition-colors ${
                    active
                        ? 'bg-grayscale-900 border-grayscale-900'
                        : 'bg-white border-grayscale-200 hover:bg-grayscale-10'
                }`}
            >
                <span
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                        active ? 'bg-white/15' : 'bg-grayscale-100'
                    }`}
                >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-grayscale-600'}`} />
                </span>
                <span className="min-w-0 flex-1">
                    <span
                        className={`block text-sm font-medium ${
                            active ? 'text-white' : 'text-grayscale-900'
                        }`}
                    >
                        {typeLabel(entry)}
                    </span>
                    <span
                        className={`block text-xs leading-relaxed ${
                            active ? 'text-white/80' : 'text-grayscale-500'
                        }`}
                    >
                        {typePickWhen(entry)}
                    </span>
                </span>
                {active && <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />}
            </button>
        );
    };

    return (
        <div
            className="font-poppins w-full max-w-[560px] mx-auto bg-white rounded-[20px] flex flex-col max-h-[80vh] overflow-hidden"
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-grayscale-100">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {m['issueFlow.browser.title']()}
                    </h2>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-grayscale-400 hover:text-grayscale-900 hover:bg-grayscale-100 transition-colors"
                        aria-label={m['common.close']()}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-grayscale-600 mb-4">
                    {m['issueFlow.browser.subtitle']()}
                </p>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayscale-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={m['issueFlow.browser.searchPlaceholder']()}
                        className="w-full py-3 pl-10 pr-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-6">
                {matches ? (
                    matches.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {matches.map(renderRow)}
                        </div>
                    ) : (
                        <p className="text-sm text-grayscale-400 text-center py-8">
                            {m['issueFlow.browser.noMatch']({ query })}
                        </p>
                    )
                ) : (
                    CREDENTIAL_FAMILIES.map(family => (
                        <div key={family.id}>
                            <div className="mb-2">
                                <h3 className="text-xs font-semibold text-grayscale-700 uppercase tracking-wide">
                                    {familyLabel(family)}
                                </h3>
                                <p className="text-xs text-grayscale-400">{familyBlurb(family)}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {getTypesForFamily(family.id).map(renderRow)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
