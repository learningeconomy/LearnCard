import * as m from '../../../../paraglide/messages.js';

import React, { useState, useEffect } from 'react';
import {
    Palette,
    Upload,
    Image as ImageIcon,
    ArrowRight,
    ArrowLeft,
    Building2,
    User,
    Loader2,
    X,
    Save,
    CreditCard,
} from 'lucide-react';

import { getLogger } from 'learn-card-base';
const log = getLogger('branding-step');

import { useFilestack, useWallet, useGetCurrentLCNUser } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import { BrandingConfig, ProfileDisplay } from '../types';

interface BrandingStepProps {
    branding: BrandingConfig | null;
    onComplete: (branding: BrandingConfig) => void;
    onBack: () => void;
}

const getColorLabel = (name: string) => {
    const labels: Record<string, () => string> = {
        Cyan: () => m['developerPortal.onboarding.branding.colorCyan'](),
        Blue: () => m['developerPortal.onboarding.branding.colorBlue'](),
        Violet: () => m['developerPortal.onboarding.branding.colorViolet'](),
        Emerald: () => m['developerPortal.onboarding.branding.colorEmerald'](),
        Rose: () => m['developerPortal.onboarding.branding.colorRose'](),
        Amber: () => m['developerPortal.onboarding.branding.colorAmber'](),
    };
    return (labels[name] ?? (() => name))();
};

const DEFAULT_COLORS = [
    { name: 'Cyan', primary: '#06B6D4', accent: '#2DD4BF' },
    { name: 'Blue', primary: '#3B82F6', accent: '#60A5FA' },
    { name: 'Violet', primary: '#8B5CF6', accent: '#A78BFA' },
    { name: 'Emerald', primary: '#10B981', accent: '#34D399' },
    { name: 'Rose', primary: '#F43F5E', accent: '#FB7185' },
    { name: 'Amber', primary: '#F59E0B', accent: '#FBBF24' },
];

const DEFAULT_WALLPAPERS = [
    'https://cdn.filestackcontent.com/DbOxscSWQsC5roJK7FH6',
    'https://cdn.filestackcontent.com/ohKxz345R6m4jupj9Ny5',
    'https://cdn.filestackcontent.com/EnAa9K5pRnO4NYe1I0dC',
];

