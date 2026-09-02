import React, { useState } from 'react';
import * as m from '../../../../paraglide/messages.js';
import { Checkmark } from '@learncard/react';

import countries from '../../../../constants/countries.json';

const COUNTRIES: Record<string, string> = countries as Record<string, string>;
const COUNTRY_ENTRIES = Object.entries(COUNTRIES).sort((a, b) => a[1].localeCompare(b[1]));

export type CountrySelectorModalProps = {
    selected?: string;
    onSelect: (code: string) => void;
};

const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({ selected, onSelect }) => {
    const [query, setQuery] = useState<string>('');

    const filtered = COUNTRY_ENTRIES.filter(([_, label]) =>
        label.toLowerCase().includes((query ?? '').toLowerCase())
    );

    return (
        <div className="w-full h-full transparent flex items-center justify-center">
            <div className="bg-white text-grayscale-800 w-full rounded-[20px] shadow-3xl z-50 font-notoSans max-w-[600px] h-[600px] max-h-[85vh] flex flex-col">
                <div className="px-4 py-3 border-b border-grayscale-100">
                    <h2 className="font-notoSans font-semibold text-[16px] normal-case">
                        {m['onboarding.country.title']()}
                    </h2>
                </div>
                <div className="p-4">
                    <label htmlFor="onboarding-country-search" className="sr-only">
                        {m['onboarding.country.search']()}
                    </label>
                    <input
                        id="onboarding-country-search"
                        type="text"
                        value={query}
                        placeholder={m['onboarding.country.search']()}
                        onChange={event => setQuery(event.target.value)}
                        className="w-full bg-grayscale-100 text-grayscale-800 placeholder:text-grayscale-400 rounded-[12px] py-[5px] px-[15px] font-normal text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />
                </div>
                <div className="px-2 pb-4 overflow-y-auto flex-1">
                    {filtered.map(([code, label]) => (
                        <button
                            key={code}
                            type="button"
                            onClick={() => onSelect(code)}
                            className="w-full text-left px-3 py-2 rounded-[12px] hover:bg-grayscale-100 flex items-center justify-between"
                        >
                            <span className="text-grayscale-800 text-[16px] flex gap-[10px] items-center">
                                <img
                                    src={`https://flagcdn.com/36x27/${code.toLowerCase()}.png`}
                                    alt=""
                                    className="w-[36px] h-[27px] object-cover"
                                />
                                {label}
                            </span>
                            {selected === code && (
                                <span aria-hidden="true">
                                    <Checkmark className="w-[20px] h-[20px] text-emerald-600" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CountrySelectorModal;
