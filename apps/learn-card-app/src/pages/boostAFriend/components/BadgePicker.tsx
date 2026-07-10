import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Plus } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import {
    BadgePreset,
    getSocialBadgePresets,
    VIBE_COLORS,
    resolveBadgeStyle,
} from '../boostAFriend.helpers';
import { LCAStylesPackRegistryEntry, BadgeGroup } from 'learn-card-base';

interface BadgePickerProps {
    onSelect: (badge: BadgePreset, vibeColor: string) => void;
    onBack: () => void;
    stylePacks: LCAStylesPackRegistryEntry[] | undefined;
    badgeGroups: BadgeGroup[] | undefined;
}

export const BadgePicker: React.FC<BadgePickerProps> = ({
    onSelect,
    onBack,
    stylePacks,
    badgeGroups,
}) => {
    const [search, setSearch] = useState('');
    const presets = useMemo(() => getSocialBadgePresets(), []);

    const filteredPresets = useMemo(() => {
        if (!search) return presets;
        const lower = search.toLowerCase();
        return presets.filter(p => p.title.toLowerCase().includes(lower));
    }, [presets, search]);

    const handleSelect = (badge: BadgePreset, color: string) => {
        if (Capacitor.isNativePlatform()) {
            try {
                Haptics.impact({ style: ImpactStyle.Light });
            } catch {
                // Haptics are best-effort; a device without support must not block selection.
            }
        }
        onSelect(badge, color);
    };

    const handleSurpriseMe = () => {
        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
        const randomColor = VIBE_COLORS[Math.floor(Math.random() * VIBE_COLORS.length)];
        handleSelect(randomPreset, randomColor);
    };

    const handleCustom = () => {
        if (!search) return;
        const randomColor = VIBE_COLORS[Math.floor(Math.random() * VIBE_COLORS.length)];
        handleSelect({ title: search, type: `ext:${search.replace(/\s+/g, '')}` }, randomColor);
    };

    const groupedPresets = useMemo(() => {
        if (search) return null;

        const groups: { group: BadgeGroup; presets: BadgePreset[] }[] = [];
        const usedTypes = new Set<string>();

        if (badgeGroups) {
            for (const group of badgeGroups) {
                const groupPresets = presets.filter(p => group.types.includes(p.type));
                if (groupPresets.length > 0) {
                    groups.push({ group, presets: groupPresets });
                    groupPresets.forEach(p => usedTypes.add(p.type));
                }
            }
        }

        const remainingPresets = presets.filter(p => !usedTypes.has(p.type));
        if (remainingPresets.length > 0) {
            groups.push({
                group: { id: 'more', label: 'More Badges', types: [] },
                presets: remainingPresets,
            });
        }

        return groups;
    }, [presets, badgeGroups, search]);

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <div>
                    <h1 className="text-xl font-semibold text-grayscale-900">Pick a Badge</h1>
                    <p className="text-sm text-grayscale-600 mt-0.5">
                        Send a fun badge to a friend to show appreciation.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    Cancel
                </button>
            </div>

            <div className="relative mb-4 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grayscale-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search or create custom..."
                    className="w-full py-3.5 pl-12 pr-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all"
                />
            </div>

            <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide shrink-0">
                <button
                    type="button"
                    onClick={handleSurpriseMe}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-full bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Surprise me
                </button>
                {search && !presets.some(p => p.title.toLowerCase() === search.toLowerCase()) && (
                    <button
                        type="button"
                        onClick={handleCustom}
                        className="flex items-center gap-2 py-2.5 px-4 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm hover:bg-emerald-100 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Create "{search}"
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pb-20 -mx-4 sm:mx-0">
                {search ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-6 sm:px-0">
                        {filteredPresets.map((preset, index) => {
                            const color = VIBE_COLORS[index % VIBE_COLORS.length];
                            return (
                                <BadgeTile
                                    key={preset.title}
                                    preset={preset}
                                    color={color}
                                    onSelect={() => handleSelect(preset, color)}
                                    stylePacks={stylePacks}
                                    index={index}
                                />
                            );
                        })}
                        {filteredPresets.length === 0 && (
                            <div className="col-span-full text-center py-10 text-grayscale-500">
                                No badges found.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {groupedPresets?.map((groupData, groupIndex) => (
                            <div key={groupData.group.id} className="space-y-3">
                                <div className="px-6 sm:px-1">
                                    <h2 className="text-lg sm:text-xl font-semibold text-grayscale-900">
                                        {groupData.group.label}
                                    </h2>
                                    {groupData.group.description && (
                                        <p className="text-sm text-grayscale-500 mt-0.5">
                                            {groupData.group.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory pb-4 sm:pb-0 scrollbar-hide px-6 sm:px-0 scroll-pl-6 sm:scroll-pl-0">
                                    {groupData.presets.map((preset, index) => {
                                        const color =
                                            VIBE_COLORS[
                                                (groupIndex * 10 + index) % VIBE_COLORS.length
                                            ];
                                        return (
                                            <div
                                                key={preset.title}
                                                className="snap-start shrink-0 w-32 sm:w-auto"
                                            >
                                                <BadgeTile
                                                    preset={preset}
                                                    color={color}
                                                    onSelect={() => handleSelect(preset, color)}
                                                    stylePacks={stylePacks}
                                                    index={index}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const BadgeTile: React.FC<{
    preset: BadgePreset;
    color: string;
    onSelect: () => void;
    stylePacks: LCAStylesPackRegistryEntry[] | undefined;
    index: number;
}> = ({ preset, color, onSelect, stylePacks, index }) => {
    const [imgError, setImgError] = useState(false);
    const { imageUrl, backgroundColor } = resolveBadgeStyle(preset, stylePacks);
    const tileColor = backgroundColor || color;

    const isRealImage = Boolean(imageUrl) && !imgError;

    return (
        <button
            type="button"
            onClick={onSelect}
            className="group w-full aspect-square relative overflow-hidden rounded-2xl sm:rounded-3xl border border-grayscale-200 shadow-sm hover:shadow-md transition-all duration-300 text-left motion-safe:hover:-translate-y-0.5 active:scale-[0.97] motion-safe:animate-pop-in"
            style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
        >
            {isRealImage ? (
                <img
                    src={imageUrl}
                    alt={preset.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div
                    className="absolute inset-0 w-full h-full transition-transform duration-300 motion-safe:group-hover:scale-105"
                    style={{ backgroundColor: tileColor }}
                />
            )}

            <div
                className={`absolute inset-x-0 bottom-0 pt-12 pb-3 px-3 sm:px-4 flex items-end ${
                    isRealImage ? 'bg-gradient-to-t from-black/70 via-black/25 to-transparent' : ''
                }`}
            >
                <span
                    className={`text-sm sm:text-base font-semibold text-white line-clamp-1 w-full ${
                        isRealImage ? 'drop-shadow-sm' : ''
                    }`}
                >
                    {preset.title}
                </span>
            </div>
        </button>
    );
};