export const BrandingStep: React.FC<BrandingStepProps> = ({ branding, onComplete, onBack }) => {
    const { initWallet } = useWallet();
    const { currentLCNUser, refetch: refetchCurrentUser } = useGetCurrentLCNUser();
    const { presentToast } = useToast();

    const [displayName, setDisplayName] = useState(branding?.displayName || '');
    const [image, setImage] = useState(branding?.image || '');
    const [shortBio, setShortBio] = useState(branding?.shortBio || '');
    const [bio, setBio] = useState(branding?.bio || '');

    const [display, setDisplay] = useState<ProfileDisplay>(
        branding?.display || {
            backgroundColor: '#ffffff',
            backgroundImage: '',
            fadeBackgroundImage: false,
            repeatBackgroundImage: false,
            fontColor: '#1f2937',
            accentColor: '#2DD4BF',
            accentFontColor: '#ffffff',
            idBackgroundImage: '',
            fadeIdBackgroundImage: true,
            idBackgroundColor: '#2DD4BF',
            repeatIdBackgroundImage: false,
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Load current profile data on mount
    useEffect(() => {
        if (currentLCNUser && !branding) {
            setDisplayName(currentLCNUser.displayName || '');
            setImage(currentLCNUser.image || '');
            setShortBio(currentLCNUser.shortBio || '');
            setBio(currentLCNUser.bio || '');

            if (currentLCNUser.display) {
                setDisplay({
                    backgroundColor: currentLCNUser.display.backgroundColor || '#ffffff',
                    backgroundImage: currentLCNUser.display.backgroundImage || '',
                    fadeBackgroundImage: currentLCNUser.display.fadeBackgroundImage || false,
                    repeatBackgroundImage: currentLCNUser.display.repeatBackgroundImage || false,
                    fontColor: currentLCNUser.display.fontColor || '#1f2937',
                    accentColor: currentLCNUser.display.accentColor || '#2DD4BF',
                    accentFontColor: currentLCNUser.display.accentFontColor || '#ffffff',
                    idBackgroundImage: currentLCNUser.display.idBackgroundImage || '',
                    fadeIdBackgroundImage: currentLCNUser.display.fadeIdBackgroundImage ?? true,
                    idBackgroundColor: currentLCNUser.display.idBackgroundColor || '#2DD4BF',
                    repeatIdBackgroundImage:
                        currentLCNUser.display.repeatIdBackgroundImage || false,
                });
            }

            setIsLoadingProfile(false);
        } else if (branding) {
            setIsLoadingProfile(false);
        }
    }, [currentLCNUser, branding]);

    const { handleFileSelect: handleProfileImageUpload, isLoading: profileImageUploading } =
        useFilestack({
            fileType: IMAGE_MIME_TYPES,
            onUpload: (_url, _file, data) => {
                setImage(data?.url || '');
            },
        });

    const { handleFileSelect: handleBackgroundUpload, isLoading: backgroundUploading } =
        useFilestack({
            fileType: IMAGE_MIME_TYPES,
            onUpload: (_url, _file, data) => {
                setDisplay(prev => ({ ...prev, backgroundImage: data?.url || '' }));
            },
        });

    const { handleFileSelect: handleIdBackgroundUpload, isLoading: idBackgroundUploading } =
        useFilestack({
            fileType: IMAGE_MIME_TYPES,
            onUpload: (_url, _file, data) => {
                setDisplay(prev => ({ ...prev, idBackgroundImage: data?.url || '' }));
            },
        });

    const handleColorSelect = (primary: string, accent: string) => {
        setDisplay(prev => ({
            ...prev,
            idBackgroundColor: primary,
            accentColor: accent,
        }));
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);

        try {
            const wallet = await initWallet();

            await wallet.invoke.updateProfile({
                displayName,
                image,
                shortBio,
                bio,
                display: {
                    backgroundColor: display.backgroundColor,
                    backgroundImage: display.backgroundImage,
                    fadeBackgroundImage: display.fadeBackgroundImage,
                    repeatBackgroundImage: display.repeatBackgroundImage,
                    fontColor: display.fontColor,
                    accentColor: display.accentColor,
                    accentFontColor: display.accentFontColor,
                    idBackgroundImage: display.idBackgroundImage,
                    fadeIdBackgroundImage: display.fadeIdBackgroundImage,
                    idBackgroundColor: display.idBackgroundColor,
                    repeatIdBackgroundImage: display.repeatIdBackgroundImage,
                },
            });

            await refetchCurrentUser();

            presentToast(m['developerPortal.onboarding.branding.savedToast'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            const config: BrandingConfig = {
                displayName,
                image,
                shortBio,
                bio,
                display,
            };

            onComplete(config);
        } catch (err) {
            log.error('Failed to update profile:', err);
            presentToast(m['developerPortal.onboarding.branding.failedToast'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const canProceed = displayName.trim();

    if (isLoadingProfile) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile Image */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-pink-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">
                            {m['developerPortal.onboarding.branding.profileImage']()}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {m['developerPortal.onboarding.branding.profileImageDesc']()}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    {image ? (
                        <div className="relative">
                            <img
                                src={image}
                                alt={m['developerPortal.onboarding.branding.profileImage']()}
                                className="w-24 h-24 object-cover bg-white border border-gray-200 rounded-xl"
                            />

                            <button
                                onClick={() => setImage('')}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleProfileImageUpload}
                            disabled={profileImageUploading}
                            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-cyan-400 hover:text-cyan-500 transition-colors"
                        >
                            {profileImageUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="w-6 h-6" />
                                    <span className="text-xs">
                                        {m['developerPortal.onboarding.branding.upload']()}
                                    </span>
                                </>
                            )}
                        </button>
                    )}

                    <div className="flex-1 text-sm text-gray-500">
                        <p>{m['developerPortal.onboarding.branding.imageRecommendation']()}</p>
                        <p>{m['developerPortal.onboarding.branding.imageFormats']()}</p>
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">
                            {m['developerPortal.onboarding.branding.profileInfo']()}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {m['developerPortal.onboarding.branding.profileInfoDesc']()}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {m['developerPortal.onboarding.branding.displayName']()}{' '}
                            <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="e.g., AARP Skills Builder"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {m['developerPortal.onboarding.branding.shortBio']()}
                        </label>

                        <input
                            type="text"
                            value={shortBio}
                            onChange={e => setShortBio(e.target.value)}
                            placeholder={m[
                                'developerPortal.onboarding.branding.shortBioPlaceholder'
                            ]()}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {m['developerPortal.onboarding.branding.fullBio']()}
                        </label>

                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder={m[
                                'developerPortal.onboarding.branding.fullBioPlaceholder'
                            ]()}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Card Colors */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Palette className="w-5 h-5 text-violet-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">
                            {m['developerPortal.onboarding.branding.cardColors']()}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {m['developerPortal.onboarding.branding.cardColorsDesc']()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {DEFAULT_COLORS.map(color => (
                        <button
                            key={color.name}
                            onClick={() => handleColorSelect(color.primary, color.accent)}
                            className={`p-3 rounded-xl border-2 transition-all ${
                                display.idBackgroundColor === color.primary
                                    ? 'border-gray-900 shadow-md'
                                    : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            <div
                                className="w-full h-8 rounded-lg mb-2"
                                style={{ backgroundColor: color.primary }}
                            />

                            <span className="text-xs text-gray-600">
                                {getColorLabel(color.name)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                            {m['developerPortal.onboarding.branding.cardBgInput']()}
                        </label>

                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={display.idBackgroundColor || '#2DD4BF'}
                                onChange={e =>
                                    setDisplay(prev => ({
                                        ...prev,
                                        idBackgroundColor: e.target.value,
                                    }))
                                }
                                className="w-10 h-10 rounded cursor-pointer"
                            />

                            <input
                                type="text"
                                value={display.idBackgroundColor || '#2DD4BF'}
                                onChange={e =>
                                    setDisplay(prev => ({
                                        ...prev,
                                        idBackgroundColor: e.target.value,
                                    }))
                                }
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                            {m['developerPortal.onboarding.branding.accentColorInput']()}
                        </label>

                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={display.accentColor || '#2DD4BF'}
                                onChange={e =>
                                    setDisplay(prev => ({ ...prev, accentColor: e.target.value }))
                                }
                                className="w-10 h-10 rounded cursor-pointer"
                            />

                            <input
                                type="text"
                                value={display.accentColor || '#2DD4BF'}
                                onChange={e =>
                                    setDisplay(prev => ({ ...prev, accentColor: e.target.value }))
                                }
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Background Image */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-cyan-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">
                            {m['developerPortal.onboarding.branding.cardBackground']()}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {m['developerPortal.onboarding.branding.cardBackgroundDesc']()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {DEFAULT_WALLPAPERS.map((wallpaper, index) => (
                        <button
                            key={index}
                            onClick={() =>
                                setDisplay(prev => ({ ...prev, idBackgroundImage: wallpaper }))
                            }
                            className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                display.idBackgroundImage === wallpaper
                                    ? 'border-cyan-500 shadow-md'
                                    : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            <img
                                src={wallpaper}
                                alt={`Wallpaper ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}

                    <button
                        onClick={handleIdBackgroundUpload}
                        disabled={idBackgroundUploading}
                        className="w-20 h-14 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-cyan-400 hover:text-cyan-500 transition-colors"
                    >
                        {idBackgroundUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5" />
                        )}
                    </button>

                    {display.idBackgroundImage && (
                        <button
                            onClick={() => setDisplay(prev => ({ ...prev, idBackgroundImage: '' }))}
                            className="w-20 h-14 border-2 border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-3">
                    {m['developerPortal.onboarding.branding.preview']()}
                </p>

                <div
                    className="p-4 rounded-xl relative overflow-hidden"
                    style={{
                        backgroundColor: display.idBackgroundColor || '#2DD4BF',
                        backgroundImage: display.idBackgroundImage
                            ? `url(${display.idBackgroundImage})`
                            : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {display.fadeIdBackgroundImage && display.idBackgroundImage && (
                        <div className="absolute inset-0 bg-black/30" />
                    )}

                    <div className="relative flex items-center gap-3">
                        {image ? (
                            <img
                                src={image}
                                alt={m['developerPortal.onboarding.branding.profileImage']()}
                                className="w-12 h-12 object-cover rounded-full bg-white"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                        )}

                        <div>
                            <p className="font-semibold text-white">
                                {displayName || m['developerPortal.onboarding.branding.yourOrg']()}
                            </p>

                            <p className="text-sm text-white/80">
                                {shortBio || m['developerPortal.onboarding.branding.orgTagline']()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {m['developerPortal.onboarding.branding.back']()}
                </button>

                <button
                    onClick={handleSaveProfile}
                    disabled={!canProceed || isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {m['developerPortal.onboarding.branding.saving']()}
                        </>
                    ) : (
                        <>
                            {m['developerPortal.onboarding.branding.saveAndContinue']()}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
