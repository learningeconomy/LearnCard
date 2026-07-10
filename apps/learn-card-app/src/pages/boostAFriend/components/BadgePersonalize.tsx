import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
    BadgePreset,
    VIBE_COLORS,
    resolveBadgeStyle,
    buildBoostFriendTemplate,
} from '../boostAFriend.helpers';
import {
    LCAStylesPackRegistryEntry,
    BoostCategoryOptionsEnum,
    BoostPageViewMode,
} from 'learn-card-base';
import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import { templateToJson } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';

interface BadgePersonalizeProps {
    badge: BadgePreset;
    title: string;
    onTitleChange: (title: string) => void;
    subtype: string;
    onSubtypeChange: (subtype: string) => void;
    isCustom: boolean;
    vibeColor: string;
    onVibeColorChange: (color: string) => void;
    note: string;
    onNoteChange: (note: string) => void;
    onNext: () => void;
    onBack: () => void;
    stylePacks: LCAStylesPackRegistryEntry[] | undefined;
    issuerName?: string;
}

export const BadgePersonalize: React.FC<BadgePersonalizeProps> = ({
    badge,
    title,
    onTitleChange,
    subtype,
    onSubtypeChange,
    isCustom,
    vibeColor,
    onVibeColorChange,
    note,
    onNoteChange,
    onNext,
    onBack,
    stylePacks,
    issuerName,
}) => {
    const { imageUrl } = resolveBadgeStyle(badge, stylePacks);

    const previewCredential = useMemo(() => {
        const displayTitle = title.trim() || 'Your Badge';
        const template = buildBoostFriendTemplate({
            title: displayTitle,
            subtype: subtype.trim() || displayTitle,
            description: `A social badge for being a ${displayTitle}`,
            note,
            vibeColor,
            imageUrl,
            issuerName,
        });
        const json = templateToJson(template) as Record<string, any>;

        json.validFrom = new Date().toISOString();
        if (json.issuer) {
            json.issuer.id = 'did:key:preview';
        }
        if (json.credentialSubject) {
            delete json.credentialSubject.id;
        }
        return json;
    }, [title, subtype, note, vibeColor, imageUrl, issuerName]);

    return (
        <div className="flex flex-col h-full animate-fade-in-up pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="flex items-center gap-3 mb-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-white/50 text-grayscale-600 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-semibold text-grayscale-900">Personalize</h1>
                    <p className="text-sm text-grayscale-600 mt-1">Add a note and pick a color.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 flex flex-col scrollbar-hide">
                <div className="my-auto w-full py-6 space-y-8">
                    <div className="flex justify-center">
                        <div className="w-[160px] sm:w-[200px]">
                            <BoostEarnedCard
                                credential={previewCredential as any}
                                categoryType={BoostCategoryOptionsEnum.socialBadge}
                                boostPageViewMode={BoostPageViewMode.Card}
                                useWrapper={false}
                                verifierState={false}
                                hideOptionsMenu
                                isPreview
                                className="shadow-xl"
                            />
                        </div>
                    </div>

                    <div className="max-w-sm mx-auto w-full space-y-8">
                        <div>
                            <label className="block text-sm font-medium text-grayscale-900 mb-2">
                                Badge name
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => onTitleChange(e.target.value)}
                                placeholder="e.g. Trailblazer"
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all shadow-sm"
                            />
                        </div>

                        {isCustom && (
                            <div>
                                <label className="block text-sm font-medium text-grayscale-900 mb-1">
                                    Subtype
                                </label>
                                <p className="text-xs text-grayscale-500 mb-2">
                                    A short label for this kind of badge.
                                </p>
                                <input
                                    type="text"
                                    value={subtype}
                                    onChange={e => onSubtypeChange(e.target.value)}
                                    placeholder="e.g. Trailblazer"
                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all shadow-sm"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-grayscale-900 mb-3 text-center">
                                Vibe Color
                            </label>
                            <div className="grid grid-cols-8 gap-2">
                                {VIBE_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => onVibeColorChange(color)}
                                        className={`aspect-square w-full rounded-full transition-transform shadow-sm ${
                                            vibeColor === color
                                                ? 'ring-2 ring-offset-2 ring-grayscale-900'
                                                : 'hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        aria-label={`Select color ${color}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-grayscale-900 mb-2">
                                Add a note (optional)
                            </label>
                            <textarea
                                value={note}
                                onChange={e => onNoteChange(e.target.value)}
                                placeholder="You're awesome because..."
                                rows={3}
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all resize-none shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 mt-auto">
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!title.trim()}
                    className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
};
