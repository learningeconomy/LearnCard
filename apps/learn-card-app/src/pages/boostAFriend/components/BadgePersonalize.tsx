import React, { useMemo } from 'react';
import { ArrowLeft, ImagePlus, Loader2, X } from 'lucide-react';
import {
    BadgePreset,
    VIBE_COLORS,
    resolveBadgeStyle,
    buildPreviewCredential,
} from '../boostAFriend.helpers';
import {
    LCAStylesPackRegistryEntry,
    BoostCategoryOptionsEnum,
    BoostPageViewMode,
    useFilestack,
} from 'learn-card-base';
import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import * as m from '../../../paraglide/messages.js';

interface BadgePersonalizeProps {
    badge: BadgePreset;
    title: string;
    onTitleChange: (title: string) => void;
    subtype: string;
    onSubtypeChange: (subtype: string) => void;
    isCustom: boolean;
    vibeColor: string;
    onVibeColorChange: (color: string) => void;
    description?: string;
    note: string;
    notePlaceholder?: string;
    onNoteChange: (note: string) => void;
    imageUrl?: string;
    onImageUrlChange?: (url: string) => void;
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
    description,
    note,
    notePlaceholder,
    onNoteChange,
    imageUrl,
    onImageUrlChange,
    onNext,
    onBack,
    stylePacks,
    issuerName,
}) => {
    const stylePackImageUrl = resolveBadgeStyle(badge, stylePacks).imageUrl;
    const effectiveImageUrl = imageUrl?.trim() || stylePackImageUrl;

    const { handleFileSelect, isLoading: isUploadingImage } = useFilestack({
        onUpload: url => onImageUrlChange?.(url),
    });

    const previewCredential = useMemo(() => {
        const displayTitle = title.trim() || m['boostAFriend.yourBadge']();
        return buildPreviewCredential({
            title: displayTitle,
            subtype: subtype.trim() || displayTitle,
            description,
            note: note.trim() || notePlaceholder,
            vibeColor,
            imageUrl: effectiveImageUrl,
            issuerName,
        });
    }, [
        title,
        subtype,
        description,
        note,
        notePlaceholder,
        vibeColor,
        effectiveImageUrl,
        issuerName,
    ]);

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex-1 overflow-y-auto pb-20 flex flex-col scrollbar-hide -mx-4 sm:mx-0">
                <div className="sticky top-0 z-30 flex items-center gap-3 mb-6 px-6 sm:px-0 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 bg-white/70 backdrop-blur-xl border-b border-grayscale-200/60 sm:bg-transparent sm:backdrop-blur-none sm:border-0">
                    <button
                        type="button"
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-white/50 text-grayscale-600 transition-colors"
                        aria-label={m['settings.goBack']()}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-semibold text-grayscale-900">
                            {m['sidemenu.links.personalize']()}
                        </h1>
                        <p className="text-sm text-grayscale-600 mt-1">
                            {m['boostAFriend.person.subtitle']()}
                        </p>
                    </div>
                </div>

                <div className="w-full py-6 space-y-8 px-6 sm:px-2 relative z-0">
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
                                {m['boostAFriend.person.name']()}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => onTitleChange(e.target.value)}
                                placeholder={m['boostAFriend.person.namePlace']()}
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all shadow-sm"
                            />
                        </div>

                        {isCustom && (
                            <div>
                                <label className="block text-sm font-medium text-grayscale-900 mb-1">
                                    {m['boostAFriend.person.subtype']()}
                                </label>
                                <p className="text-xs text-grayscale-500 mb-2">
                                    {m['boostAFriend.person.subDesc']()}
                                </p>
                                <input
                                    type="text"
                                    value={subtype}
                                    onChange={e => onSubtypeChange(e.target.value)}
                                    placeholder={m['boostAFriend.person.namePlace']()}
                                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all shadow-sm"
                                />
                            </div>
                        )}

                        {isCustom && (
                            <div>
                                <label className="block text-sm font-medium text-grayscale-900 mb-2">
                                    {m['boostAFriend.person.image']()}
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleFileSelect()}
                                        disabled={isUploadingImage}
                                        className="relative w-16 h-16 rounded-2xl border border-grayscale-300 bg-white flex items-center justify-center overflow-hidden shrink-0 hover:bg-grayscale-10 transition-colors disabled:opacity-60"
                                        aria-label={m['boostAFriend.person.uploadAria']()}
                                    >
                                        {isUploadingImage ? (
                                            <Loader2 className="w-5 h-5 text-grayscale-400 animate-spin" />
                                        ) : effectiveImageUrl ? (
                                            <img
                                                src={effectiveImageUrl}
                                                alt={m['wallet.categoriesSingular.socialBadges']()}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ImagePlus className="w-6 h-6 text-grayscale-400" />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => handleFileSelect()}
                                            disabled={isUploadingImage}
                                            className="text-sm font-medium text-grayscale-900 hover:text-grayscale-600 transition-colors disabled:opacity-60"
                                        >
                                            {isUploadingImage
                                                ? m['boost.cms.media.uploading']()
                                                : effectiveImageUrl
                                                ? m['boostAFriend.person.change']()
                                                : m['boostAFriend.person.uploadImg']()}
                                        </button>
                                        {imageUrl?.trim() && !isUploadingImage && (
                                            <button
                                                type="button"
                                                onClick={() => onImageUrlChange?.('')}
                                                className="flex items-center gap-1 text-xs text-grayscale-500 hover:text-red-600 transition-colors mt-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                {m['profile.email.remove']()}
                                            </button>
                                        )}
                                        <p className="text-xs text-grayscale-500 mt-1">
                                            {m['boostAFriend.person.fileTypes']()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-grayscale-900 mb-3 text-center">
                                {m['boostAFriend.person.vibe']()}
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
                                        aria-label={m['boostAFriend.person.colorAria']({ color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-grayscale-900 mb-2">
                                {m['boostAFriend.person.note']()}
                            </label>
                            <textarea
                                value={note}
                                onChange={e => onNoteChange(e.target.value)}
                                placeholder={
                                    notePlaceholder?.trim() || m['boostAFriend.person.notePlace']()
                                }
                                rows={3}
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all resize-none shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 mt-auto pb-[env(safe-area-inset-bottom,0px)]">
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!title.trim()}
                    className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {m['common.next']()}
                </button>
            </div>
        </div>
    );
};
