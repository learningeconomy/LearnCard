import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BadgePreset, VIBE_COLORS, resolveBadgeStyle } from '../boostAFriend.helpers';
import { LCAStylesPackRegistryEntry } from 'learn-card-base';

interface BadgePersonalizeProps {
    badge: BadgePreset;
    vibeColor: string;
    onVibeColorChange: (color: string) => void;
    note: string;
    onNoteChange: (note: string) => void;
    onNext: () => void;
    onBack: () => void;
    stylePacks: LCAStylesPackRegistryEntry[] | undefined;
}

export const BadgePersonalize: React.FC<BadgePersonalizeProps> = ({
    badge,
    vibeColor,
    onVibeColorChange,
    note,
    onNoteChange,
    onNext,
    onBack,
    stylePacks,
}) => {
    const [imgError, setImgError] = useState(false);
    const { imageUrl } = resolveBadgeStyle(badge, stylePacks);

    const isRealImage = Boolean(imageUrl) && !imgError;

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

            <div className="flex-1 overflow-y-auto pb-20 flex flex-col justify-center space-y-8">
                <div className="flex justify-center">
                    <div
                        className="w-56 h-56 rounded-[32px] flex flex-col items-center justify-center p-6 shadow-lg border border-white/40 backdrop-blur-md transition-all duration-300 ring-1 ring-black/5"
                        style={{
                            background: `linear-gradient(135deg, ${vibeColor}30 0%, ${vibeColor}10 100%)`,
                        }}
                    >
                        <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-4 relative">
                            {isRealImage ? (
                                <>
                                    <div
                                        className="absolute inset-0 rounded-2xl blur-xl opacity-40 transition-colors duration-300"
                                        style={{ backgroundColor: vibeColor }}
                                    />
                                    <img
                                        src={imageUrl}
                                        alt={badge.title}
                                        className="w-full h-full object-cover relative z-10"
                                        onError={() => setImgError(true)}
                                    />
                                </>
                            ) : (
                                <div
                                    className="absolute inset-0 w-full h-full transition-colors duration-300 rounded-2xl"
                                    style={{ backgroundColor: vibeColor }}
                                />
                            )}
                        </div>
                        <span className="text-xl font-semibold text-center text-grayscale-900 line-clamp-2">
                            {badge.title}
                        </span>
                        <span className="text-xs font-medium text-grayscale-600 mt-1 opacity-80">
                            Social Badge
                        </span>
                    </div>
                </div>

                <div className="max-w-sm mx-auto w-full space-y-8">
                    <div>
                        <label className="block text-sm font-medium text-grayscale-900 mb-3 text-center">
                            Vibe Color
                        </label>
                        <div className="flex flex-wrap justify-center gap-3">
                            {VIBE_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => onVibeColorChange(color)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-sm ${
                                        vibeColor === color
                                            ? 'scale-110 ring-2 ring-offset-2 ring-grayscale-900'
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

            <div className="pt-4 mt-auto">
                <button
                    type="button"
                    onClick={onNext}
                    className="w-full py-3.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-base hover:opacity-90 transition-opacity shadow-sm"
                >
                    Next
                </button>
            </div>
        </div>
    );
};
